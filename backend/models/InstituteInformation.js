const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  instituteID: {
    type: String,
    required: true,
    unique: true
  },
  instituteName: {
    type: String,
    required: true,
    unique: true
  },
  // Backward-compatible string logo (legacy). New binary fields below.
  instituteLogo: {
    type: String,
    default: ''
  },
  logoData: {
    type: Buffer,
    required: false
  },
  logoContentType: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  themeColor: {
    type: String,
    default: '#7c3aed'
  },
  subscription: {
    type: String,
    enum: ['Monthly', 'Yearly', 'Trial'],
    default: 'Trial'
  },
  instituteType: {
    type: String,
    enum: ['School', 'College', 'University'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InstituteInformation', instituteSchema);
