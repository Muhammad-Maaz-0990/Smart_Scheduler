const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Users = require('../models/Users');
const FeedBack = require('../models/Feedback');
const FeedBackMessages = require('../models/FeedBackMessages');
const Counter = require('../models/Counter');

// Utility: get current DB user and institute key
async function getCurrentUser(req) {
  const dbUser = await Users.findById(req.user.id);
  if (!dbUser) throw new Error('User not found');
  return dbUser;
}

// GET /api/feedback/threads - list feedback threads
router.get('/threads', protect, async (req, res) => {
  try {
    const dbUser = await getCurrentUser(req);
    const isAdmin = (dbUser.designation === 'Admin');

    const query = isAdmin
      ? { instituteID: dbUser.instituteID }
      : { instituteID: dbUser.instituteID, userID: dbUser.userID };

    const threads = await FeedBack.find(query).sort({ updatedAt: -1 });

    // Attach user details to each thread for display
    const userIDs = [...new Set(threads.map(t => t.userID))];
    const usersMap = new Map();
    if (userIDs.length) {
      const users = await Users.find({ userID: { $in: userIDs } }, 'userID userName designation');
      users.forEach(u => usersMap.set(u.userID, { userName: u.userName, designation: u.designation }));
    }

    const enriched = threads.map(t => ({
      feedbackID: t.feedbackID,
      title: t.issue,
      issueDate: t.issueDate,
      userID: t.userID,
      instituteID: t.instituteID,
      user: usersMap.get(t.userID) || null
    }));

    res.json(enriched);
  } catch (err) {
    console.error('List threads error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/feedback/threads - create new thread
router.post('/threads', protect, async (req, res) => {
  try {
    const dbUser = await getCurrentUser(req);
    const isAdmin = (dbUser.designation === 'Admin');
    const { issue, userID } = req.body;

    if (!issue || !issue.trim()) {
      return res.status(400).json({ message: 'Issue is required' });
    }

    let targetUserID = dbUser.userID;
    if (isAdmin) {
      if (typeof userID !== 'number') {
        return res.status(400).json({ message: 'userID (Number) is required for admin-initiated thread' });
      }
      // Validate user belongs to same institute
      const targetUser = await Users.findOne({ userID, instituteID: dbUser.instituteID });
      if (!targetUser) return res.status(404).json({ message: 'Target user not found in your institute' });
      targetUserID = userID;
    }

    const counter = await Counter.findByIdAndUpdate(
      'feedback_feedbackID',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const thread = await FeedBack.create({
      feedbackID: counter.seq,
      issue: issue.trim(),
      issueDate: new Date(),
      userID: targetUserID,
      instituteID: dbUser.instituteID
    });

    res.status(201).json(thread);
  } catch (err) {
    console.error('Create thread error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/feedback/threads/:feedbackID/messages - list messages in a thread
router.get('/threads/:feedbackID/messages', protect, async (req, res) => {
  try {
    const { feedbackID } = req.params;
    const dbUser = await getCurrentUser(req);
    const thread = await FeedBack.findOne({ feedbackID: Number(feedbackID) });
    if (!thread) return res.status(404).json({ message: 'Feedback not found' });
    // Scope: must belong to same institute, and if not admin, must be owner of thread
    if (thread.instituteID !== dbUser.instituteID) return res.status(403).json({ message: 'Forbidden' });
    if (dbUser.designation !== 'Admin' && thread.userID !== dbUser.userID) return res.status(403).json({ message: 'Forbidden' });

    const messages = await FeedBackMessages.find({ feedBackID: thread.feedbackID }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error('List messages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/feedback/threads/:feedbackID/messages - add a message
router.post('/threads/:feedbackID/messages', protect, async (req, res) => {
  try {
    const { feedbackID } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message is required' });

    const dbUser = await getCurrentUser(req);
    const thread = await FeedBack.findOne({ feedbackID: Number(feedbackID) });
    if (!thread) return res.status(404).json({ message: 'Feedback not found' });
    if (thread.instituteID !== dbUser.instituteID) return res.status(403).json({ message: 'Forbidden' });
    if (dbUser.designation !== 'Admin' && thread.userID !== dbUser.userID) return res.status(403).json({ message: 'Forbidden' });

    const counter = await Counter.findByIdAndUpdate(
      'feedback_messages_messageID',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const msg = await FeedBackMessages.create({
      messageID: counter.seq,
      message: message.trim(),
      date: new Date(),
      sender: dbUser.designation === 'Admin' ? 'Admin' : 'User',
      feedBackID: thread.feedbackID,
      feedbackMsgStatus: true
    });

    // Touch thread updatedAt
    await FeedBack.updateOne({ _id: thread._id }, { $set: { updatedAt: new Date() } });

    res.status(201).json(msg);
  } catch (err) {
    console.error('Create message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
