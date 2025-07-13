const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'signup',
      'create_request',
      'update_request',
      'delete_request',
      'offer_help',
      'complete_request',
      'rate_service',
      'update_profile',
      'send_message',
      'role_change',
      'admin_action'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  }
});

// Index for efficient querying
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ action: 1, timestamp: -1 });
activitySchema.index({ timestamp: -1 });

// Static method to log activity
activitySchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// Static method to get user activities
activitySchema.statics.getUserActivities = async function(userId, limit = 50) {
  return await this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get all activities with pagination
activitySchema.statics.getAllActivities = async function(page = 1, limit = 20, filters = {}) {
  const skip = (page - 1) * limit;
  const query = {};
  
  if (filters.action) query.action = filters.action;
  if (filters.userId) query.userId = filters.userId;
  if (filters.status) query.status = filters.status;
  if (filters.dateFrom) query.timestamp = { $gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    if (query.timestamp) {
      query.timestamp.$lte = new Date(filters.dateTo);
    } else {
      query.timestamp = { $lte: new Date(filters.dateTo) };
    }
  }
  
  const activities = await this.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(query);
  
  return {
    activities,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// Static method to get activity statistics
activitySchema.statics.getActivityStats = async function(days = 7) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: dateFrom }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        dailyStats: {
          $push: {
            date: '$_id.date',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    }
  ]);
  
  return stats;
};

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity; 