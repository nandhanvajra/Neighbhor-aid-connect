const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 4 },
    address: { type: String, required: true, trim: true },
    job: { type: String, required: true, trim: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    role: { 
      type: String, 
      enum: [...config.availableRoles, 'custom'],
      default: 'resident'
    },
    // Profile fields
    phone: { type: String, trim: true },
    bio: { type: String, maxlength: 500, trim: true },
    skills: [{ type: String, trim: true }],
    profilePicture: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      default: 'prefer-not-to-say'
    },
    occupation: { type: String, trim: true },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true }
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      emailUpdates: { type: Boolean, default: true },
      publicProfile: { type: Boolean, default: true }
    },
    requestPreferences: [{ type: String, trim: true }],
    // Enhanced rating system
    rating: { 
      average: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 },
      ratingBreakdown: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 }
      },
      lastRatedAt: { type: Date }
    }
  });
  
// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password on login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to update user rating statistics
userSchema.methods.updateRatingStats = async function(newRating) {
  const prevTotal = this.rating.totalRatings || 0;
  const prevAvg = this.rating.average || 0;
  const newTotal = prevTotal + 1;
  const newAvg = ((prevAvg * prevTotal) + newRating) / newTotal;
  
  this.rating.average = newAvg;
  this.rating.totalRatings = newTotal;
  this.rating.ratingBreakdown[newRating] = (this.rating.ratingBreakdown[newRating] || 0) + 1;
  this.rating.lastRatedAt = new Date();
  
  await this.save();
  return this.rating;
};

// Virtual for rating display
userSchema.virtual('ratingDisplay').get(function() {
  return {
    average: this.rating.average,
    totalRatings: this.rating.totalRatings,
    breakdown: this.rating.ratingBreakdown,
    hasRatings: this.rating.totalRatings > 0
  };
});

const User = mongoose.model('User', userSchema);
module.exports = User;