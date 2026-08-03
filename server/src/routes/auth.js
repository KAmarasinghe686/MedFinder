const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const OtpToken = require('../models/OtpToken');
const auth = require('../middleware/auth');
const { generateOtp, getOtpExpiry } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/email');
const { getAdminLoginError } = require('../utils/adminAccess');
const {
  getEmailValidationError,
  getOtpValidationError,
  getPharmacyValidationError,
  getRoleValidationError,
  normalizeEmail,
  normalizePharmacyName,
} = require('../utils/loginValidation');

const router = express.Router();

const isDevFixedOtpEnabled = () =>
  String(process.env.DEV_FIXED_OTP_ENABLED || '').toLowerCase() === 'true';

const getFixedEmailForRole = (role) => {
  if (role === 'admin') {
    return (process.env.DEV_FIXED_ADMIN_EMAIL || '').trim().toLowerCase();
  }

  if (role === 'pharmacy') {
    return (process.env.DEV_FIXED_PHARMACY_EMAIL || '').trim().toLowerCase();
  }

  return (process.env.DEV_FIXED_USER_EMAIL || '').trim().toLowerCase();
};

const getFixedOtpForRole = (role) => {
  if (role === 'admin') {
    return (process.env.DEV_FIXED_ADMIN_OTP || '').trim();
  }

  if (role === 'pharmacy') {
    return (process.env.DEV_FIXED_PHARMACY_OTP || '').trim();
  }

  return (process.env.DEV_FIXED_USER_OTP || '').trim();
};

const getPharmacyApprovalMessage = (pharmacy) => {
  if (!pharmacy?.approvalStatus || pharmacy.approvalStatus === 'approved') {
    return null;
  }

  return pharmacy.approvalStatus === 'rejected'
    ? 'This pharmacy registration was rejected.'
    : 'This pharmacy registration is pending admin approval.';
};

const validatePharmacyBinding = async (user, requestedPharmacyName) => {
  if (!user?.pharmacyId) {
    return {
      status: 403,
      message: 'This pharmacy account is not linked to a pharmacy. Contact an administrator.',
    };
  }

  const pharmacy = await Pharmacy.findById(user.pharmacyId);
  if (!pharmacy) {
    return { status: 404, message: 'The pharmacy linked to this account was not found.' };
  }

  const approvalMessage = getPharmacyApprovalMessage(pharmacy);
  if (approvalMessage) {
    return { status: 403, message: approvalMessage };
  }

  if (
    requestedPharmacyName
    && pharmacy.name.trim().toLowerCase() !== requestedPharmacyName.trim().toLowerCase()
  ) {
    return {
      status: 403,
      message: 'This email does not belong to the selected pharmacy.',
    };
  }

  return { pharmacy };
};

const buildUserPayload = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  name: user.name || null,
  phone: user.phone || null,
  address: user.address || null,
  pharmacyId: user.pharmacyId,
  pharmacyName: user.pharmacyName,
});

