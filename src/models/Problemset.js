const mongoose = require('mongoose');

const problemsetSchema = new mongoose.Schema({
  // Problem Information
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  topicTag: {
    type: String,
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  platform: {
    type: String,
    trim: true,
  },
  companyTag: {
    type: String,
    trim: true,
  },
  link: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },

  // Problem Status
  status: {
    type: [String], // Array of usernames who have solved this problem
    default: [],
  },

  // Metadata
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
problemsetSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

problemsetSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Problemset', problemsetSchema);
