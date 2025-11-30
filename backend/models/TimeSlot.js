const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  timeSlotID: {
    type: Number,
    required: true,
    unique: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
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

// Index for institute-specific queries
timeSlotSchema.index({ instituteID: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
