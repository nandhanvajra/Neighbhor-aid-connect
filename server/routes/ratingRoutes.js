const express = require('express');
const router = express.Router();
const Rating = require('../models/ratingSchema');
const Request = require('../models/requestSchema');
const User = require('../models/userSchema');
const { auth } = require('../middleware/auth');

// POST /api/ratings - Submit a new rating
router.post('/', auth, async (req, res) => {
  try {
    const { requestId, stars, review, category, qualityOfWork, communication, professionalism, isAnonymous } = req.body;

    // Validate required fields
    if (!requestId || !stars || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request ID, stars, and category are required' 
      });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Get the request to validate and get helper info
    const request = await Request.findById(requestId)
      .populate('userId', 'name')
      .populate('completedBy', 'name');

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    // Check if request is completed
    if (request.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only rate completed requests' 
      });
    }

    // Check if user is the one who posted the request
    if (request.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the request owner can rate the helper' 
      });
    }

    // Check if already rated
    const existingRating = await Rating.findOne({ 
      requestId, 
      raterId: req.user.userId 
    });

    if (existingRating) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already rated this request' 
      });
    }

    // Check if trying to rate yourself
    if (request.completedBy && request.completedBy._id.toString() === req.user.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot rate your own work' 
      });
    }

    // Calculate response time if request has completion data
    let responseTime = null;
    if (request.completedBy && request.updatedAt && request.createdAt) {
      responseTime = Math.round((request.updatedAt - request.createdAt) / (1000 * 60)); // minutes
    }

    // Create new rating
    const newRating = new Rating({
      requestId,
      raterId: req.user.userId,
      ratedUserId: request.completedBy ? request.completedBy._id : request.userId._id,
      stars,
      review: review || '',
      category,
      qualityOfWork,
      communication,
      professionalism,
      isAnonymous: isAnonymous || false,
      responseTime
    });

    await newRating.save();

    // Update request with rating info
    request.rating = {
      stars,
      review: review || '',
      ratedBy: req.user.userId,
      ratedAt: new Date()
    };
    await request.save();

    // Update helper's rating statistics
    if (request.completedBy) {
      const helper = await User.findById(request.completedBy);
      if (helper) {
        await helper.updateRatingStats(stars);
      }
    }

    // Notify the rated user through Socket.io if available
    if (req.io && request.completedBy) {
      req.io.to(request.completedBy._id.toString()).emit('newRating', {
        ratingId: newRating._id,
        stars,
        review: review || '',
        category,
        fromUser: req.user.userId,
        requestId
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Rating submitted successfully', 
      rating: newRating 
    });

  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// GET /api/ratings/user/:userId - Get all ratings for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, sort = 'createdAt' } = req.query;

    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sort] = -1;

    const ratings = await Rating.find({ ratedUserId: userId })
      .populate('raterId', 'name')
      .populate('requestId', 'category description')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Rating.countDocuments({ ratedUserId: userId });

    res.status(200).json({
      success: true,
      ratings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasMore: skip + ratings.length < total
      }
    });

  } catch (err) {
    console.error('Get user ratings error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// GET /api/ratings/user/:userId/stats - Get rating statistics for a user
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Rating.getUserRatingStats(userId);

    // Get recent ratings
    const recentRatings = await Rating.find({ ratedUserId: userId })
      .populate('raterId', 'name')
      .populate('requestId', 'category')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats,
      recentRatings
    });

  } catch (err) {
    console.error('Get user rating stats error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// GET /api/ratings/request/:requestId - Get rating for a specific request
router.get('/request/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const rating = await Rating.findOne({ requestId })
      .populate('raterId', 'name')
      .populate('ratedUserId', 'name');

    if (!rating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }

    res.status(200).json({
      success: true,
      rating
    });

  } catch (err) {
    console.error('Get request rating error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// PUT /api/ratings/:ratingId - Update a rating (only by the original rater)
router.put('/:ratingId', auth, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { stars, review, qualityOfWork, communication, professionalism } = req.body;

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }

    // Check if user is the original rater
    if (rating.raterId.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this rating' 
      });
    }

    // Update rating fields
    if (stars !== undefined) {
      if (stars < 1 || stars > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rating must be between 1 and 5' 
        });
      }
      rating.stars = stars;
    }

    if (review !== undefined) rating.review = review;
    if (qualityOfWork !== undefined) rating.qualityOfWork = qualityOfWork;
    if (communication !== undefined) rating.communication = communication;
    if (professionalism !== undefined) rating.professionalism = professionalism;

    rating.updatedAt = new Date();
    await rating.save();

    // Update request rating
    const request = await Request.findById(rating.requestId);
    if (request && request.rating) {
      request.rating.stars = rating.stars;
      request.rating.review = rating.review;
      await request.save();
    }

    // Recalculate helper's rating statistics
    const helper = await User.findById(rating.ratedUserId);
    if (helper) {
      // This is a simplified recalculation - in production you might want to recalculate all ratings
      const allRatings = await Rating.find({ ratedUserId: rating.ratedUserId });
      const totalRatings = allRatings.length;
      const averageRating = allRatings.reduce((sum, r) => sum + r.stars, 0) / totalRatings;
      
      helper.rating.average = Math.round(averageRating * 100) / 100;
      helper.rating.totalRatings = totalRatings;
      await helper.save();
    }

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      rating
    });

  } catch (err) {
    console.error('Update rating error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// DELETE /api/ratings/:ratingId - Delete a rating (only by the original rater)
router.delete('/:ratingId', auth, async (req, res) => {
  try {
    const { ratingId } = req.params;

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }

    // Check if user is the original rater
    if (rating.raterId.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this rating' 
      });
    }

    // Remove rating from request
    const request = await Request.findById(rating.requestId);
    if (request && request.rating) {
      request.rating = undefined;
      await request.save();
    }

    // Recalculate helper's rating statistics
    const helper = await User.findById(rating.ratedUserId);
    if (helper) {
      const allRatings = await Rating.find({ ratedUserId: rating.ratedUserId });
      const totalRatings = allRatings.length;
      const averageRating = totalRatings > 0 
        ? allRatings.reduce((sum, r) => sum + r.stars, 0) / totalRatings 
        : 0;
      
      helper.rating.average = Math.round(averageRating * 100) / 100;
      helper.rating.totalRatings = totalRatings;
      await helper.save();
    }

    await Rating.findByIdAndDelete(ratingId);

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });

  } catch (err) {
    console.error('Delete rating error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// POST /api/ratings/:ratingId/helpful - Mark a rating as helpful
router.post('/:ratingId/helpful', auth, async (req, res) => {
  try {
    const { ratingId } = req.params;

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }

    // Check if user is not the rater (can't mark own rating as helpful)
    if (rating.raterId.toString() === req.user.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot mark your own rating as helpful' 
      });
    }

    rating.helpfulCount += 1;
    await rating.save();

    res.status(200).json({
      success: true,
      message: 'Rating marked as helpful',
      helpfulCount: rating.helpfulCount
    });

  } catch (err) {
    console.error('Mark rating helpful error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

module.exports = router; 