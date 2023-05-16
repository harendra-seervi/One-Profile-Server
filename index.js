require('./db/config');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./db/user');
const app = express();
const cheerio = require('cheerio');
const axios = require('axios');
const platformRoutes = require('./routes/platform.routes');
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
const jwtKey = 'e-com';


// leetcode API  ->  https://leetcode-public-api.cyclic.app/user/harendra_seervi/contests
// https://leetcode-public-api.cyclic.app/

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

app.post('/login', async (req, res) => {
    if (req.body.email && req.body.password) {
        let user = await User.find(req.body).select("-password");
        if (user.length) {
            jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    res.send("something went wrong");
                }
                res.send({ user, auth: token });
            })
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

async function getCFRating(userHandle){
    let result=await fetch(`https://codeforces.com/api/user.info?handles=${userHandle}`);
    result=await result.json();
    if(result.status==="OK")
    return result.result[0].rating;
    else{
        console.log(result);
        return 0;
    }
}

app.use(express.urlencoded({ extended: false }));

app.use('/api', platformRoutes);


function sortAndAddRank(users){
    
users.sort(function(a, b) {
    const ratingOne = a.rating,
      ratingTwo = b.rating;
    // Compare the 2 dates
    if (ratingOne < ratingTwo) return 1;
    if (ratingOne > ratingTwo) return -1;
    return 0;
  });
  let count=1;
  const newUsers=users.map((data)=>{
    return{
        ...data,
        rank: count++,
    }
  })
  return newUsers;
}

app.get('/ratings', async (req, res) => {
    try {
      let usersDb = await User.find({});
      let userWithRating = await Promise.all(usersDb.map(async (user) => {
        let cfRating = await getCFRating(user.cf);
        return {
          ...user._doc,
          rating: cfRating,
        };
      }));
      const rankedUsers = sortAndAddRank(userWithRating);
      res.send(rankedUsers);
    } catch (e) {
      res.send(e.message);
    }
  });
  

function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    // console.log(token);
    if (token) {
        token = token.split(' ');
        token = token[1];
        jwt.verify(JSON.parse(token), jwtKey, (err, valid) => {
            if (err){
                res.status(406).send({ result: "Please add valid token with headers" });
            }
            else {
                next();
            }
        });
    }
    else {
        res.status(406).send({ result: "Please add token with headers" });
    }
}

app.get('/profile/:opusername', async (req, res) => {
    let result = await User.find({ "opusername": req.params.opusername });
    // result=await result.json();
    if (result.length > 0) {
        // console.log(result);
        res.send(result);
    }
    else {
        res.send(true);
    }
})

app.listen(5000, () => {
    console.log("Server up and running on port: 5000");
})
