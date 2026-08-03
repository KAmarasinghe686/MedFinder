const express = require('express');
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({
      $or: [
        { approvalStatus: 'approved' },
        { approvalStatus: { $exists: false } },
      ],
    }).sort({ distanceKm: 1 }).lean();
    return res.json(pharmacies);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load pharmacies.' });
  }
});

router.get('/admin/all', auth(['admin']), async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find().sort({ createdAt: -1 }).lean();
    return res.json(pharmacies);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load pharmacy applications.' });
  }
});

router.get('/me', auth(['pharmacy', 'admin']), async (req, res) => {
  try {
    if (!req.user.pharmacyId) {
      return res.status(404).json({ message: 'Pharmacy profile not found.' });
    }

    const pharmacy = await Pharmacy.findById(req.user.pharmacyId).lean();
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy profile not found.' });
    }

    return res.json(pharmacy);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load pharmacy profile.' });
  }
});

router.patch('/me', auth(['pharmacy', 'admin']), async (req, res) => {
  try {
    if (!req.user.pharmacyId) {
      return res.status(404).json({ message: 'Pharmacy profile not found.' });
    }

    const pharmacy = await Pharmacy.findById(req.user.pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy profile not found.' });
    }

    const fields = [
      'name',
      'location',
      'tel',
      'open',
      'days',
      'image',
      'lat',
      'lng',
      'distanceKm',
      'description',
      'contactEmail',
      'whatsapp',
      'licenseNumber',
    ];
    fields.forEach((field) => {
      if (typeof req.body[field] !== 'undefined' && req.body[field] !== '') {
        pharmacy[field] = req.body[field];
      }
    });

    await pharmacy.save();
    return res.json(pharmacy);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update pharmacy profile.' });
  }
});

router.patch('/:id/approval', auth(['admin']), async (req, res) => {
  try {
    const { approvalStatus, approvalNote = '' } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Invalid approval status.' });
    }

    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found.' });
    }

    pharmacy.approvalStatus = approvalStatus;
    pharmacy.approvalNote = String(approvalNote).trim();
    pharmacy.approvedAt = approvalStatus === 'approved' ? new Date() : null;
    await pharmacy.save();

    return res.json(pharmacy);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update pharmacy approval.' });
  }
});

router.patch('/:id', auth(['admin']), async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found.' });
    }

    const fields = [
      'name',
      'location',
      'tel',
      'open',
      'days',
      'image',
      'lat',
      'lng',
      'distanceKm',
      'description',
      'contactEmail',
      'whatsapp',
      'licenseNumber',
    ];

    fields.forEach((field) => {
      if (typeof req.body[field] !== 'undefined') {
        pharmacy[field] = req.body[field];
      }
    });

    await pharmacy.save();
    await User.updateMany(
      { pharmacyId: pharmacy._id },
      { $set: { pharmacyName: pharmacy.name } },
    );
    await Medicine.updateMany(
      { pharmacyId: pharmacy._id },
      { $set: { pharmacyName: pharmacy.name } },
    );
    await Reservation.updateMany(
      { pharmacyId: pharmacy._id },
      { $set: { pharmacyName: pharmacy.name } },
    );

    return res.json(pharmacy);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'A pharmacy with this name already exists.' });
    }
    return res.status(500).json({ message: 'Unable to update pharmacy.' });
  }
});

router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found.' });
    }

    await Promise.all([
      Medicine.deleteMany({ pharmacyId: pharmacy._id }),
      Reservation.deleteMany({ pharmacyId: pharmacy._id }),
      User.deleteMany({ pharmacyId: pharmacy._id }),
    ]);
    await pharmacy.deleteOne();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete pharmacy.' });
  }
});

module.exports = router;
