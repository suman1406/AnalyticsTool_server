const express = require('express');
const router = express.Router();
const topicClusteringController = require('../controllers/topicClusteringController');
const webTokenValidator = require('../middleware/webTokenValidator');

// Topic Modeling: Extract topics from tokenized posts.
router.get('/topic_modeling', webTokenValidator, topicClusteringController.topicModeling);

// Topic Coherence: Return a (dummy) coherence score.
router.get('/topic_coherence', webTokenValidator, topicClusteringController.topicCoherence);

// KMeans Clustering: Cluster posts using TF-IDF features.
router.get('/kmeans_clustering', webTokenValidator, topicClusteringController.kmeansClustering);

// Duplicate Detection: Identify near-duplicate posts.
router.get('/duplicate_detection', webTokenValidator, topicClusteringController.duplicateDetection);

module.exports = router;