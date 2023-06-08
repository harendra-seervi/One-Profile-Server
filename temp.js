require('./db/config');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./db/user');
const Post = require('./db/posts');
const app = express();
const cheerio = require('cheerio');
const axios = require('axios');
const platformRoutes = require('./routes/platform.routes');
const cron = require('node-cron');
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
const jwtKey = process.env.JWT_PASS;

app.get('/register/:opusername', async (req, res) => {
    let result = await User.find({ "opusername": req.params.opusername });
    if (result.length > 0) {
        res.send(false);
    }
    else {
        res.send(true);
    }
})

app.post('/register', async (req, res) => {
    let user = new User(req.body);
    let result = await user.save();
    res.send({ result });
});

app.post('/', verifyToken, async(req,res) => {
    const {title,image,caption} = req.body;
    const {_id} = req._id;
    if(!title || !image){
        res.status(500).send({message: "Title and Image url is required"});
    }

    let newPost = new Post({title,image,owner: _id});
    let result = await newPost.save();
    res.status(201).send({message: "Post created successfully", newPost: result});
})

app.post('/like',verifyToken, async(req,res) => {
    const {postId} = req.body;
    const {_id} = req._id;
    if(!postId)
    res.status(500).send({message: "Post id is required"});

    const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({message: "Post not found"});
        }

        if (post.likes.includes(_id)) {
            const index = post.likes.indexOf(_id);

            post.likes.splice(index, 1);
            await post.save();
            res.status(200).send({message: "UnLiked"});
        } else {
            post.likes.push(_id);
            await post.save();
            res.status(200).send({message: "Unliked"});
        }

})

app.post('/login', async (req, res) => {
    if (req.body.email && req.body.password) {
        let user = await User.findOne(req.body).select("-password");
        console.log(user);
        if (user) {
            const accessToken = jwt.sign({ _id : user._id }, jwtKey, {expiresIn: '2h'});
            res.send({user,auth: accessToken});
        }
        else {
            res.send({ result: "No user found 1" });
        }
    }
    else {
        res.send({ result: "No user found 2" });
    }
});

app.post('/messaging', verifyToken, async (req, res) => {
    return res.json({ "val": "Here is all messages" });
});

app.use(express.urlencoded({ extended: false }));

function sortAndAddRank(users) {
    users.sort(function (a, b) {
        const ratingOne = a.rating,
            ratingTwo = b.rating;
        // Compare the 2 dates
        if (ratingOne < ratingTwo) return 1;
        if (ratingOne > ratingTwo) return -1;
        return 0;
    });
    let count = 1;
    const newUsers = users.map((data) => {
        return {
            ...data,
            rank: count++,
        }
    })
    return newUsers;
}
async function getCFRating(userHandle) {
    let result = await fetch(`https://codeforces.com/api/user.info?handles=${userHandle}`);
    result = await result.json();
    if (result.status === "OK")
        return result.result[0].rating;
    else {
        console.log(result);
        return 0;
    }
}

async function getCF(username) {
    try {
        const userHandle = username;
        if (!userHandle) {
            return 0;
        }

        const url = `https://codeforces.com/api/user.info?handles=${userHandle}`;
        let response = await axios.get(url);
        response = response.data;

        if (response.status !== "OK") {
            return 0;
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
        return data.maxRating;
        return res.send(success(200, data));

    } catch (e) {
        return 0;
    }
}

async function getCC(username) {
    try {
        const userHandle = username;
        if (!userHandle) {
            return 0;
        }
        const url = `https://www.codechef.com/users/${userHandle}`;
        const html = await axios.get(url);
        const $ = await cheerio.load(html.data);
        const rating = $('.rating-number').text().slice(0, 4);
        const stars = $('.rating-star').text();
        const globalRank = $('.rating-ranks > .inline-list > li > a').children().first().text();
        const countryRank = $('.rating-ranks > .inline-list').children().last().children().first().text();

        if (globalRank === "" || countryRank === "" || rating === "" || stars === "") {
            return 0;
        }


        const data = {
            "userHandle": userHandle,
            "rating": rating,
            "stars": stars,
            "globalRank": globalRank,
            "countryRank": countryRank,
        }

        return data.rating;
    } catch (e) {
        return 0;
    }
}
async function getLC(username) {
    try {
        const userHandle = username;
        if (!userHandle) {
            return 0;
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
            return 0;
        }

        const data = {
            "userHandle": userHandle,
            "rating": rating,
            "globalRank": globalRank,
        }

        return data.rating;
    } catch (e) {
        return 0;
    }
}
async function getAT(username) {
    try {
        const userHandle = username;
        const url = `https://atcoder.jp/users/${userHandle}`;
        const html = await axios.get(url);
        const $ = await cheerio.load(html.data);
        const rank = $('[id=user-nav-tabs]').eq(1).next().children('tbody').children('tr').eq(0).children('td').text().toString();

        const rating = $('[id=user-nav-tabs]').eq(1).next().children('tbody').children('tr').eq(1).children('td').children('span').eq(0).text().toString();
        const data = {
            "username": userHandle,
            "rank": rank,
            "rating": rating,
        }
        return data.rating;
    } catch (e) {
        return 0;
    }
}
function getHR(username) {
    //Not implement yet so we consider this to be 0
    return 0;
}

async function updateRating() {
    const currentDate = new Date();
    let formattedDate = currentDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    console.log(`Ratings last updated: ${formattedDate}`)
    let userDb = await User.find({});
    let userWithRating = await Promise.all(userDb.map(async (user) => {
        let cfRating = await getCF(user.cf);
        let ccRating = await getCC(user.cc);
        let LCRating = await getLC(user.sp);
        let atRating = await getAT(user.at);
        let hrRating = await getHR(user.hr);
        // console.log(atRating);
        let oneUser = {
            ...user._doc,
            cfrating: cfRating,
            ccrating: ccRating,
            sprating: LCRating,
            atrating: atRating,
            hrrating: hrRating,
            lastupdate: formattedDate,
        };
        await User.updateOne({ _id: user._id }, oneUser);
    }));
    userDb = userWithRating;
}

app.get('/ratings', async (req, res) => {
    try {
        let userDb = await User.find({});
        let userWithRating = await Promise.all(userDb.map(async (user) => {
            let val=Math.max(user.cfrating,Number(user.ccrating)-612,Number(user.atrating)+222,Number(user.sprating)-317);
            if(val<=300) val=0;
            return {
                ...user._doc,
                rating: val,
            };
        }));
        const rankedUsers = sortAndAddRank(userWithRating);
        res.send(rankedUsers);
    } catch (e) {
        res.send(e);
    }
});

function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ');
        token = token[1];
       const token = jwt.verify(JSON.parse(token), jwtKey);
       if(token)
       {
            req._id = token._id;
            next();
       }
       else
       {
        res.status(401).send({ result: "Please add valid token with headers" });
       }
    }
    else {
        res.status(401).send({ result: "Please add token with headers" });
    }
}

app.get('/profile/:opusername' ,async (req, res) => {
    let result = await User.find({ "opusername": req.params.opusername });
    if (result.length > 0) {
        res.send(result);
    }
    else {
        res.send(true);
    }
})
// updateRating();
cron.schedule('0 */4 * * *', updateRating);
app.listen(5000, () => {
    console.log("Server up and running on port: 5000");
})
