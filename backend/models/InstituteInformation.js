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
  instituteAddress: {
    type: String,
    required: true
  },
  instituteContact: {
    type: String,
    required: true
  },
  instituteType: {
    type: String,
    enum: ['School', 'College', 'University'],
    required: true
  },
  instituteLogo: {
    type: String,
    default: ''
  },
  address: String,
  contactEmail: String,
  contactPhone: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InstituteInformation', instituteSchema);
