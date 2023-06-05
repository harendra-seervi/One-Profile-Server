const mongoose = require('mongoose');

const userSchema=new mongoose.Schema({
    name: String,
    opusername: String,
    email: String,
    password: String,
    country:String,
    cf: String,   
    cc: String,
    sp: String,
    at: String,
    hr: String,
    cfrating: String,
    ccrating: String,
    sprating: String,
    atrating: String,
    hrrating: String,    
    lastupdate: String,
});

module.exports = mongoose.model("users",userSchema);