const mongoose = require('mongoose');

const feedBackSchema = new mongoose.Schema({
  feedbackID: {
    type: Number,
    required: true,
    unique: true
  },
  issue: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  userID: {
    type: Number,
    required: true,
    ref: 'Users'
  },
  instituteID: {
    type: String,
    required: true,
    ref: 'InstituteInformation'
  }
}, {
  timestamps: true
});

// Indexes for queries
feedBackSchema.index({ userID: 1 });
feedBackSchema.index({ instituteID: 1 });

module.exports = mongoose.model('FeedBack', feedBackSchema);
