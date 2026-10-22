const User = require('../models/User');
const PlatformService = require('./platformService');

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

class RatingService {
  static isUpdateRunning = false;

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async fetchWithRetry(fetcher, userHandle, label, maxAttempts = 3, baseDelayMs = 1500) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const value = await fetcher(userHandle);

        if (value !== undefined && value !== null && value !== '') {
          return Number(value) || 0;
        }

        lastError = new Error(`${label} returned empty data`);
      } catch (error) {
        lastError = error;
      }

      if (attempt < maxAttempts) {
        const delayMs = baseDelayMs * attempt;
        console.warn(`[RatingService] ${label} attempt ${attempt}/${maxAttempts} failed for ${userHandle}. Retrying in ${delayMs}ms...`);
        await this.sleep(delayMs);
      }
    }

    console.error(`[RatingService] ${label} failed for ${userHandle} after ${maxAttempts} attempts. Error: ${lastError ? lastError.message : 'Unknown error'}`);
    return 0;
  }

  /**
   * Update all user ratings from various coding platforms
   * This is typically called by a cron job every 3 minutes
   */
  static async updateAllRatings() {
    if (this.isUpdateRunning) {
      console.log('[RatingService] Previous rating update is still running; skipping this cycle.');
      return false;
    }

    this.isUpdateRunning = true;
    const startedAt = Date.now();

    try {
      console.log('[RatingService] Starting rating update cycle...');
      
      let users = await User.find({});
      
      if (users.length === 0) {
        console.log('[RatingService] No users found to update');
        return true;
      }

      users = users.map(user => mapLegacyFields(user.toObject ? user.toObject() : user));

      for (let index = 0; index < users.length; index++) {
        const user = users[index];

        if (index > 0) {
          await this.sleep(500);
        }

        try {
          const codeforcesRating = await this.fetchWithRetry(
            PlatformService.fetchCodeforcesRating.bind(PlatformService),
            user.codeforces,
            'Codeforces',
            3,
            1500
          );

          const codechefRating = await this.fetchWithRetry(
            PlatformService.fetchCodeChefRating.bind(PlatformService),
            user.codechef,
            'CodeChef',
            3,
            1500
          );

          const leetcodeRating = await this.fetchWithRetry(
            PlatformService.fetchLeetCodeRating.bind(PlatformService),
            user.leetcode,
            'LeetCode',
            3,
            1500
          );

          const atcoderRating = await this.fetchWithRetry(
            PlatformService.fetchAtCoderRating.bind(PlatformService),
            user.atcoder,
            'AtCoder',
            3,
            1500
          );

          const compositeRating = PlatformService.calculateCompositeRating(
            codeforcesRating,
            codechefRating,
            leetcodeRating,
            atcoderRating
          );

          const updateData = {
            codeforcesRating,
            codechefRating,
            leetcodeRating,
            atcoderRating,
            compositeRating,
            lastRatingUpdate: new Date(),
          };

          await User.updateOne({ _id: user._id }, updateData);
        } catch (error) {
          console.error(`[RatingService] Error updating ratings for user ${user._id}:`, error.message);
        }
      }
      
      const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const elapsedMs = Date.now() - startedAt;
      console.log(`[RatingService] Rating update completed at ${currentTime} in ${Math.round(elapsedMs / 1000)}s`);
      return true;
    } catch (error) {
      console.error('[RatingService] Fatal error during rating update:', error.message);
      throw error;
    } finally {
      this.isUpdateRunning = false;
    }
  }

  /**
   * Get all users with their computed ratings, sorted by rating
   */
  static async getAllUsersWithRatings() {
    try {
      let users = await User.find({}).lean();

      // Map legacy field names for all users
      users = users.map(user => mapLegacyFields(user));

      const usersWithRank = users.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      // Sort by composite rating in descending order
      usersWithRank.sort((a, b) => (b.compositeRating || 0) - (a.compositeRating || 0));

      // Re-rank after sorting
      return usersWithRank.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
    } catch (error) {
      console.error('[RatingService] Error fetching users with ratings:', error.message);
      throw error;
    }
  }

  /**
   * Get a single user's rating information
   */
  static async getUserRating(opusername) {
    try {
      const normalizedUsername = String(opusername || '').trim();
      if (!normalizedUsername) {
        return null;
      }

      const query = {
        opusername: {
          $regex: new RegExp(`^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        },
      };

      let user = await User.findOne(query).lean();
      
      if (!user) {
        return null;
      }

      // Map legacy field names
      user = mapLegacyFields(user);

      return {
        ...user,
        rank: 0, // Will be calculated if needed in controller
      };
    } catch (error) {
      console.error(`[RatingService] Error fetching rating for user ${opusername}:`, error.message);
      throw error;
    }
  }
}

module.exports = RatingService;
