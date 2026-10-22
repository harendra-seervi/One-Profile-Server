const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and login
 * @access  Public
 */
router.post('/login', AuthController.login);

/**
 * @route   GET /api/auth/check-username/:opusername
 * @desc    Check if username is available
 * @access  Public
 */
router.get('/check-username/:opusername', AuthController.checkUsernameAvailability);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', AuthController.register);

module.exports = router;
