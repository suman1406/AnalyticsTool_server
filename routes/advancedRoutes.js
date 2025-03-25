const express = require('express');
const router = express.Router();
const advancedController = require('../controllers/advancedController');
const webTokenValidator = require('../middleware/webTokenValidator');

router.get('/outlierDetection', webTokenValidator, advancedController.outlierDetection);
router.get('/contentSimilarityMatrix', webTokenValidator, advancedController.contentSimilarityMatrix);
router.get('/predictEngagement', webTokenValidator, advancedController.predictEngagement);
router.get('/featureImportance', webTokenValidator, advancedController.featureImportance);
router.get('/trendForecasting', webTokenValidator, advancedController.trendForecasting);

module.exports = router;