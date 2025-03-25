// analysisController.test.js

// tests/analysis.test.js
jest.setTimeout(30000); // Increase timeout if needed

// Suppress all console output globally.
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const moment = require('moment');
const vader = require('vader-sentiment');
const analysisController = require('../controllers/hashtagController'); // adjust path as needed

// Import the models so we can override their methods
const Reddit = require('../models/Reddit');
const Sentiment140 = require('../models/Sentiment140');
const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
const GeotagNintendo = require('../models/GeotagNintendo');

// Helper: create a fake response object.
function createRes() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

// Helper: create a mock cursor that yields the given docs one by one.
function createMockCursor(docs) {
  let index = 0;
  return {
    async next() {
      return index < docs.length ? docs[index++] : null;
    }
  };
}

describe('Analysis Controller Endpoints', () => {
  describe('trendingHashtags', () => {
    it('should return trending hashtags for Reddit dataset', async () => {
      // Create a dummy Reddit document.
      // Use created_utc as seconds since epoch.
      const dummyDoc = {
        created_utc: 1630000000, // for example
        selftext: "#Hello #World #hello",
        score: 10,
        author: "user1",
        num_comments: 5
      };
      // Override Reddit.find() to return a mock cursor yielding one document.
      Reddit.find = jest.fn().mockReturnValue({
        cursor: () => createMockCursor([dummyDoc])
      });

      const req = { query: { dataset: 'reddit' } };
      const res = createRes();

      await analysisController.trendingHashtags(req, res);

      // Compute expected day key.
      const day = moment.unix(dummyDoc.created_utc).toISOString().slice(0, 10);
      // Expected hashtags: from "#Hello #World #hello" => ["hello", "world", "hello"]
      // So counts: hello: 2, world: 1.
      const expectedTrending = {};
      expectedTrending[day] = [
        { tag: "hello", count: 2 },
        { tag: "world", count: 1 }
      ];
      // We check that res.json was called with an object containing the expected day.
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result).toHaveProperty(day);
      // Check that the sorted hashtags match.
      expect(result[day]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tag: "hello", count: 2 }),
          expect.objectContaining({ tag: "world", count: 1 })
        ])
      );
    });
  });

  describe('engagementDistribution', () => {
    it('should return a histogram for Reddit dataset', async () => {
      // Dummy doc for Reddit with score
      const dummyDoc = {
        created_utc: 1630000000,
        selftext: "Test post",
        score: 15,
        author: "user1",
        num_comments: 3
      };
      Reddit.find = jest.fn().mockReturnValue({
        cursor: () => createMockCursor([dummyDoc])
      });

      const req = { query: { dataset: 'reddit' } };
      const res = createRes();

      await analysisController.engagementDistribution(req, res);

      expect(res.json).toHaveBeenCalled();
      // For a score of 15, using bins [0, 1, 5, 10, 20, 50, 100, 500, Infinity]
      // Score 15 should fall into the bin "10-19"
      const histogram = res.json.mock.calls[0][0];
      expect(histogram['10-19']).toBe(1);
    });
  });

  describe('userActivity', () => {
    it('should return top 10 authors for Reddit dataset', async () => {
      // Create two dummy Reddit docs with same author.
      const doc1 = {
        created_utc: 1630000000,
        selftext: "Post one",
        score: 10,
        author: "userA",
        num_comments: 2
      };
      const doc2 = {
        created_utc: 1630000100,
        selftext: "Post two",
        score: 20,
        author: "userA",
        num_comments: 3
      };
      Reddit.find = jest.fn().mockReturnValue({
        cursor: () => createMockCursor([doc1, doc2])
      });

      const req = { query: { dataset: 'reddit' } };
      const res = createRes();

      await analysisController.userActivity(req, res);

      expect(res.json).toHaveBeenCalled();
      const results = res.json.mock.calls[0][0];
      // Expect one author "userA" with post_count=2 and avg_score = (10+20)/2 = 15.
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ author: "userA", post_count: 2, avg_score: 15 })
        ])
      );
    });
  });

  describe('engagementByTimeOfDay', () => {
    it('should return hourly stats for Reddit dataset', async () => {
      // Create a dummy Reddit doc.
      const dummyDoc = {
        created_utc: 1630000000, // some time
        selftext: "Test post",
        score: 10,
        author: "user1",
        num_comments: 4
      };
      // Override countDocuments and find cursor.
      Reddit.countDocuments = jest.fn().mockResolvedValue(1);
      Reddit.find = jest.fn().mockReturnValue({
        cursor: () => createMockCursor([dummyDoc])
      });

      const req = { query: { dataset: 'reddit' } };
      const res = createRes();

      await analysisController.engagementByTimeOfDay(req, res);

      expect(res.json).toHaveBeenCalled();
      const stats = res.json.mock.calls[0][0];
      // Get the hour (UTC) from dummyDoc
      const date = moment.unix(dummyDoc.created_utc).toDate();
      const hourStr = date.getUTCHours().toString().padStart(2, '0');
      // Check that hour bucket has nonzero avg_score and avg_comments
      expect(stats[hourStr].avg_score).toBeGreaterThan(0);
      expect(stats[hourStr].avg_comments).toBeGreaterThan(0);
    });
  });

  describe('trendAnalysis', () => {
    it('should return weekly average sentiment for Sentiment140 dataset', async () => {
      // Create a dummy Sentiment140 document.
      // Use a date string in the expected format.
      const dummyDoc = {
        date: "Wed Sep 01 12:00:00 +0000 2021",
        text: "I love testing #Jest",
        user: "tester"
      };
      // Override Sentiment140.find to return a cursor with one doc.
      Sentiment140.find = jest.fn().mockReturnValue({
        cursor: () => createMockCursor([dummyDoc])
      });

      const req = { query: { dataset: 'sentiment140' } };
      const res = createRes();

      await analysisController.trendAnalysis(req, res);

      expect(res.json).toHaveBeenCalled();
      const weeklyAvg = res.json.mock.calls[0][0];
      // Calculate expected week key.
      const date = moment(dummyDoc.date, 'ddd MMM DD HH:mm:ss Z YYYY').toDate();
      const year = date.getUTCFullYear();
      const tempDate = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
      const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
      const week = Math.floor((tempDate - firstDayOfYear) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = `${year}-${week.toString().padStart(2, '0')}`;
      expect(weeklyAvg).toHaveProperty(weekKey);
    });
  });
});
