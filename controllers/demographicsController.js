const Reddit = require('../models/Reddit');
const Sentiment140 = require('../models/Sentiment140');
const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
const GeotagNintendo = require('../models/GeotagNintendo');
const vader = require('vader-sentiment');

// Initialize VADER sentiment analyzer
const sentiment = vader.SentimentIntensityAnalyzer;

// Updated fieldMappings (unchanged from original, included for completeness)
const fieldMappings = {
    'Reddit': {
        date: doc => new Date(doc.created_utc * 1000),
        text: doc => doc.selftext || '',
        score: doc => doc.score || 0,
        author: doc => doc.author || 'unknown',
        num_comments: doc => doc.num_comments || 0
    },
    'Covid19Twitter2020': {
        date: doc => new Date(doc.created_at),
        text: doc => doc.original_text || '',
        score: doc => (doc.favorite_count || 0) + (doc.retweet_count || 0),
        author: doc => doc.original_author || 'unknown',
        num_comments: doc => 0
    },
    'Covid19Twitter2021': {
        date: doc => new Date(doc.created_at),
        text: doc => doc.original_text || '',
        score: doc => (doc.favorite_count || 0) + (doc.retweet_count || 0),
        author: doc => doc.original_author || 'unknown',
        num_comments: doc => 0
    },
    'Sentiment': {
        date: doc => new Date(doc.someDateField),
        text: doc => doc.someTextField || '',
        score: doc => doc.someScoreField || 0,
        author: doc => doc.someAuthorField || 'unknown',
        num_comments: doc => doc.someCommentsField || 0
    },
    'TwitterUSAirlineSentiment': {
        date: doc => new Date(doc.date),
        text: doc => doc.text || '',
        score: doc => doc.retweet_count || 0,
        author: doc => doc.name || 'unknown',
        num_comments: doc => 0
    },
    'GeotagNintendo': {
        date: doc => new Date(doc.created_at),
        text: doc => doc.text || '',
        score: doc => (doc.favorite_count || 0) + (doc.retweet_count || 0),
        author: doc => doc.user && doc.user.screen_name ? doc.user.screen_name : 'unknown',
        num_comments: doc => 0
    }
};

// Utility function to clean text (unchanged from original)
function cleanText(text) {
    if (!text) {
        console.log('cleanText: No text provided, returning empty string');
        return '';
    }
    const cleaned = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    console.log(`cleanText: Cleaned text from "${text.substring(0, 50)}..." to "${cleaned.substring(0, 50)}..."`);
    return cleaned;
}

// Function to get models based on dataset
function getModels(dataset) {
    dataset = dataset.toLowerCase();
    const modelMap = {
        'reddit': [Reddit],
        'covid2020': [Covid19Twitter2020],
        'covid2021': [Covid19Twitter2021],
        'Sentiment140': [Sentiment140],
        'airline': [TwitterUSAirlineSentiment],
        'geonintendo': [GeotagNintendo],
        'combined': [Reddit, Covid19Twitter2020, Covid19Twitter2021, Sentiment140, TwitterUSAirlineSentiment, GeotagNintendo]
    };
    const models = modelMap[dataset] || [];
    console.log(`getModels: Retrieved models for dataset "${dataset}": ${models.map(m => m.modelName).join(', ')}`);
    return models;
}

// **Endpoint 1: /demographics_summary**
async function demographicsSummary(req, res) {
    console.log('demographicsSummary: Endpoint called');
    const demographicFields = ['user_gender', 'user_age', 'user_location'];
    const results = {};

    for (const field of demographicFields) {
        const fieldCounts = {};
        const models = getModels('combined'); // Always use combined for demographics

        for (const model of models) {
            const modelName = model.modelName;
            console.log(`demographicsSummary: Processing model ${modelName} for field ${field}`);
            const cursor = model.find({ [field]: { $exists: true, $ne: null } }).cursor();

            for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
                const value = doc[field];
                if (value) {
                    const key = String(value).trim().toLowerCase();
                    if (!fieldCounts[key]) fieldCounts[key] = 0;
                    fieldCounts[key] += 1;
                    console.log(`demographicsSummary: Counted ${key} for ${field} in ${modelName}`);
                }
            }
        }
        results[field] = fieldCounts;
        console.log(`demographicsSummary: Completed counts for ${field}: ${JSON.stringify(fieldCounts)}`);
    }
    console.log('demographicsSummary: Sending response');
    res.json(results);
}

