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
    
  }
});

// Update the updatedAt field on save
requestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;