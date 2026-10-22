const axios = require('axios');
const cheerio = require('cheerio');

const CODEFORCES_API = 'https://codeforces.com/api/contest.list?gym=false';
const ATCODER_URL = 'https://atcoder.jp/contests/';
const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';
const HACKERRANK_URL = 'https://www.hackerrank.com/contests';

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function isMeaningfulText(value) {
  return normalizeText(value).length > 0;
}

function isHackerRankContestLink(href, text) {
  if (!href || !text) return false;

  const cleanedText = normalizeText(text);
  const lowerHref = href.toLowerCase();

  if (lowerHref.includes('/administration/') || lowerHref.includes('/jobs/') || lowerHref.includes('/signin')) {
    return false;
  }

  if (lowerHref.includes('/contests/archived') || lowerHref.includes('/contests/create') || lowerHref.includes('/contests?')) {
    return false;
  }

  if (cleanedText === 'Create a Contest' || cleanedText === 'View All' || cleanedText === 'View all') {
    return false;
  }

  return lowerHref.includes('/contests/') || lowerHref.includes('contests?');
}

function normalizeContestList(contests) {
  return contests.filter((contest) => {
    if (!contest || !contest.name || contest.name === 'Untitled contest') return false;
    if (contest.platform === 'HackerRank' && (!contest.url || !contest.url.includes('/contests/'))) return false;
    return true;
  });
}

function parseDateInput(value) {
  if (!value) return null;

  const text = normalizeText(value).replace(/\u00a0/g, ' ');
  if (!text) return null;

  const candidate = text.replace(/\s+/g, ' ');
  const isoLike = candidate.replace(' ', 'T');

  const direct = new Date(isoLike);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  const withTimezone = new Date(candidate);
  if (!Number.isNaN(withTimezone.getTime())) {
    return withTimezone.toISOString();
  }

  const numeric = Date.parse(candidate);
  if (!Number.isNaN(numeric)) {
    return new Date(numeric).toISOString();
  }

  return null;
}

function toContestEntry(platform, name, start, end, url, difficulty = 'N/A') {
  return {
    platform,
    platformLabel: platform,
    name: normalizeText(name) || 'Untitled contest',
    start: start ? parseDateInput(start) : null,
    end: end ? parseDateInput(end) : null,
    url: url || '#',
    difficulty: normalizeText(difficulty) || 'N/A',
  };
}

async function fetchCodeforcesContests() {
  try {
    const response = await axios.get(CODEFORCES_API, {
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const result = response?.data?.result || [];

    return result
      .filter((item) => item && item.phase === 'BEFORE')
      .slice(0, 40)
      .map((item) => {
        const start = new Date(Number(item.startTimeSeconds) * 1000).toISOString();
        const end = new Date((Number(item.startTimeSeconds) + Number(item.durationSeconds)) * 1000).toISOString();
        return toContestEntry('Codeforces', item.name, start, end, `https://codeforces.com/contest/${item.id}`, 'N/A');
      });
  } catch (error) {
    console.error('[ContestController] Codeforces API failed:', error.message);
    return [];
  }
}

async function fetchAtCoderContests() {
  try {
    const response = await axios.get(ATCODER_URL, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const $ = cheerio.load(response.data);
    const contests = [];

    $('tr').each((_, row) => {
      const link = $(row).find('a[href*="/contests/"]').first();
      const time = $(row).find('time.fixtime-full').first().text().trim();

      if (!link.length || !time) return;

      const href = $(link).attr('href');
      const name = $(link).text().trim();

      if (!href || !name || href.includes('/register') || href.includes('/login')) return;

      const url = href.startsWith('http') ? href : `https://atcoder.jp${href}`;
      if (!url.includes('/contests/')) return;

      contests.push(toContestEntry('AtCoder', name, time, null, url));
    });

    return normalizeContestList(contests).slice(0, 40);
  } catch (error) {
    console.error('[ContestController] AtCoder fetch failed:', error.message);
    return [];
  }
}

async function fetchLeetCodeContests() {
  try {
    const payload = {
      query: `query { allContests { title startTime duration } }`,
    };

    const response = await axios.post(LEETCODE_GRAPHQL, payload, {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://leetcode.com/',
        Accept: 'application/json',
      },
    });

    const contests = response?.data?.data?.allContests || [];

    return contests
      .filter((item) => item && item.title && Number(item.startTime) > Math.floor(Date.now() / 1000))
      .slice(0, 30)
      .map((item) => {
        const start = new Date(Number(item.startTime) * 1000).toISOString();
        const end = new Date((Number(item.startTime) + Number(item.duration)) * 1000).toISOString();
        return toContestEntry('LeetCode', item.title, start, end, 'https://leetcode.com/contest/', 'N/A');
      });
  } catch (error) {
    console.error('[ContestController] LeetCode fetch failed:', error.message);
    return [];
  }
}

async function fetchHackerRankContests() {
  try {
    const response = await axios.get(HACKERRANK_URL, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const $ = cheerio.load(response.data);
    const contests = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text();

      if (!isHackerRankContestLink(href, text)) return;

      const fullUrl = href.startsWith('http') ? href : `https://www.hackerrank.com${href}`;
      const contestText = normalizeText(text);
      if (!contestText || contestText.length < 3) return;

      contests.push(toContestEntry('HackerRank', contestText, null, null, fullUrl));
    });

    return normalizeContestList(contests).slice(0, 25);
  } catch (error) {
    console.error('[ContestController] HackerRank fetch failed:', error.message);
    return [];
  }
}

function uniqueContests(contests) {
  const seen = new Set();
  return contests.filter((contest) => {
    const key = `${contest.platform}:${contest.name}:${contest.start || contest.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

class ContestController {
  static async getContests(req, res) {
    try {
      const [codeforces, atcoder, leetcode, hackerrank] = await Promise.all([
        fetchCodeforcesContests(),
        fetchAtCoderContests(),
        fetchLeetCodeContests(),
        fetchHackerRankContests(),
      ]);

      const contests = uniqueContests([...codeforces, ...atcoder, ...leetcode, ...hackerrank])
        .filter((contest) => contest.name && contest.name !== 'Untitled contest')
        .sort((a, b) => {
          const left = a.start ? new Date(a.start).getTime() : Number.MAX_SAFE_INTEGER;
          const right = b.start ? new Date(b.start).getTime() : Number.MAX_SAFE_INTEGER;
          return left - right;
        });

      return res.status(200).json({
        success: true,
        data: contests,
        total: contests.length,
      });
    } catch (error) {
      console.error('[ContestController] Error fetching contests:', error.message);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching contests.',
        error: error.message,
      });
    }
  }
}

module.exports = ContestController;
