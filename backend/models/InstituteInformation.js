const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  instituteName: {
    type: String,
    required: true,
    unique: true
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
