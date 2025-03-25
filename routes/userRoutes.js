const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const webTokenValidator = require('../middleware/webTokenValidator');

// Register a new user
router.post('/register', userController.register);

// Login user
router.post('/login', userController.login);

// Forgot password to generate and send OTP
router.post('/forgot-password', userController.forgotPassword);

router.post('/reset-password', userController.resetPassword);

// Delete authenticated user
router.delete('/delete', webTokenValidator, userController.deleteUser);

module.exports = router;