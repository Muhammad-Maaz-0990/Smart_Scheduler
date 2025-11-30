const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const Users = require('../models/Users');
const OwnerUser = require('../models/OwnerUser');
const InstituteInformation = require('../models/InstituteInformation');
const Subscription = require('../models/Subscription');

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

// @route   POST /api/auth/register-institute
// @desc    Register new institute with owner
// @access  Public
router.post('/register-institute', [
  body('instituteID').trim().notEmpty().withMessage('Institute ID is required'),
  body('instituteName').trim().notEmpty().withMessage('Institute name is required'),
  body('instituteAddress').trim().notEmpty().withMessage('Institute address is required'),
  body('institutePhone').trim().notEmpty().withMessage('Institute phone is required'),
  body('instituteType').isIn(['School', 'College', 'University']).withMessage('Invalid institute type'),
  body('userName').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('cnic').trim().notEmpty().withMessage('National ID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    instituteID,
    instituteName,
    instituteAddress,
    institutePhone,
    instituteType,
    userName,
    email,
    phoneNumber,
    cnic,
    password,
    country
  } = req.body;

  try {
    // Check if owner email already exists
    let existingUser = await OwnerUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if institute ID already exists
    let existingInstituteByID = await InstituteInformation.findOne({ instituteID });
    if (existingInstituteByID) {
      return res.status(400).json({ message: 'Institute ID already registered' });
    }

    // Check if institute name already exists
    let existingInstitute = await InstituteInformation.findOne({ instituteName });
    if (existingInstitute) {
      return res.status(400).json({ message: 'Institute name already registered' });
    }

    // Create Institute Information
    const newInstitute = new InstituteInformation({
      instituteID,
      instituteName,
      instituteAddress,
      instituteContact: institutePhone,
      instituteType
    });

    await newInstitute.save();

    // Create 7-day trial subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    const newSubscription = new Subscription({
      instituteID: newInstitute._id,
      subscriptionType: 'trial',
      status: 'active',
      startDate: new Date(),
      endDate: trialEndDate,
      trialUsed: true,
      autoRenew: false
    });

    await newSubscription.save();

    // Create Owner User
    const newOwner = new OwnerUser({
      userName,
      email,
      password,
      phoneNumber,
      cnic,
      role: 'Owner',
      instituteID: newInstitute._id
    });

    await newOwner.save();

    // Create Admin User in Users table
    const newAdmin = new Users({
      userName,
      email,
      password,
      phoneNumber,
      cnic: cnic || 'N/A',
      designation: 'Admin',
      instituteID: newInstitute._id
    });

    await newAdmin.save();

    // Generate token for Admin user
    const token = generateToken(newAdmin);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newAdmin._id,
        userName: newAdmin.userName,
        email: newAdmin.email,
        phoneNumber: newAdmin.phoneNumber,
        designation: 'Admin',
        instituteID: newInstitute._id,
        instituteName: newInstitute.instituteName
      },
      subscription: {
        type: 'trial',
        status: 'active',
        endDate: trialEndDate
      },
      message: 'Institute registered successfully with 7-day trial'
    });
  } catch (error) {
    console.error('Institute registration error:', error);
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
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }
      
      // If no user, redirect to register with Google info
      if (!user) {
        const email = info?.email || '';
        const name = info?.name || '';
        return res.redirect(`${process.env.FRONTEND_URL}/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
      }
      
      // If user exists, log them in
      req.logIn(user, (err) => {
        if (err) {
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=login_failed`);
        }
        
        // Generate JWT token
        const token = generateToken(user);
        
        // Redirect to frontend with token and user info
        const designation = user.designation || user.role || 'Student';
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&designation=${designation}`);
      });
    })(req, res, next);
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

// @route   GET /api/auth/institute/:instituteID
// @desc    Get institute information
// @access  Private
router.get('/institute/:instituteID', async (req, res) => {
  try {
    const institute = await InstituteInformation.findOne({ instituteID: req.params.instituteID });
    
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    res.json(institute);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
