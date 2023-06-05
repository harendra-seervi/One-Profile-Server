const cheerio = require('cheerio');
const axios = require('axios');
const { success, error } = require('../utils/responseWrapper');

exports.hackerrankController = async (req, res) => {
    res.send(0);
}
exports.atCoderController = async (req, res) => {
    try {
        const userHandle = req.params.userHandle;
        const url = `https://atcoder.jp/users/${req.params.userHandle}`;
        const html = await axios.get(url);
        const $ = await cheerio.load(html.data);
        const rank = $('[id=user-nav-tabs]').eq(1).next().children('tbody').children('tr').eq(0).children('td').text().toString();

        const rating = $('[id=user-nav-tabs]').eq(1).next().children('tbody').children('tr').eq(1).children('td').children('span').eq(0).text().toString();
        console.log("rank: ", rank);
        console.log("rating: ", rating);
        const data = {
            "username": userHandle,
            "rank": rank,
            "rating": rating,
        }
        return res.send(success(200, data));
    } catch (e) {
        return res.send(error(500, e.message));
    }
}
exports.codeChefController = async (req, res) => {
    try {
        const userHandle = req.params.userHandle;
        if (!userHandle) {
            return res.send(error(400, "User Handle is required"));
        }
        const url = `https://www.codechef.com/users/${userHandle}`;
        const html = await axios.get(url);
        const $ = await cheerio.load(html.data);
        const rating = $('.rating-number').text().slice(0, 4);
        const stars = $('.rating-star').text();
        const globalRank = $('.rating-ranks > .inline-list > li > a').children().first().text();
        const countryRank = $('.rating-ranks > .inline-list').children().last().children().first().text();

        if (globalRank === "" || countryRank === "" || rating === "" || stars === "") {
            return res.send(error(404, "User not found"));
        }


        const data = {
            "userHandle": userHandle,
            "rating": rating,
            "stars": stars,
            "globalRank": globalRank,
            "countryRank": countryRank,
        }

        return res.send(success(200, data));
    } catch (e) {
        return res.send(error(500, e.message));
    }
}

exports.codeForcesController = async (req, res) => {
    try {
        const userHandle = req.params.userHandle;
        if (!userHandle) {
            return res.send(error(400, "User Handle is required"));
        }

        const url = `https://codeforces.com/api/user.info?handles=${userHandle}`;
        let response = await axios.get(url);
        response = response.data;

        if (response.status !== "OK") {
            return res.send(error(404, "User not found or Unknown Error Occured"));
        }
        const result = response.result[0];
        const rating = result.rating;
        const maxRating = result.maxRating;
        const rank = result.rank;
        const maxRank = result.maxRank;

        const data = {
            "userHandle": userHandle,
            "rating": rating,
            "maxRating": maxRating,
            "rank": rank,
            "maxRank": maxRank,
        }

        return res.send(success(200, data));

    } catch (e) {

        return res.send(error(500, e.message));
    }
}

exports.leetCodeController = async (req, res) => {
    try {
        const userHandle = req.params.userHandle;
        if (!userHandle) {
            return res.send(error(400, "User Handle is required"));
        }

        const url = `https://leetcode.com/${userHandle}`;
        const html = await axios.get(url);
        const $ = await cheerio.load(html.data);
        const details = $('.rating-contest-graph').prev().first().first().text().toString();
        let rating = details.slice(14, 19);
        rating = rating.replace(",", "");

        let globalRank = details.slice(33, 40);
        globalRank = globalRank.replace(",", "");

        if (globalRank === "" || rating === "") {
            return res.send(error(404, "User not found"));
        }

        const data = {
            "userHandle": userHandle,
            "rating": rating,
            "globalRank": globalRank,
        }

        return res.send(success(200, data));
    } catch (e) {
        return res.send(error(500, e.message));
    }
}

exports.opController = async (req, res) => {
    try {
        console.log("fasdfas");
        res.send(success(200, "hello op"));
    }
    catch (e) {
        return res.send(error(500, e.message));
    }
}