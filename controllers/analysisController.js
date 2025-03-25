require('dotenv').config();
const stopword = require('stopword');
const natural = require('natural');
const TfIdf = natural.TfIdf;

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
 * GET /word_frequency
 * Compute word frequency across the text field after cleaning and stopword removal.
 * Returns the top 50 words.
 */
exports.wordFrequency = async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'combined').toLowerCase();
    const docs = await fetchDocuments(dataset);
    const allText = docs.map(doc => doc.text).join(' ');
    let words = allText.split(/\s+/);
    words = stopword.removeStopwords(words);
    const freq = {};
    words.forEach(word => {
      if (word) freq[word] = (freq[word] || 0) + 1;
    });
    const top50 = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);
    res.json(Object.fromEntries(top50));
  } catch (error) {
    console.error("Error in wordFrequency:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.ngramFrequency = async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'combined').toLowerCase();
    const sampleLimit = parseInt(req.query.limit) || 20000;
    console.log(`Dataset: ${dataset}`);
    console.log(`Using sample limit of ${sampleLimit} documents`);

    const docs = await fetchDocuments(dataset);
    console.log(`Fetched ${docs.length} documents.`);
    
    const docsToProcess = docs.slice(0, sampleLimit);
    console.log(`Processing ${docsToProcess.length} documents for n-gram analysis.`);

    const freq = {};
    const NGrams = natural.NGrams;

    for (let index = 0; index < docsToProcess.length; index++) {
      const doc = docsToProcess[index];
      if (doc.text) {
        let tokens = doc.text.split(/\s+/);
        tokens = stopword.removeStopwords(tokens);
        if (index < 5) {
          console.log(`Document ${index} tokens count: ${tokens.length}`);
        }
        const bigrams = NGrams.bigrams(tokens).map(gram => gram.join(' '));
        const trigrams = NGrams.trigrams(tokens).map(gram => gram.join(' '));
        const allNgrams = bigrams.concat(trigrams);
        allNgrams.forEach(ngram => {
          freq[ngram] = (freq[ngram] || 0) + 1;
        });
      } else {
        console.log(`Document ${index} has no text.`);
      }
      if ((index + 1) % 1000 === 0) {
        console.log(`Processed ${index + 1} documents...`);
      }
    }
    
    console.log("N-grams frequency calculation completed.");
    
    const top20 = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    console.log("Top 20 n-grams computed:", top20);
    
    res.json({
      sampleLimit,
      top20: Object.fromEntries(top20)
    });
  } catch (error) {
    console.error("Error in ngramFrequency:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

/**
 * GET /tfidf_keywords
 * Use TF-IDF to extract the top 20 keywords from the text corpus.
 */
exports.tfidfKeywords = async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'combined').toLowerCase();
    console.log(`TF-IDF: Dataset: ${dataset}`);
    
    const docs = await fetchDocuments(dataset);
    console.log(`TF-IDF: Fetched ${docs.length} documents.`);
    
    // Use only documents that have text, and optionally a sample limit (if desired)
    const sampleLimit = parseInt(req.query.limit) || docs.length;
    const texts = docs.slice(0, sampleLimit).map(doc => doc.text).filter(t => t);
    console.log(`TF-IDF: Processing ${texts.length} documents (sample limit: ${sampleLimit}).`);
    
    if (texts.length === 0) {
      return res.status(404).json({ error: "No data for TF-IDF analysis" });
    }
    
    const tfidf = new natural.TfIdf();
    texts.forEach((doc, i) => {
      tfidf.addDocument(doc);
      if (i < 5) {
        console.log(`TF-IDF: Added document ${i} (length: ${doc.length} characters)`);
      }
    });
    
    // Calculate total TF-IDF scores per term
    const termScores = {};
    for (let i = 0; i < texts.length; i++) {
      const terms = tfidf.listTerms(i);
      terms.forEach(item => {
        termScores[item.term] = (termScores[item.term] || 0) + item.tfidf;
      });
      if ((i + 1) % 1000 === 0) {
        console.log(`TF-IDF: Processed TF-IDF for ${i + 1} documents...`);
      }
    }
    
    // Average score per term
    const avgScores = {};
    Object.keys(termScores).forEach(term => {
      avgScores[term] = termScores[term] / texts.length;
    });
    
    const top20 = Object.entries(avgScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, score]) => ({ term, score }));
    
    console.log("TF-IDF: Top 20 keywords computed:", top20);
    
    res.json(top20);
  } catch (error) {
    console.error("Error in tfidfKeywords:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

/**
 * GET /keyword_cloud
 * Return keywords and their weights formatted for a word cloud visualization.
 * Uses the output of TF-IDF keywords.
 */
exports.keywordCloud = async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'combined').toLowerCase();
    console.log(`Keyword Cloud: Dataset: ${dataset}`);
    
    // Fetch documents and apply a sample limit if provided
    const docs = await fetchDocuments(dataset);
    const sampleLimit = parseInt(req.query.limit) || docs.length;
    const texts = docs.slice(0, sampleLimit).map(doc => doc.text).filter(t => t);
    console.log(`Keyword Cloud: Processing ${texts.length} documents (sample limit: ${sampleLimit}).`);
    
    if (texts.length === 0) {
      return res.status(404).json({ error: "No data for TF-IDF analysis" });
    }
    
    // Compute TF-IDF scores for the corpus
    const tfidf = new natural.TfIdf();
    texts.forEach((doc, i) => {
      tfidf.addDocument(doc);
      if (i < 5) {
        console.log(`Keyword Cloud: Added document ${i} (length: ${doc.length} characters)`);
      }
    });
    
    // Calculate cumulative TF-IDF scores per term
    const termScores = {};
    for (let i = 0; i < texts.length; i++) {
      const terms = tfidf.listTerms(i);
      terms.forEach(item => {
        termScores[item.term] = (termScores[item.term] || 0) + item.tfidf;
      });
      if ((i + 1) % 1000 === 0) {
        console.log(`Keyword Cloud: Processed TF-IDF for ${i + 1} documents...`);
      }
    }
    
    // Calculate average TF-IDF score per term
    const avgScores = {};
    Object.keys(termScores).forEach(term => {
      avgScores[term] = termScores[term] / texts.length;
    });
    
    // Get the top 20 keywords
    const top20 = Object.entries(avgScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, score]) => ({ term, score }));
    
    // Format for word cloud: array of objects with "text" and "weight"
    const cloudData = top20.map(item => ({
      text: item.term,
      weight: item.score
    }));
    
    console.log("Keyword Cloud: Top 20 keywords computed:", cloudData);
    res.json(cloudData);
  } catch (error) {
    console.error("Error in keywordCloud:", error);
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

/**
 * GET /text_similarity
 * Compute cosine similarity between posts using TF-IDF vectors.
 * Returns a similarity matrix for the first 10 documents.
 */
exports.textSimilarity = async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'combined').toLowerCase();
    console.log(`TextSimilarity: Dataset: ${dataset}`);
    
    const docs = await fetchDocuments(dataset);
    const texts = docs.map(doc => doc.text);
    if (texts.length === 0) {
      return res.status(404).json({ error: "No documents available" });
    }
    
    const nDocs = Math.min(10, texts.length);
    const tfidf = new TfIdf();
    for (let i = 0; i < nDocs; i++) {
      tfidf.addDocument(texts[i]);
      if (i < 5) {
        console.log(`TextSimilarity: Added document ${i} (length: ${texts[i].length} characters)`);
      }
    }
    
    // Build vocabulary from the first nDocs documents
    let vocabulary = new Set();
    for (let i = 0; i < nDocs; i++) {
      tfidf.listTerms(i).forEach(item => vocabulary.add(item.term));
    }
    vocabulary = Array.from(vocabulary);
    
    // Create TF-IDF vectors for each of the first nDocs documents
    const vectors = [];
    for (let i = 0; i < nDocs; i++) {
      const vector = vocabulary.map(term => tfidf.tfidf(term, i));
      vectors.push(vector);
    }
    
    // Compute cosine similarity matrix
    const simMatrix = [];
    for (let i = 0; i < vectors.length; i++) {
      simMatrix[i] = [];
      for (let j = 0; j < vectors.length; j++) {
        try {
          simMatrix[i][j] = cosineSimilarity(vectors[i], vectors[j]);
        } catch (err) {
          console.error(`Error computing similarity for indices ${i}, ${j}:`, err);
          simMatrix[i][j] = 0;
        }
      }
    }
    
    res.json(simMatrix);
  } catch (error) {
    console.error("Error in textSimilarity:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

/**
 * GET /most_similar_posts
 * Given a specific post ID, return the 5 most similar posts based on cosine similarity on TF-IDF vectors.
 * Query parameter: post_id
 */
exports.mostSimilarPosts = async (req, res) => {
  try {
    let postId = req.query.post_id;
    const dataset = (req.query.dataset || 'combined').toLowerCase();
    const sampleLimit = parseInt(req.query.limit) || 500; // process only a subset
    console.log(`MostSimilarPosts: Dataset: ${dataset}, Post ID: ${postId ? postId : "Not provided (defaulting to first document)"}, Sample limit: ${sampleLimit}`);
    
    const docs = await fetchDocuments(dataset);
    console.log(`Fetched ${docs.length} documents for dataset: ${dataset}`);
    
    // Filter out documents with empty text
    const validDocs = docs.filter(doc => doc.text && doc.text.trim().length > 0);
    console.log(`Valid documents count: ${validDocs.length}`);
    if (validDocs.length === 0) {
      return res.status(404).json({ error: "No valid documents available" });
    }
    
    // Use only a sample of valid documents
    const docsToProcess = validDocs.slice(0, sampleLimit);
    const texts = docsToProcess.map(doc => doc.text);
    const ids = docsToProcess.map(doc => doc.id);
    console.log(`Processing ${texts.length} documents for TF-IDF analysis.`);
    
    const tfidf = new natural.TfIdf();
    for (let i = 0; i < texts.length; i++) {
      tfidf.addDocument(texts[i]);
      if (i < 5) {
        console.log(`Added document ${i} (length: ${texts[i].length} characters)`);
      }
    }
    
    // Build vocabulary from the processed documents
    let vocabulary = new Set();
    for (let i = 0; i < texts.length; i++) {
      tfidf.listTerms(i).forEach(item => vocabulary.add(item.term));
    }
    vocabulary = Array.from(vocabulary);
    console.log(`Vocabulary size: ${vocabulary.length}`);
    
    // Create TF-IDF vectors for all processed documents
    const vectors = [];
    for (let i = 0; i < texts.length; i++) {
      const vector = vocabulary.map(term => tfidf.tfidf(term, i));
      vectors.push(vector);
    }
    
    // Determine target index: if no post_id provided, default to the first document.
    let idx;
    if (!postId) {
      idx = 0;
      postId = ids[0];
      console.log(`No post_id provided. Defaulting to first document: ${postId}`);
    } else {
      idx = ids.indexOf(postId);
      if (idx === -1) {
        return res.status(404).json({ error: "Post ID not found in the sample" });
      }
    }
    console.log(`Target index: ${idx} for Post ID: ${postId}`);
    
    // Compute cosine similarity between the target post and all processed documents.
    const similarities = vectors.map(vector => cosineSimilarity(vectors[idx], vector));
    
    // Exclude the target post itself and get top 5 similar posts.
    const similarPosts = similarities
      .map((score, i) => ({ id: ids[i], score, index: i }))
      .filter(item => item.index !== idx)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    console.log("Similar posts computed:", similarPosts);
    res.json(similarPosts);
  } catch (error) {
    console.error("Error in mostSimilarPosts:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

/**
 * Retrieves post identifiers with an indicator (title or username) for the specified dataset.
 * Uses efficient batch processing for Sentiment140 to handle large datasets.
 */
exports.getPostIdentifiers = async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'combined').toLowerCase();
    console.log(`Fetching identifiers for dataset: ${dataset}`);

    let posts = [];
    if (dataset === 'reddit') {
      console.log("Querying Reddit collection...");
      const Reddit = require('../models/Reddit');
      posts = await Reddit.find({}, { id: 1, title: 1, _id: 0 }).lean();
      console.log(`Reddit posts fetched: ${posts.length}`);
    } else if (dataset === 'sentiment140') {
      console.log("Querying Sentiment140 collection with batch processing...");
      const Sentiment140 = require('../models/Sentiment140');
      posts = [];
      const cursor = Sentiment140.find({}, { ids: 1, user: 1, _id: 0 }).limit(1000).cursor(); // Adjust batch size if needed
      let count = 0;
      for await (const post of cursor) {
        posts.push({ id: post.ids, username: post.user });
        count++;
        if (count % 500 === 0) console.log(`Processed ${count} Sentiment140 posts`);
      }
      console.log(`Total Sentiment140 posts processed: ${count}`);
    } else if (dataset === 'geonintendo') {
      console.log("Querying GeoNintendo collection...");
      const GeoNintendo = require('../models/GeotagNintendo');
      posts = await GeoNintendo.find({}, { id: 1, "user.screen_name": 1, _id: 0 }).lean();
      console.log(`GeoNintendo posts fetched: ${posts.length}`);
      posts = posts.map(post => {
        const username = post.user && post.user.screen_name ? post.user.screen_name : "unknown";
        console.log(`Mapping GeoNintendo post with id: ${post.id} and username: ${username}`);
        return { id: post.id, username };
      });
    } else if (dataset === 'covid2020') {
      console.log("Querying Covid19Twitter2020 collection...");
      const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
      // Assuming Covid19Twitter2020 has fields: id and original_text, and maybe original_author.
      posts = await Covid19Twitter2020.find({}, { id: 1, original_text: 1, original_author: 1, _id: 0 }).lean();
      console.log(`Covid2020 posts fetched: ${posts.length}`);
      posts = posts.map(post => ({
        id: post.id,
        username: post.original_author || "unknown",
        text: post.original_text // optional, if needed for further processing
      }));
    } else if (dataset === 'covid2021') {
      console.log("Querying Covid19Twitter2021 collection...");
      const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
      // Assuming Covid19Twitter2021 has fields: id, original_text, original_author.
      posts = await Covid19Twitter2021.find({}, { id: 1, original_text: 1, original_author: 1, _id: 0 }).lean();
      console.log(`Covid2021 posts fetched: ${posts.length}`);
      posts = posts.map(post => ({
        id: post.id,
        username: post.original_author || "unknown",
        text: post.original_text
      }));
    } else if (dataset === 'airline') {
      console.log("Querying TwitterUSAirlineSentiment collection...");
      const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
      // Assuming Airline dataset has fields: tweet_id, text, and name.
      posts = await TwitterUSAirlineSentiment.find({}, { tweet_id: 1, text: 1, name: 1, _id: 0 }).lean();
      console.log(`Airline posts fetched: ${posts.length}`);
      posts = posts.map(post => {
        console.log(`Mapping Airline post with tweet_id: ${post.tweet_id}`);
        return { id: post.tweet_id, username: post.name, text: post.text };
      });
    } else if (dataset === 'combined') {
      console.log("Querying combined datasets: Reddit, Sentiment140, GeoNintendo, Covid2020, Covid2021, and Airline...");
      const Reddit = require('../models/Reddit');
      const Sentiment140 = require('../models/Sentiment140');
      const GeoNintendo = require('../models/GeoNintendo');
      const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
      const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
      const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');

      const redditPosts = await Reddit.find({}, { id: 1, title: 1, _id: 0 }).lean();
      console.log(`Reddit posts fetched: ${redditPosts.length}`);

      const sentimentRecords = await Sentiment140.find({}, { ids: 1, user: 1, _id: 0 }).lean();
      console.log(`Sentiment140 posts fetched: ${sentimentRecords.length}`);
      const sentimentPosts = sentimentRecords.map(post => ({ id: post.ids, username: post.user }));

      const geoRecords = await GeoNintendo.find({}, { id: 1, "user.screen_name": 1, _id: 0 }).lean();
      console.log(`GeoNintendo posts fetched: ${geoRecords.length}`);
      const geoPosts = geoRecords.map(post => ({
        id: post.id,
        username: post.user && post.user.screen_name ? post.user.screen_name : "unknown"
      }));

      const covid2020Records = await Covid19Twitter2020.find({}, { id: 1, original_text: 1, original_author: 1, _id: 0 }).lean();
      console.log(`Covid2020 posts fetched: ${covid2020Records.length}`);
      const covid2020Posts = covid2020Records.map(post => ({
        id: post.id,
        username: post.original_author || "unknown",
        text: post.original_text
      }));

      const covid2021Records = await Covid19Twitter2021.find({}, { id: 1, original_text: 1, original_author: 1, _id: 0 }).lean();
      console.log(`Covid2021 posts fetched: ${covid2021Records.length}`);
      const covid2021Posts = covid2021Records.map(post => ({
        id: post.id,
        username: post.original_author || "unknown",
        text: post.original_text
      }));

      const airlineRecords = await TwitterUSAirlineSentiment.find({}, { tweet_id: 1, text: 1, name: 1, _id: 0 }).lean();
      console.log(`Airline posts fetched: ${airlineRecords.length}`);
      const airlinePosts = airlineRecords.map(post => ({
        id: post.tweet_id,
        username: post.name,
        text: post.text
      }));

      return res.json({
        reddit: redditPosts,
        sentiment140: sentimentPosts,
        geonintendo: geoPosts,
        covid2020: covid2020Posts,
        covid2021: covid2021Posts,
        airline: airlinePosts
      });
    } else {
      console.error(`Invalid dataset parameter: ${dataset}`);
      return res.status(400).json({ error: "Invalid dataset parameter" });
    }
    
    console.log(`Returning ${posts.length} posts for dataset: ${dataset}`);
    res.json(posts);
  } catch (error) {
    console.error("Error in getPostIdentifiers:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};