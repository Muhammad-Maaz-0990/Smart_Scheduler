const express = require('express');
const axios = require('axios');
const router = express.Router();
const { protect } = require('../middleware/auth');
const InstituteTimeTables = require('../models/InstituteTimeTables');
const InstituteTimeTableDetails = require('../models/InstituteTimeTableDetails');
const TimeSlot = require('../models/TimeSlot');
const Room = require('../models/Room');

// helper to compose key per spec
function keyFor(ttId, instituteID, year) {
  return `${ttId}_${instituteID}_${year}`;
}

// POST /api/timetables-gen/generate
// Expects: { session, year, instituteID, classes, courses, instructors, rooms, timeslots, breaks }
// courses: [{ name, type: 'Lecture'|'Lab', creditHours }]; enforce Lab creditHours=3
// breaks: { mode: 'same'|'per-day', same?: { start, end }, perDay?: { Mon:{start,end}, ... } }
router.post('/generate', protect, async (req, res) => {
  try {
    const { instituteID } = req.user || {};
    if (!instituteID) return res.status(400).json({ message: 'User has no institute' });

    const {
      session,
      year,
      classes = [],
      courses = [],
      instructors = [],
      rooms = [],
      timeslots: clientTimeslots = [],
      breaks = {}
    } = req.body || {};

    if (!session || !year) return res.status(400).json({ message: 'Missing session/year' });

    // Validate courses: Lecture must have positive creditHours; Lab forced to 3
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ message: 'At least one course is required' });
    }
    const normalizedCourses = (courses || []).map((c, idx) => {
      const type = c.type === 'Lab' ? 'Lab' : 'Lecture';
      let creditHours = type === 'Lab' ? 3 : Number(c.creditHours);
      if (type === 'Lecture') {
        if (!Number.isFinite(creditHours) || creditHours < 1) {
          throw new Error(`Course ${c.name || `#${idx+1}`} missing/invalid creditHours`);
        }
        creditHours = Math.floor(creditHours);
      }
      return {
        name: c.name,
        type,
        creditHours
      };
    });

    // Load institute time window per day from DB and transform to generator format
    const dayMap = {
      Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun'
    };
    const tsList = await TimeSlot.find({ instituteID }).sort({ timeSlotID: 1 }).lean();
    if (!tsList || tsList.length === 0) {
      return res.status(400).json({ message: 'No time slots defined for this institute' });
    }
    const timeslots = tsList.map(ts => ({
      day: dayMap[ts.days] || ts.days,
      start: ts.startTime,
      end: ts.endTime
    }));

    const payload = {
      instituteID,
      session: String(session),
      year: Number(year),
      classes,
      courses: normalizedCourses,
      instructors,
      rooms,
      timeslots,
      breaks,
      algorithms: ['GA_A', 'GA_B', 'GA_C']
    };

    const PY_API_URL = process.env.PY_API_URL || 'http://localhost:8000';
    const url = `${PY_API_URL}/timetables/generate`;

    const response = await axios.post(url, payload, { timeout: 60000 });
    const { candidates = [] } = response.data || {};
    if (!Array.isArray(candidates) || candidates.length < 3) {
      return res.status(502).json({ message: 'Python API did not return 3 candidates' });
    }

    return res.json({ candidates });
  } catch (err) {
    console.error('Generate timetable error:', err?.message || err);
    if (String(err?.message || '').includes('missing/invalid creditHours')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to generate timetables' });
  }
});

