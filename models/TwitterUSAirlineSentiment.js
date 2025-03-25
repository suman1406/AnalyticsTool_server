const mongoose = require('mongoose');

const TwitterUSAirlineSentimentSchema = new mongoose.Schema({
  tweet_id: { type: String, required: true },
  airline_sentiment: { type: String },
  airline_sentiment_confidence: { type: Number },
  negativereason: { type: String },
  negativereason_confidence: { type: Number },
  airline: { type: String },
  airline_sentiment_gold: { type: String },
  name: { type: String },
  negativereason_gold: { type: String },
  retweet_count: { type: Number },
  text: { type: String },
  tweet_coord: { type: String },
  date: { type: Date },
  tweet_location: { type: String },
  user_timezone: { type: String }
});

module.exports = mongoose.model('TwitterUSAirlineSentiment', TwitterUSAirlineSentimentSchema, 'Twitter_US_Airline_Sentiment_processed');