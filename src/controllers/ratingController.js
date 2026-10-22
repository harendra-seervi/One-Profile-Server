const RatingService = require('../services/ratingService');

class RatingController {
  /**
   * Get all users with their ratings, sorted by rank
   */
  static async getAllRatings(req, res) {
    try {
      const users = await RatingService.getAllUsersWithRatings();

      if (users.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No users found',
        });
      }

      return res.status(200).json({
        success: true,
        data: users,
        totalUsers: users.length,
      });
    } catch (error) {
      console.error('[RatingController] Get all ratings error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching ratings',
        error: error.message,
      });
    }
  }

  /**
   * Get rating for a specific user
   */
  static async getUserRating(req, res) {
    try {
      const { opusername } = req.params;

      if (!opusername || opusername.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Username is required',
        });
      }

      const user = await RatingService.getUserRating(opusername);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('[RatingController] Get user rating error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching user rating',
        error: error.message,
      });
    }
  }

  /**
   * Manually trigger rating update (useful for testing)
   * In production, this should have proper authorization
   */
  static async triggerRatingUpdate(req, res) {
    try {
      console.log('[RatingController] Manual rating update triggered');
      
      await RatingService.updateAllRatings();

      return res.status(200).json({
        success: true,
        message: 'Rating update completed successfully',
      });
    } catch (error) {
      console.error('[RatingController] Manual rating update error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during rating update',
        error: error.message,
      });
    }
  }
}

module.exports = RatingController;
