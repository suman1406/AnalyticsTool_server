const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const webTokenValidator = require('../middleware/webTokenValidator');

// Word Frequency: /api/word_frequency?dataset=<dataset>
router.get('/word_frequency', webTokenValidator, analysisController.wordFrequency);

// N-gram Frequency: /api/ngram_frequency?dataset=<dataset>
router.get('/ngram_frequency', webTokenValidator, analysisController.ngramFrequency);

// TF-IDF Keywords: /api/tfidf_keywords?dataset=<dataset>
router.get('/tfidf_keywords', webTokenValidator, analysisController.tfidfKeywords);

// Keyword Cloud: /api/keyword_cloud?dataset=<dataset>
router.get('/keyword_cloud', webTokenValidator, analysisController.keywordCloud);

// Text Similarity: /api/text_similarity?dataset=<dataset>
// Returns cosine similarity matrix for first 10 documents.
router.get('/text_similarity', webTokenValidator, analysisController.textSimilarity);

// Most Similar Posts: /api/most_similar_posts?dataset=<dataset>&post_id=<id>
// Returns 5 most similar posts based on cosine similarity.
router.get('/most_similar_posts', webTokenValidator, analysisController.mostSimilarPosts);

//getPostIdentifiers
router.get('/post_identifiers', webTokenValidator, analysisController.getPostIdentifiers);

module.exports = router;