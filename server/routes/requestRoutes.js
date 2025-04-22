const express = require('express');
const router = express.Router();
const Request = require('../models/requestSchema');
const auth = require('../middleware/auth');

// POST /api/requests - Create a new help request
router.post('/', auth, async (req, res) => {
  console.log('Received request creation with data:', req.body);
  try {
    const { category, description, urgency, preferredTime, addressNote } = req.body;
    
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
    const { category, description, urgency, preferredTime, addressNote } = req.body;
    
    // Find request
    let request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Check if user owns this request
    if (request.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this request' });
    }
    
    // Update request
    request = await Request.findByIdAndUpdate(
      req.params.id,
      { category, description, urgency, preferredTime, addressNote, updatedAt: Date.now() },
      { new: true }
    );
    
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