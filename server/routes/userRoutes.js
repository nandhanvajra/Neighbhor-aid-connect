// routes/volunteerRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');

router.get('/volunteers', async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' }).select('_id name email');
    res.json(volunteers);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
