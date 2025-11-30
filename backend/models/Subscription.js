const mongoose = require('mongoose');

const instituteSubscriptionSchema = new mongoose.Schema({
  paymentID: {
    type: Number,
    required: true,
    unique: true
  },
  instituteID: {
    type: String,
    ref: 'InstituteInformation',
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Index for institute-specific queries
instituteSubscriptionSchema.index({ instituteID: 1 });

module.exports = mongoose.model('InstituteSubscription', instituteSubscriptionSchema);
