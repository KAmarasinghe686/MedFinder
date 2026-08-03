const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getEmailValidationError,
  getOtpValidationError,
  getPharmacyValidationError,
  getRoleValidationError,
  normalizeEmail,
} = require('../src/utils/loginValidation');
const { generateOtp } = require('../src/utils/otp');

test('normalizes valid login emails and rejects malformed values', () => {
  assert.equal(normalizeEmail('  Patient@Example.COM '), 'patient@example.com');
  assert.equal(getEmailValidationError('patient@example.com'), null);
  assert.match(getEmailValidationError('not-an-email'), /valid email/i);
  assert.match(getEmailValidationError(''), /required/i);
});

test('accepts only known login roles and six-digit OTP values', () => {
  assert.equal(getRoleValidationError('user'), null);
  assert.equal(getRoleValidationError('pharmacy'), null);
  assert.equal(getRoleValidationError('admin'), null);
  assert.match(getRoleValidationError('super-admin'), /invalid/i);

  assert.equal(getOtpValidationError('123456'), null);
  assert.match(getOtpValidationError('12345'), /6-digit/i);
  assert.match(getOtpValidationError('12345a'), /6-digit/i);
});

test('validates pharmacy selection and generates secure six-digit OTP values', () => {
  assert.equal(getPharmacyValidationError('City Pharmacy'), null);
  assert.match(getPharmacyValidationError('   '), /required/i);

  for (let index = 0; index < 20; index += 1) {
    assert.match(generateOtp(), /^\d{6}$/);
  }
});
