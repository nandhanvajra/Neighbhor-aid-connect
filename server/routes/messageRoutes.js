const express = require('express');
const router = express.Router();
const Message = require('../models/messageSchema');

// Fetch messages by chatId
router.get('/:chatId', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('sender', 'name');
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get messages', error: err.message });
  }
});

module.exports = router;
