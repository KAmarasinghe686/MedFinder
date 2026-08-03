const crypto = require('crypto');

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const getOtpExpiry = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

module.exports = {
  generateOtp,
  getOtpExpiry,
};
