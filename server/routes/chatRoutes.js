// ✅ Updated: chatRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/messageSchema');
const Chat = require('../models/chatSchema');
const User = require('../models/userSchema');
const mongoose = require('mongoose');

// Get messages for a chat (with sender populated)
router.get('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: 'Invalid chat ID' });
  }

  try {
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
router.post('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const { senderId, text } = req.body;

  try {
    const message = await Message.create({
      chatId,
      sender: senderId,
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