// POST /register — patient self-registration (role='user' only)
router.post('/register', async (req, res) => {
  try {
    const { email, name, phone, address } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ message: 'Address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
    }

    await User.create({
      email: normalizedEmail,
      role: 'user',
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      address: address.trim(),
    });

    return res.status(201).json({ message: 'Account created. You can now sign in with OTP.' });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// POST /register-pharmacy — pharmacy self-registration
router.post('/register-pharmacy', async (req, res) => {
  try {
    const {
      pharmacyName,
      email,
      managerName,
      phone,
      address,
      licenseNumber,
      licenseDocument,
    } = req.body;

    if (!pharmacyName || !pharmacyName.trim()) {
      return res.status(400).json({ message: 'Pharmacy name is required.' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (!managerName || !managerName.trim()) {
      return res.status(400).json({ message: 'Manager name is required.' });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ message: 'Address is required.' });
    }
    if (!licenseNumber || !licenseNumber.trim() || !licenseDocument) {
      return res.status(400).json({ message: 'License number and document are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
    }

    const existingPharmacy = await Pharmacy.findOne({ name: pharmacyName.trim() });
    if (existingPharmacy) {
      return res.status(409).json({ message: 'A pharmacy with this name is already registered.' });
    }

    const pharmacy = await Pharmacy.create({
      name: pharmacyName.trim(),
      location: address.trim(),
      tel: phone ? phone.trim() : undefined,
      contactEmail: normalizedEmail,
      licenseNumber: licenseNumber.trim(),
      licenseDocument,
      approvalStatus: 'pending',
    });

    await User.create({
      email: normalizedEmail,
      role: 'pharmacy',
      name: managerName.trim(),
      phone: phone ? phone.trim() : undefined,
      address: address.trim(),
      pharmacyId: pharmacy._id,
      pharmacyName: pharmacy.name,
    });

    return res.status(201).json({ message: 'Pharmacy registered and pending admin approval.' });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

router.post('/request-otp', async (req, res) => {
  try {
    const { email, role, pharmacyName } = req.body || {};
    const roleError = getRoleValidationError(role);
    if (roleError) return res.status(400).json({ message: roleError });

    const emailError = getEmailValidationError(email);
    if (emailError) return res.status(400).json({ message: emailError });

    const fixedMode = isDevFixedOtpEnabled();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPharmacyName = role === 'pharmacy'
      ? normalizePharmacyName(
        pharmacyName || (fixedMode ? process.env.DEV_FIXED_PHARMACY_NAME : ''),
      )
      : '';
    if (role === 'pharmacy') {
      const pharmacyError = getPharmacyValidationError(normalizedPharmacyName);
      if (pharmacyError) return res.status(400).json({ message: pharmacyError });
    }

    if (fixedMode) {
      const fixedEmail = getFixedEmailForRole(role);
      const fixedOtp = getFixedOtpForRole(role);

      if (
        getEmailValidationError(fixedEmail)
        || getOtpValidationError(fixedOtp)
      ) {
        return res.status(500).json({
          message:
            'DEV_FIXED_OTP_ENABLED is true but its email or six-digit OTP configuration is invalid.',
        });
      }

      if (normalizedEmail !== fixedEmail) {
        return res.status(401).json({
          message: `Use the fixed ${role} email: ${fixedEmail}`,
        });
      }

      let resolvedPharmacyName = normalizedPharmacyName;
      if (role === 'pharmacy') {
        resolvedPharmacyName = normalizedPharmacyName;
      }

      let user = await User.findOne({ email: normalizedEmail });
      if (role === 'admin') {
        const adminError = getAdminLoginError(
          normalizedEmail,
          Boolean(user && user.role === 'admin'),
        );
        if (adminError) {
          return res.status(adminError.status).json({ message: adminError.message });
        }
      }
      if (!user) {
        if (role === 'pharmacy') {
          return res.status(404).json({
            message: 'No pharmacy account found for this email. Register the pharmacy first.',
          });
        }
        user = await User.create({
          email: normalizedEmail,
          role,
        });
      } else if (user.role !== role) {
        return res.status(409).json({ message: 'Account exists with a different role.' });
      }

      if (role === 'pharmacy') {
        const binding = await validatePharmacyBinding(user, resolvedPharmacyName);
        if (!binding.pharmacy) {
          return res.status(binding.status).json({ message: binding.message });
        }
      }

      await OtpToken.deleteMany({ email: normalizedEmail, role });

      return res.json({ message: 'OTP sent successfully (fixed dev mode).' });
    }

    if (!process.env.SMTP_HOST) {
      return res.status(503).json({
        message:
          'Email delivery is not configured on this server. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in server/.env to send OTPs by email.',
      });
    }

    // For regular patients: require pre-registration
    if (role === 'user') {
      const user = await User.findOne({ email: normalizedEmail, role: 'user' });
      if (!user) {
        return res.status(404).json({
          message: 'No account found for this email. Please register first.',
          needsRegistration: true,
        });
      }

      await OtpToken.deleteMany({ email: normalizedEmail, role });

      const otp = generateOtp();
      const tokenHash = await bcrypt.hash(otp, 10);
      const expiresAt = getOtpExpiry(Number(process.env.OTP_EXPIRY_MINUTES || 10));

      await OtpToken.create({ email: normalizedEmail, role, tokenHash, expiresAt });
      await sendOtpEmail({ to: normalizedEmail, otp, role });

      return res.json({ message: 'OTP sent successfully.' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (role === 'admin') {
      const adminError = getAdminLoginError(
        normalizedEmail,
        Boolean(user && user.role === 'admin'),
      );
      if (adminError) {
        return res.status(adminError.status).json({ message: adminError.message });
      }
    }
    if (!user) {
      if (role === 'pharmacy') {
        return res.status(404).json({
          message: 'No pharmacy account found for this email. Register the pharmacy first.',
        });
      }
      user = await User.create({
        email: normalizedEmail,
        role,
      });
    } else if (user.role !== role) {
      return res.status(409).json({ message: 'Account exists with a different role.' });
    }

    if (role === 'pharmacy') {
      const binding = await validatePharmacyBinding(user, normalizedPharmacyName);
      if (!binding.pharmacy) {
        return res.status(binding.status).json({ message: binding.message });
      }
    }

    await OtpToken.deleteMany({ email: normalizedEmail, role });

    const otp = generateOtp();
    const tokenHash = await bcrypt.hash(otp, 10);
    const expiresAt = getOtpExpiry(Number(process.env.OTP_EXPIRY_MINUTES || 10));

    await OtpToken.create({ email: normalizedEmail, role, tokenHash, expiresAt });
    await sendOtpEmail({ to: normalizedEmail, otp, role });

    return res.json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Failed to request OTP:', error);

    if (error?.code === 'EAUTH') {
      return res.status(500).json({
        message: 'SMTP authentication failed. For Gmail, use a valid App Password and SMTP_USER as the full Gmail address.',
      });
    }

    if (error?.code === 'EENVELOPE' || error?.code === 'EINVALIDMAIL') {
      return res.status(400).json({
        message: 'Invalid sender or recipient email address in SMTP settings.',
      });
    }

    if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNECTION') {
      return res.status(500).json({
        message: 'Could not connect to SMTP server. Check SMTP_HOST, SMTP_PORT, and your network/firewall.',
      });
    }

    return res.status(500).json({ message: 'Unable to send OTP email. Check SMTP settings and try again.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, role, otp, pharmacyName } = req.body || {};
    const roleError = getRoleValidationError(role);
    if (roleError) return res.status(400).json({ message: roleError });

    const emailError = getEmailValidationError(email);
    if (emailError) return res.status(400).json({ message: emailError });

    const otpError = getOtpValidationError(otp);
    if (otpError) return res.status(400).json({ message: otpError });

    const fixedMode = isDevFixedOtpEnabled();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPharmacyName = role === 'pharmacy'
      ? normalizePharmacyName(
        pharmacyName || (fixedMode ? process.env.DEV_FIXED_PHARMACY_NAME : ''),
      )
      : '';
    if (role === 'pharmacy') {
      const pharmacyError = getPharmacyValidationError(normalizedPharmacyName);
      if (pharmacyError) return res.status(400).json({ message: pharmacyError });
    }

    if (fixedMode) {
      const fixedEmail = getFixedEmailForRole(role);
      const fixedOtp = getFixedOtpForRole(role);

      if (
        getEmailValidationError(fixedEmail)
        || getOtpValidationError(fixedOtp)
      ) {
        return res.status(500).json({
          message:
            'DEV_FIXED_OTP_ENABLED is true but its email or six-digit OTP configuration is invalid.',
        });
      }

      if (normalizedEmail !== fixedEmail) {
        return res.status(401).json({ message: `Use the fixed ${role} email: ${fixedEmail}` });
      }

      if (String(otp).trim() !== fixedOtp) {
        return res.status(401).json({ message: 'Invalid OTP for fixed dev mode.' });
      }

      let user = await User.findOne({ email: normalizedEmail, role });
      if (role === 'admin') {
        const adminError = getAdminLoginError(normalizedEmail, Boolean(user));
        if (adminError) {
          return res.status(adminError.status).json({ message: adminError.message });
        }
      }
      if (!user) {
        if (role === 'pharmacy') {
          return res.status(404).json({
            message: 'No pharmacy account found for this email. Register the pharmacy first.',
          });
        }
        user = await User.create({
          email: normalizedEmail,
          role,
        });
      }

      if (role === 'pharmacy') {
        const binding = await validatePharmacyBinding(user, normalizedPharmacyName);
        if (!binding.pharmacy) {
          return res.status(binding.status).json({ message: binding.message });
        }
      }

      const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      });

      return res.json({ token, user: buildUserPayload(user) });
    }

    const tokenDoc = await OtpToken.findOne({ email: normalizedEmail, role });

    if (!tokenDoc) {
      return res.status(404).json({ message: 'OTP not found. Request a new code.' });
    }

    if (tokenDoc.expiresAt < new Date()) {
      await OtpToken.deleteOne({ _id: tokenDoc._id });
      return res.status(410).json({ message: 'OTP expired. Request a new code.' });
    }

    const isMatch = await bcrypt.compare(String(otp).trim(), tokenDoc.tokenHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid OTP.' });
    }

    await OtpToken.deleteOne({ _id: tokenDoc._id });

    const user = await User.findOne({ email: normalizedEmail, role });
    if (role === 'admin') {
      const adminError = getAdminLoginError(normalizedEmail, Boolean(user));
      if (adminError) {
        return res.status(adminError.status).json({ message: adminError.message });
      }
    }
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }
    if (role === 'pharmacy') {
      const binding = await validatePharmacyBinding(user, normalizedPharmacyName);
      if (!binding.pharmacy) {
        return res.status(binding.status).json({ message: binding.message });
      }
    }

    const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    });

    return res.json({ token, user: buildUserPayload(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to verify OTP.' });
  }
});

router.get('/me', auth(), (req, res) => {
  res.json({ user: buildUserPayload(req.user) });
});

// PATCH /profile — update name, phone, address for signed-in patients
router.patch('/profile', auth(['user']), async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        address: address ? address.trim() : '',
      },
      { new: true },
    );

    return res.json({ user: buildUserPayload(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
});

module.exports = router;
