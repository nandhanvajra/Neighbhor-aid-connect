const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/userSchema');
const Request = require('../models/requestSchema');
const Activity = require('../models/activitySchema');
const Message = require('../models/messageSchema');
const Chat = require('../models/chatSchema');

// Apply admin auth middleware to all routes
router.use(adminAuth);

// GET /api/admin/dashboard - Get admin dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get basic statistics
    const totalUsers = await User.countDocuments();
    const totalRequests = await Request.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalChats = await Chat.countDocuments();
    
    // Get recent activities
    const recentActivities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'name email');
    
    // Get user statistics by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get request statistics by status
    const requestStats = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get activity statistics for the last 7 days
    const activityStats = await Activity.getActivityStats(7);
    
    // Get top users by activity
    const topUsers = await Activity.aggregate([
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          userEmail: { $first: '$userEmail' },
          activityCount: { $sum: 1 }
        }
      },
      {
        $sort: { activityCount: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRequests,
          totalMessages,
          totalChats
        },
        userStats,
        requestStats,
        activityStats,
        topUsers,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/admin/users - Get all users with pagination and filters
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/admin/activities - Get all activities with pagination and filters
router.get('/activities', async (req, res) => {
  try {
    const { page = 1, limit = 20, action, userId, status, dateFrom, dateTo } = req.query;
    
    const filters = {};
    if (action) filters.action = action;
    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    
    const result = await Activity.getAllActivities(parseInt(page), parseInt(limit), filters);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/admin/requests - Get all requests with pagination and filters
router.get('/requests', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, urgency, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (urgency) query.urgency = urgency;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { addressNote: { $regex: search, $options: 'i' } }
      ];
    }
    
    const requests = await Request.find(query)
      .populate('userId', 'name email')
      .populate('completedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Request.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;
    
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Log the admin action
    await Activity.logActivity({
      userId: req.adminUser._id,
      userName: req.adminUser.name,
      userEmail: req.adminUser.email,
      action: 'admin_action',
      details: {
        action: 'role_change',
        targetUserId: id,
        targetUserName: user.name,
        oldRole: user.role,
        newRole: role
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/admin/users/:id/status - Update user status (enable/disable)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const { id } = req.params;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Log the admin action
    await Activity.logActivity({
      userId: req.adminUser._id,
      userName: req.adminUser.name,
      userEmail: req.adminUser.email,
      action: 'admin_action',
      details: {
        action: 'user_status_change',
        targetUserId: id,
        targetUserName: user.name,
        newStatus: isActive
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.adminUser._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deletion of other admins
    if (user.isAdmin || user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin users' });
    }
    
    // Delete user's requests, messages, and activities
    await Request.deleteMany({ userId: id });
    await Message.deleteMany({ userId: id });
    await Activity.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);
    
    // Log the admin action
    await Activity.logActivity({
      userId: req.adminUser._id,
      userName: req.adminUser.name,
      userEmail: req.adminUser.email,
      action: 'admin_action',
      details: {
        action: 'user_deletion',
        targetUserId: id,
        targetUserName: user.name,
        targetUserEmail: user.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/admin/reports - Get various reports
router.get('/reports', async (req, res) => {
  try {
    const { type, days = 30 } = req.query;
    
    let reportData = {};
    
    switch (type) {
      case 'user_activity':
        reportData = await Activity.getActivityStats(parseInt(days));
        break;
        
      case 'request_analytics':
        const requestAnalytics = await Request.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                category: '$category',
                status: '$status'
              },
              count: { $sum: 1 }
            }
          }
        ]);
        reportData = requestAnalytics;
        break;
        
      case 'user_registration':
        const userRegistration = await User.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                role: '$role'
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.date': 1 }
          }
        ]);
        reportData = userRegistration;
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }
    
    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router; 