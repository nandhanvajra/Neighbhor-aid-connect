const mongoose = require('mongoose');
const config = require('../config/config');

const requestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: config.serviceCategories,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  urgency: {
    type: String,
    enum: config.urgencyLevels,
    required: true
  },
  preferredTime: {
    type: String,
    required: true
  },
  addressNote: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: config.requestStatuses,
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Enhanced rating system
  rating: {
    stars: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: function(v) {
          return v === null || (v >= 1 && v <= 5);
        },
        message: 'Rating must be between 1 and 5'
      }
    },
    review: {
      type: String,
      maxlength: 500,
      trim: true
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ratedAt: {
      type: Date,
      default: Date.now
    }
  }
});

// Update the updatedAt field on save
requestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if request is rated
requestSchema.virtual('isRated').get(function() {
  return this.rating && this.rating.stars && this.rating.ratedBy;
});

// Virtual for getting rating display
requestSchema.virtual('ratingDisplay').get(function() {
  if (!this.rating || !this.rating.stars) return null;
  return {
    stars: this.rating.stars,
    review: this.rating.review,
    ratedAt: this.rating.ratedAt
  };
});

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;