const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Counter = require('./Counter');

const ownerUserSchema = new mongoose.Schema({
  userID: {
    type: Number,
    unique: true,
    index: true
  },
  userName: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: true
  },
  cnic: {
    type: String,
    required: false,
    default: 'N/A'
  },
  role: {
    type: String,
    default: 'Owner'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
ownerUserSchema.pre('save', async function(next) {
  // Auto-increment userID if not set
  if (this.isNew && !this.userID) {
    const counter = await Counter.findByIdAndUpdate(
      'owneruser_userID',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userID = counter.seq;
  }

  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
ownerUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('OwnerUser', ownerUserSchema);
