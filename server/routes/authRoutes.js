const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const Activity = require('../models/activitySchema');
const router = express.Router();

// Use a constant secret key
const jwtSecret = 'superSecretHardcodedKey123';

// Admin creation secret key (you should change this to a secure value)
const ADMIN_SECRET = 'adminSecretKey2024';

// POST /api/auth/create-admin - Create admin user (for Postman/API use)
router.post('/create-admin', async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    address, 
    job,
    phone,
    bio,
    skills,
    profilePicture,
    dateOfBirth,
    gender,
    occupation,
    emergencyContact,
    preferences,
    adminSecret
  } = req.body;

  try {
    // Verify admin secret
    if (adminSecret !== ADMIN_SECRET) {
      console.log('→ Admin creation failed: invalid secret');
      return res.status(403).json({ 
        message: 'Unauthorized: Invalid admin secret key',
        error: 'ADMIN_SECRET_MISMATCH'
      });
    }

    // Validate required fields
    if (!name || !email || !password || !address || !job) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, email, password, address, job',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('→ Admin creation failed: user exists');
      return res.status(400).json({ 
        message: 'User with this email already exists',
        error: 'USER_ALREADY_EXISTS'
      });
    }
    
    // Create admin user
    const newAdmin = await User.create({ 
      name, 
      email, 
      password, 
      address,
      job,
      phone,
      bio,
      skills,
      profilePicture,
      dateOfBirth,
      gender,
      occupation,
      emergencyContact,
      preferences,
      isAdmin: true, // Set admin flag
      role: 'admin'  // Set admin role
    });

    console.log('→ Admin user created successfully:', newAdmin.email);
    
    // Log admin creation activity
    await Activity.logActivity({
      userId: newAdmin._id,
      userName: newAdmin.name,
      userEmail: newAdmin.email,
      action: 'admin_action',
      details: {
        action: 'admin_creation',
        createdBy: 'system',
        adminSecret: adminSecret ? 'provided' : 'missing'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Create and return token
    const token = jwt.sign(
      { userId: newAdmin._id },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    return res.status(201).json({ 
      message: 'Admin user created successfully',
      token,
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        address: newAdmin.address,
        job: newAdmin.job,
        isAdmin: newAdmin.isAdmin,
        role: newAdmin.role,
        phone: newAdmin.phone,
        bio: newAdmin.bio,
        skills: newAdmin.skills,
        profilePicture: newAdmin.profilePicture,
        dateOfBirth: newAdmin.dateOfBirth,
        gender: newAdmin.gender,
        occupation: newAdmin.occupation,
        emergencyContact: newAdmin.emergencyContact,
        preferences: newAdmin.preferences,
        createdAt: newAdmin.createdAt
      }
    });
  } catch (err) {
    console.error('Admin creation error:', err);
    return res.status(500).json({ 
      message: 'Admin creation failed', 
      error: err.message 
    });
  }
});

// GET /api/auth/admins - List all admin users (for verification)
router.get('/admins', async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      message: 'Admin users retrieved successfully',
      count: admins.length,
      admins: admins.map(admin => ({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isAdmin: admin.isAdmin,
        createdAt: admin.createdAt
      }))
    });
  } catch (err) {
    console.error('Get admins error:', err);
    res.status(500).json({ 
      message: 'Failed to retrieve admin users', 
      error: err.message 
    });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
   const { 
     name, 
     email, 
     password, 
     address, 
     job,
     isAdmin,
     phone,
     bio,
     skills,
     profilePicture,
     dateOfBirth,
     gender,
     occupation,
     emergencyContact,
     preferences
   } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('→ Signup failed: user exists');
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const newUser = await User.create({ 
      name, 
      email, 
      password, 
      address,
      job,
      phone,
      bio,
      skills,
      profilePicture,
      dateOfBirth,
      gender,
      occupation,
      emergencyContact,
      preferences
    });
    console.log('→ Signup success:', newUser.email);
    
    // Log signup activity
    await Activity.logActivity({
      userId: newUser._id,
      userName: newUser.name,
      userEmail: newUser.email,
      action: 'signup',
      details: {
        role: newUser.role,
        isAdmin: newUser.isAdmin
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
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
        address: newUser.address,
        job: newUser.job,
        phone: newUser.phone,
        bio: newUser.bio,
        skills: newUser.skills,
        profilePicture: newUser.profilePicture,
        dateOfBirth: newUser.dateOfBirth,
        gender: newUser.gender,
        occupation: newUser.occupation,
        emergencyContact: newUser.emergencyContact,
        preferences: newUser.preferences
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
    
    // Log login activity
    await Activity.logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'login',
      details: {
        role: user.role,
        isAdmin: user.isAdmin
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(200).json({ 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        job: user.job,
        isadmin: user.isAdmin,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        occupation: user.occupation,
        emergencyContact: user.emergencyContact,
        preferences: user.preferences
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
    
    res.status(200).json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        job: user.job,
        isAdmin: user.isAdmin,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        occupation: user.occupation,
        emergencyContact: user.emergencyContact,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/auth/user/profile - Update user profile
router.put('/user/profile', async (req, res) => {
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
    
    const {
      name,
      address,
      job,
      phone,
      bio,
      skills,
      profilePicture,
      dateOfBirth,
      gender,
      occupation,
      emergencyContact,
      preferences
    } = req.body;
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      verified.userId,
      {
        name,
        address,
        job,
        phone,
        bio,
        skills,
        profilePicture,
        dateOfBirth,
        gender,
        occupation,
        emergencyContact,
        preferences
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Profile updated for user:', updatedUser.email);
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        job: updatedUser.job,
        isAdmin: updatedUser.isAdmin,
        role: updatedUser.role,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        profilePicture: updatedUser.profilePicture,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        occupation: updatedUser.occupation,
        emergencyContact: updatedUser.emergencyContact,
        preferences: updatedUser.preferences,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;