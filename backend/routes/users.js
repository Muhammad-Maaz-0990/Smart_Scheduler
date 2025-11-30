const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const Users = require('../models/Users');
const OwnerUser = require('../models/OwnerUser');
const InstituteInformation = require('../models/InstituteInformation');

router.get('/profile', protect, async (req, res) => {
  try {
    let user;
    
    if (req.user.designation === 'Owner') {
      user = await OwnerUser.findById(req.user.id).select('-password');
    } else {
      user = await Users.findById(req.user.id).select('-password').populate('instituteID');
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

// @route   GET /api/users/institutes
// @desc    Get all institutes
// @access  Public
router.get('/institutes', async (req, res) => {
  try {
    const institutes = await InstituteInformation.find().select('instituteName address');
    res.json({ institutes });
  } catch (error) {
    console.error('Institutes fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/institutes
// @desc    Create new institute (Owner only)
// @access  Private
router.post('/institutes', protect, authorizeRoles('Owner'), async (req, res) => {
  try {
    const { instituteName, address, contactEmail, contactPhone } = req.body;

    const existingInstitute = await InstituteInformation.findOne({ instituteName });
    if (existingInstitute) {
      return res.status(400).json({ message: 'Institute already exists' });
    }

    const newInstitute = new InstituteInformation({
      instituteName,
      address,
      contactEmail,
      contactPhone
    });

    await newInstitute.save();

    res.status(201).json({ 
      message: 'Institute created successfully',
      institute: newInstitute 
    });
  } catch (error) {
    console.error('Institute creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
