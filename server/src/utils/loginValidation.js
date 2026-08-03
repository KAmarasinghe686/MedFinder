const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = new Set(['user', 'pharmacy', 'admin']);
const MAX_EMAIL_LENGTH = 254;
const MAX_PHARMACY_NAME_LENGTH = 120;

const normalizeEmail = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const normalizePharmacyName = (value) =>
  typeof value === 'string' ? value.trim() : '';

const getEmailValidationError = (value) => {
  const email = normalizeEmail(value);
  if (!email) return 'Email is required.';
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address.';
  }
  return null;
};

const getRoleValidationError = (role) =>
  ALLOWED_ROLES.has(role) ? null : 'Invalid account role.';

const getPharmacyValidationError = (value) => {
  const pharmacyName = normalizePharmacyName(value);
  if (!pharmacyName) return 'Pharmacy is required.';
  if (pharmacyName.length > MAX_PHARMACY_NAME_LENGTH) {
    return `Pharmacy name must be ${MAX_PHARMACY_NAME_LENGTH} characters or fewer.`;
  }
  return null;
};

const getOtpValidationError = (value) =>
  typeof value === 'string' && /^\d{6}$/.test(value.trim())
    ? null
    : 'Enter a valid 6-digit OTP code.';

module.exports = {
  MAX_EMAIL_LENGTH,
  MAX_PHARMACY_NAME_LENGTH,
  getEmailValidationError,
  getOtpValidationError,
  getPharmacyValidationError,
  getRoleValidationError,
  normalizeEmail,
  normalizePharmacyName,
};
