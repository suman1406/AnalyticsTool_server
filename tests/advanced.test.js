// advancedEndpoints.test.js
jest.setTimeout(30000); // Increase timeout to 30 seconds

// Suppress console logs to avoid "Cannot log after tests are done" errors.
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};

const moment = require('moment');
const natural = require('natural');
const vader = require('vader-sentiment');

// Import endpoints from your advanced controller.
// IMPORTANT: Ensure that advancedController.js has been fixed to remove duplicate declarations.
const {
  outlierDetection,
  contentSimilarityMatrix,
  predictEngagement,
  featureImportance,
  trendForecasting
} = require('../controllers/advancedController');

// Import models to override their methods in tests.
const Reddit = require('../models/Reddit');
const Sentiment140 = require('../models/Sentiment140');
const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
const GeotagNintendo = require('../models/GeotagNintendo');

// Helper: create a fake Express response object.
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

  // --------------------------
  // outlierDetection Endpoint Test
  // --------------------------
  describe('outlierDetection', () => {
    it('should detect outliers from dummy data', async () => {
      // Create dummy documents for one model (simulate Reddit).
      const dummyDoc1 = {
        selftext: "Normal post",
        score: 10,
        toObject() { return this; }
      };
      const dummyDoc2 = {
        selftext: "Outlier post",
        score: 100,
        toObject() { return this; }
      };
      // Override Reddit.find() to return these docs.
      Reddit.find = jest.fn().mockReturnValue({
        exec: () => Promise.resolve([dummyDoc1, dummyDoc2])
      });
      // For other models, return an empty array.
      [Sentiment140, Covid19Twitter2020, Covid19Twitter2021, TwitterUSAirlineSentiment, GeotagNintendo]
        .forEach(Model => {
          Model.find = jest.fn().mockReturnValue({
            exec: () => Promise.resolve([])
          });
        });

      const req = { query: { dataset: 'reddit' } };
      const res = createRes();
      await outlierDetection(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result).toHaveProperty('outliers');
      expect(Array.isArray(result.outliers)).toBe(true);
    });
  });

  // --------------------------
  // contentSimilarityMatrix Endpoint Test
  // --------------------------
  describe('contentSimilarityMatrix', () => {
    it('should return a similarity matrix for dummy texts', async () => {
      // For example, use Reddit docs.
      const dummyDocs = [
        { id: "doc1", selftext: "Hello world" },
        { id: "doc2", selftext: "Hello there" }
      ];
      Reddit.find = jest.fn().mockReturnValue({
        limit: () => ({ exec: () => Promise.resolve(dummyDocs) })
      });
      // Other models: return empty arrays.
      [Sentiment140, Covid19Twitter2020, Covid19Twitter2021, TwitterUSAirlineSentiment, GeotagNintendo]
        .forEach(Model => {
          Model.find = jest.fn().mockReturnValue({
            limit: () => ({ exec: () => Promise.resolve([]) })
          });
        });

      const req = { query: { dataset: 'reddit', sample_size: '2' } };
      const res = createRes();
      await contentSimilarityMatrix(req, res);
      const similarityObj = res.json.mock.calls[0][0];
      expect(similarityObj).toHaveProperty("doc1");
      expect(similarityObj).toHaveProperty("doc2");
    });
  });

  // --------------------------
  // predictEngagement Endpoint Test
  // --------------------------
//   describe('predictEngagement', () => {
//     it('should predict engagement score using dummy training data', async () => {
//       // We'll use Sentiment140 as an example.
//       const dummyTrainingDocs = [
//         { ids: "s1", text: "Good post", toObject() { return this; }, score: 20 },
//         { ids: "s2", text: "Bad post", toObject() { return this; }, score: 5 }
//       ];
//       // Override find() for training data.
//       Sentiment140.find = jest.fn().mockReturnValue({
//         limit: () => ({ exec: () => Promise.resolve(dummyTrainingDocs) })
//       });
//       // Override findOne() to return the first dummy document.
//       Sentiment140.findOne = jest.fn().mockReturnValue({
//         exec: () => Promise.resolve(dummyTrainingDocs[0])
//       });

//       const req = { body: { datasetName: 'Sentiment140', postId: "s1" } };
//       const res = createRes();
//       await predictEngagement(req, res);
//       const result = res.json.mock.calls[0][0];
//       expect(result).toHaveProperty('post_id', "s1");
//       expect(result).toHaveProperty('predicted_engagement_score');
//     });
//   });

  // --------------------------
  // featureImportance Endpoint Test
  // --------------------------
//   describe('featureImportance', () => {
//     it('should return an array of feature importance values from dummy data', async () => {
//       // Simulate dummy Reddit docs.
//       const dummyDocs = [
//         { id: "doc1", selftext: "Hello world", score: 10 },
//         { id: "doc2", selftext: "Another test", score: 20 }
//       ];
//       Reddit.find = jest.fn().mockReturnValue({
//         limit: () => ({ exec: () => Promise.resolve(dummyDocs) })
//       });
//       // Other models: return empty arrays.
//       [Sentiment140, Covid19Twitter2020, Covid19Twitter2021, TwitterUSAirlineSentiment, GeotagNintendo]
//         .forEach(Model => {
//           Model.find = jest.fn().mockReturnValue({
//             limit: () => ({ exec: () => Promise.resolve([]) })
//           });
//         });
      
//       const req = { query: {} };
//       const res = createRes();
//       await featureImportance(req, res);
//       const importanceArray = res.json.mock.calls[0][0];
//       expect(Array.isArray(importanceArray)).toBe(true);
//     });
//   });

  // --------------------------
  // trendForecasting Endpoint Test
  // --------------------------
//   describe('trendForecasting', () => {
//     it('should return a forecast for the next 7 days using dummy data', async () => {
//       // Simulate dummy Reddit document with created_utc field.
//       const dummyDoc = {
//         created_utc: 1630000000, // Unix timestamp
//         selftext: "Test post",
//         score: 10
//       };
//       Reddit.find = jest.fn().mockReturnValue({
//         exec: () => Promise.resolve([dummyDoc])
//       });
//       // Other models: return empty arrays.
//       [Sentiment140, Covid19Twitter2020, Covid19Twitter2021, TwitterUSAirlineSentiment, GeotagNintendo]
//         .forEach(Model => {
//           Model.find = jest.fn().mockReturnValue({
//             exec: () => Promise.resolve([])
//           });
//         });
      
//       const req = { query: {} };
//       const res = createRes();
//       await trendForecasting(req, res);
//       const forecast = res.json.mock.calls[0][0];
//       // Expect forecast to have 7 keys (one for each of the next 7 days).
//       expect(Object.keys(forecast).length).toBe(7);
//     });
//   });
});
