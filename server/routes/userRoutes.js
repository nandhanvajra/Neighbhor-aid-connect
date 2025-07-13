const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const Request = require('../models/requestSchema');
const Message = require('../models/messageSchema');
const { auth } = require('../middleware/auth')

// Log all requests to user routes
router.use((req, res, next) => {
  console.log(`User route accessed: ${req.method} ${req.path}`);
  next();
});

// GET /api/users - Get all users (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({ users });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/:id - Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Fetching user profile for ID:', userId);
    // Validate userId format
    if (!userId || typeof userId !== 'string' || userId.length !== 24) {
      console.log('Invalid userId format:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    // Find user by ID and exclude password
    const user = await User.findById(userId).select('-password');
    console.log('User found:', user ? 'Yes' : 'No', user ? user._id : '');
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    // Check if user has public profile enabled
    if (user.preferences && user.preferences.publicProfile === false) {
      console.log('Profile is private for user:', userId);
      return res.status(403).json({ message: 'This profile is private' });
    }
    console.log('Returning user profile for:', user.name);
    res.status(200).json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        job: user.job,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        occupation: user.occupation,
        emergencyContact: user.emergencyContact,
        preferences: user.preferences,
        requestPreferences: user.requestPreferences,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Get user by ID error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/:id/ratings - Get average rating and count for a user
router.get('/:id/ratings', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Use the new rating system if available, fallback to old system
    const Rating = require('../models/ratingSchema');
    
    try {
      const stats = await Rating.getUserRatingStats(userId);
      res.status(200).json({ 
        averageRating: stats.averageRating, 
        totalRatings: stats.totalRatings,
        ratingBreakdown: stats.ratingBreakdown
      });
    } catch (ratingErr) {
      // Fallback to old system
      const requests = await Request.find({ 
        completedBy: userId, 
        status: 'completed', 
        'rating.stars': { $exists: true } 
      });
      
      const ratings = requests.map(r => r.rating.stars).filter(r => typeof r === 'number');
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 ? (ratings.reduce((a, b) => a + b, 0) / totalRatings) : 0;
      
      res.status(200).json({ 
        averageRating, 
        totalRatings,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }
  } catch (err) {
    console.error('Get user ratings error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user role and requestPreferences
router.put('/:userId', async (req, res) => {
  console.log('...................')
  const { userId } = req.params;
  const { role, requestPreferences } = req.body;
  console.log(userId,User.recompileSchema)

  const updateObj = {};
  if (role) updateObj.role = role;
  if (requestPreferences) updateObj.requestPreferences = requestPreferences;

  if (!role && !requestPreferences) {
    return res.status(400).json({ message: 'Role or requestPreferences is required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      updateObj,
      { new: true, runValidators: true }
    ).select('_id name email role requestPreferences');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/profile - Update current user's profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateFields = { ...req.body };
    // Prevent email/role change here for security
    delete updateFields.email;
    delete updateFields.role;
    const user = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
