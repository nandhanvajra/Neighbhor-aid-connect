const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const Request = require('../models/requestSchema');
const { auth } = require('../middleware/auth');

// Fetch volunteers with rating information
router.get('/', auth, async (req, res) => {
  try {
    const volunteers = await User.find().select('name email job role address phone bio skills rating');
    
    // Transform the data to include rating information
    const volunteersWithRatings = volunteers.map(volunteer => {
      const ratingData = volunteer.rating || {};
      return {
        _id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        job: volunteer.job,
        role: volunteer.role,
        address: volunteer.address,
        phone: volunteer.phone,
        bio: volunteer.bio,
        skills: volunteer.skills,
        rating: ratingData.average || 0,
        totalRatings: ratingData.totalRatings || 0,
        ratingBreakdown: ratingData.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        hasRatings: (ratingData.totalRatings || 0) > 0
      };
    });
    
    res.json(volunteersWithRatings);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
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