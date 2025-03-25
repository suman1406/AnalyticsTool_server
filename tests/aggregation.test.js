// controllers.test.js

const controllers = require('../controllers/aggregationController'); // adjust path to your module file
const Sentiment = require('../models/Sentiment140');
const Reddit = require('../models/Reddit');
const GeoNintendo = require('../models/GeotagNintendo');
const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
const Covid19TwitterAugSep2020 = require('../models/Covid19TwitterAugSep2020');
const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');

// Create mock response object
const createRes = () => {
    const res = {};
    res.json = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    console.error.mockRestore();
});

describe('Controllers Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSentimentSummary', () => {
        it('should return sentiment summary successfully', async () => {
            // Arrange
            const req = {};
            const res = createRes();
            // Mock Sentiment model methods
            Sentiment.countDocuments = jest.fn().mockResolvedValue(100);
            // First aggregate call returns metrics, second returns top users
            Sentiment.aggregate = jest.fn()
                .mockResolvedValueOnce([
                    {
                        avgTextLength: 50,
                        earliestDate: new Date('2021-01-01'),
                        latestDate: new Date('2021-01-31')
                    }
                ])
                .mockResolvedValueOnce([
                    { _id: 'user1', count: 20 },
                    { _id: 'user2', count: 15 }
                ]);

            // Act
            await controllers.getSentimentSummary(req, res);

            // Assert
            expect(Sentiment.countDocuments).toHaveBeenCalledWith({});
            expect(Sentiment.aggregate).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                dataset: "Sentiment140",
                totalRecords: 100,
                avgTextLength: 50,
                earliestDate: new Date('2021-01-01'),
                latestDate: new Date('2021-01-31'),
                topUsers: [
                    { _id: 'user1', count: 20 },
                    { _id: 'user2', count: 15 }
                ]
            });
        });

        it('should handle errors in getSentimentSummary', async () => {
            const req = {};
            const res = createRes();
            const error = new Error("Test error");
            Sentiment.countDocuments = jest.fn().mockRejectedValue(error);

            await controllers.getSentimentSummary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
        });
    });

    describe('getRedditSummary', () => {
        it('should return reddit summary successfully', async () => {
            const req = {};
            const res = createRes();

            // Mock methods
            Reddit.countDocuments = jest.fn().mockResolvedValue(200);
            Reddit.aggregate = jest.fn().mockResolvedValue([
                {
                    dailySummary: [
                        { _id: '2021-01-01', postCount: 10, avgScore: 5, totalComments: 20 }
                    ],
                    hourlySummary: [
                        { _id: 0, postCount: 2 },
                        { _id: 1, postCount: 3 }
                    ]
                }
            ]);

            await controllers.getRedditSummary(req, res);

            expect(Reddit.countDocuments).toHaveBeenCalledWith({});
            expect(Reddit.aggregate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                dataset: "Reddit",
                totalRecords: 200,
                dailySummary: [
                    { _id: '2021-01-01', postCount: 10, avgScore: 5, totalComments: 20 }
                ],
                hourlySummary: [
                    { _id: 0, postCount: 2 },
                    { _id: 1, postCount: 3 }
                ]
            });
        });

        it('should handle errors in getRedditSummary', async () => {
            const req = {};
            const res = createRes();
            const error = new Error("Test error");
            Reddit.countDocuments = jest.fn().mockRejectedValue(error);

            await controllers.getRedditSummary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
        });
    });

    describe('getGeoNintendoSummary', () => {
        it('should return GeoNintendo summary successfully', async () => {
            const req = {};
            const res = createRes();

            // Mock methods for GeoNintendo
            GeoNintendo.countDocuments = jest.fn().mockResolvedValue(150);
            GeoNintendo.aggregate = jest.fn()
                .mockResolvedValueOnce([
                    { _id: "Place1", count: 30, avgRetweet: 2, avgFavorite: 5 }
                ])
                .mockResolvedValueOnce([
                    { _id: "2021-01-01", count: 10, avgRetweet: 2, avgFavorite: 3 }
                ]);

            await controllers.getGeoNintendoSummary(req, res);

            expect(GeoNintendo.countDocuments).toHaveBeenCalledWith({});
            expect(GeoNintendo.aggregate).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                dataset: "GeoNintendo",
                totalRecords: 150,
                topPlaces: [
                    { _id: "Place1", count: 30, avgRetweet: 2, avgFavorite: 5 }
                ],
                dailySummary: [
                    { _id: "2021-01-01", count: 10, avgRetweet: 2, avgFavorite: 3 }
                ]
            });
        });

        it('should handle errors in getGeoNintendoSummary', async () => {
            const req = {};
            const res = createRes();
            const error = new Error("Test error");
            GeoNintendo.countDocuments = jest.fn().mockRejectedValue(error);

            await controllers.getGeoNintendoSummary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
        });
    });

    describe('getCovid19Twitter2020Summary', () => {
        it('should return Covid19Twitter2020 summary successfully', async () => {
            const req = {};
            const res = createRes();

            Covid19Twitter2020.countDocuments = jest.fn().mockResolvedValue(80);
            Covid19Twitter2020.aggregate = jest.fn().mockResolvedValue([
                { _id: '2021-02-01', tweetCount: 5, avgFavorite: 10, avgRetweet: 2, totalFavorite: 50, totalRetweet: 10 }
            ]);

            await controllers.getCovid19Twitter2020Summary(req, res);

            expect(Covid19Twitter2020.countDocuments).toHaveBeenCalledWith({});
            expect(Covid19Twitter2020.aggregate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                dataset: "Covid19Twitter2020",
                totalRecords: 80,
                dailySummary: [
                    { _id: '2021-02-01', tweetCount: 5, avgFavorite: 10, avgRetweet: 2, totalFavorite: 50, totalRetweet: 10 }
                ]
            });
        });

        it('should handle errors in getCovid19Twitter2020Summary', async () => {
            const req = {};
            const res = createRes();
            const error = new Error("Test error");
            Covid19Twitter2020.countDocuments = jest.fn().mockRejectedValue(error);

            await controllers.getCovid19Twitter2020Summary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
        });
    });

    describe('getCovid19Twitter2021Summary', () => {
        it('should return Covid19Twitter2021 summary successfully', async () => {
            const req = {};
            const res = createRes();

            Covid19Twitter2021.countDocuments = jest.fn().mockResolvedValue(90);
            Covid19Twitter2021.aggregate = jest.fn().mockResolvedValue([
                { _id: '2021-03-01', tweetCount: 8, avgFavorite: 15, avgRetweet: 3, totalFavorite: 120, totalRetweet: 24 }
            ]);

            await controllers.getCovid19Twitter2021Summary(req, res);

            expect(Covid19Twitter2021.countDocuments).toHaveBeenCalledWith({});
            expect(Covid19Twitter2021.aggregate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                dataset: "Covid19Twitter2021",
                totalRecords: 90,
                dailySummary: [
                    { _id: '2021-03-01', tweetCount: 8, avgFavorite: 15, avgRetweet: 3, totalFavorite: 120, totalRetweet: 24 }
                ]
            });
        });

        it('should handle errors in getCovid19Twitter2021Summary', async () => {
            const req = {};
            const res = createRes();
            const error = new Error("Test error");
            Covid19Twitter2021.countDocuments = jest.fn().mockRejectedValue(error);

            await controllers.getCovid19Twitter2021Summary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
        });
    });

    describe('getCovid19TwitterAugSep2020Summary', () => {
        it('should return Covid19TwitterAugSep2020 summary successfully', async () => {
            const req = {};
            const res = createRes();

            Covid19TwitterAugSep2020.countDocuments = jest.fn().mockResolvedValue(70);
            Covid19TwitterAugSep2020.aggregate = jest.fn().mockResolvedValue([
                { _id: '2021-04-01', tweetCount: 4, avgFavorite: 20, avgRetweet: 5, totalFavorite: 80, totalRetweet: 20 }
            ]);

            await controllers.getCovid19TwitterAugSep2020Summary(req, res);

            expect(Covid19TwitterAugSep2020.countDocuments).toHaveBeenCalledWith({});
            expect(Covid19TwitterAugSep2020.aggregate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                dataset: "Covid19TwitterAugSep2020",
                totalRecords: 70,
                dailySummary: [
                    { _id: '2021-04-01', tweetCount: 4, avgFavorite: 20, avgRetweet: 5, totalFavorite: 80, totalRetweet: 20 }
                ]
            });
        });

        it('should handle errors in getCovid19TwitterAugSep2020Summary', async () => {
            const req = {};
            const res = createRes();
            const error = new Error("Test error");
            Covid19TwitterAugSep2020.countDocuments = jest.fn().mockRejectedValue(error);

            await controllers.getCovid19TwitterAugSep2020Summary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
        });
    });

    describe('getTwitterAirlineSentimentSummary', () => {
        it('should return TwitterUSAirlineSentiment summary successfully', async () => {
            const req = {};
            const res = createRes();

            TwitterUSAirlineSentiment.countDocuments = jest.fn().mockResolvedValue(60);
            TwitterUSAirlineSentiment.aggregate = jest.fn().mockResolvedValue([
                { _id: 'positive', tweetCount: 30, avgConfidence: 0.8 },
                { _id: 'negative', tweetCount: 20, avgConfidence: 0.7 }
            ]);

            await controllers.getTwitterAirlineSentimentSummary(req, res);

            expect(TwitterUSAirlineSentiment.countDocuments).toHaveBeenCalledWith({});
            expect(TwitterUSAirlineSentiment.aggregate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                dataset: "TwitterUSAirlineSentiment",
                totalRecords: 60,
                sentimentSummary: [
                    { _id: 'positive', tweetCount: 30, avgConfidence: 0.8 },
                    { _id: 'negative', tweetCount: 20, avgConfidence: 0.7 }
                ]
            });
        });

        it('should handle errors in getTwitterAirlineSentimentSummary', async () => {
            const req = {};
            const res = createRes();
            const error = new Error("Test error");
            TwitterUSAirlineSentiment.countDocuments = jest.fn().mockRejectedValue(error);

            await controllers.getTwitterAirlineSentimentSummary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
        });
    });

    describe('getCombinedHourlySummary', () => {
        it('should return combined hourly summary successfully', async () => {
            const req = {};
            const res = createRes();

            // Prepare sample hourly aggregates for each dataset.
            const sentimentHourlySample = [
                { _id: 0, count: 10 },
                { _id: 1, count: 15 }
            ];
            const redditHourlySample = [
                { _id: 0, count: 5 },
                { _id: 2, count: 20 }
            ];
            const geoHourlySample = [
                { _id: 1, count: 10 },
                { _id: 2, count: 5 }
            ];

            // Mock the aggregate calls on each model.
            Sentiment.aggregate = jest.fn().mockResolvedValue(sentimentHourlySample);
            Reddit.aggregate = jest.fn().mockResolvedValue(redditHourlySample);
            GeoNintendo.aggregate = jest.fn().mockResolvedValue(geoHourlySample);

            await controllers.getCombinedHourlySummary(req, res);

            // The combined summary should sum counts by hour.
            // Hour 0: 10 (sentiment) + 5 (reddit) = 15
            // Hour 1: 15 (sentiment) + 10 (geo) = 25
            // Hour 2: 20 (reddit) + 5 (geo) = 25
            expect(Sentiment.aggregate).toHaveBeenCalled();
            expect(Reddit.aggregate).toHaveBeenCalled();
            expect(GeoNintendo.aggregate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                dataset: "Combined Hourly Summary",
                hourlySummary: [
                    { hour: 0, count: 15 },
                    { hour: 1, count: 25 },
                    { hour: 2, count: 25 }
                ]
            });
        });

        it('should handle errors in getCombinedHourlySummary', async () => {
            const req = {};
            const res = createRes();
            const error = new Error("Test error");
            Sentiment.aggregate = jest.fn().mockRejectedValue(error);

            await controllers.getCombinedHourlySummary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
        });
    });
});
