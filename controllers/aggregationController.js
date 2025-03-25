require('dotenv').config();
const Sentiment = require('../models/Sentiment140');
const Reddit = require('../models/Reddit');
const GeoNintendo = require('../models/GeotagNintendo');
const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
const Covid19TwitterAugSep2020 = require('../models/Covid19TwitterAugSep2020');
const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
const Sentiment140 = require('../models/Sentiment140');

exports.getSentimentSummary = async (req, res) => {
  try {
    // Get total record count
    const totalRecords = await Sentiment.countDocuments({});

    // Compute average text length, earliest and latest date from the "date" field.
    const metrics = await Sentiment.aggregate([
      { $match: { date: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgTextLength: { $avg: { $strLenCP: "$text" } },
          earliestDate: { $min: "$date" },
          latestDate: { $max: "$date" }
        }
      }
    ]);

    // Get top 5 users by post count
    const topUsers = await Sentiment.aggregate([
      { $match: { user: { $exists: true } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      dataset: "Sentiment140",
      totalRecords,
      avgTextLength: metrics[0]?.avgTextLength || 0,
      earliestDate: metrics[0]?.earliestDate || null,
      latestDate: metrics[0]?.latestDate || null,
      topUsers
    });
  } catch (error) {
    console.error("Error fetching sentiment summary:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getRedditSummary = async (req, res) => {
  try {
    // Total number of documents in the Reddit dataset
    const totalRecords = await Reddit.countDocuments({});

    // Aggregation pipeline using $facet to get both daily and hourly summaries
    const analytics = await Reddit.aggregate([
      {
        $facet: {
          // Daily summary: Group by day (YYYY-MM-DD)
          dailySummary: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$created_utc" } }
                },
                postCount: { $sum: 1 },
                avgScore: { $avg: "$score" },
                totalComments: { $sum: "$num_comments" }
              }
            },
            { $sort: { _id: 1 } }
          ],
          // Hourly summary: Group by hour of day (0-23) across all documents
          hourlySummary: [
            {
              $group: {
                _id: { $hour: { $toDate: "$created_utc" } },
                postCount: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    res.json({
      dataset: "Reddit",
      totalRecords,
      dailySummary: analytics[0].dailySummary,
      hourlySummary: analytics[0].hourlySummary
    });
  } catch (error) {
    console.error("Error fetching Reddit summary:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getGeoNintendoSummary = async (req, res) => {
  try {
    // Total number of documents in the GeoNintendo dataset
    const totalRecords = await GeoNintendo.countDocuments({});

    // Top Places: group by the "place" field (ignoring nulls)
    const topPlaces = await GeoNintendo.aggregate([
      { $match: { place: { $ne: null } } },
      {
        $group: {
          _id: "$place",
          count: { $sum: 1 },
          avgRetweet: { $avg: "$retweet_count" },
          avgFavorite: { $avg: "$favorite_count" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Daily Summary: group posts by day (converted from created_at)
    const dailySummary = await GeoNintendo.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$created_at" }
            }
          },
          count: { $sum: 1 },
          avgRetweet: { $avg: "$retweet_count" },
          avgFavorite: { $avg: "$favorite_count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      dataset: "GeoNintendo",
      totalRecords,
      topPlaces,
      dailySummary
    });
  } catch (error) {
    console.error("Error fetching GeoNintendo summary:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * 1. GET /api/covid19twitter2020/summary
 * Aggregate tweets by day and compute daily tweet count, average favorite, average retweet,
 * total favorites, and total retweets for the Covid19 Twitter dataset (Apr-Jun 2020).
 */
exports.getCovid19Twitter2020Summary = async (req, res) => {
  try {
    const totalRecords = await Covid19Twitter2020.countDocuments({});
    const dailySummary = await Covid19Twitter2020.aggregate([
      { $match: { created_at: { $exists: true } } },
      { 
        $addFields: { 
          dateConverted: { $toDate: "$created_at" } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateConverted" } },
          tweetCount: { $sum: 1 },
          avgFavorite: { $avg: "$favorite_count" },
          avgRetweet: { $avg: "$retweet_count" },
          totalFavorite: { $sum: "$favorite_count" },
          totalRetweet: { $sum: "$retweet_count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({
      dataset: "Covid19Twitter2020",
      totalRecords,
      dailySummary
    });
  } catch (error) {
    console.error("Error in getCovid19Twitter2020Summary:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * 2. GET /api/covid19twitter2021/summary
 * Aggregate tweets by day and compute daily tweet count, average favorite, average retweet,
 * total favorites, and total retweets for the Covid19 Twitter dataset (Apr-Jun 2021).
 */
exports.getCovid19Twitter2021Summary = async (req, res) => {
  try {
    const totalRecords = await Covid19Twitter2021.countDocuments({});
    const dailySummary = await Covid19Twitter2021.aggregate([
      { $match: { created_at: { $exists: true } } },
      { 
        $addFields: { 
          dateConverted: { $toDate: "$created_at" } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateConverted" } },
          tweetCount: { $sum: 1 },
          avgFavorite: { $avg: "$favorite_count" },
          avgRetweet: { $avg: "$retweet_count" },
          totalFavorite: { $sum: "$favorite_count" },
          totalRetweet: { $sum: "$retweet_count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({
      dataset: "Covid19Twitter2021",
      totalRecords,
      dailySummary
    });
  } catch (error) {
    console.error("Error in getCovid19Twitter2021Summary:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * 3. GET /api/covid19twitteraugsep2020/summary
 * Aggregate tweets by day and compute daily tweet count, average favorite, average retweet,
 * total favorites, and total retweets for the Covid19 Twitter dataset (Aug-Sep 2020).
 */
exports.getCovid19TwitterAugSep2020Summary = async (req, res) => {
  try {
    const totalRecords = await Covid19TwitterAugSep2020.countDocuments({});
    const dailySummary = await Covid19TwitterAugSep2020.aggregate([
      { $match: { created_at: { $exists: true } } },
      { 
        $addFields: { 
          dateConverted: { $toDate: "$created_at" } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateConverted" } },
          tweetCount: { $sum: 1 },
          avgFavorite: { $avg: "$favorite_count" },
          avgRetweet: { $avg: "$retweet_count" },
          totalFavorite: { $sum: "$favorite_count" },
          totalRetweet: { $sum: "$retweet_count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({
      dataset: "Covid19TwitterAugSep2020",
      totalRecords,
      dailySummary
    });
  } catch (error) {
    console.error("Error in getCovid19TwitterAugSep2020Summary:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * 4. GET /api/twitterairlinesentiment/summary
 * Aggregate tweets by airline sentiment and compute counts and average sentiment confidence.
 */
exports.getTwitterAirlineSentimentSummary = async (req, res) => {
  try {
    const totalRecords = await TwitterUSAirlineSentiment.countDocuments({});
    const sentimentSummary = await TwitterUSAirlineSentiment.aggregate([
      { $match: { airline_sentiment: { $exists: true } } },
      {
        $group: {
          _id: "$airline_sentiment",
          tweetCount: { $sum: 1 },
          avgConfidence: { $avg: "$airline_sentiment_confidence" }
        }
      },
      { $sort: { tweetCount: -1 } }
    ]);
    res.json({
      dataset: "TwitterUSAirlineSentiment",
      totalRecords,
      sentimentSummary
    });
  } catch (error) {
    console.error("Error in getTwitterAirlineSentimentSummary:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/combined_hourly_summary
 * Aggregate posts by hour (0-23) across all datasets.
 * For each dataset, we group by hour (after converting the appropriate date field),
 * then merge the counts for a combined view.
 */
exports.getCombinedHourlySummary = async (req, res) => {
  try {
    // For Sentiment140, assume the date field is "date"
    const sentimentHourly = await Sentiment140.aggregate([
      { $match: { date: { $exists: true } } },
      { $addFields: { dateConverted: { $toDate: "$date" } } },
      {
        $group: {
          _id: { $hour: "$dateConverted" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // For Reddit, assume the date field is "created_utc"
    const redditHourly = await Reddit.aggregate([
      { $match: { created_utc: { $exists: true } } },
      { $addFields: { dateConverted: { $toDate: "$created_utc" } } },
      {
        $group: {
          _id: { $hour: "$dateConverted" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // For GeoNintendo, assume the date field is "created_at"
    const geoHourly = await GeoNintendo.aggregate([
      { $match: { created_at: { $exists: true } } },
      { $addFields: { dateConverted: { $toDate: "$created_at" } } },
      {
        $group: {
          _id: { $hour: "$dateConverted" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Combine hourly counts from all datasets.
    // We'll merge by hour. For simplicity, we'll use an object to collect counts.
    const combinedMap = {};

    [sentimentHourly, redditHourly, geoHourly].forEach(dataset => {
      dataset.forEach(doc => {
        const hr = doc._id;
        combinedMap[hr] = (combinedMap[hr] || 0) + doc.count;
      });
    });

    // Convert the combinedMap to an array and sort by hour
    const combinedHourly = Object.keys(combinedMap).map(hour => ({
      hour: Number(hour),
      count: combinedMap[hour]
    })).sort((a, b) => a.hour - b.hour);

    res.json({
      dataset: "Combined Hourly Summary",
      hourlySummary: combinedHourly
    });
  } catch (error) {
    console.error("Error in getCombinedHourlySummary:", error);
    res.status(500).json({ error: "Server error" });
  }
};