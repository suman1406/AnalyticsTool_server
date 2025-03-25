const Reddit = require('../models/Reddit');
const Sentiment140 = require('../models/Sentiment140');
const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
const GeotagNintendo = require('../models/GeotagNintendo'); 
const vader = require('vader-sentiment');
const moment = require('moment');

// Use the analyzer directly:
const sentiment = vader.SentimentIntensityAnalyzer;

// Utility function to extract hashtags from text
function extractHashtags(text) {
    if (!text) {
        console.log('extractHashtags: No text provided, returning empty array');
        return [];
    }
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    const hashtags = matches ? matches.map(match => match.slice(1).toLowerCase()) : [];
    console.log(`extractHashtags: Extracted ${hashtags.length} hashtags from text: ${hashtags}`);
    return hashtags;
}

// Utility function to clean text (lowercase and remove punctuation)
function cleanText(text) {
    if (!text) {
        console.log('cleanText: No text provided, returning empty string');
        return '';
    }
    const cleaned = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    console.log(`cleanText: Cleaned text from "${text.substring(0, 50)}..." to "${cleaned.substring(0, 50)}..."`);
    return cleaned;
}

// Field mappings for each dataset/model
const fieldMappings = {
    'Reddit': {
        date: doc => {
            const date = moment.unix(doc.created_utc).toDate();
            console.log(`Reddit date: ${doc.created_utc} -> ${date}`);
            return date;
        },
        hashtags: doc => extractHashtags(doc.selftext),
        score: doc => {
            const score = doc.score || 0;
            console.log(`Reddit score: ${score}`);
            return score;
        },
        author: doc => {
            const author = doc.author || 'unknown';
            console.log(`Reddit author: ${author}`);
            return author;
        },
        num_comments: doc => {
            const num = doc.num_comments || 0;
            console.log(`Reddit num_comments: ${num}`);
            return num;
        },
        text: doc => {
            const text = doc.selftext || '';
            console.log(`Reddit text: "${text.substring(0, 50)}..."`);
            return text;
        }
    },
    'Covid19Twitter2020': {
        date: doc => {
            const date = moment(doc.created_at, 'ddd MMM DD HH:mm:ss Z YYYY').toDate();
            console.log(`Covid19Twitter2020 date: ${doc.created_at} -> ${date}`);
            return date;
        },
        hashtags: doc => Array.isArray(doc.hashtags) ? doc.hashtags.map(tag => tag.toLowerCase()) : extractHashtags(doc.original_text),
        score: doc => {
            const score = (doc.favorite_count || 0) + (doc.retweet_count || 0);
            console.log(`Covid19Twitter2020 score: favorite_count=${doc.favorite_count}, retweet_count=${doc.retweet_count}, total=${score}`);
            return score;
        },
        author: doc => {
            const author = doc.original_author || 'unknown';
            console.log(`Covid19Twitter2020 author: ${author}`);
            return author;
        },
        num_comments: doc => {
            console.log('Covid19Twitter2020 num_comments: Not available, returning 0');
            return 0;
        },
        text: doc => {
            const text = doc.original_text || '';
            console.log(`Covid19Twitter2020 text: "${text.substring(0, 50)}..."`);
            return text;
        }
    },
    'Covid19Twitter2021': {
        date: doc => {
            const date = moment(doc.created_at, 'ddd MMM DD HH:mm:ss Z YYYY').toDate();
            console.log(`Covid19Twitter2021 date: ${doc.created_at} -> ${date}`);
            return date;
        },
        hashtags: doc => Array.isArray(doc.hashtags) ? doc.hashtags.map(tag => tag.toLowerCase()) : extractHashtags(doc.original_text),
        score: doc => {
            const score = (doc.favorite_count || 0) + (doc.retweet_count || 0);
            console.log(`Covid19Twitter2021 score: favorite_count=${doc.favorite_count}, retweet_count=${doc.retweet_count}, total=${score}`);
            return score;
        },
        author: doc => {
            const author = doc.original_author || 'unknown';
            console.log(`Covid19Twitter2021 author: ${author}`);
            return author;
        },
        num_comments: doc => {
            console.log('Covid19Twitter2021 num_comments: Not available, returning 0');
            return 0;
        },
        text: doc => {
            const text = doc.original_text || '';
            console.log(`Covid19Twitter2021 text: "${text.substring(0, 50)}..."`);
            return text;
        }
    },
    'Sentiment140': {
        date: doc => {
            const date = moment(doc.date, 'ddd MMM DD HH:mm:ss Z YYYY').toDate();
            console.log(`Sentiment140 date: ${doc.date} -> ${date}`);
            return date;
        },
        hashtags: doc => extractHashtags(doc.text),
        score: doc => {
            console.log('Sentiment140 score: No engagement metric, returning 0');
            return 0;
        },
        author: doc => {
            const author = doc.user || 'unknown';
            console.log(`Sentiment140 author: ${author}`);
            return author;
        },
        num_comments: doc => {
            console.log('Sentiment140 num_comments: Not available, returning 0');
            return 0;
        },
        text: doc => {
            const text = doc.text || '';
            console.log(`Sentiment140 text: "${text.substring(0, 50)}..."`);
            return text;
        }
    },
    'TwitterUSAirlineSentiment': {
        date: doc => {
            const date = moment(doc.date, 'ddd MMM DD HH:mm:ss Z YYYY').toDate();
            console.log(`TwitterUSAirlineSentiment date: ${doc.date} -> ${date}`);
            return date;
        },
        hashtags: doc => extractHashtags(doc.text),
        score: doc => {
            const score = doc.retweet_count || 0;
            console.log(`TwitterUSAirlineSentiment score: retweet_count=${score}`);
            return score;
        },
        author: doc => {
            const author = doc.name || 'unknown';
            console.log(`TwitterUSAirlineSentiment author: ${author}`);
            return author;
        },
        num_comments: doc => {
            console.log('TwitterUSAirlineSentiment num_comments: Not available, returning 0');
            return 0;
        },
        text: doc => {
            const text = doc.text || '';
            console.log(`TwitterUSAirlineSentiment text: "${text.substring(0, 50)}..."`);
            return text;
        }
    },
    'GeotagNintendo': {
        date: doc => {
            const date = moment(doc.created_at, 'ddd MMM DD HH:mm:ss Z YYYY').toDate();
            console.log(`GeotagNintendo date: ${doc.created_at} -> ${date}`);
            return date;
        },
        hashtags: doc => extractHashtags(doc.text),
        score: doc => {
            const score = (doc.favorite_count || 0) + (doc.retweet_count || 0);
            console.log(`GeotagNintendo score: favorite_count=${doc.favorite_count}, retweet_count=${doc.retweet_count}, total=${score}`);
            return score;
        },
        author: doc => {
            const author = doc.user && doc.user.screen_name ? doc.user.screen_name : 'unknown';
            console.log(`GeotagNintendo author: ${author}`);
            return author;
        },
        num_comments: doc => {
            console.log('GeotagNintendo num_comments: Not available, returning 0');
            return 0;
        },
        text: doc => {
            const text = doc.text || '';
            console.log(`GeotagNintendo text: "${text.substring(0, 50)}..."`);
            return text;
        }
    }
};

