const mongoose = require('mongoose');

const instituteTimeTableDetailsSchema = new mongoose.Schema({
  key: { type: String, required: true, index: true }, // (instituteTimeTableID + instituteID + year)
  timeTableID: { type: Number, required: true },
  instituteTimeTableID: { type: Number, required: true },
  instituteID: { type: String, required: true },
  year: { type: Number, required: true },
  roomNumber: { type: String, required: true },
  class: { type: String, required: true },
  course: { type: String, required: true },
  day: { type: String, required: true },
  time: { type: String, required: true }, // e.g., 10:00-11:00
  instructorName: { type: String, required: true },
  // optional break window on this day for this class/room
  breakStart: { type: String }, // e.g., 12:00
  breakEnd: { type: String },   // e.g., 12:30
}, { timestamps: true });

instituteTimeTableDetailsSchema.index({ instituteTimeTableID: 1, instituteID: 1, year: 1 });

module.exports = mongoose.model('InstituteTimeTableDetails', instituteTimeTableDetailsSchema);
