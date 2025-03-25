const vader = require('vader-sentiment');
const moment = require('moment');

// Field mappings for different datasets to standardize text, date, and author fields
const fieldMappings = {
    reddit: {
        text: 'selftext',
        date: 'created_utc',
        author: 'original_author'
    },
    sentiment140: {
        text: 'text',
        date: 'date',
        author: 'user'
    },
    covid2020: {
        text: 'original_text',
        date: 'created_at',
        author: 'original_author'
    },
    covid2021: {
        text: 'original_text',
        date: 'created_at',
        author: 'original_author'
    },
    airline: {
        text: 'text',
        date: 'date',
        author: 'name'
    },
    geonintendo: {
        text: 'text',
        date: 'created_at',
        author: 'user' // Adjust to 'user.screen_name' if 'user' is an object
    }
};

// Utility function to fetch data from MongoDB based on dataset and required field types
async function fetchData(dataset, fieldTypes) {
    console.log(`Fetching data for dataset: ${dataset} with field types: ${fieldTypes}`);
    let data = [];
    dataset = dataset.toLowerCase();

    const fetchFromModel = async (Model, datasetName) => {
        const projection = {};
        const mappings = fieldMappings[datasetName];
        fieldTypes.forEach(type => {
            const field = mappings[type];
            if (field) {
                projection[field] = 1;
            }
        });
        console.log(`Projection for ${datasetName}: ${JSON.stringify(projection)}`);
        try {
            const records = await Model.find({}, projection).exec();
            console.log(`Fetched ${records.length} records from ${datasetName}`);
            return records.map(record => {
                const doc = {};
                fieldTypes.forEach(type => {
                    const field = mappings[type];
                    if (field in record) {
                        doc[type] = record[field];
                    }
                });
                doc.dataset = datasetName;
                return doc;
            });
        } catch (error) {
            console.error(`Error fetching from ${datasetName}: ${error.message}`);
            return [];
        }
    };

    if (dataset === 'combined') {
        const Reddit = require('../models/Reddit');
        const Sentiment140 = require('../models/Sentiment140');
        const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
        const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
        const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
        const GeoNintendo = require('../models/GeotagNintendo');

        const redditData = await fetchFromModel(Reddit, 'reddit');
        const sentimentData = await fetchFromModel(Sentiment140, 'sentiment140');
        const covid2020Data = await fetchFromModel(Covid19Twitter2020, 'covid2020');
        const covid2021Data = await fetchFromModel(Covid19Twitter2021, 'covid2021');
        const airlineData = await fetchFromModel(TwitterUSAirlineSentiment, 'airline');
        const geonintendoData = await fetchFromModel(GeoNintendo, 'geonintendo');

        data = [
            ...redditData,
            ...sentimentData,
            ...covid2020Data,
            ...covid2021Data,
            ...airlineData,
            ...geonintendoData
        ];
        console.log(`Combined total records: ${data.length}`);
    } else {
        let modelName = dataset.charAt(0).toUpperCase() + dataset.slice(1);
        if (dataset === 'covid2020') modelName = 'Covid19Twitter2020';
        if (dataset === 'covid2021') modelName = 'Covid19Twitter2021';
        if (dataset === 'airline') modelName = 'TwitterUSAirlineSentiment';
        if (dataset === 'geonintendo') modelName = 'GeotagNintendo';
        try {
            const Model = require(`../models/${modelName}`);
            data = await fetchFromModel(Model, dataset);
        } catch (error) {
            console.error(`Error loading model for ${dataset}: ${error.message}`);
            throw error;
        }
    }
    console.log('Sample doc:', data[0]);
    return data;
}

// Utility function to clean text (lowercase and remove punctuation)
function cleanText(text) {
    if (!text) {
        console.log('Text is empty or null');
        return '';
    }
    const cleaned = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    console.log(`Cleaned text: "${text}" -> "${cleaned}"`);
    return cleaned;
}

// Field mappings to standardize date fields across datasets
const dateMappings = {
    reddit: { date: 'created_utc' },
    sentiment140: { date: 'date' },
    covid2020: { date: 'created_at' },
    covid2021: { date: 'created_at' },
    airline: { date: 'date' },
    geonintendo: { date: 'created_at' }
};

// Date formats mapping for each dataset
const dateFormats = {
    'reddit': null, // Unix timestamp
    'sentiment140': 'ddd MMM DD HH:mm:ss Z YYYY', // e.g., "Mon Apr 06 22:19:45 PDT 2009"
    'covid2020': 'ddd MMM DD HH:mm:ss Z YYYY', // e.g., "Wed Apr 01 12:34:56 +0000 2020"
    'covid2021': 'ddd MMM DD HH:mm:ss Z YYYY',
    'airline': ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD HH:mm:ss'], // Possible formats
    'geonintendo': 'ddd MMM DD HH:mm:ss Z YYYY'
};

