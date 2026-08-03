const express = require('express');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.pharmacyId) {
      query.pharmacyId = req.query.pharmacyId;
    }
    const medicines = await Medicine.find(query).sort({ name: 1 }).lean();
    return res.json(medicines);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load medicines.' });
  }
});

router.patch('/:id', auth(['pharmacy', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (typeof req.body.available === 'boolean') {
      updates.available = req.body.available;
    }
    if (typeof req.body.quantity === 'number') {
      if (!Number.isInteger(req.body.quantity) || req.body.quantity < 0) {
        return res.status(400).json({
          message: 'Medicine quantity must be a non-negative whole number.',
        });
      }
      updates.quantity = req.body.quantity;
    }
    if (typeof req.body.name === 'string') {
      updates.name = req.body.name.trim();
    }
    if (typeof req.body.category === 'string') {
      updates.category = req.body.category.trim();
    }
    if (typeof req.body.brandName === 'string') {
      updates.brandName = req.body.brandName.trim();
    }
    if (typeof req.body.productForm === 'string') {
      updates.productForm = req.body.productForm.trim();
    }
    if (typeof req.body.price === 'string') {
      updates.price = req.body.price;
    }
    if (typeof req.body.image === 'string') {
      updates.image = req.body.image;
    }
    if (typeof req.body.description === 'string') {
      updates.description = req.body.description.trim();
    }
    if (typeof req.body.requiresPrescription === 'boolean') {
      updates.requiresPrescription = req.body.requiresPrescription;
    }

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }

    if (req.user.role === 'pharmacy' && String(medicine.pharmacyId) !== String(req.user.pharmacyId)) {
      return res.status(403).json({ message: 'Access denied for this pharmacy.' });
    }

    Object.assign(medicine, updates);
    if (medicine.quantity === 0) {
      medicine.available = false;
    }
    await medicine.save();

    return res.json(medicine);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update medicine.' });
  }
});

router.post('/', auth(['pharmacy', 'admin']), async (req, res) => {
  try {
    const {
      name,
      brandName,
      category,
      productForm,
      price,
      quantity,
      available,
      requiresPrescription,
      image,
      description,
      pharmacyId,
      pharmacyName,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Medicine name and price are required.' });
    }

    let targetPharmacyId = req.user.pharmacyId;
    let targetPharmacyName = req.user.pharmacyName;

    if (req.user.role === 'admin') {
      if (pharmacyId) {
        const pharmacy = await Pharmacy.findById(pharmacyId).lean();
        if (!pharmacy) {
          return res.status(404).json({ message: 'Pharmacy not found.' });
        }

        targetPharmacyId = pharmacy._id;
        targetPharmacyName = pharmacy.name;
      } else if (pharmacyName) {
        const pharmacy = await Pharmacy.findOne({ name: pharmacyName.trim() }).lean();
        if (!pharmacy) {
          return res.status(404).json({ message: 'Pharmacy not found.' });
        }

        targetPharmacyId = pharmacy._id;
        targetPharmacyName = pharmacy.name;
      }
    }

    if (!targetPharmacyId || !targetPharmacyName) {
      return res.status(400).json({ message: 'Pharmacy details are required.' });
    }

    const normalizedQuantity = Number(quantity);
    if (
      typeof quantity !== 'undefined'
      && (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 0)
    ) {
      return res.status(400).json({
        message: 'Medicine quantity must be a non-negative whole number.',
      });
    }
    const stockQuantity = Number.isInteger(normalizedQuantity) ? normalizedQuantity : 0;

    const medicine = await Medicine.create({
      name: name.trim(),
      brandName: brandName ? brandName.trim() : '',
      category: category ? category.trim() : '',
      productForm: productForm ? productForm.trim() : '',
      price: price.trim(),
      quantity: stockQuantity,
      available: stockQuantity > 0 && (typeof available === 'boolean' ? available : true),
      requiresPrescription: typeof requiresPrescription === 'boolean' ? requiresPrescription : false,
      image: typeof image === 'string' ? image : '',
      description: description ? description.trim() : '',
      pharmacyId: targetPharmacyId,
      pharmacyName: targetPharmacyName,
    });

    return res.status(201).json(medicine);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create medicine.' });
  }
});

router.delete('/:id', auth(['pharmacy', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }

    if (req.user.role === 'pharmacy' && String(medicine.pharmacyId) !== String(req.user.pharmacyId)) {
      return res.status(403).json({ message: 'Access denied for this pharmacy.' });
    }

    await medicine.deleteOne();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete medicine.' });
  }
});

module.exports = router;
