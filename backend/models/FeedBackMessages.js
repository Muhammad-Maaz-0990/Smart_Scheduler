const mongoose = require('mongoose');

const feedBackMessagesSchema = new mongoose.Schema({
  messageID: {
    type: Number,
    required: true,
    unique: true
  },
  message: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  sender: {
    type: String,
    enum: ['Admin', 'User'],
    required: true
  },
  feedBackID: {
    type: Number,
    required: true,
    ref: 'FeedBack'
  },
  feedbackMsgStatus: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for feedback-specific queries
feedBackMessagesSchema.index({ feedBackID: 1 });

module.exports = mongoose.model('FeedBackMessages', feedBackMessagesSchema);
