const mongoose = require('mongoose');

const RedditSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String },
  created_utc: { type: Date },
  score: { type: Number },
  num_comments: { type: Number },
  selftext: { type: String }
});

module.exports = mongoose.model('Reddit', RedditSchema, 'Reddit');