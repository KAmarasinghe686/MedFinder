const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brandName: { type: String, trim: true },
    category: { type: String, trim: true },
    productForm: { type: String, trim: true },
    price: { type: String, trim: true },
    available: { type: Boolean, default: true },
    quantity: { type: Number, default: 0, min: 0 },
    requiresPrescription: { type: Boolean, default: false },
    image: { type: String },
    description: { type: String, trim: true },
    usage: { type: String, trim: true },
    ageLimit: { type: String, trim: true },
    dose: { type: String, trim: true },
    ingredients: { type: String, trim: true },
    size: { type: String, trim: true },
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    pharmacyName: { type: String, trim: true, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Medicine', medicineSchema);
