const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const auth = require('../middleware/auth');

const router = express.Router();

const CANCEL_WINDOW_HOURS = 2;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_ORDER_ITEMS = 50;
const MAX_ITEM_QUANTITY = 100;

const generateRef = () => `MF-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

const STAFF_STATUS_TRANSITIONS = {
  Pending: ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Packing', 'Rejected', 'Cancelled'],
  Packing: ['Ready for Pickup', 'Rejected', 'Cancelled'],
  'Ready for Pickup': ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
  Rejected: [],
};

const makeHttpError = (status, message) =>
  Object.assign(new Error(message), { status });

const normalizeRequestedItems = ({ items, medicineId, quantity }) => {
  const rawItems = Array.isArray(items) && items.length > 0
    ? items
    : medicineId
      ? [{ medicineId, quantity: quantity || 1 }]
      : [];

  if (rawItems.length > MAX_ORDER_ITEMS) {
    throw makeHttpError(400, `An order may contain at most ${MAX_ORDER_ITEMS} medicines.`);
  }

  const quantitiesByMedicine = new Map();
  rawItems.forEach((item) => {
    const id = String(item?.medicineId || '').trim();
    const requestedQuantity = Number(item?.quantity);

    if (!mongoose.isValidObjectId(id)) {
      throw makeHttpError(400, 'Every order item must have a valid medicine ID.');
    }
    if (
      !Number.isInteger(requestedQuantity)
      || requestedQuantity < 1
      || requestedQuantity > MAX_ITEM_QUANTITY
    ) {
      throw makeHttpError(
        400,
        `Medicine quantity must be between 1 and ${MAX_ITEM_QUANTITY}.`,
      );
    }

    quantitiesByMedicine.set(
      id,
      (quantitiesByMedicine.get(id) || 0) + requestedQuantity,
    );
  });

  const normalized = [...quantitiesByMedicine.entries()].map(
    ([id, requestedQuantity]) => ({ medicineId: id, quantity: requestedQuantity }),
  );
  if (normalized.some((item) => item.quantity > MAX_ITEM_QUANTITY)) {
    throw makeHttpError(
      400,
      `Medicine quantity must be between 1 and ${MAX_ITEM_QUANTITY}.`,
    );
  }

  return normalized;
};

const formatOrderPrice = (items) => {
  const prices = items.map(({ medicine, quantity }) => {
    const amount = Number(String(medicine.price || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(amount) ? amount * quantity : null;
  });
  if (prices.some((price) => price === null)) return '';

  const total = prices.reduce((sum, price) => sum + price, 0);
  return `LKR ${Number.isInteger(total) ? total : total.toFixed(2)}`;
};

const restoreMedicineStock = async (items) => {
  await Promise.all(
    items.map(({ medicineId, quantity }) =>
      Medicine.updateOne(
        { _id: medicineId },
        [
          {
            $set: {
              available: {
                $cond: [{ $eq: ['$quantity', 0] }, true, '$available'],
              },
              quantity: { $add: ['$quantity', quantity] },
            },
          },
        ],
      ),
    ),
  );
};

const reserveMedicineStock = async (items) => {
  const reserved = [];

  try {
    for (const { medicine, quantity } of items) {
      const updated = await Medicine.findOneAndUpdate(
        {
          _id: medicine._id,
          pharmacyId: medicine.pharmacyId,
          available: true,
          quantity: { $gte: quantity },
        },
        [
          { $set: { quantity: { $subtract: ['$quantity', quantity] } } },
          { $set: { available: { $gt: ['$quantity', 0] } } },
        ],
        { new: true },
      );

      if (!updated) {
        throw makeHttpError(
          409,
          `${medicine.name} does not have enough stock for this order.`,
        );
      }

      reserved.push({ medicineId: medicine._id, quantity });
    }
  } catch (error) {
    await restoreMedicineStock(reserved);
    throw error;
  }
};

const createReservationWithReference = async (payload) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Reservation.create({
        ...payload,
        referenceNumber: generateRef(),
      });
    } catch (error) {
      if (error?.code !== 11000 || attempt === 4) throw error;
    }
  }

  throw makeHttpError(500, 'Unable to generate a unique reservation reference.');
};

const releaseReservationStock = async (reservation) => {
  if (
    reservation.inventoryStatus !== 'reserved'
    || !Array.isArray(reservation.items)
    || reservation.items.length === 0
  ) {
    return;
  }

  const claimed = await Reservation.updateOne(
    { _id: reservation._id, inventoryStatus: 'reserved' },
    { $set: { inventoryStatus: 'released' } },
  );
  if (claimed.matchedCount === 0) return;

  try {
    await restoreMedicineStock(reservation.items);
    reservation.inventoryStatus = 'released';
  } catch (error) {
    await Reservation.updateOne(
      { _id: reservation._id, inventoryStatus: 'released' },
      { $set: { inventoryStatus: 'reserved' } },
    );
    throw error;
  }
};

const consumeReservationStock = async (reservation) => {
  if (reservation.inventoryStatus !== 'reserved') return;

  await Reservation.updateOne(
    { _id: reservation._id, inventoryStatus: 'reserved' },
    { $set: { inventoryStatus: 'consumed' } },
  );
  reservation.inventoryStatus = 'consumed';
};

const getDataUrlByteLength = (value) => {
  const match = String(value || '').match(/^data:(image\/[^;,]+|application\/pdf);base64,(.+)$/i);
  if (!match) return null;

  const base64 = match[2];
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

router.get('/track', async (req, res) => {
  try {
    const reference = String(req.query.reference || '').trim().toUpperCase();
    if (!reference) {
      return res.status(400).json({ message: 'Reference number is required.' });
    }

    const reservation = await Reservation.findOne({ referenceNumber: reference })
      .select('-prescriptionData -userId -customerPhone')
      .lean();
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    return res.json(reservation);
  } catch {
    return res.status(500).json({ message: 'Unable to track reservation.' });
  }
});

router.get('/', auth(['user', 'pharmacy', 'admin']), async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'pharmacy') query.pharmacyId = req.user.pharmacyId;
    if (req.user.role === 'user')     query.userId     = req.user._id;

    const reservations = await Reservation.find(query).sort({ createdAt: -1 }).lean();
    return res.json(reservations);
  } catch {
    return res.status(500).json({ message: 'Unable to load reservations.' });
  }
});

router.post('/', auth(['user']), async (req, res) => {
  let reservedItems = [];

  try {
    const {
      medicineId,
      items,
      quantity,
      customerName,
      customerPhone,
      notes,
      prescriptionData,
      prescriptionFileName,
      fulfillmentType,
      deliveryAddress,
      medicineName,
      pharmacyName,
    } = req.body;

    if (!customerName || !String(customerName).trim() || !customerPhone || !String(customerPhone).trim()) {
      return res.status(400).json({ message: 'Name and phone are required.' });
    }
    const requestedItems = normalizeRequestedItems({ items, medicineId, quantity });
    if (requestedItems.length === 0 && (!medicineName || !pharmacyName)) {
      return res.status(400).json({
        message: 'Select an inventory medicine or provide medicine and pharmacy details.',
      });
    }
    if (fulfillmentType === 'delivery' && !String(deliveryAddress || '').trim()) {
      return res.status(400).json({ message: 'Delivery address is required.' });
    }
    if (prescriptionData) {
      const uploadBytes = getDataUrlByteLength(prescriptionData);
      if (uploadBytes === null) {
        return res.status(400).json({ message: 'Prescription must be an image or PDF file.' });
      }
      if (uploadBytes > MAX_UPLOAD_BYTES) {
        return res.status(413).json({ message: 'Prescription file must be 5 MB or smaller.' });
      }
    }

    let pharmacy = null;
    let reservationItems = [];
    let resolvedMedicineName = '';
    let resolvedPrice = '';

    if (requestedItems.length > 0) {
      const medicines = await Medicine.find({
        _id: { $in: requestedItems.map((item) => item.medicineId) },
      });
      if (medicines.length !== requestedItems.length) {
        return res.status(404).json({ message: 'One or more medicines were not found.' });
      }

      const medicineById = new Map(
        medicines.map((medicine) => [String(medicine._id), medicine]),
      );
      const resolvedItems = requestedItems.map((item) => ({
        medicine: medicineById.get(item.medicineId),
        quantity: item.quantity,
      }));
      const pharmacyIds = new Set(
        resolvedItems.map(({ medicine }) => String(medicine.pharmacyId)),
      );
      if (pharmacyIds.size !== 1) {
        return res.status(400).json({
          message: 'All medicines in one order must come from the same pharmacy.',
        });
      }
      if (
        resolvedItems.some(({ medicine }) => medicine.requiresPrescription)
        && !prescriptionData
      ) {
        return res.status(400).json({
          message: 'A prescription upload is required for one or more medicines.',
        });
      }

      pharmacy = await Pharmacy.findById(resolvedItems[0].medicine.pharmacyId).lean();
      if (
        !pharmacy
        || (pharmacy.approvalStatus && pharmacy.approvalStatus !== 'approved')
      ) {
        return res.status(409).json({
          message: 'This pharmacy is not currently accepting orders.',
        });
      }

      await reserveMedicineStock(resolvedItems);
      reservedItems = requestedItems;
      reservationItems = resolvedItems.map(({ medicine, quantity: itemQuantity }) => ({
        medicineId: medicine._id,
        name: medicine.name,
        quantity: itemQuantity,
        unitPrice: medicine.price || '',
      }));
      resolvedMedicineName = reservationItems
        .map((item) => `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`)
        .join(', ');
      resolvedPrice = formatOrderPrice(resolvedItems);
    } else {
      if (!prescriptionData) {
        return res.status(400).json({ message: 'Prescription upload is required.' });
      }
      pharmacy = await Pharmacy.findOne({
        name: String(pharmacyName).trim(),
        $or: [
          { approvalStatus: 'approved' },
          { approvalStatus: { $exists: false } },
        ],
      }).lean();
      resolvedMedicineName = String(medicineName).trim();
    }

    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found.' });

    const reservation = await createReservationWithReference({
      medicineId:           reservationItems[0]?.medicineId || null,
      items:                reservationItems,
      pharmacyId:           pharmacy._id,
      userId:               req.user._id,
      medicineName:         resolvedMedicineName,
      pharmacyName:         pharmacy.name,
      price:                resolvedPrice,
      customerName:         String(customerName).trim(),
      customerPhone:        String(customerPhone).trim(),
      notes:                notes ? notes.trim() : '',
      prescriptionData:     prescriptionData || '',
      prescriptionFileName: prescriptionFileName || '',
      inventoryStatus:      reservationItems.length > 0 ? 'reserved' : 'not_applicable',
      fulfillmentType:      fulfillmentType === 'delivery' ? 'delivery' : 'pickup',
      deliveryAddress:      fulfillmentType === 'delivery' ? String(deliveryAddress).trim() : '',
      status:               'Pending',
    });
    reservedItems = [];

    return res.status(201).json(reservation);
  } catch (error) {
    if (reservedItems.length > 0) {
      try {
        await restoreMedicineStock(reservedItems);
      } catch (restoreError) {
        console.error('Unable to restore stock after reservation failure:', restoreError.message);
      }
    }
    return res.status(error?.status || 500).json({
      message: error?.status
        ? error.message
        : 'Unable to create reservation.',
    });
  }
});

// PATCH — patients can cancel within window; pharmacy/admin can approve/reject/advance status
router.patch('/:id', auth(['user', 'pharmacy', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionNote } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found.' });

    // ── Patient cancel ──────────────────────────────────────────────────────
    if (req.user.role === 'user') {
      if (String(reservation.userId) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      if (status === 'Delivered') {
        if (reservation.status !== 'Ready for Pickup') {
          return res.status(400).json({
            message: 'Receipt can only be confirmed after the order is ready.',
          });
        }
        await consumeReservationStock(reservation);
        reservation.status = 'Delivered';
        reservation.patientConfirmedReceivedAt = new Date();
        await reservation.save();
        return res.json(reservation);
      }

      if (status !== 'Cancelled') {
        return res.status(403).json({
          message: 'Patients may only cancel an order or confirm that it was received.',
        });
      }
      if (!['Pending', 'Approved'].includes(reservation.status)) {
        return res.status(400).json({ message: 'Order cannot be cancelled once it is being packed.' });
      }
      const diffHours = (Date.now() - new Date(reservation.createdAt)) / (1000 * 60 * 60);
      if (diffHours > CANCEL_WINDOW_HOURS) {
        return res.status(400).json({ message: `Cancellation window of ${CANCEL_WINDOW_HOURS} hours has passed.` });
      }
      await releaseReservationStock(reservation);
      reservation.status = 'Cancelled';
      await reservation.save();
      return res.json(reservation);
    }

    // ── Pharmacy / admin ────────────────────────────────────────────────────
    if (req.user.role === 'pharmacy' && String(reservation.pharmacyId) !== String(req.user.pharmacyId)) {
      return res.status(403).json({ message: 'Access denied for this reservation.' });
    }

    if (status) {
      const allowedNextStatuses = STAFF_STATUS_TRANSITIONS[reservation.status] || [];
      if (status !== reservation.status && !allowedNextStatuses.includes(status)) {
        return res.status(400).json({
          message: `Order cannot move from ${reservation.status} to ${status}.`,
        });
      }

      if (['Cancelled', 'Rejected'].includes(status)) {
        await releaseReservationStock(reservation);
      } else if (status === 'Delivered') {
        await consumeReservationStock(reservation);
      }

      reservation.status = status;

      if (status === 'Approved' && !reservation.referenceNumber) {
        reservation.referenceNumber = generateRef();
      }

      if (status === 'Rejected' && rejectionNote) {
        reservation.rejectionNote = rejectionNote.trim();
      }
    }

    await reservation.save();
    return res.json(reservation);
  } catch {
    return res.status(500).json({ message: 'Unable to update reservation.' });
  }
});

router.delete('/:id', auth(['pharmacy', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found.' });

    if (req.user.role === 'pharmacy' && String(reservation.pharmacyId) !== String(req.user.pharmacyId)) {
      return res.status(403).json({ message: 'Access denied for this reservation.' });
    }

    await releaseReservationStock(reservation);
    await reservation.deleteOne();
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Unable to remove reservation.' });
  }
});

module.exports = router;
module.exports._test = {
  formatOrderPrice,
  normalizeRequestedItems,
  reserveMedicineStock,
};
