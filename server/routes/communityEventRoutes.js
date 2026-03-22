const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CommunityEvent = require('../models/communityEventSchema');
const Chat = require('../models/chatSchema');
const User = require('../models/userSchema');
const { auth, adminAuth } = require('../middleware/auth');

// Public (authenticated): list community events
router.get('/', auth, async (req, res) => {
  try {
    const events = await CommunityEvent.find()
      .sort({ startDate: 1 })
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email userType')
      .lean();

    res.json(events);
  } catch (err) {
    console.error('List events error:', err);
    res.status(500).json({ message: 'Failed to load events', error: err.message });
  }
});

// Admin: create event + linked group chat
router.post('/', adminAuth, async (req, res) => {
  const { title, description, imageUrl, startDate, endDate } = req.body;
  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: 'title, startDate, and endDate are required' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ message: 'Invalid dates' });
  }

  const adminId = req.user.userId;

  try {
    const chat = await Chat.create({
      chatType: 'group',
      name: String(title).trim(),
      createdBy: adminId,
      participants: [adminId]
    });

    const event = await CommunityEvent.create({
      title: String(title).trim(),
      description: description != null ? String(description) : '',
      imageUrl: imageUrl != null ? String(imageUrl) : '',
      startDate: start,
      endDate: end,
      createdBy: adminId,
      attendees: [],
      groupChat: chat._id
    });

    chat.eventId = event._id;
    await chat.save();

    const full = await CommunityEvent.findById(event._id)
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email userType');

    res.status(201).json(full);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
});

// Resident: join event and event group chat
router.post('/:eventId/join', auth, async (req, res) => {
  const { eventId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: 'Invalid event id' });
  }

  try {
    const user = await User.findById(req.user.userId).select('userType');
    if (!user || user.userType !== 'resident') {
      return res.status(403).json({ message: 'Only residents can join community events' });
    }

    const event = await CommunityEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const already = event.attendees.some(
      (a) => a.userId && a.userId.toString() === req.user.userId
    );
    if (!already) {
      event.attendees.push({ userId: req.user.userId, joinedAt: new Date() });
      await event.save();
    }

    const chat = await Chat.findById(event.groupChat);
    if (chat) {
      const set = new Set(chat.participants.map((p) => p.toString()));
      set.add(req.user.userId);
      chat.participants = [...set].map((id) => new mongoose.Types.ObjectId(id));
      await chat.save();
    }

    const full = await CommunityEvent.findById(event._id)
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email userType');

    res.json({
      message: already ? 'Already joined' : 'Joined successfully',
      event: full,
      groupChatId: event.groupChat
    });
  } catch (err) {
    console.error('Join event error:', err);
    res.status(500).json({ message: 'Failed to join event', error: err.message });
  }
});

module.exports = router;
