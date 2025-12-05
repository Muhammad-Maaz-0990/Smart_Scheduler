const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { body, validationResult } = require('express-validator');

const { protect } = require('../middleware/auth');

// Get rooms via query param (fallback when no path param used); defaults to authenticated user's institute
router.get('/', protect, async (req, res) => {
  try {
    let { instituteID } = req.query;
    if (!instituteID) {
      instituteID = req.user?.instituteID;
    }
    if (!instituteID) {
      return res.status(400).json({ message: 'Missing instituteID' });
    }
    
    // Resolve string business key to ObjectId via InstituteInformation if needed
    const mongoose = require('mongoose');
    let instituteObjectId = instituteID;
    if (!mongoose.Types.ObjectId.isValid(instituteID)) {
      try {
        const InstituteInformation = require('../models/InstituteInformation');
        const inst = await InstituteInformation.findOne({ instituteID }).lean();
        if (!inst || !inst._id) {
          return res.status(400).json({ message: 'Invalid institute ID' });
        }
        instituteObjectId = inst._id;
      } catch (e) {
        console.error('Institute lookup failed:', e);
        return res.status(500).json({ message: 'Failed to resolve institute', error: e.message });
      }
    }

    const rooms = await Room.find({ instituteID: instituteObjectId }).sort({ roomID: 1 });
    res.json(rooms);
  } catch (err) {
    console.error('GET /api/rooms error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all rooms for an institute
router.get('/:instituteID', async (req, res) => {
  try {
    const rooms = await Room.find({ instituteID: req.params.instituteID }).sort({ roomID: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a new room
router.post('/', [
  body('roomNumber').notEmpty().withMessage('Room number is required'),
  body('roomStatus').isIn(['Lab', 'Class']).withMessage('Room status must be Lab or Class'),
  body('instituteID').notEmpty().withMessage('Institute ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { roomNumber, roomStatus, instituteID } = req.body;

    // Validate ObjectId format
    if (!require('mongoose').Types.ObjectId.isValid(instituteID)) {
      return res.status(400).json({ message: 'Invalid institute ID format' });
    }

    // Get the highest roomID for auto-increment
    const lastRoom = await Room.findOne().sort({ roomID: -1 });
    const newRoomID = lastRoom && lastRoom.roomID ? Number(lastRoom.roomID) + 1 : 1;
    
    // Ensure newRoomID is a valid number
    if (isNaN(newRoomID)) {
      console.error('Invalid roomID calculation:', { lastRoom, newRoomID });
      return res.status(500).json({ message: 'Failed to generate room ID' });
    }

    const room = new Room({
      roomID: newRoomID,
      roomNumber,
      roomStatus,
      instituteID
    });

    await room.save();
    res.status(201).json(room);
  } catch (err) {
    console.error('Room creation error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Room number already exists for this institute' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a room
router.put('/:id', [
  body('roomNumber').optional().notEmpty().withMessage('Room number cannot be empty'),
  body('roomStatus').optional().isIn(['Lab', 'Class']).withMessage('Room status must be Lab or Class')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Room number already exists for this institute' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a room
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
