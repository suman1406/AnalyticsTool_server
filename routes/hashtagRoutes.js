const express = require('express');
const router = express.Router();
const trendController = require('../controllers/hashtagController');
const webTokenValidator = require('../middleware/webTokenValidator');

router.get('/trending_hashtags', webTokenValidator, trendController.trendingHashtags);
router.get('/engagement_distribution', webTokenValidator, trendController.engagementDistribution);
router.get('/user_activity', webTokenValidator, trendController.userActivity);
router.get('/engagement_by_time_of_day', webTokenValidator, trendController.engagementByTimeOfDay);
router.get('/trend_analysis', webTokenValidator, trendController.trendAnalysis);

module.exports = router;