// POST /api/timetables-gen/save
// Expects: { header: { instituteTimeTableID, visibility, currentStatus, session?, year? }, details: [{ timeTableID, roomNumber, class, course, day, time, instructorName, breakStart, breakEnd }] }
router.post('/save', protect, async (req, res) => {
  try {
    const { instituteID } = req.user || {};
    if (!instituteID) return res.status(400).json({ message: 'User has no institute' });

    const { header, details } = req.body || {};
    if (!header) {
      return res.status(400).json({ message: 'Missing header' });
    }
    if (!Array.isArray(details)) {
      return res.status(400).json({ message: 'Missing details array' });
    }
    
    const session = header.session || `${new Date().getFullYear()}`;
    const year = header.year || new Date().getFullYear();
    const instituteTimeTableID = Number(header.instituteTimeTableID);
    if (!instituteTimeTableID) return res.status(400).json({ message: 'Invalid instituteTimeTableID' });

    // upsert header (carry optional global break window if provided)
    await InstituteTimeTables.updateOne(
      { instituteTimeTableID },
      { $set: { instituteTimeTableID, instituteID, session, year, visibility: !!header.visibility, currentStatus: !!header.currentStatus, ...(header.breakStart && header.breakEnd ? { breakStart: String(header.breakStart), breakEnd: String(header.breakEnd) } : {}) } },
      { upsert: true }
    );

    const key = keyFor(instituteTimeTableID, instituteID, year);

    // remove existing details for this key then insert new
    await InstituteTimeTableDetails.deleteMany({ key });

    const rows = details.map((d) => ({
      key,
      timeTableID: Number(d.timeTableID),
      instituteTimeTableID,
      instituteID,
      year,
      roomNumber: String(d.roomNumber),
      class: String(d.class),
      course: String(d.course),
      day: String(d.day),
      time: String(d.time),
      instructorName: String(d.instructorName),
      breakStart: d.breakStart ? String(d.breakStart) : undefined,
      breakEnd: d.breakEnd ? String(d.breakEnd) : undefined,
    }));

    if (rows.some(r => !r.timeTableID || !r.roomNumber || !r.class || !r.course || !r.day || !r.time || !r.instructorName)) {
      return res.status(400).json({ message: 'Invalid detail rows' });
    }

    // Enforce room occupancy constraint:
    // - Class rooms: at most one class per room per timeslot
    // - Lab rooms: allow multiple classes per timeslot
    const roomNumbers = [...new Set(rows.map(r => r.roomNumber))];
    const roomDocs = await Room.find({ instituteID, roomNumber: { $in: roomNumbers } }).lean();
    const statusByRoom = new Map(roomDocs.map(r => [String(r.roomNumber), r.roomStatus]));

    const violations = [];
    const bySlot = new Map();
    for (const r of rows) {
      const status = statusByRoom.get(r.roomNumber) || 'Class';
      const slotKey = `${r.roomNumber}__${r.day}__${r.time}`;
      if (!bySlot.has(slotKey)) bySlot.set(slotKey, []);
      bySlot.get(slotKey).push(r);
      if (status === 'Class' && bySlot.get(slotKey).length > 1) {
        violations.push({ roomNumber: r.roomNumber, day: r.day, time: r.time });
      }
    }

    if (violations.length) {
      return res.status(400).json({
        message: 'Room occupancy violation: class rooms can host only one class per timeslot',
        conflicts: violations
      });
    }

    await InstituteTimeTableDetails.insertMany(rows);

    return res.json({ ok: true, instituteTimeTableID, count: rows.length });
  } catch (err) {
    console.error('Save timetable error:', err?.message || err);
    return res.status(500).json({ message: 'Failed to save timetable' });
  }
});

// GET /api/timetables-gen/list
router.get('/list', protect, async (req, res) => {
  try {
    const { instituteID } = req.user || {};
    if (!instituteID) return res.status(400).json({ message: 'User has no institute' });
    const items = await InstituteTimeTables.find({ instituteID }).sort({ year: -1, updatedAt: -1 }).lean();
    return res.json({ items });
  } catch (err) {
    console.error('List timetables error:', err?.message || err);
    return res.status(500).json({ message: 'Failed to list timetables' });
  }
});

// GET /api/timetables-gen/details/:id
router.get('/details/:id', protect, async (req, res) => {
  try {
    const { instituteID } = req.user || {};
    if (!instituteID) return res.status(400).json({ message: 'User has no institute' });
    const instituteTimeTableID = Number(req.params.id);
    const header = await InstituteTimeTables.findOne({ instituteTimeTableID, instituteID }).lean();
    if (!header) return res.status(404).json({ message: 'Timetable not found' });
    const key = keyFor(instituteTimeTableID, instituteID, header.year);
    const details = await InstituteTimeTableDetails.find({ key }).lean();
    return res.json({ header, details });
  } catch (err) {
    console.error('Details timetables error:', err?.message || err);
    return res.status(500).json({ message: 'Failed to fetch timetable' });
  }
});

// PATCH /api/timetables-gen/header/:id
// Body: { visibility?: boolean, currentStatus?: boolean }
router.patch('/header/:id', protect, async (req, res) => {
  try {
    const { instituteID } = req.user || {};
    if (!instituteID) return res.status(400).json({ message: 'User has no institute' });
    const instituteTimeTableID = Number(req.params.id);
    const { visibility, currentStatus } = req.body || {};

    const header = await InstituteTimeTables.findOne({ instituteTimeTableID, instituteID });
    if (!header) return res.status(404).json({ message: 'Timetable not found' });

    const updates = {};
    if (typeof visibility === 'boolean') updates.visibility = visibility;
    if (typeof currentStatus === 'boolean') updates.currentStatus = currentStatus;

    // If setting currentStatus true, unset currentStatus for all other timetables of this institute
    if (updates.currentStatus === true) {
      await InstituteTimeTables.updateMany({ instituteID, currentStatus: true }, { $set: { currentStatus: false } });
    }

    await InstituteTimeTables.updateOne({ instituteTimeTableID, instituteID }, { $set: updates });
    const updated = await InstituteTimeTables.findOne({ instituteTimeTableID, instituteID }).lean();
    return res.json({ header: updated });
  } catch (err) {
    console.error('Update header error:', err?.message || err);
    return res.status(500).json({ message: 'Failed to update header' });
  }
});

module.exports = router;
