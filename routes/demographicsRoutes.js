const express = require('express');
const demographicsController = require('../controllers/demographicsController');
const router = express();
const webTokenValidator = require('../middleware/webTokenValidator');

router.get('/demographics_summary', webTokenValidator, demographicsController.demographicsSummary);
router.get('/platform_comparison', webTokenValidator, demographicsController.platformComparison);
router.get('/time_period_comparison', webTokenValidator, demographicsController.timePeriodComparison);
router.get('/author_comparison', webTokenValidator, demographicsController.authorComparison);

module.exports = router;