// Function to get models based on dataset
function getModels(dataset) {
    dataset = dataset.toLowerCase();
    console.log(`getModels: Processing dataset "${dataset}"`);
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
    console.log(`getModels: Returning ${models.length} models: ${models.map(m => m.modelName).join(', ')}`);
    return models;
}

// **Endpoint 1: /trending_hashtags**
async function trendingHashtags(req, res) {
    console.log('trendingHashtags: Endpoint called');
    const dataset = req.query.dataset || 'combined';
    console.log(`trendingHashtags: Dataset selected: ${dataset}`);
    const models = getModels(dataset);

    if (models.length === 0) {
        console.log('trendingHashtags: Invalid dataset, returning 400');
        return res.status(400).json({ error: 'Invalid dataset' });
    }

    const dailyHashtags = {};

    for (const model of models) {
        const modelName = model.modelName;
        console.log(`trendingHashtags: Processing model ${modelName}`);
        const cursor = model.find().cursor();

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const mapping = fieldMappings[modelName];
            if (!mapping) {
                console.log(`trendingHashtags: No mapping for ${modelName}, skipping document`);
                continue;
            }

            const date = mapping.date(doc);
            if (!date || isNaN(date)) {
                console.log('trendingHashtags: Invalid date, skipping document');
                continue;
            }
            const day = date.toISOString().slice(0, 10); // YYYY-MM-DD
            let hashtags = mapping.hashtags(doc);
            if (!Array.isArray(hashtags)) {
                console.log('trendingHashtags: Hashtags is not an array, setting to empty');
                hashtags = [];
            }

            if (hashtags.length > 0) {
                if (!dailyHashtags[day]) dailyHashtags[day] = {};
                for (const tag of hashtags) {
                    if (!dailyHashtags[day][tag]) dailyHashtags[day][tag] = 0;
                    dailyHashtags[day][tag] += 1;
                }
                console.log(`trendingHashtags: Added ${hashtags.length} hashtags for day ${day}`);
            }
        }
    }

    const trending = {};
    for (const day in dailyHashtags) {
        const tags = dailyHashtags[day];
        const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1]);
        trending[day] = sortedTags.slice(0, 5).map(([tag, count]) => ({ tag, count }));
        console.log(`trendingHashtags: Top 5 for ${day}: ${JSON.stringify(trending[day])}`);
    }

    console.log('trendingHashtags: Sending response');
    res.json(trending);
}

