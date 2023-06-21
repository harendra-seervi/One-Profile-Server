require('./db/config');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./db/user');
const problemset = require('./db/problemset');
const app = express();
const cheerio = require('cheerio');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const platformRoutes = require('./routes/platform.routes');
const multer = require('multer');
const cron = require('node-cron');
const morgan = require('morgan');
const jwtKey = process.env.JWT_PASS;
const blogModel = require('./db/blog');

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("common"));
//cloudinary configuration: -
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//Login Page backend
app.post('/login', async (req, res) => {
    if (req.body.email && req.body.password) {
        let user = await User.find(req.body).select("-password");
        if (user.length) {
            const token = jwt.sign({ username: user[0]._id }, jwtKey, { expiresIn: "8h" })
            res.send({ username: user[0].opusername, auth: token });
        }
        else {
            res.send({ result: "No user found 1" });
        }
    }
    else {
        res.send({ result: "No user found 2" });
    }
});

//Register Page backend
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

//Profile Page backend
app.get('/profile/:opusername', async (req, res) => {
    let result = await User.find({ "opusername": req.params.opusername });
    if (result.length > 0) {
        res.send(result);
    }
    else {
        res.send(true);
    }
})

//messaging Page backend
app.post('/messaging', verifyToken, async (req, res) => {
    return res.send({ "val": "Here is all messages" });
});


//Rating Page backend
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
    //hello
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
            let val = Math.max(user.cfrating, Number(user.ccrating) - 612, Number(user.atrating) + 222, Number(user.sprating) - 317);
            if (val <= 300) val = 0;
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

//verify token function in JWT
function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ');
        token = token[1];
        token = jwt.verify(token, jwtKey);
        if (token) {
            req._id = token.username;
            next();
        }
        else {
            res.status(401).send({ result: "Please add valid token with headers" });
        }
    }
    else {
        res.status(406).send({ result: "Please add token with headers" });
    }
}

//Implemented cron-jobs for updating rating in database
cron.schedule('0 */4 * * *', updateRating);


//problemset 
app.post('/problemset/postproblem', async (req, res) => {
    let ps = new problemset(req.body);
    ps = await ps.save();
    console.log("Ps", ps);
    res.send(ps);
})
app.get('/problemset', async (req, res) => {
    let ps = await problemset.find({});
    // console.log("Ps", ps);
    res.send(ps);
})

const upload = multer({ storage: multer.memoryStorage() });


app.get('/blog', async (req, res) => {
    try {
        const blogList = await blogModel.find({});
        const newList = [];

        for (const blog of blogList) {
            const user = await User.findById(blog.userid);
            newList.push({ ...blog._doc, name: user.name });
        }

        // Sort the newList based on createdDate in descending order
        newList.sort((a, b) => b.createdAt - a.createdAt);

        console.log(newList);
        res.send(newList);
    }
    catch (e) {
        console.log(e);
        res.send("Not able to fetch blogs");
    }
});
app.post('/blog', verifyToken, async (req, res) => {
    try {
        const { title, description, files } = req.body;
        const userid = req._id;
        console.log(userid);
        let image = await cloudinary.uploader.upload(files, {
            folder: "posts"
        });

        image = {
            url: image.url,
            public_id: image.public_id
        }

        //add to DB
        const newBlog = new blogModel({
            userid,
            title,
            description,
            imagelink: image,
        })

        await newBlog.save();

        res.status(201).send(newBlog);
    }
    catch (e) {
        console.log(e);
        res.status(500).send("Could not create post");
    }
})

app.post('/blog/like', verifyToken, async (req, res) => {
    const { _id } = req.body;
    let userid = req._id;
    // console.log(" dfsdf", _id, userid);
    let givenPost = await blogModel.findOne({ _id });

    if (givenPost.like.includes(userid)) {
        //unlike karo
        // console.log(givenPost.like);
        const index = givenPost.like.indexOf(userid);
        givenPost.like.splice(index,1);
    } else {
        givenPost.like.push(userid);
    }

    await givenPost.save();
    // let leng = newLikeArray.length;
    // console.log(givenPost.like.length);
    
    res.send({likeCount: givenPost.like.length}); // Send status code 201 (Created)
});

app.get('/', (req,res)=> {
    res.send("Server is up and running");
})



app.post('/problemset/changestatus', async (req, res) => {
    let userName = req.body.user;
    let problemLink = req.body.link;
    let dataContainLink = await problemset.findOne({ "link": problemLink });
    let newStatus = [];
    let x = false;
    dataContainLink.status.map((obj) => {
        if (obj === userName) {
            newStatus = dataContainLink.status.filter((secObj) => {
                return secObj !== userName;
            })
            x = true;
        }
    })
    if (x === false) {
        dataContainLink.status.push(userName);
        await dataContainLink.save();
        res.send(true);
    }
    else {
        dataContainLink.status = newStatus;
        await dataContainLink.save();
        res.send(false);
    }

})
app.listen(5000, () => {
    console.log("Server up and running on port: 5000");
})