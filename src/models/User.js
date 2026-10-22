const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    trim: true,
  },
  opusername: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    trim: true,
  },

  // Coding Platform Usernames
  codeforces: {
    type: String,
    trim: true,
    default: '',
  },
  codechef: {
    type: String,
    trim: true,
    default: '',
  },
  leetcode: {
    type: String,
    trim: true,
    default: '',
  },
  atcoder: {
    type: String,
    trim: true,
    default: '',
  },

  // Platform Ratings
  codeforcesRating: {
    type: Number,
    default: 0,
  },
  codechefRating: {
    type: Number,
    default: 0,
  },
  leetcodeRating: {
    type: Number,
    default: 0,
  },
  atcoderRating: {
    type: Number,
    default: 0,
  },

  // OneProfile Composite Rating
  compositeRating: {
    type: Number,
    default: 0,
  },

  // Metadata
  lastRatingUpdate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

userSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('User', userSchema);
