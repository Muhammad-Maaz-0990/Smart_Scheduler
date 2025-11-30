const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { body, validationResult } = require('express-validator');

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
    // Get the highest roomID for auto-increment
    const lastRoom = await Room.findOne().sort({ roomID: -1 });
    const newRoomID = lastRoom ? lastRoom.roomID + 1 : 1;

    const room = new Room({
      roomID: newRoomID,
      roomNumber: req.body.roomNumber,
      roomStatus: req.body.roomStatus,
      instituteID: req.body.instituteID
    });

    await room.save();
    res.status(201).json(room);
  } catch (err) {
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
