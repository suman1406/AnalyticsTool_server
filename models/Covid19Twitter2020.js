const mongoose = require('mongoose');

const Covid19Twitter2020Schema = new mongoose.Schema({
  id: { type: String, required: true },
  created_at: { type: Date },
  source: { type: String },
  original_text: { type: String },
  lang: { type: String },
  favorite_count: { type: Number },
  retweet_count: { type: Number },
  original_author: { type: String },
  hashtags: { type: [String] },
  user_mentions: { type: [String] },
  place: { type: String },
  clean_tweet: { type: String },
  compound: { type: Number },
  neg: { type: Number },
  neu: { type: Number },
  pos: { type: Number },
  sentiment: { type: String }
});

module.exports = mongoose.model('Covid19Twitter2020', Covid19Twitter2020Schema, 'Covid19Twitter2020');