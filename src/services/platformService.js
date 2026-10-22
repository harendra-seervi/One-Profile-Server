const axios = require('axios');

class PlatformService {
  /**
   * Fetch Codeforces rating for a user
   * @param {string} userHandle - Codeforces username
   * @returns {number} User's maximum rating or 0 if not found
   */
  static async fetchCodeforcesRating(userHandle) {
    try {
      if (!userHandle || userHandle.trim() === '') {
        return 0;
      }

      const url = `https://codeforces.com/api/user.info?handles=${userHandle}`;
      const response = await axios.get(url);
      
      if (response.data.status !== 'OK') {
        return 0;
      }

      const user = response.data.result[0];
      return Number(user?.rating ?? user?.maxRating ?? 0);
    } catch (error) {
      console.error(`Codeforces fetch error for user ${userHandle}:`, error.message);
      return 0;
    }
  }

  /**
   * Fetch CodeChef rating for a user
   * @param {string} userHandle - CodeChef username
   * @returns {number} User's rating or 0 if not found
   */
  static async fetchCodeChefRating(userHandle) {
    try {
      if (!userHandle || userHandle.trim() === '') {
        return 0;
      }

      const url = `https://www.codechef.com/users/${userHandle}`;
      const response = await axios.get(url);
      const cheerio = require('cheerio');
      const $ = cheerio.load(response.data);

      const rating = $('.rating-number').text().match(/\d+(\.\d+)?/)?.[0];

      if (!rating) {
        return 0;
      }

      return Number(rating);
    } catch (error) {
      console.error(`CodeChef fetch error for user ${userHandle}:`, error.message);
      return 0;
    }
  }

  /**
   * Fetch LeetCode rating for a user
   * @param {string} username - LeetCode username
   * @returns {number} User's contest rating or 0 if not found
   */
  static async fetchLeetCodeRating(username) {
    try {
      if (!username || username.trim() === '') {
        return 0;
      }

      const query = `
        query userContestRankingInfo($username: String!) {
          userContestRanking(username: $username) {
            rating
            globalRanking
          }
        }
      `;

      const response = await axios.post(
        'https://leetcode.com/graphql',
        {
          query,
          variables: { username },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Referer': `https://leetcode.com/u/${username}/`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
          },
        }
      );

      const rating = response?.data?.data?.userContestRanking?.rating;

      if (!rating) {
        return 0;
      }

      return Math.round(rating);
    } catch (error) {
      console.error(`LeetCode fetch error for user ${username}:`, error.message);
      return 0;
    }
  }

  /**
   * Fetch AtCoder rating for a user
   * @param {string} userHandle - AtCoder username
   * @returns {number} User's rating or 0 if not found
   */
  static async fetchAtCoderRating(userHandle) {
    try {
      if (!userHandle || userHandle.trim() === '') {
        return 0;
      }

      const url = `https://atcoder.jp/users/${userHandle}`;
      const response = await axios.get(url);
      const cheerio = require('cheerio');
      const $ = cheerio.load(response.data);

      const rating = $('[id=user-nav-tabs]')
        .eq(1)
        .next()
        .children('tbody')
        .children('tr')
        .eq(1)
        .children('td')
        .children('span')
        .eq(0)
        .text()
        .trim();

      if (!rating) {
        return 0;
      }

      return Number(rating);
    } catch (error) {
      console.error(`AtCoder fetch error for user ${userHandle}:`, error.message);
      return 0;
    }
  }

  /**
   * Calculate composite rating from all platforms
   * @param {number} codeforcesRating - Codeforces rating
   * @param {number} codechefRating - CodeChef rating
   * @param {number} leetcodeRating - LeetCode rating
   * @param {number} atcoderRating - AtCoder rating
   * @returns {number} Composite OneProfile rating
   */
  static calculateCompositeRating(codeforcesRating, codechefRating, leetcodeRating, atcoderRating) {
    const ratings = [
      codeforcesRating,
      codechefRating - 612,
      atcoderRating + 222,
      leetcodeRating - 317,
    ];

    let maxRating = Math.max(...ratings);

    // If max rating is too low, return 0
    if (maxRating <= 300) {
      maxRating = 0;
    }

    return maxRating;
  }
}

module.exports = PlatformService;