/**
 * Parses the date from a document based on the dataset's date field and format.
 * @param {Object} doc - The document containing the date field.
 * @param {string} dataset - The name of the dataset (e.g., 'reddit', 'airline').
 * @returns {string|null} - The parsed date in 'YYYY-MM-DD' format, or null if invalid.
 */
function parseDate(doc, dataset) {
    // Use the standardized 'date' key from the doc, not the dataset-specific field
    const rawDate = doc.date;

    console.log(`Parsing date for ${dataset}: ${rawDate}`);

    // Check if the date field exists and has a value
    if (!rawDate) {
        console.log(`No date found in ${dataset} document`);
        return null;
    }

    // Get the expected format(s) for the dataset
    const formats = dateFormats[dataset];

    if (formats === null) {
        // Handle Unix timestamp (e.g., 'created_utc' in Reddit)
        const timestamp = typeof rawDate === 'number' ? rawDate : parseInt(rawDate, 10);
        if (isNaN(timestamp)) {
            console.log(`Invalid Unix timestamp in ${dataset}: ${rawDate}`);
            return null;
        }
        return new Date(timestamp * 1000).toISOString().split('T')[0]; // Convert to 'YYYY-MM-DD'
    } else {
        // Handle string dates (e.g., 'created_at' or 'date')
        const parsed = moment(rawDate, formats, true); // Strict parsing
        if (parsed.isValid()) {
            return parsed.format('YYYY-MM-DD');
        } else {
            console.log(`Invalid date in ${dataset}: ${rawDate}`);
            return null;
        }
    }
}

// Example usage:
/*
const doc1 = { created_utc: 1585748096 }; // Reddit Unix timestamp
const doc2 = { created_at: "Wed Apr 01 12:34:56 +0000 2020" }; // COVID Twitter
const doc3 = { date: "2020-04-01" }; // Airline (assuming YYYY-MM-DD)

console.log(parseDate(doc1, 'reddit'));        // Output: "2020-04-01"
console.log(parseDate(doc2, 'covid2020'));    // Output: "2020-04-01"
console.log(parseDate(doc3, 'airline'));      // Output: "2020-04-01"
*/

