const natural = require('natural');
const { SLR } = require('ml-regression'); // Simple Linear Regression
const TfIdf = natural.TfIdf;
const { LinearRegression } = require('ml-regression');
const { Matrix } = require('ml-matrix');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const Reddit = require('../models/Reddit');
const Sentiment140 = require('../models/Sentiment140');
const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
const GeotagNintendo = require('../models/GeotagNintendo');
const { MultivariateLinearRegression } = require('ml-regression');

// **Field Mappings for Datasets**
const fieldMappings = {
    'Reddit': {
        id: doc => doc.id,
        text: doc => doc.selftext || '',
        score: doc => doc.score || 0,
        projection: 'id selftext score'
    },
    'Covid19Twitter2020': {
        id: doc => doc.id, // ← id is present in the dataset
        text: doc => doc.original_text || '',
        score: doc => (doc.favorite_count || 0) + (doc.retweet_count || 0),
        projection: 'id original_text favorite_count retweet_count'
    },
    'Covid19Twitter2021': {
        id: doc => doc.id, // ← id is present in the dataset
        text: doc => doc.original_text || '',
        score: doc => (doc.favorite_count || 0) + (doc.retweet_count || 0),
        projection: 'id original_text favorite_count retweet_count'
    },
    'Sentiment140': {
        id: doc => doc.ids, // ← ids is the unique identifier in Sentiment140
        text: doc => doc.text || '',
        score: doc => 0, // No engagement score in this dataset
        projection: 'ids text'
    },
    'TwitterUSAirlineSentiment': {
        id: doc => doc.tweet_id, // ← tweet_id is the identifier
        text: doc => doc.text || '',
        score: doc => doc.retweet_count || 0,
        projection: 'tweet_id text retweet_count'
    },
    'GeotagNintendo': {
        id: doc => doc.id, // ← id is the identifier
        text: doc => doc.text || '',
        score: doc => (doc.favorite_count || 0) + (doc.retweet_count || 0),
        projection: 'id text favorite_count retweet_count'
    }
};

// **Utility Functions**

// Clean text by removing special characters and normalizing
function cleanText(text) {
    if (!text) {
        console.log('cleanText: No text provided, returning empty string');
        return '';
    }
    const cleaned = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    console.log(`cleanText: Cleaned "${text.substring(0, 50)}..." to "${cleaned.substring(0, 50)}..."`);
    return cleaned;
}

// Map dataset key to Mongoose models
function getModels(dataset) {
    dataset = dataset.toLowerCase();
    const modelMap = {
        'reddit': [Reddit],
        'covid2020': [Covid19Twitter2020],
        'covid2021': [Covid19Twitter2021],
        'sentiment140': [Sentiment140],
        'airline': [TwitterUSAirlineSentiment],
        'geonintendo': [GeotagNintendo],
        'combined': [Reddit, Covid19Twitter2020, Covid19Twitter2021, Sentiment140, TwitterUSAirlineSentiment, GeotagNintendo]
    };
    const models = modelMap[dataset] || [];
    return models;
}

