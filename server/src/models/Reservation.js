const mongoose = require('mongoose');

const reservationItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    name: { type: String, trim: true, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const reservationSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', default: null },
    items: { type: [reservationItemSchema], default: [] },
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    medicineName:   { type: String, trim: true, required: true },
    pharmacyName:   { type: String, trim: true, required: true },
    price:          { type: String, trim: true },
    customerName:   { type: String, trim: true, required: true },
    customerPhone:  { type: String, trim: true, required: true },
    notes:          { type: String, trim: true },
    prescriptionData:     { type: String },
    prescriptionFileName: { type: String, trim: true },
    referenceNumber: { type: String, trim: true, default: null },
    fulfillmentType: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: 'pickup',
    },
    deliveryAddress: { type: String, trim: true, default: '' },
    patientConfirmedReceivedAt: { type: Date, default: null },
    inventoryStatus: {
      type: String,
      enum: ['reserved', 'released', 'consumed', 'not_applicable'],
      default: 'not_applicable',
    },
    rejectionNote:   { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Packing', 'Ready for Pickup', 'Delivered', 'Cancelled', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true },
);

reservationSchema.index(
  { referenceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { referenceNumber: { $type: 'string' } },
  },
);

module.exports = mongoose.model('Reservation', reservationSchema);
