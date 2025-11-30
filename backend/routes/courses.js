const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { body, validationResult } = require('express-validator');

// Get all courses for an institute
router.get('/:instituteID', async (req, res) => {
  try {
    const courses = await Course.find({ instituteID: req.params.instituteID }).sort({ courseID: 1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a new course
router.post('/', [
  body('courseCode').notEmpty().withMessage('Course code is required'),
  body('courseTitle').notEmpty().withMessage('Course title is required'),
  body('courseType').isIn(['Lab', 'Theory']).withMessage('Course type must be Lab or Theory'),
  body('creditHours').isInt({ min: 1 }).withMessage('Credit hours must be a positive integer'),
  body('instituteID').notEmpty().withMessage('Institute ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Get the highest courseID for auto-increment
    const lastCourse = await Course.findOne().sort({ courseID: -1 });
    const newCourseID = lastCourse ? lastCourse.courseID + 1 : 1;

    const course = new Course({
      courseID: newCourseID,
      courseCode: req.body.courseCode,
      courseTitle: req.body.courseTitle,
      courseType: req.body.courseType,
      creditHours: req.body.creditHours,
      instituteID: req.body.instituteID
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists for this institute' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a course
router.put('/:id', [
  body('courseCode').optional().notEmpty().withMessage('Course code cannot be empty'),
  body('courseTitle').optional().notEmpty().withMessage('Course title cannot be empty'),
  body('courseType').optional().isIn(['Lab', 'Theory']).withMessage('Course type must be Lab or Theory'),
  body('creditHours').optional().isInt({ min: 1 }).withMessage('Credit hours must be a positive integer')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists for this institute' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a course
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
