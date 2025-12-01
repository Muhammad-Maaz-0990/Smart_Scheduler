const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Users = require('../models/Users');
const OwnerUser = require('../models/OwnerUser');
const InstituteInformation = require('../models/InstituteInformation');
const { sendInstituteUserWelcome } = require('../utils/mailer');

router.get('/profile', protect, async (req, res) => {
  try {
    let user;
    
    if (req.user.designation === 'Owner') {
      user = await OwnerUser.findById(req.user.id).select('-password');
    } else {
      // instituteID is a business key string; no populate
      user = await Users.findById(req.user.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===================== Institute Users (Admin) =====================

// Helper to resolve current admin's institute business key
async function getAdminInstituteKey(userId) {
  const admin = await Users.findById(userId).select('designation instituteID');
  if (!admin || admin.designation !== 'Admin' || !admin.instituteID) return null;
  return admin.instituteID; // business key string
}

// Country detection based on phone prefix
function getCountryFromPhone(phone) {
  if (!phone) return 'PK';
  if (phone.startsWith('+1')) return 'US';
  if (phone.startsWith('+92')) return 'PK';
  if (phone.startsWith('+44')) return 'GB';
  if (phone.startsWith('+91')) return 'IN';
  if (phone.startsWith('+971')) return 'AE';
  if (phone.startsWith('+966')) return 'SA';
  return 'PK';
}

// Validate CNIC/National ID by country
function validateCNIC(cnic, country) {
  const patterns = {
    PK: /^\d{13}$/,
    US: /^\d{9}$/,
    IN: /^\d{12}$/,
    GB: /^[A-Z]{2}\d{6}[A-Z]$/i,
    AE: /^\d{3}-?\d{4}-?\d{7}-?\d$/,
    SA: /^\d{10}$/
  };
  if (!cnic) return false;
  const pattern = patterns[country];
  if (!pattern) return cnic.length >= 5;
  return pattern.test(String(cnic).replace(/[-\s]/g, ''));
}

// Normalize CNIC for storage
function normalizeCNIC(cnic, country) {
  if (!cnic) return cnic;
  if (['PK', 'US', 'IN', 'SA', 'AE'].includes(country)) {
    return String(cnic).replace(/[^0-9]/g, '');
  }
  if (country === 'GB') {
    return String(cnic).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
  return String(cnic).trim();
}

// GET /api/users/institute - list users in current admin's institute
router.get('/institute', protect, authorizeRoles('Admin'), async (req, res) => {
  try {
    const instituteKey = await getAdminInstituteKey(req.user.id);
    if (!instituteKey) {
      return res.status(403).json({ message: 'Admin institute not resolved' });
    }
    const users = await Users.find({ instituteID: instituteKey, _id: { $ne: req.user.id } })
      .select('-password')
      .sort({ userID: 1 });
    res.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users - create user in current admin's institute
router.post(
  '/',
  protect,
  authorizeRoles('Admin'),
  [
    body('userName').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('designation').isIn(['Student', 'Teacher']).withMessage('Invalid designation'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('cnic').trim().notEmpty().withMessage('National ID is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const instituteKey = await getAdminInstituteKey(req.user.id);
      if (!instituteKey) {
        return res.status(403).json({ message: 'Admin institute not resolved' });
      }

      let { userName, email, password, designation, phoneNumber, cnic } = req.body;

      // Validate CNIC against derived country from phone
      const country = getCountryFromPhone(String(phoneNumber || ''));
      if (!validateCNIC(cnic, country)) {
        return res.status(400).json({ message: 'Invalid National ID format for selected country' });
      }
      cnic = normalizeCNIC(cnic, country);

      // Enforce email uniqueness within the same institute
      const emailInInstitute = await Users.findOne({ instituteID: instituteKey, email });
      if (emailInInstitute) {
        return res.status(400).json({ message: 'Email already exists in this institute' });
      }
      // Optionally still guard against username global duplicates (schema enforces unique)
      const usernameExists = await Users.findOne({ userName });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const newUser = new Users({
        userName,
        email,
        password,
        designation,
        instituteID: instituteKey,
        phoneNumber,
        cnic
      });
      await newUser.save();

      // Prepare institute/Admin context for email
      const inst = await InstituteInformation.findOne({ instituteID: instituteKey });
      const creator = await Users.findById(req.user.id).select('userName email');

      // Send welcome email (non-fatal on failure)
      try {
        await sendInstituteUserWelcome({
          to: newUser.email,
          userName: newUser.userName,
          designation: newUser.designation,
          institute: inst ? {
            name: inst.instituteName,
            id: inst.instituteID,
            address: inst.address,
            contactNumber: inst.contactNumber,
            type: inst.instituteType
          } : null,
          createdBy: creator ? creator.userName : 'Admin',
          loginEmail: newUser.email
        });
      } catch (mailErr) {
        console.error('Welcome email failed:', mailErr.message || mailErr);
      }

      const sanitized = newUser.toObject();
      delete sanitized.password;
      res.status(201).json(sanitized);
    } catch (error) {
      if (error && error.code === 11000) {
        return res.status(400).json({ message: 'Duplicate user (email or username) already exists' });
      }
      console.error('User create error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/users/:id - update user within current admin's institute (no password/institute change)
router.put(
  '/:id',
  protect,
  authorizeRoles('Admin'),
  [
    body('userName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('designation').optional().isIn(['Student', 'Teacher']),
    body('phoneNumber').optional().isString(),
    body('cnic').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const instituteKey = await getAdminInstituteKey(req.user.id);
      if (!instituteKey) {
        return res.status(403).json({ message: 'Admin institute not resolved' });
      }

      const target = await Users.findById(req.params.id);
      if (!target || target.instituteID !== instituteKey) {
        return res.status(404).json({ message: 'User not found in your institute' });
      }

      const allowed = ['userName', 'email', 'designation', 'phoneNumber', 'cnic'];
      const update = {};
      for (const k of allowed) {
        if (Object.prototype.hasOwnProperty.call(req.body, k)) update[k] = req.body[k];
      }

      // Email uniqueness within institute on update
      if (update.email && update.email !== target.email) {
        const dupEmail = await Users.findOne({ instituteID: instituteKey, email: update.email, _id: { $ne: target._id } });
        if (dupEmail) {
          return res.status(400).json({ message: 'Email already exists in this institute' });
        }
      }

      // If phone and/or cnic present, validate and normalize cnic according to country
      const derivedCountry = getCountryFromPhone(String((update.phoneNumber ?? target.phoneNumber) || ''));
      const candidateCnic = update.cnic ?? target.cnic;
      if (!validateCNIC(candidateCnic, derivedCountry)) {
        return res.status(400).json({ message: 'Invalid National ID format for selected country' });
      }
      update.cnic = normalizeCNIC(candidateCnic, derivedCountry);

      const updated = await Users.findByIdAndUpdate(target._id, { $set: update }, { new: true, runValidators: true });
      const sanitized = updated.toObject();
      delete sanitized.password;
      res.json(sanitized);
    } catch (error) {
      if (error && error.code === 11000) {
        return res.status(400).json({ message: 'Duplicate user (email or username) already exists' });
      }
      console.error('User update error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/users/:id - delete user within current admin's institute
router.delete('/:id', protect, authorizeRoles('Admin'), async (req, res) => {
  try {
    const instituteKey = await getAdminInstituteKey(req.user.id);
    if (!instituteKey) {
      return res.status(403).json({ message: 'Admin institute not resolved' });
    }
    const target = await Users.findById(req.params.id);
    if (!target || target.instituteID !== instituteKey) {
      return res.status(404).json({ message: 'User not found in your institute' });
    }
    await Users.findByIdAndDelete(target._id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('User delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
