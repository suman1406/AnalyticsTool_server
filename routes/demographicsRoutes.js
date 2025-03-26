const express = require('express');
const demographicsController = require('../controllers/demographicsController');
const router = express();
const webTokenValidator = require('../middleware/webTokenValidator');

router.get('/demographics_summary', demographicsController.demographicsSummary);
router.get('/platform_comparison', demographicsController.platformComparison);
router.get('/time_period_comparison', demographicsController.timePeriodComparison);
router.get('/author_comparison', demographicsController.authorComparison);

module.exports = router;