const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const Request = require('../models/requestSchema');
const auth = require('../middleware/auth');

// Fetch volunteers
router.get('/', auth, async (req, res) => {
  try {
    const chatPartners = await User.find().select('name email job role address phone bio skills');
    res.json(chatPartners);
  } catch (err) {
    console.error('Error fetching chat partners:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/directory', auth, async (req, res) => {
  try {
    const volunteers = await Request.find({ completedBy: req.user.userId });
    console.log(req.user);
    res.json(volunteers);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/request', auth, async (req, res) => {
  try {
    const volunteers = await Request.findById(req.user.userId);
    console.log(req.user);
    res.json(volunteers);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 