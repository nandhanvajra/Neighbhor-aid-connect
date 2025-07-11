const express = require('express');
const router = express.Router();
const Request = require('../models/requestSchema');
const User = require('../models/userSchema');
const auth = require('../middleware/auth');

// POST /api/requests - Create a new help request
router.post('/', auth, async (req, res) => {
  console.log('Received request creation with data:', req.body);

  try {
    const { category, description, urgency, preferredTime, addressNote } = req.body;
    console.log(category)
    
    // Get user details for notifications
    const user = await User.findById(req.user.userId).select('name');
    
    // Create new request
    const newRequest = new Request({
      userId: req.user.userId,
      category,
      description,
      urgency,
      preferredTime,
      addressNote: addressNote || '' // Handle optional field
    });

    console.log('Created new request object:', newRequest);
    
    // Save request to database
    const savedRequest = await newRequest.save();
    console.log('Saved request to database with ID:', savedRequest._id);

    // Notify all users of the new request
    if (req.io) {
      req.io.emit('newHelpRequest', {
        requestId: savedRequest._id,
        category,
        description,
        urgency,
        preferredTime,
        addressNote,
        fromUserId: req.user.userId
      });
      
      // If this is a direct service request to a specific staff member, notify them
      if (req.body.staffMemberId) {
        req.io.to(req.body.staffMemberId).emit('directServiceRequest', {
          requestId: savedRequest._id,
          category,
          description,
          urgency,
          preferredTime,
          addressNote,
          fromUserId: req.user.userId,
          fromUserName: user.name || 'A resident',
          staffMemberId: req.body.staffMemberId,
          staffMemberName: req.body.staffMemberName
        });
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Help request created successfully', 
      request: savedRequest 
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// GET /api/requests - Get all requests for the logged in user
router.get('/all', auth, async (req, res) => {
    try {
        const requests = await Request.find()
            .populate('userId', 'name email job role')
            .populate('completedBy', 'name email job role');
        
        // Transform the data to include userName and ensure userId is a string
        const requestsWithUserNames = requests.map(request => ({
            ...request.toObject(),
            userId: request.userId ? request.userId._id.toString() : request.userId,
            userName: request.userId ? request.userId.name : 'Unknown User',
            userEmail: request.userId ? request.userId.email : '',
            userJob: request.userId ? request.userId.job : '',
            userRole: request.userId ? request.userId.role : '',
            completedBy: request.completedBy ? request.completedBy._id.toString() : request.completedBy,
            completedByName: request.completedBy ? request.completedBy.name : 'Volunteer'
        }));
        
        res.status(200).json({ success: true, requests: requestsWithUserNames });
    } catch (err) {
        console.error('Get requests error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

router.get('/allusers', auth, async (req, res) => {
    try {
        const requests = await User.find();
        res.status(200).json({ success: true, requests });
    } catch (err) {
        console.error('Get requests error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

router.get('/', auth, async (req, res) => {
  try {
    const requests = await Request.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/requests/:id - Get a specific request
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Check if user owns this request
    if (request.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this request' });
    }
    
    res.status(200).json({ success: true, request });
  } catch (err) {
    console.error('Get request error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT /api/requests/:id - Update a request
router.put('/:id', auth, async (req, res) => {
  try {
    const { category, description, urgency, preferredTime, addressNote, completedBy, status } = req.body;
    
    // Find request
    let request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Check if this is an "offer help" request
    const isOfferingHelp = completedBy !== undefined && status === 'in-progress';
    
    // If not offering help, only the owner can update
    if (!isOfferingHelp && request.userId.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this request',
        isOfferingHelp: isOfferingHelp,
        requestUserId: request.userId,
        currentUserId: req.user.userId
      });
    }
    
    // Prepare update object with only the fields that exist in the request
    const updateObj = { updatedAt: Date.now() };
    if (category !== undefined) updateObj.category = category;
    if (description !== undefined) updateObj.description = description;
    if (urgency !== undefined) updateObj.urgency = urgency;
    if (preferredTime !== undefined) updateObj.preferredTime = preferredTime;
    if (addressNote !== undefined) updateObj.addressNote = addressNote;
    if (completedBy !== undefined) updateObj.completedBy = completedBy;
    if (status !== undefined) updateObj.status = status;
    
    console.log('Updating request with:', updateObj);
    
    // Update request
    request = await Request.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true }
    );
    
    // Notify through Socket.io if available
    if (req.io && isOfferingHelp) {
      req.io.to(request.userId.toString()).emit('requestHelp', {
        requestId: request._id,
        helper: req.user.userId,
        status: 'in-progress'
      });
    }
    
    res.status(200).json({ success: true, message: 'Request updated successfully', request });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE /api/requests/:id - Delete a request
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find request
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Check if user owns this request
    if (request.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this request' });
    }
    
    // Delete request
    await Request.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ success: true, message: 'Request deleted successfully' });
  } catch (err) {
    console.error('Delete request error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;