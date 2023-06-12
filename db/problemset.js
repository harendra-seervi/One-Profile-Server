const mongoose = require('mongoose');

const problemsetSchema=new mongoose.Schema({
    id: String,
    title: String,
    topictag: String,
    difficulty:String,
    platform:String,
    companytag:String,
    link:{type:String,index:true},
    status:[{}],
});

module.exports = mongoose.model("problemset",problemsetSchema);