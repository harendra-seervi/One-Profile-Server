const cron = require('node-cron');
const RatingService = require('../services/ratingService');

/**
 * Initialize scheduled rating update job
 * Runs every 3 minutes, with a guard to prevent overlapping updates
 */
function initializeRatingJob() {
  try {
    console.log('[CronJob] Initializing rating update job...');

    let isJobRunning = false;

    cron.schedule('*/3 * * * *', async () => {
      if (isJobRunning) {
        console.log('[CronJob] Previous job still running, skipping this cycle');
        return;
      }

      isJobRunning = true;

      try {
        await RatingService.updateAllRatings();
      } catch (error) {
        console.error('[CronJob] Error in scheduled rating update:', error.message);
      } finally {
        isJobRunning = false;
      }
    });

    console.log('[CronJob] Rating update job initialized - will run every 3 minutes');
  } catch (error) {
    console.error('[CronJob] Failed to initialize rating job:', error.message);
  }
}

module.exports = {
  initializeRatingJob,
};
