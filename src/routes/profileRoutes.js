const express = require('express');
const ProfileController = require('../controllers/profileController');

const router = express.Router();

/**
 * @route   GET /api/profile/:opusername
 * @desc    Get user profile by username
 * @access  Public
 */
router.get('/:opusername', ProfileController.getUserProfile);

/**
 * @route   PUT /api/profile/:opusername
 * @desc    Update user profile
 * @access  Public (should add authentication in production)
 */
router.put('/:opusername', ProfileController.updateUserProfile);

module.exports = router;
