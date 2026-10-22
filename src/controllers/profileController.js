const User = require('../models/User');
const PlatformService = require('../services/platformService');

function normalizeOpUsername(value) {
  return String(value || '').trim();
}

function buildCaseInsensitiveUsernameQuery(value) {
  const normalized = normalizeOpUsername(value);
  if (!normalized) {
    return null;
  }

  return {
    opusername: {
      $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    },
  };
}

// Helper function to migrate old field names to new ones
function mapLegacyFields(userData) {
  const migrated = { ...userData };
  
  // Map old platform handle names to new ones
  if (userData.cf && !userData.codeforces) migrated.codeforces = userData.cf;
  if (userData.cc && !userData.codechef) migrated.codechef = userData.cc;
  if (userData.sp && !userData.leetcode) migrated.leetcode = userData.sp;
  if (userData.at && !userData.atcoder) migrated.atcoder = userData.at;
  
  // Map old rating field names to new ones and convert to numbers
  if (userData.cfrating && !userData.codeforcesRating) {
    migrated.codeforcesRating = Number(userData.cfrating) || 0;
  }
  if (userData.ccrating && !userData.codechefRating) {
    migrated.codechefRating = Number(userData.ccrating) || 0;
  }
  if (userData.sprating && !userData.leetcodeRating) {
    migrated.leetcodeRating = Number(userData.sprating) || 0;
  }
  if (userData.atrating && !userData.atcoderRating) {
    migrated.atcoderRating = Number(userData.atrating) || 0;
  }
  
  // Ensure all ratings are numbers
  migrated.codeforcesRating = Number(migrated.codeforcesRating) || 0;
  migrated.codechefRating = Number(migrated.codechefRating) || 0;
  migrated.leetcodeRating = Number(migrated.leetcodeRating) || 0;
  migrated.atcoderRating = Number(migrated.atcoderRating) || 0;
  
  // Calculate composite rating if it doesn't exist but we have platform ratings
  if ((!migrated.compositeRating || migrated.compositeRating === 0) && 
      (migrated.codeforcesRating || migrated.codechefRating || migrated.leetcodeRating || migrated.atcoderRating)) {
    migrated.compositeRating = PlatformService.calculateCompositeRating(
      migrated.codeforcesRating,
      migrated.codechefRating,
      migrated.leetcodeRating,
      migrated.atcoderRating
    );
  }
  
  // Map old lastupdate to lastRatingUpdate
  if (userData.lastupdate && !userData.lastRatingUpdate) migrated.lastRatingUpdate = userData.lastupdate;
  
  return migrated;
}

class ProfileController {
  /**
   * Get user profile by username
   */
  static async getUserProfile(req, res) {
    try {
      const opusernameParam = String(req.params.opusername || '').trim();
      const opusername = normalizeOpUsername(opusernameParam).toLowerCase();

      if (!opusername) {
        return res.status(400).json({
          success: false,
          message: 'Username is required',
        });
      }

      const query = buildCaseInsensitiveUsernameQuery(opusername);
      let user = query ? await User.findOne(query).select('-password').lean() : null;

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Map legacy field names to new ones for backward compatibility
      user = mapLegacyFields(user);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('[ProfileController] Get profile error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching user profile',
        error: error.message,
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(req, res) {
    try {
      const { opusername } = req.params;
      const updateData = req.body;

      if (!opusername || opusername.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Username is required',
        });
      }

      // Prevent password updates through this endpoint
      delete updateData.password;

      const updatedUser = await User.findOneAndUpdate(
        { opusername },
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      console.error('[ProfileController] Update profile error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating user profile',
        error: error.message,
      });
    }
  }
}

module.exports = ProfileController;
