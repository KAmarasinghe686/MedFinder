const mongoose = require('mongoose');

const adminMessageSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const emergencyOrderSchema = new mongoose.Schema(
  {
    referenceNumber:    { type: String, trim: true, required: true, index: true },
    medicineName:       { type: String, trim: true, required: true },
    contactName:        { type: String, trim: true, required: true },
    contactPhone:       { type: String, trim: true, required: true },
    deliveryAddress:    { type: String, trim: true, required: true },
    preferredPharmacy:  { type: String, trim: true, default: '' },
    notes:              { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Acknowledged', 'Fulfilled', 'Cancelled'],
      default: 'Pending',
    },
    acknowledgedBy: { type: String, trim: true, default: '' },
    adminMessages: { type: [adminMessageSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('EmergencyOrder', emergencyOrderSchema);
