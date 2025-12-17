const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const InstituteInformation = require('../models/InstituteInformation');
const InstituteSubscription = require('../models/Subscription');

// Calendar helpers
function addMonths(date, n = 1) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function addYears(date, n = 1) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + n);
  return d;
}

// For Trial we still use a fixed-length window from creation date
function getTrialBounds(created, days = 14) {
  const start = new Date(created);
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return { start, end, label: `${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)}` };
}

// @route   GET /api/subscription/status/:instituteID
// @desc    Get current subscription/payment status for an institute
// @access  Private
router.get('/status/:instituteID', protect, async (req, res) => {
  try {
    const { instituteID } = req.params;
    
    // Try to find by custom instituteID first, then by MongoDB _id
    let institute = await InstituteInformation.findOne({ instituteID });
    if (!institute && instituteID.match(/^[0-9a-fA-F]{24}$/)) {
      // If not found and looks like ObjectId, try finding by _id
      institute = await InstituteInformation.findById(instituteID);
    }
    
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }
    
    // Use the actual instituteID from the found document for subsequent queries
    const actualInstituteID = institute.instituteID;

    const subscriptionType = institute.subscription || 'Trial';

    if (subscriptionType === 'Trial') {
      const trialDays = Number(process.env.TRIAL_DAYS || 14);
      const created = institute.created_at || institute.createdAt || new Date();
      const { start, end, label } = getTrialBounds(created, trialDays);
      const nowMs = Date.now();
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysLeft = Math.ceil((end.getTime() - nowMs) / msPerDay);
      const isExpired = nowMs > end.getTime();
      return res.json({
        subscriptionType,
        currentPeriod: { type: 'Trial', label, start, end },
        hasPaymentThisPeriod: false,
        daysLeft,
        isExpired,
        showPaymentButton: true,
        reason: 'trial'
      });
    }

    // ROLLING PERIODS: from last successful payment date
    const lastPayment = await InstituteSubscription.findOne({
      instituteID: actualInstituteID,
    }).sort({ paymentDate: -1 });

    let start, end, label;
    const now = new Date();
    if (lastPayment) {
      start = new Date(lastPayment.paymentDate);
      end = subscriptionType === 'Monthly' ? addMonths(start, 1) : addYears(start, 1);
      label = `${start.toISOString().slice(0,10)} → ${end.toISOString().slice(0,10)}`;
    } else {
      // No payments yet after trial – mark as expired and ask to pay
      start = null;
      end = null;
      label = 'No active period';
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const hasPaymentThisPeriod = !!lastPayment && end && now < end;
    const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / msPerDay)) : 0;
    const isExpired = !hasPaymentThisPeriod;
    const showPaymentButton = isExpired || daysLeft <= 2;

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
      isExpired,
      showPaymentButton,
      lastPayment: lastPayment ? {
        paymentID: lastPayment.paymentID,
        paymentDate: lastPayment.paymentDate,
        amount: lastPayment.amount
      } : null
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
