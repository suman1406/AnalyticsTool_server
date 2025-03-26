const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendOtpEmail, reset_PW_OTP, accountDeactivated, loginOTP, userCreated } = require('../mail/mailer');
const Otp = require('../models/Otp');
const createToken = require('../middleware/webTokenGenerator');
const paseto = require('paseto');
const { V4: { verify } } = paseto;
const fs = require('fs');

// Utility: Generate a 6-digit OTP string
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ======================================================================
// REGISTER: Create a new user or admin
// If a role is provided (e.g. "admin") it will be used; otherwise, default to "user".
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if a user with the same email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password (always hash passwords in production)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user document; role defaults to "user" if not provided.
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role && role.toLowerCase() === 'admin' ? 'admin' : 'user',
    });
    await newUser.save();

    // Send a welcome email with email, password, and username using userCreated mailer function
    userCreated(username, email, password);

    return res.status(201).json({ 
      message: "User registered successfully", 
      user: { id: newUser._id, email: newUser.email } 
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ======================================================================
// LOGIN: Authenticate user (or admin) and issue Bearer token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create token payload including secret_key, id, email, username and role
    const tokenPayload = {
      secret_key: process.env.SECRET_KEY, // must be defined in your environment
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // Generate token using the paseto-based token generator
    const token = await createToken(tokenPayload);

    return res.json({ message: 'Logged in successfully', token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ======================================================================
// FORGOT PASSWORD: Generate an OTP for password reset and send it via email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP and expiry time (10 minutes)
    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Save OTP in Otp model (Remove previous OTPs for this user first)
    await Otp.deleteMany({ user: user._id }); // Clean up old OTPs
    await Otp.create({ user: user._id, otp, expiresAt });

    // Send OTP email
    reset_PW_OTP(user.username, otp, email);

    return res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('Forgot Password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ======================================================================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find OTP entry for the user
    const otpEntry = await Otp.findOne({ user: user._id, otp });
    if (!otpEntry || Date.now() > otpEntry.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Remove OTP after successful reset
    await Otp.deleteMany({ user: user._id });

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ======================================================================
// DELETE USER: Delete a user account using a Bearer token (works for both admin and user)
// Only the user themselves (or an admin, if you wish to extend functionality) can delete the account.
exports.deleteUser = async (req, res) => {
  try {
    // Bearer token should be provided in the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token using paseto
    const publicKey = fs.readFileSync('./RSA/public_key.pem');
    const decoded = await verify(token, publicKey);
    // decoded now contains the payload fields such as id, email, username, role, etc.
    
    // Find the requesting user
    const requestingUser = await User.findById(decoded.id);
    if (!requestingUser) {
      return res.status(404).json({ error: 'Requesting user not found' });
    }

    let targetUserId;
    if (requestingUser.role === 'admin') {
      // Admin can delete any account; expects target user ID in req.body.userId,
      // or defaults to deleting their own account if not provided.
      targetUserId = req.body.userId || decoded.id;
    } else {
      // Regular users can only delete their own account.
      targetUserId = decoded.id;
    }

    // If a non-admin tries to delete another user's account, deny the request.
    if (requestingUser.role !== 'admin' && targetUserId !== String(decoded.id)) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own account.' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    await User.findByIdAndDelete(targetUserId);
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};