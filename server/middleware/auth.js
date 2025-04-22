const jwt = require('jsonwebtoken');

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

module.exports = auth;