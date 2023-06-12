const mongoose = require('mongoose');

const blog = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    title: String,
    description: String,
    imagelink: {
        public_id: String,
        url: String
    },
    like:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"users"
    }],
    dislike:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"users"
    }]
},{
    timestamps: true
})

module.exports=mongoose.model("blog",blog);