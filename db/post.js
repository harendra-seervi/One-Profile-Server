const mongoose = require('mongoose');

const postSchema=new mongoose.Schema({
    caption: String,
    title: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    }],
    image: String
});

module.exports = mongoose.model("posts",postSchema);