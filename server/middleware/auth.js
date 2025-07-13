const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

// JWT secret key
const jwtSecret = 'superSecretHardcodedKey123';

// Authentication middleware
const auth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted and processing...');
    
    // Verify token
    const verified = jwt.verify(token, jwtSecret);
    console.log('Token verified, user ID:', verified.userId);
    
    // Add user from token to request object
    req.user = verified;
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(401).json({ message: 'Invalid token, authorization denied' });
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const verified = jwt.verify(token, jwtSecret);
    
    // Check if user exists and is admin
    const user = await User.findById(verified.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isAdmin && user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Add user info to request object
    req.user = verified;
    req.adminUser = user;
    next();
  } catch (err) {
    console.error('Admin auth error:', err.message);
    res.status(401).json({ message: 'Invalid token or admin access denied' });
  }
};

module.exports = { auth, adminAuth };