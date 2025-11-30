const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomID: {
    type: Number,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  roomStatus: {
    type: String,
    enum: ['Lab', 'Class'],
    default: 'Class',
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

// Compound index to ensure unique room number per institute
roomSchema.index({ roomNumber: 1, instituteID: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
