const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const { isAdminSessionAllowed } = require('../utils/adminAccess');

const auth = (allowedRoles = []) => async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();

    if (!user) {
      return res.status(401).json({ message: 'Invalid user.' });
    }

    if (user.role === 'admin' && !isAdminSessionAllowed(user.email)) {
      return res.status(403).json({
        message: 'Admin access is no longer enabled for this email.',
      });
    }

    if (user.role === 'pharmacy') {
      const pharmacy = user.pharmacyId
        ? await Pharmacy.findById(user.pharmacyId).select('approvalStatus').lean()
        : null;
      if (
        !pharmacy
        || (pharmacy.approvalStatus && pharmacy.approvalStatus !== 'approved')
      ) {
        return res.status(403).json({
          message: pharmacy?.approvalStatus === 'rejected'
            ? 'This pharmacy registration was rejected.'
            : 'This pharmacy registration is pending admin approval.',
        });
      }
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = auth;