// Endpoint: Compute overall VADER sentiment (average compound score and distribution)
exports.sentimentVader = async (req, res) => {
    console.log('Entering sentimentVader endpoint');
    try {
        const dataset = req.query.dataset || 'combined';
        console.log(`Dataset selected: ${dataset}`);
        const data = await fetchData(dataset, ['text']);

        let compoundScores = [];
        let sentimentCounts = { positive: 0, negative: 0, neutral: 0 };

        console.log(`Processing ${data.length} documents`);
        data.forEach((doc, index) => {
            const text = doc.text;
            if (text) {
                console.log(`Document ${index + 1}: Processing text`);
                const cleanedText = cleanText(text);
                const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(cleanedText);
                const compound = sentiment.compound;
                console.log(`Compound score: ${compound}`);
                compoundScores.push(compound);
                if (compound >= 0.05) {
                    sentimentCounts.positive++;
                    console.log('Classified as positive');
                } else if (compound <= -0.05) {
                    sentimentCounts.negative++;
                    console.log('Classified as negative');
                } else {
                    sentimentCounts.neutral++;
                    console.log('Classified as neutral');
                }
            } else {
                console.log(`Document ${index + 1}: No text to process`);
            }
        });

        const avgCompound = compoundScores.length > 0
            ? compoundScores.reduce((a, b) => a + b, 0) / compoundScores.length
            : 0;
        console.log(`Average compound score: ${avgCompound}`);
        console.log(`Sentiment distribution: ${JSON.stringify(sentimentCounts)}`);

        const result = {
            average_compound: avgCompound,
            sentiment_distribution: sentimentCounts
        };
        res.json(result);
    } catch (error) {
        console.error(`Error in sentimentVader: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Endpoint: Compute average VADER compound sentiment per day (time series)
exports.sentimentTimeSeries = async (req, res) => {
    console.log('Entering sentimentTimeSeries endpoint');
    try {
        const dataset = req.query.dataset || 'combined';
        console.log(`Dataset selected: ${dataset}`);
        const data = await fetchData(dataset, ['text', 'date']);

        let dailySentiments = {};

        console.log(`Processing ${data.length} documents`);
        data.forEach((doc, index) => {
            const dateStr = parseDate(doc, doc.dataset);
            if (!dateStr) {
                console.log(`Document ${index + 1}: No valid date`);
                return; // Skip this document
            }

            const text = doc.text;
            if (text) {
                console.log(`Document ${index + 1}: Processing text`);
                const cleanedText = cleanText(text);
                const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(cleanedText);
                const compound = sentiment.compound;
                dailySentiments[dateStr] = dailySentiments[dateStr] || [];
                dailySentiments[dateStr].push(compound);
                console.log(`Added compound score ${compound} to date ${dateStr}`);
            } else {
                console.log(`Document ${index + 1}: No text to process`);
            }
        });

        // Calculate average per day
        const timeSeries = {};
        for (const [day, scores] of Object.entries(dailySentiments)) {
            if (scores.length > 0) {
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                timeSeries[day] = avg;
                console.log(`Average for ${day}: ${avg} (based on ${scores.length} scores)`);
            }
        }
        console.log(`Time series result: ${JSON.stringify(timeSeries)}`);
        res.json(timeSeries);
    } catch (error) {
        console.error(`Error in sentimentTimeSeries: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Endpoint: Compute a 7-day rolling average of sentiment scores
exports.rollingSentiment = async (req, res) => {
    console.log('Entering rollingSentiment endpoint');
    try {
        const dataset = req.query.dataset || 'combined';
        console.log(`Dataset selected: ${dataset}`);
        const data = await fetchData(dataset, ['text', dateMappings[dataset].date]);
        console.log('First doc:', data[0]);

        let dailySentiments = {};
        console.log(`Processing ${data.length} documents`);

        data.forEach((doc, index) => {
            const dateStr = parseDate(doc, doc.dataset);
            if (!dateStr) {
                console.log(`Skipping document ${index + 1} in ${doc.dataset}: No valid date`);
                return;
            }

            const text = doc.text;
            if (text) {
                const cleanedText = cleanText(text);
                const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(cleanedText);
                const compound = sentiment.compound;
                dailySentiments[dateStr] = dailySentiments[dateStr] || [];
                dailySentiments[dateStr].push(compound);
            } else {
                console.log(`Document ${index + 1}: No text to process`);
            }
        });

        const dailyAverages = Object.entries(dailySentiments).map(([day, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            return { day, avg };
        });

        dailyAverages.sort((a, b) => new Date(a.day) - new Date(b.day));
        console.log('Sorted daily averages by date');

        const rolling = {};
        dailyAverages.forEach((item, index) => {
            const start = Math.max(0, index - 6);
            const window = dailyAverages.slice(start, index + 1);
            const windowSum = window.reduce((sum, i) => sum + i.avg, 0);
            const windowAvg = windowSum / window.length;
            rolling[item.day] = windowAvg;
        });

        console.log(`Rolling sentiment result: ${JSON.stringify(rolling)}`);
        res.json(rolling);
    } catch (error) {
        console.error(`Error in rollingSentiment: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Endpoint: Aggregate sentiment scores by author (top 10 by post count)
exports.authorSentiment = async (req, res) => {
    console.log('Entering authorSentiment endpoint');
    try {
        const dataset = req.query.dataset || 'combined';
        console.log(`Dataset selected: ${dataset}`);
        const data = await fetchData(dataset, ['text', 'author']);

        const authorSentiments = {};

        console.log(`Processing ${data.length} documents`);
        data.forEach((doc, index) => {
            const author = doc.author;
            const text = doc.text;
            if (author && text) {
                console.log(`Document ${index + 1}: Processing author "${author}"`);
                const cleanedText = cleanText(text);
                const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(cleanedText);
                const compound = sentiment.compound;
                authorSentiments[author] = authorSentiments[author] || { scores: [], count: 0 };
                authorSentiments[author].scores.push(compound);
                authorSentiments[author].count++;
                console.log(`Added score ${compound} for author "${author}" (count: ${authorSentiments[author].count})`);
            } else {
                console.log(`Document ${index + 1}: Missing author or text (author: ${author}, text: ${text})`);
            }
        });

        const results = [];
        for (const [author, info] of Object.entries(authorSentiments)) {
            const avgScore = info.scores.reduce((a, b) => a + b, 0) / info.scores.length;
            results.push({ author, post_count: info.count, avg_sentiment: avgScore });
            console.log(`Author "${author}": post_count=${info.count}, avg_sentiment=${avgScore}`);
        }

        results.sort((a, b) => b.post_count - a.post_count);
        console.log('Sorted authors by post count');
        const top10 = results.slice(0, 10);
        console.log(`Top 10 authors: ${JSON.stringify(top10)}`);
        res.json(top10);
    } catch (error) {
        console.error(`Error in authorSentiment: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};