// **Endpoint 2: /engagement_distribution**
async function engagementDistribution(req, res) {
    console.log('engagementDistribution: Endpoint called');
    const dataset = req.query.dataset || 'combined';
    console.log(`engagementDistribution: Dataset selected: ${dataset}`);
    const models = getModels(dataset);

    if (models.length === 0) {
        console.log('engagementDistribution: Invalid dataset, returning 400');
        return res.status(400).json({ error: 'Invalid dataset' });
    }

    const bins = [0, 1, 5, 10, 20, 50, 100, 500, Infinity];
    const binLabels = ['0', '1-4', '5-9', '10-19', '20-49', '50-99', '100-499', '500+'];
    const histogram = {};
    binLabels.forEach(label => histogram[label] = 0);

    for (const model of models) {
        const modelName = model.modelName;
        console.log(`engagementDistribution: Processing model ${modelName}`);
        const cursor = model.find().cursor();

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const mapping = fieldMappings[modelName];
            if (!mapping) {
                console.log(`engagementDistribution: No mapping for ${modelName}, skipping document`);
                continue;
            }

            const score = mapping.score(doc);
            if (score == null) {
                console.log('engagementDistribution: Score is null, skipping document');
                continue;
            }

            let binIndex = bins.findIndex((bin, i) => score >= bin && score < bins[i + 1]);
            if (binIndex === -1) binIndex = bins.length - 1; // Last bin (500+)
            const label = binLabels[binIndex];
            histogram[label] += 1;
            console.log(`engagementDistribution: Score ${score} placed in bin ${label}`);
        }
    }

    console.log(`engagementDistribution: Histogram: ${JSON.stringify(histogram)}`);
    res.json(histogram);
}

// **Endpoint 3: /user_activity**
async function userActivity(req, res) {
    console.log('userActivity: Endpoint called');
    const dataset = req.query.dataset || 'combined';
    console.log(`userActivity: Dataset selected: ${dataset}`);
    const models = getModels(dataset);

    if (models.length === 0) {
        console.log('userActivity: Invalid dataset, returning 400');
        return res.status(400).json({ error: 'Invalid dataset' });
    }

    const authorStats = {};

    for (const model of models) {
        const modelName = model.modelName;
        console.log(`userActivity: Processing model ${modelName}`);
        const cursor = model.find().cursor();

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const mapping = fieldMappings[modelName];
            if (!mapping) {
                console.log(`userActivity: No mapping for ${modelName}, skipping document`);
                continue;
            }

            const author = mapping.author(doc);
            const score = mapping.score(doc);

            if (author && score != null) {
                if (!authorStats[author]) {
                    authorStats[author] = { post_count: 0, total_score: 0 };
                }
                authorStats[author].post_count += 1;
                authorStats[author].total_score += score;
                console.log(`userActivity: Updated stats for ${author}: posts=${authorStats[author].post_count}, total_score=${authorStats[author].total_score}`);
            }
        }
    }

    const results = Object.entries(authorStats).map(([author, stats]) => ({
        author,
        post_count: stats.post_count,
        avg_score: stats.total_score / stats.post_count
    }));
    results.sort((a, b) => b.post_count - a.post_count);
    const top10 = results.slice(0, 10);
    console.log(`userActivity: Top 10 authors: ${JSON.stringify(top10)}`);
    res.json(top10);
}

