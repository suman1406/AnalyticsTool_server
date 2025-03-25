require('dotenv').config();
const lda = require('lda'); // npm install lda
const natural = require('natural');
const TfIdf = natural.TfIdf;
const KMeans = require('ml-kmeans');
const stopword = require('stopword');
const { Worker } = require('worker_threads');

// Utility: Clean text (simple lowercase and punctuation removal)
function cleanText(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// Utility: Fetch documents (returns an array of objects { id, text })
async function fetchDocuments(dataset) {
    let docs = [];
    dataset = dataset.toLowerCase();

    if (dataset === 'reddit') {
        const Reddit = require('../models/Reddit');
        const records = await Reddit.find({}, { selftext: 1, id: 1 }).exec();
        records.forEach(record => {
            docs.push({ id: record.id, text: cleanText(record.selftext) });
        });
    } else if (dataset === 'sentiment140') {
        const Sentiment140 = require('../models/Sentiment140');
        const records = await Sentiment140.find({}, { text: 1, ids: 1 }).exec();
        records.forEach(record => {
            docs.push({ id: record.ids, text: cleanText(record.text) });
        });
    } else if (dataset === 'covid2020') {
        const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
        // Use "original_text" field for Covid datasets
        const records = await Covid19Twitter2020.find({}, { original_text: 1, id: 1 }).exec();
        records.forEach(record => {
            docs.push({ id: record.id, text: cleanText(record.original_text) });
        });
    } else if (dataset === 'covid2021') {
        const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
        // Use "original_text" field for Covid datasets
        const records = await Covid19Twitter2021.find({}, { original_text: 1, id: 1 }).exec();
        records.forEach(record => {
            docs.push({ id: record.id, text: cleanText(record.original_text) });
        });
    } else if (dataset === 'airline') {
        const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
        const records = await TwitterUSAirlineSentiment.find({}, { text: 1, tweet_id: 1 }).exec();
        records.forEach(record => {
            docs.push({ id: record.tweet_id, text: cleanText(record.text) });
        });
    } else if (dataset === 'geonintendo') {
        const GeoNintendo = require('../models/GeotagNintendo');
        const records = await GeoNintendo.find({}, { text: 1, id: 1 }).exec();
        records.forEach(record => {
            docs.push({ id: record.id, text: cleanText(record.text) });
        });
    } else if (dataset === 'combined') {
        // Merge documents from all datasets
        const Reddit = require('../models/Reddit');
        const Sentiment140 = require('../models/Sentiment140');
        const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
        const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
        const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
        const GeoNintendo = require('../models/GeotagNintendo');

        // Reddit
        const redditRecords = await Reddit.find({}, { selftext: 1, id: 1 }).exec();
        redditRecords.forEach(record => {
            docs.push({ id: record.id, text: cleanText(record.selftext) });
        });
        // Sentiment140
        const sentimentRecords = await Sentiment140.find({}, { text: 1, ids: 1 }).exec();
        sentimentRecords.forEach(record => {
            docs.push({ id: record.ids, text: cleanText(record.text) });
        });
        // Covid19Twitter2020
        const covid2020Records = await Covid19Twitter2020.find({}, { text: 1, id: 1 }).exec();
        covid2020Records.forEach(record => {
            docs.push({ id: record.id, text: cleanText(record.text) });
        });
        // Covid19Twitter2021
        const covid2021Records = await Covid19Twitter2021.find({}, { text: 1, id: 1 }).exec();
        covid2021Records.forEach(record => {
            docs.push({ id: record.id, text: cleanText(record.text) });
        });
        // Airline
        const airlineRecords = await TwitterUSAirlineSentiment.find({}, { text: 1, tweet_id: 1 }).exec();
        airlineRecords.forEach(record => {
            docs.push({ id: record.tweet_id, text: cleanText(record.text) });
        });
        // GeoNintendo
        const geonintendoRecords = await GeoNintendo.find({}, { text: 1, id: 1 }).exec();
        geonintendoRecords.forEach(record => {
            docs.push({ id: record.id, text: cleanText(record.text) });
        });
    }
    return docs;
}

/**
 * GET /topic_modeling
 * Perform LDA topic modeling on tokenized text.
 * Returns the top 5 topics (each with top 5 words).
 */
exports.topicModeling = async (req, res) => {
    try {
        const dataset = (req.query.dataset || 'combined').toLowerCase();
        console.log(`Topic Modeling: Dataset: ${dataset}`);

        // Fetch documents and log their count and a sample
        const docs = await fetchDocuments(dataset);
        console.log(`Number of documents fetched: ${docs.length}`);
        console.log(`Sample document (first): ${JSON.stringify(docs[0] || 'No documents')}`);
        console.log(`Sample document (last): ${JSON.stringify(docs[docs.length - 1] || 'No documents')}`);

        // Define stopwords; if stopword.en is empty, use a default list.
        let stopWords = Array.isArray(stopword.en) ? stopword.en : [];
        if (stopWords.length === 0) {
            stopWords = ["and", "or", "but", "the", "a", "an", "in", "on", "for", "is", "are"];
        }
        console.log(`Stopwords length: ${stopWords.length}`);
        console.log(`Stopwords sample: ${stopWords.slice(0, 5).join(', ')}`);

        // Tokenize each document: split text into words, remove stopwords, then join tokens.
        const documents = docs.map((doc, index) => {
            if (!doc.text) {
                console.log(`Document ${index} (ID: ${doc.id}) has no text`);
                return '';
            }
            const tokens = doc.text.split(/\s+/).filter(word => !stopWords.includes(word));
            console.log(`Document ${index} (ID: ${doc.id}) token count: ${tokens.length}`);
            if (index < 2) { // Log tokens for first two documents as a sample
                console.log(`Document ${index} tokens sample: ${tokens.slice(0, 5).join(', ')}`);
            }
            return tokens.join(' ');
        }).filter(text => {
            const isValid = text.length > 0;
            if (!isValid) console.log(`Filtered out empty document: "${text}"`);
            return isValid;
        });

        console.log(`Number of processed documents: ${documents.length}`);
        console.log(`Sample processed document (first): "${documents[0] || 'None'}"`);
        console.log(`Sample processed document (last): "${documents[documents.length - 1] || 'None'}"`);

        if (documents.length < 5) {
            console.log(`Insufficient documents for LDA: ${documents.length} < 5`);
            return res.status(404).json({ error: "Not enough data for topic modeling" });
        }

        // Run LDA with 5 topics and 5 terms per topic
        console.log(`Running LDA with ${documents.length} documents, 5 topics, 5 terms`);
        const topics = lda(documents, 5, 5);
        console.log(`LDA completed. Number of topics returned: ${topics.length}`);
        console.log(`Sample topic (first): ${JSON.stringify(topics[0])}`);
        console.log(`Sample topic (last): ${JSON.stringify(topics[topics.length - 1])}`);

        const formattedTopics = {};
        topics.forEach((topic, i) => {
            formattedTopics[`Topic ${i + 1}`] = topic;
        });
        console.log(`Formatted topics: ${JSON.stringify(formattedTopics, null, 2)}`);

        res.json(formattedTopics);
    } catch (error) {
        console.error("Error in topicModeling:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

/**
 * GET /topic_coherence
 * Compute a placeholder coherence score for the LDA topics.
 * (A proper coherence measure would require additional implementation.)
 */
exports.topicCoherence = async (req, res) => {
    try {
      const dataset = (req.query.dataset || 'combined').toLowerCase();
      console.log(`[DEBUG] Topic Coherence: Dataset: ${dataset}`);
  
      // Fetch documents and tokenize
      const docs = await fetchDocuments(dataset);
      console.log(`[DEBUG] Fetched ${docs.length} raw documents`);
  
      const tokenizedDocs = docs.map(doc => {
        if (!doc.text) return [];
        return doc.text.split(/\s+/).filter(word => word.length > 0);
      }).filter(tokens => tokens.length > 0);
      console.log(`[DEBUG] Tokenized documents: ${tokenizedDocs.length} (non-empty)`);
  
      if (tokenizedDocs.length < 5) {
        console.warn(`[WARN] Insufficient documents: ${tokenizedDocs.length}`);
        return res.status(404).json({ error: "Not enough data for analysis" });
      }
  
      // Prepare for LDA: join tokens back to strings.
      const documentsStr = tokenizedDocs.map(tokens => tokens.join(' '));
      if (typeof documentsStr[0] !== 'string') {
        throw new Error('Documents must be strings');
      }
  
      // Log LDA configuration.
      console.log(`[DEBUG] LDA Config:
  - Topics: 5
  - Terms per topic: 5
  - Iterations: 10
  - Languages: ['en']
  - Random Seed: 123`);
  
      // Run LDA.
      // According to documentation, the fifth parameter should be an array of language codes.
      const topics = lda(documentsStr, 5, 5);
      console.log(`[DEBUG] LDA returned ${topics.length} topics`);
  
      if (!Array.isArray(topics)) {
        throw new Error(`Invalid LDA output format: ${typeof topics}`);
      }
  
      // Improved word extraction with validation.
      function extractTopWords(topicStr) {
        if (typeof topicStr !== 'string') {
          console.warn(`[WARN] Unexpected topic format:`, topicStr);
          return [];
        }
        const words = [];
        const regex = /(\d+\.\d+)\*"?([^"\s]+)"?/g;
        let match;
        while ((match = regex.exec(topicStr)) !== null) {
          words.push(match[2]);
        }
        return words.slice(0, 5); // Return top 5 words
      }
  
      const topicWords = topics.map(topic => {
        const words = extractTopWords(topic);
        console.log(`[DEBUG] Topic ${topics.indexOf(topic)}:`, words);
        return words;
      });
  
      // Enhanced coherence calculation using a simple UMass metric.
      function computeUMassCoherence(topWords, tokenizedDocs) {
        let sum = 0;
        let count = 0;
        for (let i = 1; i < topWords.length; i++) {
          for (let j = 0; j < i; j++) {
            const wi = topWords[i];
            const wj = topWords[j];
            let docCountWi = 0;
            let docCountBoth = 0;
            tokenizedDocs.forEach(tokens => {
              const hasWi = tokens.includes(wi);
              const hasWj = tokens.includes(wj);
              if (hasWi) {
                docCountWi++;
                if (hasWj) docCountBoth++;
              }
            });
            if (docCountWi === 0) {
              console.warn(`[WARN] Zero documents contain word ${wi}`);
              continue;
            }
            sum += Math.log((docCountBoth + 1) / docCountWi);
            count++;
          }
        }
        return count > 0 ? sum / count : 0;
      }
  
      const coherenceScores = topicWords.map((words, index) => {
        if (words.length < 2) {
          console.warn(`[WARN] Topic ${index} has insufficient words for coherence`);
          return 0;
        }
        return computeUMassCoherence(words, tokenizedDocs);
      });
  
      const avgCoherence = coherenceScores.length > 0
        ? coherenceScores.reduce((a, b) => a + b, 0) / coherenceScores.length
        : 0;
  
      console.log(`[RESULTS] Coherence Scores:`, coherenceScores);
      console.log(`[RESULTS] Average Coherence: ${avgCoherence.toFixed(4)}`);
  
      res.json({
        coherence_scores: coherenceScores,
        avg_coherence: parseFloat(avgCoherence.toFixed(4)),
        topics: topicWords
      });
    } catch (error) {
      console.error(`[ERROR] in topicCoherence: ${error.message}`);
      console.error(error.stack);
      res.status(500).json({
        error: "Server error",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };
   

/**
 * GET /kmeans_clustering
 * Cluster posts using KMeans on TF-IDF features.
 * Query parameter: clusters (default=5)
 * Returns cluster labels for a sample of posts.
 */
exports.kmeansClustering = async (req, res) => {
    try {
        const clusters = parseInt(req.query.clusters) || 5;
        const dataset = (req.query.dataset || 'combined').toLowerCase();
        console.log(`KMeans Clustering: Dataset: ${dataset}, Clusters: ${clusters}`);

        const docs = await fetchDocuments(dataset);
        const documents = docs.map(doc => doc.text).filter(t => t);
        if (documents.length === 0) {
            return res.status(404).json({ error: "No data for clustering" });
        }

        // Build TF-IDF matrix using natural.TfIdf
        const tfidf = new natural.TfIdf();
        documents.forEach(doc => tfidf.addDocument(doc));
        let vocabulary = new Set();
        for (let i = 0; i < documents.length; i++) {
            tfidf.listTerms(i).forEach(item => vocabulary.add(item.term));
        }
        vocabulary = Array.from(vocabulary);
        console.log(`Vocabulary size: ${vocabulary.length}`);

        const vectors = documents.map((doc, i) => vocabulary.map(term => tfidf.tfidf(term, i)));

        // Import kmeans from ml-kmeans correctly:
        const kmeansResult = KMeans(vectors, clusters, { seed: 42 });

        const sampleResults = [];
        for (let i = 0; i < Math.min(50, kmeansResult.clusters.length); i++) {
            sampleResults.push({ id: docs[i].id, cluster: kmeansResult.clusters[i] });
        }
        res.json(sampleResults);
    } catch (error) {
        console.error("Error in kmeansClustering:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

/**
 * GET /duplicate_detection
 * Identify near-duplicate posts based on cosine similarity on TF-IDF vectors.
 * Query parameter: threshold (default=0.8)
 * Returns groups of post IDs that are near-duplicates.
 */
exports.duplicateDetection = async (req, res) => {
    try {
        const threshold = parseFloat(req.query.threshold) || 0.8;
        const dataset = (req.query.dataset || 'combined').toLowerCase();
        console.log(`Duplicate Detection: Dataset: ${dataset}, Threshold: ${threshold}`);

        const docs = await fetchDocuments(dataset);
        const texts = docs.map(doc => doc.text).filter(t => t);
        const ids = docs.map(doc => doc.id);
        if (texts.length === 0) {
            return res.status(404).json({ error: "No documents available" });
        }

        const tfidf = new TfIdf();
        texts.forEach(doc => tfidf.addDocument(doc));
        let vocabulary = new Set();
        for (let i = 0; i < texts.length; i++) {
            tfidf.listTerms(i).forEach(item => vocabulary.add(item.term));
        }
        vocabulary = Array.from(vocabulary);

        const vectors = texts.map((doc, i) => vocabulary.map(term => tfidf.tfidf(term, i)));
        const duplicates = {};
        const n = texts.length;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const sim = cosineSimilarity(vectors[i], vectors[j]);
                if (sim >= threshold) {
                    if (!duplicates[ids[i]]) duplicates[ids[i]] = [];
                    duplicates[ids[i]].push(ids[j]);
                }
            }
        }
        res.json(duplicates);
    } catch (error) {
        console.error("Error in duplicateDetection:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

/**
 * Utility: Compute cosine similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error("Vectors must have the same length.");
    }
    const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
}

module.exports = {
    topicModeling: exports.topicModeling,
    topicCoherence: exports.topicCoherence,
    kmeansClustering: exports.kmeansClustering,
    duplicateDetection: exports.duplicateDetection
};