// Calculate percentile for outlier detection
async function outlierDetection(req, res) {
    try {
        // Determine dataset from query parameters (default to 'combined')
        const datasetKey = req.query.dataset || 'combined';
        console.log(`Dataset requested: ${datasetKey}`);

        // Retrieve models based on the dataset key
        const models = getModels(datasetKey);
        console.log(`Models retrieved: ${models.map(m => m?.modelName || 'unknown').join(', ')}`);

        if (!Array.isArray(models)) {
            console.error(`Error: models is not an array, got: ${typeof models}`, models);
            return res.status(500).json({ error: 'Internal server error: models not iterable' });
        }

        const posts = [];
        const scores = [];
        const sentiments = [];

        // Process each model
        for (const model of models) {
            console.log(`Processing model: ${model?.modelName || 'unknown'}`);
            const mapping = fieldMappings[model.modelName];
            const projection = mapping.projection;
            console.log(`outlierDetection: Fetching data from ${model.modelName} with projection: ${projection}`);

            // Fetch documents with dataset-specific projection
            const docs = await model.find({}, projection).exec();

            for (const doc of docs) {
                posts.push(doc.toObject());
                const score = mapping.score(doc);
                const text = mapping.text(doc);

                // Log text for debugging (limiting output length)
                console.log(`Text for ${model.modelName}: "${text.substring(0, 50)}..."`);
                if (!text) {
                    console.log(`No text found for document in ${model.modelName}`);
                }

                scores.push(score);
                const sentimentScore = sentiment.analyze(cleanText(text)).score;
                sentiments.push(sentimentScore);
            }
        }

        console.log(`outlierDetection: Processed ${posts.length} posts`);

        // Compute thresholds (e.g., 1st and 99th percentiles)
        const scoreThresholdHigh = percentile(scores, 99);
        const scoreThresholdLow = percentile(scores, 1);
        const sentimentThresholdHigh = percentile(sentiments, 99);
        const sentimentThresholdLow = percentile(sentiments, 1);

        console.log(`outlierDetection: Thresholds - Score High: ${scoreThresholdHigh}, Low: ${scoreThresholdLow}, Sentiment High: ${sentimentThresholdHigh}, Low: ${sentimentThresholdLow}`);

        // Identify outliers based on the computed thresholds
        const outliers = posts.filter((post, index) => {
            const score = scores[index];
            const sentimentScore = sentiments[index];
            return score > scoreThresholdHigh || score < scoreThresholdLow ||
                sentimentScore > sentimentThresholdHigh || sentimentScore < sentimentThresholdLow;
        });

        console.log(`outlierDetection: Found ${outliers.length} outliers`);

        // Return outlier detection results as JSON
        res.status(200).json({ message: 'Outlier detection completed', outliers });
    } catch (error) {
        console.error('Error in outlierDetection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Assuming cleanText and percentile functions are defined elsewhere
// function cleanText(text) {
//     if (!text) {
//         console.log('cleanText: No text provided, returning empty string');
//         return '';
//     }
//     const cleaned = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
//     return cleaned;
// }

// Placeholder for percentile function (implement as needed)
function percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    return sorted[Math.floor(index)];
}

// Content Similarity Matrix
async function contentSimilarityMatrix(req, res) {
    console.log('contentSimilarityMatrix: Starting execution');
    const sampleSize = parseInt(req.query.sample_size) || 20;
    const datasetKey = req.query.dataset || 'combined';
    console.log(`contentSimilarityMatrix: Sample size: ${sampleSize}, Dataset: ${datasetKey}`);

    const models = getModels(datasetKey);
    if (models.length === 0) {
        console.log('contentSimilarityMatrix: No valid models found');
        return res.status(404).json({ error: 'No documents available' });
    }

    let documents = [];
    let ids = [];
    for (const model of models) {
        console.log(`contentSimilarityMatrix: Fetching data from ${model.modelName}`);
        const docs = await model.find({}, 'id selftext original_text text').limit(sampleSize).exec();
        for (const doc of docs) {
            // Use a fallback: if doc.id is undefined, use doc._id
            const docId = doc.id || doc._id;
            const text = cleanText(fieldMappings[model.modelName].text(doc));
            if (text) {
                documents.push(text);
                ids.push(docId);
            }
            if (documents.length >= sampleSize) break;
        }
        if (documents.length >= sampleSize) break;
    }

    console.log(`contentSimilarityMatrix: Collected ${documents.length} documents`);
    console.log('Document IDs:', ids);

    if (documents.length === 0) {
        console.log('contentSimilarityMatrix: No valid documents found');
        return res.status(404).json({ error: 'No documents available' });
    }

    // Build TF-IDF matrix using natural's TfIdf
    const natural = require('natural');
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    documents.forEach(doc => tfidf.addDocument(doc));

    // Create a vocabulary of all terms across documents
    const vocabulary = {};
    tfidf.documents.forEach(doc => {
        Object.keys(doc).forEach(term => {
            vocabulary[term] = true;
        });
    });
    const vocabList = Object.keys(vocabulary);

    // Compute the TF-IDF matrix: rows = documents, columns = terms
    const tfidfMatrix = documents.map((doc, i) => {
        return vocabList.map(term => {
            return tfidf.tfidf(term, i);
        });
    });

    console.log(`contentSimilarityMatrix: TF-IDF matrix shape: ${tfidfMatrix.length}x${tfidfMatrix[0].length}`);

    // Compute cosine similarity matrix for the TF-IDF matrix
    try {
        const similarityMatrix = cosineSimilarity(tfidfMatrix);
        const similarity = {};
        ids.forEach((id, i) => {
            similarity[id] = similarityMatrix[i];
        });
        console.log('contentSimilarityMatrix: Similarity matrix computed');
        console.log('Similarity object:', similarity);
        res.json(similarity);
    } catch (error) {
        console.error('Error computing similarity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Cosine Similarity Helper
// Pairwise Cosine Similarity Helper Function
function cosineSimilarity(matrix) {
    const n = matrix.length;
    const similarityMatrix = Array.from({ length: n }, () => new Array(n).fill(0));

    // Compute the L2 norm for each row (document vector)
    const norms = matrix.map(vec =>
        Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0))
    );

    // Compute pairwise cosine similarity
    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            let dot = 0;
            for (let k = 0; k < matrix[i].length; k++) {
                dot += matrix[i][k] * matrix[j][k];
            }
            // Protect against division by zero
            const sim = dot / ((norms[i] * norms[j]) || 1);
            similarityMatrix[i][j] = sim;
            similarityMatrix[j][i] = sim; // symmetric
        }
    }
    return similarityMatrix;
};

// Predict Engagement
async function predictEngagement(req, res) {
    try {
        console.log('predictEngagement: Starting execution');
        const { datasetName, postId } = req.body;
        if (!datasetName) {
            return res.status(400).json({ error: 'Missing datasetName in request body' });
        }

        const models = getModels(datasetName);
        const model = models[0];
        const fieldMap = fieldMappings[datasetName];
        if (!model || !fieldMap) {
            console.log(`predictEngagement: Invalid dataset name: ${datasetName}`);
            return res.status(400).json({ error: 'Invalid dataset name provided' });
        }

        // Fetch and validate training data
        const trainingDocs = await model.find({}, fieldMap.projection).limit(500);
        if (trainingDocs.length === 0) {
            return res.status(404).json({ error: 'No training data found' });
        }

        const trainingTexts = trainingDocs.map(doc => cleanText(fieldMap.text(doc) || ''));
        const trainingScores = trainingDocs.map(doc => fieldMap.score(doc));

        const validTrainingData = trainingTexts
            .map((text, i) => ({ text: text.trim(), score: trainingScores[i] }))
            .filter(data => data.text !== '');

        if (validTrainingData.length === 0) {
            return res.status(400).json({ error: 'No valid training texts available' });
        }

        const tfidf = new TfIdf();
        validTrainingData.forEach(data => tfidf.addDocument(data.text));

        const vocabulary = new Set();
        tfidf.documents.forEach(doc => {
            Object.keys(doc).forEach(term => vocabulary.add(term));
        });
        const vocabList = Array.from(vocabulary);

        if (vocabList.length === 0) {
            return res.status(400).json({ error: 'No terms found in training data' });
        }

        const trainingVectors = validTrainingData.map((data, i) => {
            return vocabList.map(term => tfidf.tfidf(term, i));
        });
        const trainingScoresFiltered = validTrainingData.map(data => data.score);

        console.log('trainingVectors length:', trainingVectors.length);
        console.log('First vector length:', trainingVectors[0].length);
        console.log('Sample vector:', trainingVectors[0]);

        const regressionModel = new MultivariateLinearRegression(trainingVectors, trainingScoresFiltered);

        // Get target document
        const targetPostId = postId || fieldMap.id(trainingDocs[0]);
        const queryId = typeof targetPostId === 'string' && /^\d+$/.test(targetPostId)
            ? Number(targetPostId)
            : targetPostId;

        console.log(`predictEngagement: Fetching target document with ID ${queryId}`);

        const targetDoc = await model.findOne({ id: queryId }, fieldMap.projection);
        if (!targetDoc || !fieldMap.text(targetDoc)) {
            console.log(`predictEngagement: Post ${targetPostId} not found or no text available`);
            return res.status(404).json({ error: 'Post ID not found or no text available' });
        }

        console.log('predictEngagement: Target document fetched');

        // Compute TF-IDF vector for target document
        const targetText = cleanText(fieldMap.text(targetDoc));
        const targetTerms = targetText.split(' ');
        const tfTarget = {};
        targetTerms.forEach(word => {
            tfTarget[word] = (tfTarget[word] || 0) + 1;
        });
        const N = tfidf.documents.length; // Number of training documents
        const targetVector = vocabList.map(term => {
            const tf = tfTarget[term] || 0;
            const df = tfidf.documents.filter(doc => term in doc).length;
            const idf = Math.log(N / (df + 1));
            return tf * idf;
        });

        // Predict engagement score
        const predictedScore = regressionModel.predict([targetVector])[0];

        return res.json({
            post_id: targetPostId,
            predicted_engagement_score: predictedScore,
        });
    } catch (error) {
        console.error('predictEngagement: Error occurred', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Feature Importance
async function featureImportance(req, res) {
    try {
        console.log('featureImportance: Starting execution');
        const models = getModels('combined');
        let documents = [];
        let targets = [];

        for (const model of models) {
            console.log(`featureImportance: Fetching data from ${model.modelName}`);
            const docs = await model.find({}, 'selftext original_text text score favorite_count retweet_count').limit(500).exec();
            for (const doc of docs) {
                const text = cleanText(fieldMappings[model.modelName].text(doc));
                if (text) {
                    documents.push(text);
                    targets.push(fieldMappings[model.modelName].score(doc));
                }
                if (documents.length >= 500) break;
            }
            if (documents.length >= 500) break;
        }

        if (documents.length === 0) {
            console.log('featureImportance: No data available');
            return res.status(404).json({ error: 'Not enough data for training' });
        }

        const natural = require('natural');
        const TfIdf = natural.TfIdf;
        const tfidf = new TfIdf();
        documents.forEach(doc => tfidf.addDocument(doc));

        // Convert documents to TF-IDF vectors
        const X = documents.map((_, i) => {
            const vector = [];
            tfidf.listTerms(i).forEach(term => vector.push(term.tfidf));
            return vector;
        });

        // Pad vectors to ensure uniform length
        const maxFeatures = Math.max(...X.map(vec => vec.length));
        X.forEach(vec => {
            while (vec.length < maxFeatures) vec.push(0);
        });

        const model = new LinearRegression(); // Use multi-linear regression
        model.fit(X, targets);
        console.log('featureImportance: Linear regression model trained');

        // Get feature names (terms) from the first document as a proxy
        const featureNames = tfidf.listTerms(0).map(term => term.term);
        const coefficients = model.coef_; // Assuming model.coef_ exists
        const importance = featureNames.map((name, i) => ({
            feature: name,
            importance: coefficients[i] || 0
        }));

        importance.sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));
        console.log(`featureImportance: Top feature: ${importance[0].feature} with importance ${importance[0].importance}`);
        res.json(importance);
    } catch (error) {
        console.error('featureImportance: Error occurred', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Trend Forecasting
async function trendForecasting(req, res) {
    try {
        console.log('trendForecasting: Starting execution');
        const models = getModels('combined');
        let dailyTotals = {};

        for (const model of models) {
            console.log(`trendForecasting: Fetching data from ${model.modelName}`);
            const docs = await model.find({}, 'created_utc created_at date score favorite_count retweet_count').exec();
            for (const doc of docs) {
                const date = fieldMappings[model.modelName].date(doc);
                const score = fieldMappings[model.modelName].score(doc);
                if (date && typeof score === 'number') {
                    const day = date.toISOString().split('T')[0];
                    dailyTotals[day] = dailyTotals[day] || { totalScore: 0, count: 0 };
                    dailyTotals[day].totalScore += score;
                    dailyTotals[day].count += 1;
                }
            }
        }

        const dailyAvg = Object.entries(dailyTotals).map(([day, totals]) => ({
            date: day,
            avgScore: totals.count > 0 ? totals.totalScore / totals.count : 0
        }));

        if (dailyAvg.length === 0) {
            console.log('trendForecasting: No data available');
            return res.status(404).json({ error: 'No data available for forecasting' });
        }

        dailyAvg.sort((a, b) => new Date(a.date) - new Date(b.date));
        const lastAvg = dailyAvg[dailyAvg.length - 1].avgScore;

        const today = new Date();
        const forecast = {};
        for (let i = 1; i <= 7; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            const futureDay = futureDate.toISOString().split('T')[0];
            forecast[futureDay] = { predicted_avg_score: lastAvg };
        }

        console.log('trendForecasting: Forecast generated for next 7 days');
        res.json(forecast);
    } catch (error) {
        console.error('trendForecasting: Error occurred', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// **Export Endpoints**
module.exports = {
    outlierDetection,
    contentSimilarityMatrix,
    predictEngagement,
    featureImportance,
    trendForecasting
};