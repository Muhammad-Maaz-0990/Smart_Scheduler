const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  classID: {
    type: Number,
    required: true,
    unique: true
  },
  degree: {
    type: String,
    required: true
  },
  session: {
    type: String,
    enum: ['Fall', 'Spring'],
    required: true
  },
  section: {
    type: String,
    required: false,
    default: ''
  },
  year: {
    type: String,
    required: true
  },
  rank: {
    type: Number,
    required: true
  },
  instituteID: {
    type: String,
    required: true,
    ref: 'InstituteInformation'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique class per institute
classSchema.index({ degree: 1, session: 1, section: 1, year: 1, instituteID: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
