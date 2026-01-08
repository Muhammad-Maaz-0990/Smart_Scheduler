const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const InstituteSubscription = require('../models/Subscription');
const InstituteInformation = require('../models/InstituteInformation');
const Users = require('../models/Users');
const { sendPaymentReminder } = require('../utils/mailer');
async function resolveInstituteIDFromUser(user) {
  if (user?.instituteID) return user.instituteID;
  if (!user?.id) return null;
  try {
    const u = await Users.findById(user.id).select('instituteID');
    return u?.instituteID || null;
  } catch {
    return null;
  }
}
const Stripe = require('stripe');

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CURRENCY = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

function getAmountForPlan(plan) {
  // USD values; Stripe amount is in cents (x100)
  if (String(plan).toLowerCase() === 'yearly') return 30000; // $300 USD
  return 4900; // $49 USD monthly
}

async function recordPayment({ instituteID, plan, paymentIntentId, amount }) {
  // Idempotent store by paymentID
  const existing = await InstituteSubscription.findOne({ paymentID: paymentIntentId });
  if (!existing) {
    await InstituteSubscription.create({
      paymentID: paymentIntentId,
      instituteID,
      paymentDate: new Date(),
      amount,
    });
  }
  // Normalize and persist subscription type based on the plan used to pay
  const norm = String(plan || '').trim().toLowerCase();
  const subscription = norm === 'yearly' ? 'Yearly' : norm === 'monthly' ? 'Monthly' : null;
  if (subscription) {
    await InstituteInformation.updateOne({ instituteID }, { $set: { subscription } });
  }
}

