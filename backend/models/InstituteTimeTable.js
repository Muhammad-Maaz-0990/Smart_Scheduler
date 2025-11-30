const mongoose = require('mongoose');

const instituteTimeTableSchema = new mongoose.Schema({
  instituteTimeTableID: {
    type: Number,
    required: true,
    unique: true
  },
  instituteID: {
    type: String,
    required: true,
    ref: 'InstituteInformation'
  },
  session: {
    type: String,
    required: true
  },
  visibility: {
    type: Boolean,
    default: true
  },
  currentStatus: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for institute-specific queries
instituteTimeTableSchema.index({ instituteID: 1 });
instituteTimeTableSchema.index({ session: 1, instituteID: 1 });

module.exports = mongoose.model('InstituteTimeTable', instituteTimeTableSchema);
