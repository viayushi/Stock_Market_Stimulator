const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Ensure bcryptjs is used for hashing passwords
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const Portfolio = require('../models/portfolio.model');

// Helper function to generate JWT and refresh tokens
const generateTokens = (userId) => {
  // Ensure JWT_SECRET is defined in your environment variables for production
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined. Please set it in your environment variables.');
    // In a real application, you might throw an error or handle this more gracefully
    // For now, we'll proceed, but tokens might not be secure.
  }

  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } // Default to 15 minutes if not specified
  );

  // Generate a cryptographically strong refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
};

/**
 * @desc Registers a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password is required and must be at least 6 characters long.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }
    const user = new User({ username, email, password, balance: 50000000 });
    await user.save();
    let portfolio = await Portfolio.findOne({ user: user._id });
    if (!portfolio) {
      portfolio = new Portfolio({ user: user._id, cash: 50000000, holdings: {} });
      await portfolio.save();
    }
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    res.status(201).json({
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        firstLogin: user.firstLogin || true,
        balance: user.balance || 50000000
      },
      token: accessToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration. Please try again later.' });
  }
};

/**
 * @desc Logs in an existing user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed. Please check your credentials.', errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (!user.password || user.password.length === 0) {
      return res.status(400).json({ message: 'This account is outdated or has no password set. Please use password reset flow or contact support.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    // Check if this is the first login
    const isFirstLogin = user.firstLogin === true;
    
    // Mark first login as false if it was true
    if (isFirstLogin) {
      user.firstLogin = false;
      await user.save();
    }
    
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    res.json({
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        firstLogin: isFirstLogin, // Return the original value before it was changed
        balance: user.balance || 50000000
      },
      token: accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login. Please try again later.' });
  }
};

/**
 * @desc Refreshes access token using refresh token
 * @route POST /api/auth/refresh
 * @access Public (but requires valid refresh token cookie)
 */
exports.refresh = async (req, res) => {
  try {
    return res.status(501).json({ message: 'Refresh token endpoint not implemented. Please log in again.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during token refresh. Please try again.' });
  }
};

/**
 * @desc Logs out the current user
 * @route POST /api/auth/logout
 * @access Private (but can be accessed publicly to clear cookies)
 */
exports.logout = async (req, res) => {
  try {
    // No server-side logout needed for JWT in header. Frontend should just delete the token.
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during logout. Please try again.' });
  }
};

/**
 * @desc Gets the profile of the authenticated user
 * @route GET /api/auth/profile
 * @access Private (requires valid access token)
 */
exports.getProfile = async (req, res) => {
  try {
    // req.user.userId is set by auth middleware
    const user = await User.findById(req.user.userId).select('-password -refreshToken -__v');
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching profile. Please try again.' });
  }
};

/**
 * @desc Helper function to log users with missing, null, or empty passwords.
 * Useful for migration or identifying data inconsistencies.
 * @access Private (for admin/development use)
 */
exports.logUsersWithMissingPasswords = async () => {
  try {
    const users = await User.find({
      $or: [
        { password: { $exists: false } }, // password field does not exist
        { password: null },               // password field is null
        { password: '' }                  // password field is an empty string
      ]
    }).select('email username'); // Select only relevant fields for logging

    if (users.length > 0) {
      console.warn(`Found ${users.length} user(s) with missing or empty passwords:`);
      users.forEach(u => console.warn(` - Email: ${u.email}, Username: ${u.username}`));
    } else {
      console.log('No users with missing or empty passwords found.');
    }
  } catch (error) {
    console.error('Error logging users with missing passwords:', error);
  }
};