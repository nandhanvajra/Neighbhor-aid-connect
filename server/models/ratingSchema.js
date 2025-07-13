const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  raterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Additional metadata
  helpfulCount: {
    type: Number,
    default: 0
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  responseTime: {
    type: Number, // in minutes
    default: null
  },
  qualityOfWork: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  communication: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  professionalism: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  }
});

// Update timestamp on save
ratingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
ratingSchema.index({ ratedUserId: 1, createdAt: -1 });
ratingSchema.index({ requestId: 1 });
ratingSchema.index({ raterId: 1 });

// Virtual for overall rating score
ratingSchema.virtual('overallScore').get(function() {
  const scores = [this.stars];
  if (this.qualityOfWork) scores.push(this.qualityOfWork);
  if (this.communication) scores.push(this.communication);
  if (this.professionalism) scores.push(this.professionalism);
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
});

// Static method to get user rating statistics
ratingSchema.statics.getUserRatingStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { ratedUserId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$stars' },
        totalRatings: { $sum: 1 },
        ratingBreakdown: {
          $push: '$stars'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  stats[0].ratingBreakdown.forEach(rating => {
    breakdown[rating]++;
  });

  return {
    averageRating: Math.round(stats[0].averageRating * 100) / 100,
    totalRatings: stats[0].totalRatings,
    ratingBreakdown: breakdown
  };
};

const Rating = mongoose.model('Rating', ratingSchema);
module.exports = Rating; 