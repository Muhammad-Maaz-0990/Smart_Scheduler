const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseID: {
    type: Number,
    required: true,
    unique: true
  },
  courseCode: {
    type: String,
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  courseType: {
    type: String,
    enum: ['Lab', 'Theory'],
    required: true
  },
  creditHours: {
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

// Ensure unique courseCode per institute (courseID is globally unique)
courseSchema.index({ courseCode: 1, instituteID: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
