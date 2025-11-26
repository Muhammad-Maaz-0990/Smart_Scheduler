const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const Users = require('../models/Users');
const OwnerUser = require('../models/OwnerUser');
const InstituteInformation = require('../models/InstituteInformation');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      userName: user.userName,
      designation: user.designation || user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check in OwnerUser first
    let user = await OwnerUser.findOne({ email });
    let userType = 'Owner';

    // If not found in OwnerUser, check in Users
    if (!user) {
      user = await Users.findOne({ email }).populate('instituteID', 'instituteName');
      userType = 'User';
    }

    // If user not found in both collections
    if (!user) {
      return res.status(404).json({ 
        message: 'No account found. Please register first.',
        redirectTo: 'register'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Prepare response
    const responseData = {
      token,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        designation: user.designation || user.role,
        ...(userType === 'User' && { 
          instituteID: user.instituteID?._id,
          instituteName: user.instituteID?.instituteName 
        })
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', [
  body('userName').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('designation').isIn(['Admin', 'Student', 'Teacher', 'Owner']).withMessage('Invalid designation')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userName, email, password, phoneNumber, cnic, designation, instituteID } = req.body;

  try {
    // Check if user already exists in either collection
    let existingUser = await Users.findOne({ $or: [{ email }, { userName }] });
    if (!existingUser) {
      existingUser = await OwnerUser.findOne({ $or: [{ email }, { userName }] });
    }

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // If designation is Owner, create OwnerUser
    if (designation === 'Owner') {
      const newOwner = new OwnerUser({
        userName,
        email,
        password,
        phoneNumber,
        role: 'Owner'
      });

      await newOwner.save();

      const token = generateToken(newOwner);

      return res.status(201).json({
        token,
        user: {
          id: newOwner._id,
          userName: newOwner.userName,
          email: newOwner.email,
          phoneNumber: newOwner.phoneNumber,
          designation: 'Owner'
        }
      });
    }

    // For other designations, create regular User
    if (!instituteID) {
      return res.status(400).json({ message: 'Institute ID is required for this designation' });
    }

    // Verify institute exists
    const institute = await InstituteInformation.findById(instituteID);
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    const newUser = new Users({
      userName,
      email,
      password,
      phoneNumber,
      cnic: cnic || 'N/A',
      designation,
      instituteID
    });

    await newUser.save();

    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        designation: newUser.designation,
        instituteID: newUser.instituteID,
        instituteName: institute.instituteName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   GET /api/auth/google
// @desc    Google OAuth authentication
// @access  Public
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL + '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user);
    
    // Redirect to frontend with token and user info
    const designation = req.user.designation || req.user.role || 'Student';
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&designation=${designation}`);
  }
);

// @route   GET /api/auth/verify
// @desc    Verify token and get user info
// @access  Private
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user = await OwnerUser.findById(decoded.id).select('-password');
    
    if (!user) {
      user = await Users.findById(decoded.id).select('-password').populate('instituteID', 'instituteName');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
