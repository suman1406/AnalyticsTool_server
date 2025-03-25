const express = require('express');
const router = express.Router();
const aggregationController = require('../controllers/aggregationController');
const webTokenValidator = require('../middleware/webTokenValidator');

// Sentiment140 dataset endpoints
router.get('/sentiment140/summary', webTokenValidator, aggregationController.getSentimentSummary);
router.get('/reddit/summary', webTokenValidator, aggregationController.getRedditSummary);
router.get('/geotag-nintendo/summary', webTokenValidator, aggregationController.getGeoNintendoSummary);
router.get('/covid19-twitter-2020/summary', webTokenValidator, aggregationController.getCovid19Twitter2020Summary);
router.get('/covid19-twitter-2021/summary', webTokenValidator, aggregationController.getCovid19Twitter2021Summary);
router.get('/covid19twitteraugsep2020/summary', webTokenValidator, aggregationController.getCovid19TwitterAugSep2020Summary);
router.get('/twitter-airline/summary', webTokenValidator, aggregationController.getTwitterAirlineSentimentSummary);
router.get('/combined_hour/summary', webTokenValidator, aggregationController.getCombinedHourlySummary);

module.exports = router;