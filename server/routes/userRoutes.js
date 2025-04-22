const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const Request = require('../models/requestSchema');
const Message = require('../models/messageSchema');
const auth=require('../middleware/auth')

// Fetch volunteers
router.get('/volunteers', auth, async (req, res) => {
  try {
    const chatPartners = await User.find();
    res.json(chatPartners);
  } catch (err) {
    console.error('Error fetching chat partners:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



router.get('/directory',auth, async (req, res) => {
  try {
    const volunteers = await Request.find({ completedBy:req.user.userId});
    console.log(req.user)
    res.json(volunteers);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/request',auth, async (req, res) => {
  try {
    const volunteers = await Request.findById(req.user.userId);
    console.log(req.user)
    res.json(volunteers);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.put('/users/:userId', async (req, res) => {
  console.log('...................')
  const { userId } = req.params;
  const { role } = req.body;
  console.log(userId,User.recompileSchema)

  if (!role) {
    return res.status(400).json({ message: 'Role is required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('_id name email role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', user });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
