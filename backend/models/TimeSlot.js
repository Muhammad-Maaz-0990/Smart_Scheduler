const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  timeSlotID: {
    type: Number,
    required: true,
    unique: true
  },
  days: {
    type: String,
    required: true,
    enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
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

// Indexes
timeSlotSchema.index({ instituteID: 1 });
// Ensure one record per day per institute
timeSlotSchema.index({ instituteID: 1, days: 1 }, { unique: true });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
