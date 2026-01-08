const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const Users = require('../models/Users');
const OwnerUser = require('../models/OwnerUser');
const InstituteInformation = require('../models/InstituteInformation');
const { protect, authorizeRoles } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { sendSelfRegistrationWelcome, sendNewInstituteWelcome, sendAdminNotification, sendOwnerNotification } = require('../utils/mailer');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      userName: user.userName,
      designation: user.designation || user.role,
      instituteID: user.instituteID
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
  const loginEmail = String(email || '').trim();

  try {
    // Prefer regular Users (Admin/Student/Teacher) first so Admin dashboard shows correctly
    // Case-insensitive email lookup to avoid casing mismatches
    const emailQuery = { email: new RegExp(`^${loginEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    let user = await Users.findOne(emailQuery);
    let userType = 'User';

    // If not found in Users, fallback to OwnerUser
    if (!user) {
      user = await OwnerUser.findOne(emailQuery);
      userType = 'Owner';
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

    // Prepare response (fetch institute name if applicable)
    let instituteName;
    if (userType === 'User' && user.instituteID) {
      try {
        const inst = await InstituteInformation.findOne({ instituteID: user.instituteID }, 'instituteName');
        instituteName = inst?.instituteName;
      } catch {}
    }

    const responseData = {
      token,
      user: {
        id: user._id,
        userID: user.userID, // numeric ID
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        designation: user.designation || user.role,
        ...(userType === 'User' && {
          instituteID: user.instituteID,
          instituteName
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
  body('designation').isIn(['Admin', 'Student', 'Teacher']).withMessage('Invalid designation')
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

    // Only create regular Users accounts (Admin/Student/Teacher)

    // For other designations, create regular User
    if (!instituteID) {
      return res.status(400).json({ message: 'Institute ID is required for this designation' });
    }

    // Verify institute exists (by business key)
    const institute = await InstituteInformation.findOne({ instituteID });
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

    // Send welcome email to new user (non-fatal on failure)
    try {
      await sendSelfRegistrationWelcome({
        to: newUser.email,
        userName: newUser.userName,
        designation: newUser.designation,
        institute: {
          name: institute.instituteName,
          id: institute.instituteID,
          address: institute.address,
          contactNumber: institute.contactNumber,
          type: institute.instituteType
        },
        loginEmail: newUser.email
      });
    } catch (mailErr) {
      console.error('Welcome email failed:', mailErr.message || mailErr);
    }

    // Send notification to admin (non-fatal on failure)
    try {
      const adminUser = await Users.findOne({ 
        instituteID: institute.instituteID, 
        designation: 'Admin' 
      }).select('email userName');
      
      if (adminUser && adminUser.email) {
        await sendAdminNotification({
          to: adminUser.email,
          newUserName: newUser.userName,
          designation: newUser.designation,
          newUserEmail: newUser.email,
          instituteName: institute.instituteName
        });
      }
    } catch (mailErr) {
      console.error('Admin notification email failed:', mailErr.message || mailErr);
    }

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
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate user (email or username) already exists' });
    }
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
  body('address').trim().notEmpty().withMessage('Institute address is required'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
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
    address,
    contactNumber,
    instituteType,
    userName,
    email,
    phoneNumber,
    cnic,
    password,
    instituteLogo
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

    // Prepare binary logo from data URL if provided
    let logoData, logoContentType;
    if (typeof instituteLogo === 'string' && instituteLogo.startsWith('data:')) {
      try {
        const match = instituteLogo.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
          logoContentType = match[1] || 'image/png';
          const b64 = match[2];
          logoData = Buffer.from(b64, 'base64');
        }
      } catch {}
    }

    // Create Institute Information
    const newInstitute = new InstituteInformation({
      instituteID,
      instituteName,
      address,
      contactNumber,
      instituteType,
      // Keep legacy string for backward compatibility only if it's a non-data URL string
      instituteLogo: (typeof instituteLogo === 'string' && !instituteLogo.startsWith('data:')) ? instituteLogo : '',
      logoData,
      logoContentType,
      subscription: 'Trial'
    });

    await newInstitute.save();

    // Create Admin User in Users table (only Users table)
    const newAdmin = new Users({
      userName,
      email,
      password,
      phoneNumber,
      cnic: cnic || 'N/A',
      designation: 'Admin',
      instituteID: newInstitute.instituteID
    });

    await newAdmin.save();

    // Generate token for Admin user
    const token = generateToken(newAdmin);

    // Send welcome email to new admin (non-fatal on failure)
    try {
      await sendNewInstituteWelcome({
        to: newAdmin.email,
        userName: newAdmin.userName,
        institute: {
          name: newInstitute.instituteName,
          id: newInstitute.instituteID,
          type: newInstitute.instituteType
        }
      });
    } catch (mailErr) {
      console.error('Institute welcome email failed:', mailErr.message || mailErr);
    }

    // Send notification to all owners (non-fatal on failure)
    try {
      const owners = await OwnerUser.find({}).select('email userName');
      
      if (owners && owners.length > 0) {
        const ownerEmailPromises = owners.map(owner => 
          sendOwnerNotification({
            to: owner.email,
            instituteName: newInstitute.instituteName,
            instituteID: newInstitute.instituteID,
            instituteType: newInstitute.instituteType,
            adminName: newAdmin.userName,
            adminEmail: newAdmin.email
          }).catch(err => {
            console.error(`Failed to send notification to owner ${owner.email}:`, err.message);
          })
        );
        
        await Promise.allSettled(ownerEmailPromises);
        console.log(`Sent institute registration notifications to ${owners.length} owner(s)`);
      }
    } catch (mailErr) {
      console.error('Owner notification emails failed:', mailErr.message || mailErr);
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newAdmin._id,
        userName: newAdmin.userName,
        email: newAdmin.email,
        phoneNumber: newAdmin.phoneNumber,
        designation: 'Admin',
        instituteID: newInstitute.instituteID,
        instituteName: newInstitute.instituteName
      },
      message: 'Institute registered successfully with Trial subscription'
    });
  } catch (error) {
    console.error('Institute registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   GET /api/auth/google
// @desc    Google OAuth authentication
// @access  Public
function getPublicBaseUrl(req) {
  const forwardedProto = (req.get('x-forwarded-proto') || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${protocol}://${host}`;
}

router.get('/google', (req, res, next) => {
  const callbackURL = `${getPublicBaseUrl(req)}/api/auth/google/callback`;
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    callbackURL,
  })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  (req, res, next) => {
    const callbackURL = `${getPublicBaseUrl(req)}/api/auth/google/callback`;
    passport.authenticate('google', { session: false, callbackURL }, (err, user, info) => {
      if (err) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }
      
      // If no user, redirect to register with Google info
      if (!user) {
        const email = info?.email || '';
        const name = info?.name || '';
        return res.redirect(`${process.env.FRONTEND_URL}/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
      }

      // Generate JWT token (no session needed)
      const token = generateToken(user);

      // Redirect to frontend with token and user info
      const designation = user.designation || user.role || 'Student';
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&designation=${designation}`);
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
      user = await Users.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach instituteName for Users
    if (user && user.instituteID) {
      try {
        const inst = await InstituteInformation.findOne({ instituteID: user.instituteID }, 'instituteName');
        if (inst) {
          return res.json({ user: { ...user.toObject(), instituteName: inst.instituteName } });
        }
      } catch {}
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
    const { instituteID } = req.params;
    let institute = null;

    // Try by business key `instituteID`
    institute = await InstituteInformation.findOne({ instituteID });

    // If not found, and looks like ObjectId, try by _id
    if (!institute) {
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(instituteID);
      if (isObjectId) {
        institute = await InstituteInformation.findById(instituteID);
      }
    }
    
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Serialize: if binary logo exists, expose a URL for frontend compatibility
    const obj = institute.toObject();
    if (obj.logoData && obj.logoData.length) {
      obj.instituteLogo = `/api/auth/institute/${encodeURIComponent(instituteID)}/logo`;
      delete obj.logoData; // don't send binary in JSON
      // keep logoContentType if needed by clients
    }

    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/auth/institute/:instituteID/logo
// @desc    Get institute logo binary
// @access  Private
router.get('/institute/:instituteID/logo', async (req, res) => {
  try {
    const { instituteID } = req.params;
    let institute = await InstituteInformation.findOne({ instituteID });
    if (!institute) {
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(instituteID);
      if (isObjectId) {
        institute = await InstituteInformation.findById(instituteID);
      }
    }

    if (!institute || !institute.logoData) {
      return res.status(404).send('Logo not found');
    }

    res.set('Content-Type', institute.logoContentType || 'image/png');
    return res.send(institute.logoData);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

  // @route   PUT /api/auth/institute/:instituteID
  // @desc    Update institute info (Admin of that institute only)
  // @access  Private
  router.put('/institute/:instituteID', protect, authorizeRoles('Admin'), async (req, res) => {
    try {
      const { instituteID } = req.params;
      const adminInstitute = req.user?.instituteID;
      if (!adminInstitute || adminInstitute !== instituteID) {
        return res.status(403).json({ message: 'You can only update your own institute' });
      }

      const { instituteName, address, contactNumber, instituteLogo, themeColor } = req.body;
      
      console.log('📥 Received update request:', { instituteName, address, contactNumber, themeColor });

      // Prepare binary logo from data URL if provided
      let logoData, logoContentType, logoString = undefined;
      if (typeof instituteLogo === 'string') {
        if (instituteLogo.startsWith('data:')) {
          try {
            const match = instituteLogo.match(/^data:(.*?);base64,(.*)$/);
            if (match) {
              logoContentType = match[1] || 'image/png';
              const b64 = match[2];
              logoData = Buffer.from(b64, 'base64');
            }
          } catch {}
          logoString = ''; // clear legacy string if data url provided
        } else {
          // keep legacy string URL if non-data URL provided
          logoString = instituteLogo;
          logoData = undefined;
          logoContentType = undefined;
        }
      }

      const update = {};
      if (typeof instituteName === 'string') update.instituteName = instituteName.trim();
      if (typeof address === 'string') update.address = address.trim();
      if (typeof contactNumber === 'string') update.contactNumber = contactNumber.trim();
      if (typeof themeColor === 'string') update.themeColor = themeColor.trim();
      if (logoString !== undefined) update.instituteLogo = logoString;
      if (logoData !== undefined) update.logoData = logoData;
      if (logoContentType !== undefined) update.logoContentType = logoContentType;

      console.log('💾 Updating institute with:', update);

      const inst = await InstituteInformation.findOneAndUpdate(
        { instituteID },
        { $set: update },
        { new: true }
      );
      if (!inst) return res.status(404).json({ message: 'Institute not found' });

      console.log('✅ Institute updated. Theme color:', inst.themeColor);

      const obj = inst.toObject();
      if (obj.logoData && obj.logoData.length) {
        obj.instituteLogo = `/api/auth/institute/${encodeURIComponent(instituteID)}/logo`;
        delete obj.logoData;
      }
      res.json(obj);
    } catch (err) {
      console.error('Institute update error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // @route   PUT /api/auth/change-password
  // @desc    Change current user's password
  // @access  Private
  router.put('/change-password', protect, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword || String(newPassword).length < 6) {
        return res.status(400).json({ message: 'Provide oldPassword and newPassword (min 6 chars)' });
      }

      // User can be in either collection
      let user = await Users.findById(req.user.id);
      let collection = 'Users';
      if (!user) {
        user = await OwnerUser.findById(req.user.id);
        collection = 'OwnerUser';
      }
      if (!user) return res.status(404).json({ message: 'User not found' });

      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) return res.status(401).json({ message: 'Old password is incorrect' });

      // Hash and save new password
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      user.password = hashed;
      await user.save();

      res.json({ ok: true, message: 'Password changed successfully' });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

// @route   GET /api/auth/institutes
// @desc    Get all institutes (Owner only)
// @access  Private
router.get('/institutes', protect, async (req, res) => {
  try {
    const institutes = await InstituteInformation.find({});
    
    // Add teacher and student counts, admin info, and logo for each institute
    const institutesWithCounts = await Promise.all(
      institutes.map(async (inst) => {
        const teachers = await Users.countDocuments({ instituteID: inst.instituteID, designation: 'Teacher' });
        const students = await Users.countDocuments({ instituteID: inst.instituteID, designation: 'Student' });
        const admin = await Users.findOne({ instituteID: inst.instituteID, designation: 'Admin' }).select('userName email phoneNumber cnic');
        
        // Convert logo to base64 if it exists
        let logoUrl = null;
        if (inst.logoData && inst.logoContentType) {
          const base64Logo = inst.logoData.toString('base64');
          logoUrl = `data:${inst.logoContentType};base64,${base64Logo}`;
        }
        
        return {
          _id: inst._id,
          instituteID: inst.instituteID,
          instituteName: inst.instituteName,
          email: admin?.email || 'N/A',
          address: inst.address,
          contactNumber: inst.contactNumber,
          instituteType: inst.instituteType,
          subscription: inst.subscription,
          created_at: inst.created_at,
          totalTeachers: teachers,
          totalStudents: students,
          admin: admin ? {
            userName: admin.userName,
            email: admin.email,
            phoneNumber: admin.phoneNumber,
            cnic: admin.cnic
          } : null,
          logoUrl
        };
      })
    );
    
    res.json(institutesWithCounts);
  } catch (err) {
    console.error('Get institutes error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/auth/owner-stats
// @desc    Get owner dashboard statistics
// @access  Private
router.get('/owner-stats', protect, async (req, res) => {
  try {
    const institutes = await InstituteInformation.countDocuments();
    const teachers = await Users.countDocuments({ designation: 'Teacher' });
    const students = await Users.countDocuments({ designation: 'Student' });
    
    res.json({ institutes, teachers, students });
  } catch (err) {
    console.error('Get owner stats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// @route   GET /api/auth/institute-growth
// @desc    Get institute growth over time (cumulative count by date)
// @access  Private
router.get('/institute-growth', protect, async (req, res) => {
  try {
    // Get all institutes with their creation date
    const institutes = await InstituteInformation.find({}, 'created_at').sort({ created_at: 1 });
    // Aggregate by date (YYYY-MM-DD)
    const growthMap = {};
    institutes.forEach(inst => {
      const date = inst.created_at.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!growthMap[date]) growthMap[date] = 0;
      growthMap[date] += 1;
    });
    // Build cumulative array
    let cumulative = 0;
    const growthArray = Object.keys(growthMap).sort().map(date => {
      cumulative += growthMap[date];
      return { date, count: cumulative };
    });
    res.json(growthArray);
  } catch (err) {
    console.error('Get institute growth error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== OwnerUser CRUD Routes ====================

// @route   GET /api/auth/owner-users
// @desc    Get all owner users
// @access  Private (Owner only)
router.get('/owner-users', protect, async (req, res) => {
  try {
    const ownerUsers = await OwnerUser.find({}).select('-password');
    res.json(ownerUsers);
  } catch (err) {
    console.error('Get owner users error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/auth/owner-users
// @desc    Create a new owner user
// @access  Private (Owner only)
router.post('/owner-users', [
  protect,
  body('userName').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('cnic').notEmpty().withMessage('National ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userName, email, password, phoneNumber, cnic } = req.body;

  try {
    // Check if user already exists
    const existingUser = await OwnerUser.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Create new owner user
    const newOwnerUser = new OwnerUser({
      userName,
      email,
      password,
      phoneNumber,
      cnic,
      role: 'Owner'
    });

    await newOwnerUser.save();

    res.status(201).json({ 
      message: 'Owner user created successfully',
      user: {
        id: newOwnerUser._id,
        userName: newOwnerUser.userName,
        email: newOwnerUser.email,
        phoneNumber: newOwnerUser.phoneNumber,
        cnic: newOwnerUser.cnic
      }
    });
  } catch (err) {
    console.error('Create owner user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/auth/owner-users/:id
// @desc    Update an owner user
// @access  Private (Owner only)
router.put('/owner-users/:id', [
  protect,
  body('userName').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('cnic').notEmpty().withMessage('National ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userName, email, phoneNumber, cnic, password } = req.body;

  try {
    const ownerUser = await OwnerUser.findById(req.params.id);
    if (!ownerUser) {
      return res.status(404).json({ message: 'Owner user not found' });
    }

    // Check if email or username is taken by another user
    const existingUser = await OwnerUser.findOne({ 
      $or: [{ email }, { userName }],
      _id: { $ne: req.params.id }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already in use' });
    }

    // Update fields
    ownerUser.userName = userName;
    ownerUser.email = email;
    ownerUser.phoneNumber = phoneNumber;
    ownerUser.cnic = cnic;

    // Only update password if provided
    if (password && password.trim()) {
      ownerUser.password = password;
    }

    await ownerUser.save();

    res.json({ 
      message: 'Owner user updated successfully',
      user: {
        id: ownerUser._id,
        userName: ownerUser.userName,
        email: ownerUser.email,
        phoneNumber: ownerUser.phoneNumber,
        cnic: ownerUser.cnic
      }
    });
  } catch (err) {
    console.error('Update owner user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   DELETE /api/auth/owner-users/:id
// @desc    Delete an owner user
// @access  Private (Owner only)
router.delete('/owner-users/:id', protect, async (req, res) => {
  try {
    const ownerUser = await OwnerUser.findById(req.params.id);
    if (!ownerUser) {
      return res.status(404).json({ message: 'Owner user not found' });
    }

    // Prevent deleting yourself
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await OwnerUser.findByIdAndDelete(req.params.id);
    res.json({ message: 'Owner user deleted successfully' });
  } catch (err) {
    console.error('Delete owner user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== Owner Profile Routes ====================

// @route   GET /api/auth/owner-profile
// @desc    Get owner profile
// @access  Private (Owner only)
router.get('/owner-profile', protect, async (req, res) => {
  try {
    const ownerUser = await OwnerUser.findById(req.user.id).select('-password');
    if (!ownerUser) {
      return res.status(404).json({ message: 'Owner user not found' });
    }
    res.json(ownerUser);
  } catch (err) {
    console.error('Get owner profile error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/auth/owner-profile
// @desc    Update owner profile
// @access  Private (Owner only)
router.put('/owner-profile', [
  protect,
  body('userName').optional().notEmpty().withMessage('Username cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phoneNumber').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('cnic').optional().notEmpty().withMessage('National ID cannot be empty')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userName, email, phoneNumber, cnic } = req.body;

  try {
    const ownerUser = await OwnerUser.findById(req.user.id);
    if (!ownerUser) {
      return res.status(404).json({ message: 'Owner user not found' });
    }

    // Check if email or username is taken by another user
    if (userName || email) {
      const existingUser = await OwnerUser.findOne({ 
        $or: [
          ...(email ? [{ email }] : []),
          ...(userName ? [{ userName }] : [])
        ],
        _id: { $ne: req.user.id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email or username already in use' });
      }
    }

    // Update fields
    if (userName) ownerUser.userName = userName;
    if (email) ownerUser.email = email;
    if (phoneNumber) ownerUser.phoneNumber = phoneNumber;
    if (cnic) ownerUser.cnic = cnic;

    await ownerUser.save();

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: ownerUser._id,
        userName: ownerUser.userName,
        email: ownerUser.email,
        phoneNumber: ownerUser.phoneNumber,
        cnic: ownerUser.cnic
      }
    });
  } catch (err) {
    console.error('Update owner profile error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/auth/owner-change-password
// @desc    Change owner password
// @access  Private (Owner only)
router.put('/owner-change-password', [
  protect,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const ownerUser = await OwnerUser.findById(req.user.id);
    if (!ownerUser) {
      return res.status(404).json({ message: 'Owner user not found' });
    }

    // Verify current password
    const isMatch = await ownerUser.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    ownerUser.password = newPassword;
    await ownerUser.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change owner password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
