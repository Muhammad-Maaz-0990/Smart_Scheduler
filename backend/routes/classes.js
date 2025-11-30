const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { body, validationResult } = require('express-validator');

// Get all classes for an institute
router.get('/:instituteID', async (req, res) => {
  try {
    const classes = await Class.find({ instituteID: req.params.instituteID }).sort({ classID: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a new class
router.post('/', [
  body('degree').notEmpty().withMessage('Degree is required'),
  body('session').isIn(['Fall', 'Spring']).withMessage('Session must be Fall or Spring'),
  body('section').isIn(['A', 'B']).withMessage('Section must be A or B'),
  body('year').notEmpty().withMessage('Year is required'),
  body('rank').isInt({ min: 1 }).withMessage('Rank must be a positive integer'),
  body('instituteID').notEmpty().withMessage('Institute ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Get the highest classID for auto-increment
    const lastClass = await Class.findOne().sort({ classID: -1 });
    const newClassID = lastClass ? lastClass.classID + 1 : 1;

    const newClass = new Class({
      classID: newClassID,
      degree: req.body.degree,
      session: req.body.session,
      section: req.body.section,
      year: req.body.year,
      rank: req.body.rank,
      instituteID: req.body.instituteID
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Class already exists for this institute' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a class
router.put('/:id', [
  body('degree').optional().notEmpty().withMessage('Degree cannot be empty'),
  body('session').optional().isIn(['Fall', 'Spring']).withMessage('Session must be Fall or Spring'),
  body('section').optional().isIn(['A', 'B']).withMessage('Section must be A or B'),
  body('year').optional().notEmpty().withMessage('Year cannot be empty'),
  body('rank').optional().isInt({ min: 1 }).withMessage('Rank must be a positive integer')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(updatedClass);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Class already exists for this institute' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a class
router.delete('/:id', async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    
    if (!deletedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
