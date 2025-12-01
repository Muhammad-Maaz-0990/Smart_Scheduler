const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/auth');
const TimeSlot = require('../models/TimeSlot');
const Counter = require('../models/Counter');
const Users = require('../models/Users');

const ALLOWED_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

async function getAdminInstituteKey(userId) {
  const admin = await Users.findById(userId).select('designation instituteID');
  if (!admin || admin.designation !== 'Admin' || !admin.instituteID) return null;
  return admin.instituteID;
}

function validTimeString(t) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
}

function compareTimes(a, b) {
  // returns true if a < b
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  if (ah !== bh) return ah < bh;
  return am < bm;
}

// GET all timeslots for current admin's institute
router.get('/institute', protect, authorizeRoles('Admin'), async (req, res) => {
  try {
    const instituteKey = await getAdminInstituteKey(req.user.id);
    if (!instituteKey) return res.status(403).json({ message: 'Admin institute not resolved' });

    const list = await TimeSlot.find({ instituteID: instituteKey }).sort({ timeSlotID: 1 });

    // Sort by day order for UX
    const byDay = list.sort((a, b) => ALLOWED_DAYS.indexOf(a.days) - ALLOWED_DAYS.indexOf(b.days));
    res.json(byDay);
  } catch (err) {
    console.error('GET timeslots error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET today's timeslot for the current authenticated user's institute (Admin/Teacher/Student)
router.get('/my/today', protect, async (req, res) => {
  try {
    const me = await Users.findById(req.user.id).select('instituteID');
    if (!me || !me.instituteID) return res.status(404).json({ message: 'User or institute not found' });

    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = dayNames[new Date().getDay()];
    const ts = await TimeSlot.findOne({ instituteID: me.instituteID, days: today });
    if (!ts) return res.json({ days: today, startTime: null, endTime: null, instituteID: me.instituteID });
    res.json(ts);
  } catch (err) {
    console.error('GET my today timeslot error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET week timeslots for the current authenticated user's institute
router.get('/my/week', protect, async (req, res) => {
  try {
    const me = await Users.findById(req.user.id).select('instituteID');
    if (!me || !me.instituteID) return res.status(404).json({ message: 'User or institute not found' });
    const list = await TimeSlot.find({ instituteID: me.instituteID }).sort({ timeSlotID: 1 });
    const byDay = list.sort((a, b) => ALLOWED_DAYS.indexOf(a.days) - ALLOWED_DAYS.indexOf(b.days));
    res.json(byDay);
  } catch (err) {
    console.error('GET my week timeslots error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE timeslot for a day
router.post('/',
  protect,
  authorizeRoles('Admin'),
  [
    body('days').isIn(ALLOWED_DAYS).withMessage('Invalid day'),
    body('startTime').custom(validTimeString).withMessage('Invalid start time (HH:mm)'),
    body('endTime').custom(validTimeString).withMessage('Invalid end time (HH:mm)')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const instituteKey = await getAdminInstituteKey(req.user.id);
      if (!instituteKey) return res.status(403).json({ message: 'Admin institute not resolved' });

      const { days, startTime, endTime } = req.body;
      if (!compareTimes(startTime, endTime)) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      // Prevent duplicate day
      const exists = await TimeSlot.findOne({ instituteID: instituteKey, days });
      if (exists) {
        return res.status(400).json({ message: 'This day already has a time slot' });
      }

      // Auto-increment numeric timeSlotID
      const counter = await Counter.findByIdAndUpdate(
        'timeslot_timeSlotID',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const ts = new TimeSlot({
        timeSlotID: counter.seq,
        days,
        startTime,
        endTime,
        instituteID: instituteKey
      });

      await ts.save();
      res.status(201).json(ts);
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(400).json({ message: 'Duplicate day for this institute' });
      }
      console.error('Create timeslot error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// UPDATE timeslot
router.put('/:id',
  protect,
  authorizeRoles('Admin'),
  [
    body('days').optional().isIn(ALLOWED_DAYS).withMessage('Invalid day'),
    body('startTime').optional().custom(validTimeString).withMessage('Invalid start time (HH:mm)'),
    body('endTime').optional().custom(validTimeString).withMessage('Invalid end time (HH:mm)')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const instituteKey = await getAdminInstituteKey(req.user.id);
      if (!instituteKey) return res.status(403).json({ message: 'Admin institute not resolved' });

      const ts = await TimeSlot.findById(req.params.id);
      if (!ts || ts.instituteID !== instituteKey) {
        return res.status(404).json({ message: 'TimeSlot not found' });
      }

      const { days, startTime, endTime } = req.body;
      const next = {
        days: days ?? ts.days,
        startTime: startTime ?? ts.startTime,
        endTime: endTime ?? ts.endTime
      };

      if (!compareTimes(next.startTime, next.endTime)) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      // If changing day, ensure no duplicate
      if (days && days !== ts.days) {
        const dup = await TimeSlot.findOne({ instituteID: instituteKey, days });
        if (dup) return res.status(400).json({ message: 'This day already has a time slot' });
      }

      ts.days = next.days;
      ts.startTime = next.startTime;
      ts.endTime = next.endTime;
      await ts.save();

      res.json(ts);
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(400).json({ message: 'Duplicate day for this institute' });
      }
      console.error('Update timeslot error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE timeslot
router.delete('/:id', protect, authorizeRoles('Admin'), async (req, res) => {
  try {
    const instituteKey = await getAdminInstituteKey(req.user.id);
    if (!instituteKey) return res.status(403).json({ message: 'Admin institute not resolved' });

    const ts = await TimeSlot.findById(req.params.id);
    if (!ts || ts.instituteID !== instituteKey) {
      return res.status(404).json({ message: 'TimeSlot not found' });
    }

    await TimeSlot.findByIdAndDelete(ts._id);
    res.json({ message: 'TimeSlot deleted' });
  } catch (err) {
    console.error('Delete timeslot error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
