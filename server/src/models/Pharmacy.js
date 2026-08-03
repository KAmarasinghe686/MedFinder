const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    location: { type: String, trim: true },
    tel: { type: String, trim: true },
    open: { type: String, trim: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 0 },
    image: { type: String, trim: true },
    days: { type: String, trim: true },
    description: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    licenseDocument: { type: String },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvalNote: { type: String, trim: true, default: '' },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Pharmacy', pharmacySchema);
