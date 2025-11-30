const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Counter = require('./Counter');

const userSchema = new mongoose.Schema({
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
    required: false,
    default: 'N/A'
  },
  cnic: {
    type: String,
    required: false,
    default: 'N/A'
  },
  designation: {
    type: String,
    required: true,
    enum: ['Admin', 'Student', 'Teacher']
  },
  instituteID: {
    type: String,
    ref: 'InstituteInformation',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Auto-increment userID if not set
  if (this.isNew && !this.userID) {
    const counter = await Counter.findByIdAndUpdate(
      'users_userID',
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Users', userSchema);
