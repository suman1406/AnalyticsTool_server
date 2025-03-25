// sentimentEndpoints.test.js
jest.setTimeout(30000); // Increase timeout to 30 seconds

// Suppress console logs globally to avoid "Cannot log after tests are done" messages.
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};

const moment = require('moment');
const vader = require('vader-sentiment');

// Import endpoints from your sentiment controller.
// Adjust the path as needed.
const {
  sentimentVader,
  authorSentiment,
  // Expose fetchData for testing override.
  fetchData
} = require('../controllers/sentimentController');

// Create a fake response object.
function createRes() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

// Override fetchData so that no real database is hit.
jest.mock('../controllers/sentimentController', () => {
  const originalModule = jest.requireActual('../controllers/sentimentController');
  return {
    ...originalModule,
    fetchData: jest.fn()
  };
});

describe('Sentiment Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sentimentVader', () => {
    it('should compute average compound score and sentiment distribution', async () => {
      // Dummy data with text field.
      const dummyData = [
        { text: "I love this product!" },
        { text: "This is terrible..." },
        { text: "Not bad, could be better." }
      ];
      // Override fetchData to return dummy data.
      require('../controllers/sentimentController').fetchData.mockResolvedValue(dummyData);

      const req = { query: { dataset: 'sentiment140' } };
      const res = createRes();

      await sentimentVader(req, res);

      // Expect res.json to be called with an object containing average_compound and sentiment_distribution.
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result).toHaveProperty('average_compound');
      expect(result).toHaveProperty('sentiment_distribution');
      expect(result.sentiment_distribution).toMatchObject({
        positive: expect.any(Number),
        negative: expect.any(Number),
        neutral: expect.any(Number)
      });
    });
  });

  describe('authorSentiment', () => {
    it('should compute average sentiment per author and return top 10', async () => {
      // Dummy data: each doc has text and author.
      const dummyData = [
        { text: "I love this!", author: "alice", dataset: "sentiment140" },
        { text: "I hate this!", author: "bob", dataset: "sentiment140" },
        { text: "I love this!", author: "alice", dataset: "sentiment140" },
        { text: "Not sure about this.", author: "charlie", dataset: "sentiment140" }
      ];
      require('../controllers/sentimentController').fetchData.mockResolvedValue(dummyData);

      const req = { query: { dataset: 'sentiment140' } };
      const res = createRes();

      await authorSentiment(req, res);

      expect(res.json).toHaveBeenCalled();
      const results = res.json.mock.calls[0][0];
      // Expect an array of objects with author, post_count, and avg_sentiment.
      expect(Array.isArray(results)).toBe(true);
      results.forEach(item => {
        expect(item).toHaveProperty('author');
        expect(item).toHaveProperty('post_count');
        expect(item).toHaveProperty('avg_sentiment');
      });
    });
  });
});