// **Endpoint 2: /platform_comparison**
async function platformComparison(req, res) {
    const models = getModels('combined');
    const results = {};

    for (const model of models) {
        const modelName = model.modelName;
        console.log(`Processing model: ${modelName}`);
        
        const mapping = fieldMappings[modelName];
        if (!mapping) {
            console.error(`No mapping found for model: ${modelName}`);
            continue;
        }

        const cursor = model.find().cursor();
        let totalScore = 0;
        let count = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const score = mapping.score(doc);
            totalScore += score;
            count += 1;
        }

        results[modelName] = {
            averageScore: count > 0 ? totalScore / count : 0,
            documentCount: count
        };
    }

    res.json(results);
}

// **Endpoint 3: /time_period_comparison**
async function timePeriodComparison(req, res) {
    console.log('timePeriodComparison: Endpoint called');
    const weeklySummary = {};

    const models = getModels('combined'); // Assuming this retrieves all models

    for (const model of models) {
        const modelName = model.modelName;
        console.log(`timePeriodComparison: Processing model ${modelName}`);

        // Check if the model has a mapping defined
        const mapping = fieldMappings[modelName];
        if (!mapping) {
            console.error(`No mapping found for model: ${modelName}. Skipping.`);
            continue; // Skip to the next model
        }

        const cursor = model.find().cursor();

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const date = mapping.date(doc);
            const text = mapping.text(doc);
            const score = mapping.score(doc);

            if (date && text && text.trim()) {
                const year = date.getUTCFullYear();
                const weekNumber = getWeekNumber(date); // Assume this function exists
                const weekKey = `${year}-${weekNumber.toString().padStart(2, '0')}`;

                if (!weeklySummary[weekKey]) {
                    weeklySummary[weekKey] = { scores: [], sentiments: [] };
                }

                weeklySummary[weekKey].scores.push(score);
                const sentimentScore = sentiment.polarity_scores(cleanText(text)).compound; // Assume sentiment and cleanText are defined
                weeklySummary[weekKey].sentiments.push(sentimentScore);
                console.log(`timePeriodComparison: Added to ${weekKey} in ${modelName} - score: ${score}, sentiment: ${sentimentScore}`);
            }
        }
    }

    const comparison = {};
    for (const week in weeklySummary) {
        const data = weeklySummary[week];
        const avgScore = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0;
        const avgSentiment = data.sentiments.length > 0 ? data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length : 0;
        comparison[week] = { average_score: avgScore, average_sentiment: avgSentiment };
        console.log(`timePeriodComparison: Computed for ${week} - avg_score: ${avgScore}, avg_sentiment: ${avgSentiment}`);
    }

    console.log('timePeriodComparison: Sending response');
    res.json(comparison);
}

// Helper function to get ISO week number
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

// **Endpoint 4: /author_comparison**
async function authorComparison(req, res) {
    console.log('authorComparison: Endpoint called');
    const authorStats = {};

    // Fetch all models (assumes 'combined' retrieves all relevant models)
    const models = getModels('combined');

    // Iterate over each model
    for (const model of models) {
        const modelName = model.modelName;
        console.log(`authorComparison: Processing model ${modelName}`);

        // Retrieve the field mapping for the current model
        const mapping = fieldMappings[modelName];
        
        // Check if mapping exists; skip to next model if not
        if (!mapping) {
            console.error(`No mapping found for model: ${modelName}`);
            continue;
        }

        // Use a cursor to iterate over all documents in the model
        const cursor = model.find().cursor();
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const author = mapping.author(doc);  // Extract author from document
            const score = mapping.score(doc);    // Extract score from document
            const text = mapping.text(doc);      // Extract text from document

            // Process only if author is defined
            if (author) {
                // Create a unique key by combining modelName and author
                const key = `${modelName}::${author}`;
                
                // Initialize stats for new author-dataset combinations
                if (!authorStats[key]) {
                    authorStats[key] = { post_count: 0, total_score: 0, total_sentiment: 0 };
                }

                // Update author statistics
                authorStats[key].post_count += 1;
                authorStats[key].total_score += score;
                const sentimentScore = sentiment.polarity_scores(cleanText(text)).compound;
                authorStats[key].total_sentiment += sentimentScore;
            }
        }
    }

    // Transform authorStats into an array of result objects
    const results = Object.entries(authorStats).map(([key, stats]) => {
        const [dataset, author] = key.split('::');
        return {
            dataset,
            author,
            post_count: stats.post_count,
            avg_score: stats.post_count > 0 ? stats.total_score / stats.post_count : 0,
            avg_sentiment: stats.post_count > 0 ? stats.total_sentiment / stats.post_count : 0
        };
    });

    // Sort by post count (descending) and take top 10
    results.sort((a, b) => b.post_count - a.post_count);
    const top10 = results.slice(0, 10);

    console.log('authorComparison: Sending top 10 authors');
    res.json(top10);
}

// Export the controllers
module.exports = {
    demographicsSummary,
    platformComparison,
    timePeriodComparison,
    authorComparison
};