// **Endpoint 4: /engagement_by_time_of_day**
async function engagementByTimeOfDay(req, res) {
    console.log('engagementByTimeOfDay: Endpoint called');
    const dataset = req.query.dataset || 'combined';
    console.log(`engagementByTimeOfDay: Dataset selected: ${dataset}`);
    const models = getModels(dataset);

    if (models.length === 0) {
        console.log('engagementByTimeOfDay: Invalid dataset, returning 400');
        return res.status(400).json({ error: 'Invalid dataset' });
    }

    const hourlyStats = {};
    for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0');
        hourlyStats[hourStr] = { total_score: 0, total_comments: 0, count: 0 };
    }

    let totalProcessed = 0; // Track processed documents

    for (const model of models) {
        const modelName = model.modelName;
        const docCount = await model.countDocuments();
        console.log(`engagementByTimeOfDay: Model ${modelName} has ${docCount} documents`);

        const cursor = model.find().cursor();

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const mapping = fieldMappings[modelName];
            if (!mapping) {
                console.log(`engagementByTimeOfDay: No mapping for ${modelName}, skipping document`);
                continue;
            }

            const date = mapping.date(doc);
            if (!date || isNaN(date.getTime())) { // Use getTime() for stricter invalid check
                console.log(`engagementByTimeOfDay: Invalid date in ${modelName}: ${JSON.stringify(doc.created_at || doc.created_utc || doc.date)}`);
                continue;
            }

            const hour = date.getUTCHours().toString().padStart(2, '0');
            const score = mapping.score(doc);
            const num_comments = mapping.num_comments(doc);

            if (score != null && num_comments != null) {
                hourlyStats[hour].total_score += score;
                hourlyStats[hour].total_comments += num_comments;
                hourlyStats[hour].count += 1;
                totalProcessed++;
                // Uncomment for detailed debugging
                // console.log(`engagementByTimeOfDay: Hour ${hour} updated - score: ${score}, comments: ${num_comments}`);
            }
        }
    }

    console.log(`engagementByTimeOfDay: Total documents processed: ${totalProcessed}`);

    for (const hour in hourlyStats) {
        const stats = hourlyStats[hour];
        stats.avg_score = stats.count > 0 ? stats.total_score / stats.count : 0;
        stats.avg_comments = stats.count > 0 ? stats.total_comments / stats.count : 0;
        delete stats.total_score;
        delete stats.total_comments;
        delete stats.count;
        console.log(`engagementByTimeOfDay: Hour ${hour} - avg_score: ${stats.avg_score}, avg_comments: ${stats.avg_comments}`);
    }

    res.json(hourlyStats);
}

// **Endpoint 5: /trend_analysis**
async function trendAnalysis(req, res) {
    console.log('trendAnalysis: Endpoint called');
    const dataset = req.query.dataset || 'combined';
    console.log(`trendAnalysis: Dataset selected: ${dataset}`);
    const models = getModels(dataset);

    if (models.length === 0) {
        console.log('trendAnalysis: Invalid dataset, returning 400');
        return res.status(400).json({ error: 'Invalid dataset' });
    }

    const weeklySentiments = {};

    for (const model of models) {
        const modelName = model.modelName;
        console.log(`trendAnalysis: Processing model ${modelName}`);
        const cursor = model.find().cursor();

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const mapping = fieldMappings[modelName];
            if (!mapping) {
                console.log(`trendAnalysis: No mapping for ${modelName}, skipping document`);
                continue;
            }

            const date = mapping.date(doc);
            const text = mapping.text(doc);
            if (!date || !text || text.trim() === '') {
                console.log('trendAnalysis: Invalid date or empty text, skipping document');
                continue;
            }

            // Simple week calculation (year-weekNumber)
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth();
            const day = date.getUTCDate();
            const tempDate = new Date(Date.UTC(year, month, day));
            const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
            const week = Math.floor((tempDate - firstDayOfYear) / (7 * 24 * 60 * 60 * 1000));
            const weekKey = `${year}-${week.toString().padStart(2, '0')}`;

            const score = sentiment.polarity_scores(cleanText(text)).compound;
            if (!weeklySentiments[weekKey]) weeklySentiments[weekKey] = [];
            weeklySentiments[weekKey].push(score);
            console.log(`trendAnalysis: Week ${weekKey} - Sentiment score: ${score}`);
        }
    }

    const weeklyAvg = {};
    for (const week in weeklySentiments) {
        const scores = weeklySentiments[week];
        const sum = scores.reduce((a, b) => a + b, 0);
        weeklyAvg[week] = sum / scores.length;
        console.log(`trendAnalysis: Week ${week} - Average sentiment: ${weeklyAvg[week]}`);
    }

    res.json(weeklyAvg);
}

// Export the controllers
module.exports = {
    trendingHashtags,
    engagementDistribution,
    userActivity,
    engagementByTimeOfDay,
    trendAnalysis
};