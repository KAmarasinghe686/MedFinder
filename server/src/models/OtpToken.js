const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('OtpToken', otpTokenSchema);
