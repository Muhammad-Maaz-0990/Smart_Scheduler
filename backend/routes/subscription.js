const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const InstituteInformation = require('../models/InstituteInformation');
const InstituteSubscription = require('../models/Subscription');

function getPeriodBounds(type, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  if (type === 'Monthly') {
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end, label: `${year}-${String(month + 1).padStart(2, '0')}` };
  }
  // Yearly default
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end, label: `${year}` };
}

// @route   GET /api/subscription/status/:instituteID
// @desc    Get current subscription/payment status for an institute
// @access  Private
router.get('/status/:instituteID', protect, async (req, res) => {
  try {
    const { instituteID } = req.params;
    const institute = await InstituteInformation.findOne({ instituteID });
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    const subscriptionType = institute.subscription || 'Trial';

    if (subscriptionType === 'Trial') {
      return res.json({
        subscriptionType,
        currentPeriod: null,
        hasPaymentThisPeriod: false,
        daysLeft: null,
        showPaymentButton: true,
        reason: 'trial'
      });
    }

    const now = new Date();
    const { start, end, label } = getPeriodBounds(subscriptionType, now);

    // Find any payment within current period
    const payment = await InstituteSubscription.findOne({
      instituteID,
      paymentDate: { $gte: start, $lte: end }
    }).sort({ paymentDate: -1 });

    const hasPaymentThisPeriod = !!payment;
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / msPerDay);
    const showPaymentButton = !hasPaymentThisPeriod || daysLeft <= 2;

    return res.json({
      subscriptionType,
      currentPeriod: {
        type: subscriptionType,
        label,
        start,
        end
      },
      hasPaymentThisPeriod,
      daysLeft,
      showPaymentButton,
      lastPayment: payment ? {
        paymentID: payment.paymentID,
        paymentDate: payment.paymentDate,
        amount: payment.amount
      } : null
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
