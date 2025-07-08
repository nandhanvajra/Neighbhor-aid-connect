const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const router = express.Router();

// Use a constant secret key
const jwtSecret = 'superSecretHardcodedKey123';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
   const { name, email, password, address ,isAdmin} = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('→ Signup failed: user exists');
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const newUser = await User.create({ name, email, password, address });
    console.log('→ Signup success:', newUser.email);
    
    // Create and return token with the response for automatic login
    const token = jwt.sign(
      { userId: newUser._id },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    return res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        address: newUser.address
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });
  try {
    const user = await User.findOne({ email });
    console.log('User from DB:', user ? 'Found' : 'Not found');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    console.log('Login successful, token generated');
    
    return res.status(200).json({ 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        isadmin:user.isAdmin
    
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// GET /api/auth/user - Get current user info
router.get('/user', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const verified = jwt.verify(token, jwtSecret);
    if (!verified) {
      return res.status(401).json({ message: 'Token verification failed' });
    }
    
    // Get user info
    const user = await User.findById(verified.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;