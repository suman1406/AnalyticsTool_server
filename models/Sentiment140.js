const mongoose = require('mongoose');

const SentimentSchema = new mongoose.Schema({
  target: { type: Number, required: true }, // e.g., 0 = negative, 2 = neutral, 4 = positive
  ids: { type: String },
  date: { type: Date },
  flag: { type: String },
  user: { type: String },
  text: { type: String },
  cleaned_text: { type: String },
  tokenized: { type: String }
});

// Ensure the collection name matches your MongoDB collection (e.g., 'Sentiment140_processed')
module.exports = mongoose.model('Sentiment140', SentimentSchema, 'Sentiment140');