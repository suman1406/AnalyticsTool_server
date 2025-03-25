// advancedEndpoints.test.js
jest.setTimeout(30000); // Increase timeout if needed

// Suppress all console logs and errors globally.
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

const lda = require('lda');
const natural = require('natural');
const stopword = require('stopword');

// Import endpoints from your module (adjust path if needed)
const {
  topicModeling,
  topicCoherence,
  // kmeansClustering, // Uncomment if you want to test this endpoint.
  duplicateDetection
} = require('../controllers/topicClusteringController');

// Import models so we can override their methods.
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

describe('Advanced Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ----------- Topic Modeling -----------
  describe('topicModeling', () => {
    it('should return formatted topics from dummy documents', async () => {
      // Create at least 5 dummy docs with a "text" field.
      const dummyDocs = [
        { id: "d1", selftext: "Apple banana orange apple." },
        { id: "d2", selftext: "Banana apple grape banana." },
        { id: "d3", selftext: "Orange apple pear orange." },
        { id: "d4", selftext: "Grape pear apple banana." },
        { id: "d5", selftext: "Apple banana grape orange." }
      ];
      // For dataset 'reddit', fetchDocuments calls Reddit.find().
      Reddit.find = jest.fn().mockReturnValue({
        exec: () => Promise.resolve(dummyDocs)
      });
      // Ensure other models return empty.
      [Sentiment140, Covid19Twitter2020, Covid19Twitter2021, TwitterUSAirlineSentiment, GeotagNintendo]
        .forEach(Model => {
          Model.find = jest.fn().mockReturnValue({
            exec: () => Promise.resolve([])
          });
        });
      
      const req = { query: { dataset: 'reddit' } };
      const res = createRes();
      
      await topicModeling(req, res);
      
      const topics = res.json.mock.calls[0][0];
      // Expect topics to be an object with keys "Topic 1", "Topic 2", etc.
      expect(typeof topics).toBe("object");
      expect(Object.keys(topics).length).toBe(5);
      // Each topic should be an array of words.
      Object.values(topics).forEach(topicArray => {
        expect(Array.isArray(topicArray)).toBe(true);
        expect(topicArray.length).toBeGreaterThan(0);
      });
    });
  });

  // ----------- Topic Coherence -----------
  describe('topicCoherence', () => {
    it('should return coherence scores and topics from dummy documents', async () => {
      // Create dummy docs for sentiment analysis.
      const dummyDocs = [
        { id: "d1", selftext: "Apple banana orange apple." },
        { id: "d2", selftext: "Banana apple grape banana." },
        { id: "d3", selftext: "Orange apple pear orange." },
        { id: "d4", selftext: "Grape pear apple banana." },
        { id: "d5", selftext: "Apple banana grape orange." },
        { id: "d6", selftext: "Apple apple apple banana." }
      ];
      Reddit.find = jest.fn().mockReturnValue({
        exec: () => Promise.resolve(dummyDocs)
      });
      [Sentiment140, Covid19Twitter2020, Covid19Twitter2021, TwitterUSAirlineSentiment, GeotagNintendo]
        .forEach(Model => {
          Model.find = jest.fn().mockReturnValue({
            exec: () => Promise.resolve([])
          });
        });
      
      const req = { query: { dataset: 'reddit' } };
      const res = createRes();
      
      await topicCoherence(req, res);
      const result = res.json.mock.calls[0][0];
      // Expect result to have coherence_scores, avg_coherence, and topics.
      expect(result).toHaveProperty('coherence_scores');
      expect(result).toHaveProperty('avg_coherence');
      expect(result).toHaveProperty('topics');
      expect(Array.isArray(result.topics)).toBe(true);
    });
  });

  // ----------- Duplicate Detection -----------
  describe('duplicateDetection', () => {
    it('should return duplicate groups for near-duplicate documents', async () => {
      // Create dummy docs where two posts are nearly identical.
      const dummyDocs = [
        { id: "d1", selftext: "Apple banana orange" },
        { id: "d2", selftext: "apple banana orange" },
        { id: "d3", selftext: "Different text entirely" }
      ];
      Reddit.find = jest.fn().mockReturnValue({
        exec: () => Promise.resolve(dummyDocs)
      });
      [Sentiment140, Covid19Twitter2020, Covid19Twitter2021, TwitterUSAirlineSentiment, GeotagNintendo]
        .forEach(Model => {
          Model.find = jest.fn().mockReturnValue({
            exec: () => Promise.resolve([])
          });
        });
      
      const req = { query: { dataset: 'reddit', threshold: '0.9' } };
      const res = createRes();
      await duplicateDetection(req, res);
      const duplicates = res.json.mock.calls[0][0];
      // Expect that document d1 has d2 as duplicate.
      expect(duplicates).toHaveProperty("d1");
      expect(duplicates["d1"]).toContain("d2");
    });
  });
});
