const express = require('express');
const router = express.Router();
const Message = require('../models/messageSchema');
const Chat = require('../models/chatSchema');
const User = require('../models/userSchema');
const { auth, adminAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

/** Normalize participant entry whether stored as ObjectId or populated User doc */
function participantToIdString(p) {
  if (p == null) return '';
  if (typeof p === 'object' && p._id != null) return String(p._id);
  return String(p);
}

function isParticipant(chat, userId) {
  if (!chat || userId == null || userId === '') return false;
  const uid = String(userId);
  return (chat.participants || []).some((p) => participantToIdString(p) === uid);
}

// List current user's chats (for dashboard filters)
router.get('/my', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.userId })
      .populate('participants', 'name email userType role')
      .sort({ updatedAt: -1 })
      .lean();

    const enriched = chats.map((c) => {
      const isGroup = c.chatType === 'group' || c.participants.length > 2;
      const uid = String(req.user.userId);
      const others = (c.participants || []).filter(
        (p) => participantToIdString(p) !== uid
      );
      let filterKind = 'group';
      if (!isGroup && others.length === 1) {
        filterKind = others[0].userType === 'worker' ? 'worker' : 'resident';
      } else if (!isGroup && others.length === 0) {
        filterKind = 'resident';
      }
      return {
        ...c,
        filterKind,
        isGroup: !!isGroup
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Failed to list chats:', err);
    res.status(500).json({ message: 'Failed to list chats', error: err.message });
  }
});

// Admin: create resident-only group chat
router.post('/group', adminAuth, async (req, res) => {
  const { name, memberIds } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Group name is required' });
  }
  const ids = Array.isArray(memberIds) ? [...new Set(memberIds.map(String))] : [];
  try {
    const adminId = req.user.userId;
    const residents = await User.find({
      _id: { $in: ids },
      userType: 'resident'
    }).select('_id');

    if (residents.length !== ids.length) {
      return res.status(400).json({
        message: 'All members must be existing residents (userType: resident)'
      });
    }

    const participantSet = new Set([adminId, ...ids]);
    const participants = [...participantSet].map((id) => new mongoose.Types.ObjectId(id));

    const chat = await Chat.create({
      chatType: 'group',
      name: name.trim(),
      createdBy: adminId,
      participants
    });

    const populated = await Chat.findById(chat._id)
      .populate('participants', 'name email userType role');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Failed to create group:', err);
    res.status(500).json({ message: 'Failed to create group chat', error: err.message });
  }
});

// Admin: add residents to a group chat
router.put('/:chatId/members', adminAuth, async (req, res) => {
  const { chatId } = req.params;
  const { userIds } = req.body;
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: 'Invalid chat ID' });
  }
  const addIds = Array.isArray(userIds) ? userIds.map(String) : [];
  if (addIds.length === 0) {
    return res.status(400).json({ message: 'userIds array is required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || chat.chatType !== 'group') {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    const residents = await User.find({
      _id: { $in: addIds },
      userType: 'resident'
    }).select('_id');

    if (residents.length !== addIds.length) {
      return res.status(400).json({
        message: 'All users to add must be residents'
      });
    }

    const set = new Set(chat.participants.map((p) => p.toString()));
    addIds.forEach((id) => set.add(id));
    chat.participants = [...set].map((id) => new mongoose.Types.ObjectId(id));
    await chat.save();

    const populated = await Chat.findById(chat._id).populate(
      'participants',
      'name email userType role'
    );
    res.json(populated);
  } catch (err) {
    console.error('Failed to add members:', err);
    res.status(500).json({ message: 'Failed to add members', error: err.message });
  }
});

// Admin: remove a member from a group chat
router.delete('/:chatId/members/:userId', adminAuth, async (req, res) => {
  const { chatId, userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || chat.chatType !== 'group') {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    chat.participants = chat.participants.filter((p) => p.toString() !== userId);
    if (chat.participants.length === 0) {
      return res.status(400).json({ message: 'Cannot remove all participants' });
    }
    await chat.save();

    const populated = await Chat.findById(chat._id).populate(
      'participants',
      'name email userType role'
    );
    res.json(populated);
  } catch (err) {
    console.error('Failed to remove member:', err);
    res.status(500).json({ message: 'Failed to remove member', error: err.message });
  }
});

// Create or get a direct chat between two users
router.post('/create', auth, async (req, res) => {
  const { participant1, participant2 } = req.body;

  if (!participant1 || !participant2) {
    return res.status(400).json({ message: 'Both participants are required' });
  }

  const uid = String(req.user.userId);
  if (uid !== String(participant1) && uid !== String(participant2)) {
    return res.status(403).json({ message: 'You can only create chats with yourself and another user' });
  }

  try {
    let chat = await Chat.findOne({
      chatType: { $ne: 'group' },
      participants: {
        $all: [participant1, participant2],
        $size: 2
      }
    });

    if (!chat) {
      chat = await Chat.create({
        chatType: 'direct',
        participants: [participant1, participant2]
      });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error('Failed to create/get chat:', err);
    res.status(500).json({ message: 'Failed to create chat', error: err.message });
  }
});

// Get chat by ID
router.get('/:chatId', auth, async (req, res) => {
  const { chatId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: 'Invalid chat ID' });
  }

  try {
    const chat = await Chat.findById(chatId).populate('participants', 'name email userType role');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!isParticipant(chat, req.user.userId)) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    res.json(chat);
  } catch (err) {
    console.error('Failed to fetch chat:', err);
    res.status(500).json({ message: 'Failed to fetch chat', error: err.message });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', auth, async (req, res) => {
  const { chatId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: 'Invalid chat ID' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!isParticipant(chat, req.user.userId)) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email');
    res.json(messages);
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
  }
});

// Send a new message
router.post('/:chatId/messages', auth, async (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!isParticipant(chat, req.user.userId)) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    const isGroupChat = chat.chatType === 'group' || chat.participants.length > 2;

    if (!isGroupChat) {
      const Request = require('../models/requestSchema');
      const otherParticipant = chat.participants.find(
        (p) => participantToIdString(p) !== String(req.user.userId)
      );

      if (otherParticipant) {
        const activeRequest = await Request.findOne({
          status: { $in: ['pending', 'in-progress'] },
          $or: [
            { userId: req.user.userId, completedBy: otherParticipant },
            { userId: otherParticipant, completedBy: req.user.userId }
          ]
        });

        if (!activeRequest) {
          const completedRequest = await Request.findOne({
            status: 'completed',
            $or: [
              { userId: req.user.userId, completedBy: otherParticipant },
              { userId: otherParticipant, completedBy: req.user.userId }
            ]
          });

          if (completedRequest) {
            return res.status(403).json({
              message: 'Cannot send messages. The service request has been completed.'
            });
          }
        }
      }
    }

    const message = await Message.create({
      chatId,
      sender: req.user.userId,
      text
    });

    chat.updatedAt = new Date();
    await chat.save();

    const populatedMessage = await message.populate('sender', 'name email');

    if (req.io) {
      req.io.to(chatId).emit('receiveMessage', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Failed to send message:', err);
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
});

module.exports = router;
