const express = require('express');
const EmergencyOrder = require('../models/EmergencyOrder');
const auth = require('../middleware/auth');

const router = express.Router();

const generateRef = () => 'EMG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
const emergencyStatuses = {
  pending: 'Pending',
  acknowledged: 'Acknowledged',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};
const normalizeEmergencyStatus = (status) =>
  emergencyStatuses[String(status || 'Pending').trim().toLowerCase()] || 'Pending';

router.get('/track', async (req, res) => {
  try {
    const reference = String(req.query.reference || '').trim().toUpperCase();
    if (!reference) {
      return res.status(400).json({ message: 'Reference number is required.' });
    }

    const order = await EmergencyOrder.findOne({ referenceNumber: reference })
      .select('-contactPhone -deliveryAddress')
      .lean();
    if (!order) {
      return res.status(404).json({ message: 'Emergency order not found.' });
    }

    return res.json(order);
  } catch {
    return res.status(500).json({ message: 'Unable to track emergency order.' });
  }
});

// POST /api/emergency — public, no auth required
router.post('/', async (req, res) => {
  try {
    const { medicineName, contactName, contactPhone, deliveryAddress, preferredPharmacy, notes } = req.body;

    if (!medicineName || !contactName || !contactPhone || !deliveryAddress) {
      return res.status(400).json({ message: 'Medicine name, your name, phone, and address are required.' });
    }

    const order = await EmergencyOrder.create({
      referenceNumber:   generateRef(),
      medicineName:      medicineName.trim(),
      contactName:       contactName.trim(),
      contactPhone:      contactPhone.trim(),
      deliveryAddress:   deliveryAddress.trim(),
      preferredPharmacy: preferredPharmacy ? preferredPharmacy.trim() : '',
      notes:             notes ? notes.trim() : '',
    });

    return res.status(201).json(order);
  } catch {
    return res.status(500).json({ message: 'Unable to submit emergency request.' });
  }
});

// GET /api/emergency — pharmacy/admin only
router.get('/', auth(['pharmacy', 'admin']), async (req, res) => {
  try {
    let query = {};

    // Pharmacy: show orders with no preferred pharmacy, or matching their pharmacy name
    if (req.user.role === 'pharmacy' && req.user.pharmacyName) {
      query = {
        $or: [
          { preferredPharmacy: '' },
          { preferredPharmacy: req.user.pharmacyName },
        ],
      };
    }

    const orders = await EmergencyOrder.find(query).sort({ createdAt: -1 }).lean();
    res.set('Cache-Control', 'no-store');
    return res.json(orders.map((order) => ({
      ...order,
      status: normalizeEmergencyStatus(order.status),
    })));
  } catch {
    return res.status(500).json({ message: 'Unable to load emergency orders.' });
  }
});

// PATCH /api/emergency/:id — pharmacy/admin update status
router.patch('/:id', auth(['pharmacy', 'admin']), async (req, res) => {
  try {
    const { status, acknowledgedBy, preferredPharmacy, adminMessage } = req.body;
    const order = await EmergencyOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Emergency order not found.' });
    if (!order.referenceNumber) order.referenceNumber = generateRef();

    if (
      req.user.role === 'pharmacy'
      && order.preferredPharmacy
      && order.preferredPharmacy !== req.user.pharmacyName
    ) {
      return res.status(403).json({ message: 'Access denied for this emergency order.' });
    }

    if (status) order.status = status;
    if (acknowledgedBy) order.acknowledgedBy = acknowledgedBy;
    if (typeof preferredPharmacy !== 'undefined' && req.user.role === 'admin') {
      order.preferredPharmacy = String(preferredPharmacy).trim();
    }
    if (adminMessage && req.user.role === 'admin') {
      order.adminMessages.push({ text: String(adminMessage).trim() });
    }

    await order.save();
    return res.json(order);
  } catch {
    return res.status(500).json({ message: 'Unable to update emergency order.' });
  }
});

module.exports = router;
