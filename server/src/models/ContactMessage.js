const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, trim: true, maxlength: 150, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
