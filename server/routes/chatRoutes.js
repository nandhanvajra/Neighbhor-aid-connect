// ✅ Updated: chatRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/messageSchema');
const Chat = require('../models/chatSchema');
const User = require('../models/userSchema');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Create or get a chat between two users
router.post('/create', auth, async (req, res) => {
  const { participant1, participant2 } = req.body;

  if (!participant1 || !participant2) {
    return res.status(400).json({ message: 'Both participants are required' });
  }

  // Ensure the authenticated user is one of the participants
  if (req.user.userId !== participant1 && req.user.userId !== participant2) {
    return res.status(403).json({ message: 'You can only create chats with yourself and another user' });
  }

  try {
    // Check if chat already exists between these users
    let chat = await Chat.findOne({
      participants: { 
        $all: [participant1, participant2],
        $size: 2
      }
    });

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
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
    const chat = await Chat.findById(chatId)
      .populate('participants', 'name email');
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.some(p => p._id.toString() === req.user.userId)) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    res.json(chat);
  } catch (err) {
    console.error('Failed to fetch chat:', err);
    res.status(500).json({ message: 'Failed to fetch chat', error: err.message });
  }
});

// Get messages for a chat (with sender populated)
router.get('/:chatId/messages', auth, async (req, res) => {
  const { chatId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: 'Invalid chat ID' });
  }

  try {
    // First check if chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user.userId)) {
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
    // Check if chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if sender is a participant
    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    const message = await Message.create({
      chatId,
      sender: req.user.userId,
      text
    });

    const populatedMessage = await message.populate('sender', 'name email');

    // Emit to socket
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
