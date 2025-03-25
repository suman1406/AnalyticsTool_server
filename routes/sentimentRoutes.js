const express = require('express');
const router = express.Router();
const sentimentController = require('../controllers/sentimentController');
const webTokenValidator = require('../middleware/webTokenValidator');

// Sentiment Analysis Routes
router.get('/sentiment_vader', webTokenValidator, sentimentController.sentimentVader);
router.get('/sentiment_time_series', webTokenValidator, sentimentController.sentimentTimeSeries);
router.get('/rolling_sentiment', webTokenValidator, sentimentController.rollingSentiment);
router.get('/author_sentiment', webTokenValidator, sentimentController.authorSentiment);

module.exports = router;