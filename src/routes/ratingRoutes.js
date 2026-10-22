const express = require('express');
const RatingController = require('../controllers/ratingController');

const router = express.Router();

/**
 * @route   GET /api/ratings
 * @desc    Get all users with their ratings, sorted by rank
 * @access  Public
 */
router.get('/', RatingController.getAllRatings);

/**
 * @route   GET /api/ratings/:opusername
 * @desc    Get a specific user's rating
 * @access  Public
 */
router.get('/:opusername', RatingController.getUserRating);

/**
 * @route   POST /api/ratings/update
 * @desc    Manually trigger rating update (testing only)
 * @access  Public (should be protected in production)
 */
router.post('/update', RatingController.triggerRatingUpdate);

module.exports = router;