// POST /api/payments/checkout
// Create a Stripe Checkout Session and return the URL
router.post('/checkout', protect, async (req, res) => {
  try {
    if (!stripe) {
      console.error('Stripe configuration missing. Please set STRIPE_SECRET_KEY in .env file');
      return res.status(500).json({ message: 'Stripe is not configured. Please contact administrator.' });
    }

    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const role = (user.designation || '').toLowerCase();
    console.log('Payment checkout attempt by:', user.userName, 'Role:', user.designation);
    if (role !== 'admin') return res.status(403).json({ message: 'Only admin can initiate payments' });

    const { plan } = req.body || {};
    const instituteID = await resolveInstituteIDFromUser(user);

    if (!instituteID) return res.status(400).json({ message: 'User has no institute' });
    if (!plan || !['Monthly', 'Yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan. Use Monthly or Yearly.' });
    }

    const amount = getAmountForPlan(plan);

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: CURRENCY,
              product_data: {
                name: `Schedule Hub ${plan} Subscription`,
                description: `${plan} plan for institute ${instituteID}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          instituteID,
          plan,
        },
        success_url: `${FRONTEND_URL}/admin/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/admin/profile?checkout=canceled`,
      });
    } catch (stripeErr) {
      console.error('Stripe create session error:', stripeErr?.message || stripeErr);
      return res.status(500).json({ message: stripeErr?.message || 'Stripe error creating session' });
    }

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// GET /api/payments/confirm?session_id=...
// Confirm a session after returning from Checkout and record payment
router.get('/confirm', protect, async (req, res) => {
  try {
    if (!stripe) {
      console.error('Stripe configuration missing. Please set STRIPE_SECRET_KEY in .env file');
      return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const role = (user.designation || '').toLowerCase();
    console.log('Payment confirmation attempt by:', user.userName, 'Role:', user.designation);
    if (role !== 'admin') return res.status(403).json({ message: 'Only admin can confirm payments' });

    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ message: 'Missing session_id' });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const instituteID = session.metadata?.instituteID;
    const plan = session.metadata?.plan;
    const paymentIntentId = session.payment_intent?.toString();
    const amount = (session.amount_total || 0) / 100;

    if (!instituteID || instituteID !== user.instituteID) {
      return res.status(403).json({ message: 'Institute mismatch' });
    }

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Missing payment intent ID' });
    }

    await recordPayment({ instituteID, plan, paymentIntentId, amount });

    return res.json({ ok: true, paymentID: paymentIntentId, amount, plan });
  } catch (err) {
    console.error('Stripe confirm error:', err);
    return res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// GET /api/payments/history/:instituteID
// List recent payments for an institute (admin only)
router.get('/history/:instituteID', protect, async (req, res) => {
  try {
    const role = (req.user?.designation || '').toLowerCase();
    console.log('Payment history request by:', req.user?.userName, 'Role:', req.user?.designation, 'Institute:', req.user?.instituteID);
    if (role !== 'admin') {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Only admin can view payment history' });
    }
    const { instituteID } = req.params;
    const resolvedInstituteID = await resolveInstituteIDFromUser(req.user);
    if (!instituteID || instituteID !== resolvedInstituteID) {
      console.log('Institute mismatch - Requested:', instituteID, 'User institute:', req.user?.instituteID);
      return res.status(403).json({ message: 'Institute mismatch' });
    }
    const items = await InstituteSubscription.find({ instituteID }).sort({ paymentDate: -1 }).limit(20).lean();
    return res.json({ items });
  } catch (err) {
    console.error('Payment history error:', err);
    return res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// Stripe webhook handler (mounted with express.raw in server.js)
async function webhookHandler(req, res) {
  if (!stripe || !webhookSecret) {
    return res.status(500).send('Stripe not configured');
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        const instituteID = session.metadata?.instituteID;
        const plan = session.metadata?.plan;
        const paymentIntentId = String(session.payment_intent || '');
        const amount = (session.amount_total || 0) / 100;
        if (instituteID && paymentIntentId) {
          await recordPayment({ instituteID, plan, paymentIntentId, amount });
        }
      }
    }
  } catch (err) {
    console.error('Webhook handling error:', err);
    // Respond 200 to prevent retries if you handle idempotency internally; else 500 to retry
    return res.status(200).send('ok');
  }
  return res.status(200).send('ok');
}

module.exports = { router, webhookHandler };
// GET /api/payments/all
// Owner-only: list all payments across institutes
router.get('/all', protect, async (req, res) => {
  try {
    const role = (req.user?.designation || '').toLowerCase();
    if (role !== 'owner') return res.status(403).json({ message: 'Only owner can view all payments' });
    const items = await InstituteSubscription.find({}).sort({ paymentDate: -1 }).limit(200).lean();
    // Attach institute names for context
    const instituteIDs = Array.from(new Set(items.map(i => i.instituteID).filter(Boolean)));
    const institutes = await InstituteInformation.find({ instituteID: { $in: instituteIDs } }).select('instituteID instituteName').lean();
    const nameById = new Map(institutes.map(i => [String(i.instituteID), i.instituteName]));
    const rows = items.map(i => ({
      paymentID: i.paymentID,
      instituteID: i.instituteID,
      instituteName: nameById.get(String(i.instituteID)) || '',
      paymentDate: i.paymentDate,
      amount: i.amount,
    }));
    return res.json({ items: rows });
  } catch (err) {
    console.error('List all payments error:', err?.message || err);
    return res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// POST /api/payments/notify/:instituteID
// Owner-only: send a payment reminder email to the admin of given institute
router.post('/notify/:instituteID', protect, async (req, res) => {
  try {
    const role = (req.user?.designation || '').toLowerCase();
    if (role !== 'owner') return res.status(403).json({ message: 'Only owner can notify institutes' });
    const { instituteID } = req.params;
    const { reason } = req.body || {}; // 'trial-ended' | 'payment-ended'
    if (!instituteID) return res.status(400).json({ message: 'Missing instituteID' });
    const inst = await InstituteInformation.findOne({ instituteID }).lean();
    if (!inst) return res.status(404).json({ message: 'Institute not found' });
    const adminUser = await Users.findOne({ instituteID, designation: 'Admin' }).lean();
    const toEmail = adminUser?.email || inst?.email || null;
    if (!toEmail) return res.status(404).json({ message: 'No admin email found for institute' });
    await sendPaymentReminder({ to: toEmail, instituteName: inst.instituteName, reason: reason || 'payment-ended' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Notify payment error:', err?.message || err);
    return res.status(500).json({ message: 'Failed to send reminder' });
  }
});
