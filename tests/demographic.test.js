// analysisEndpoints.test.js
jest.setTimeout(30000); // Increase timeout to 30 seconds

// Suppress logs to avoid "Cannot log after tests are done" errors.
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};

const moment = require('moment');
const vader = require('vader-sentiment');

// Import endpoints from your controller module.
const {
  demographicsSummary,
  platformComparison,
  timePeriodComparison,
  authorComparison
} = require('../controllers/demographicsController'); // adjust path if needed

// Helper: create a fake response object.
function createRes() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

// Helper: create a mock cursor that yields the given docs one by one.
function createMockCursor(docs) {
  let i = 0;
  return {
    async next() {
      return i < docs.length ? docs[i++] : null;
    }
  };
}

//
// DEMOGRAPHICS SUMMARY TEST
//
describe('Demographics Summary Endpoint', () => {
  it('should count demographic fields across combined models', async () => {
    // Dummy docs with demographic fields.
    const dummyDocs = [
      { user_gender: "Male", user_age: 25, user_location: "USA" },
      { user_gender: "Female", user_age: 30, user_location: "Canada" },
      { user_gender: "Male", user_age: 25, user_location: "USA" }
    ];
    
    // For each model in combined, override find to return these dummy docs.
    const models = [
      'Reddit',
      'Covid19Twitter2020',
      'Covid19Twitter2021',
      'Sentiment140',
      'TwitterUSAirlineSentiment',
      'GeotagNintendo'
    ];
    models.forEach(modelName => {
      const Model = require(`../models/${modelName}`);
      Model.find = jest.fn().mockReturnValue({
        cursor: () => createMockCursor(dummyDocs)
      });
    });
    
    const req = { query: {} };
    const res = createRes();
    await demographicsSummary(req, res);
    const result = res.json.mock.calls[0][0];
    
    // Since each model returns 3 docs, and there are 6 models, total counts are 18 per field.
    // Each dummy doc contributes: user_gender: "male"/"female", user_age: "25" or "30", user_location: "usa"/"canada"
    expect(result).toHaveProperty('user_gender');
    expect(result.user_gender).toEqual({
      "male": 12,   // 2 out of 3 per model * 6 models = 12
      "female": 6   // 1 out of 3 per model * 6 models = 6
    });
    expect(result).toHaveProperty('user_age');
    expect(result.user_age).toEqual({
      "25": 12,
      "30": 6
    });
    expect(result).toHaveProperty('user_location');
    expect(result.user_location).toEqual({
      "usa": 12,
      "canada": 6
    });
  });
});

//
// TIME PERIOD COMPARISON TEST
//
describe('Time Period Comparison Endpoint', () => {
  it('should compute weekly averages from dummy Reddit data', async () => {
    // Simulate one dummy Reddit doc.
    const redditDoc = { created_utc: 1630000000, selftext: "I love this!" };
    const Model = require('../models/Reddit');
    Model.find = jest.fn().mockReturnValue({
      cursor: () => createMockCursor([redditDoc])
    });
    // For other models, return an empty cursor.
    const otherModels = ['Covid19Twitter2020', 'Covid19Twitter2021', 'Sentiment140', 'TwitterUSAirlineSentiment', 'GeotagNintendo'];
    otherModels.forEach(modelName => {
      const M = require(`../models/${modelName}`);
      M.find = jest.fn().mockReturnValue({
        cursor: () => createMockCursor([])
      });
    });
    
    const req = { query: {} };
    const res = createRes();
    await timePeriodComparison(req, res);
    const result = res.json.mock.calls[0][0];
    const weekKeys = Object.keys(result);
    expect(weekKeys.length).toBeGreaterThan(0);
    weekKeys.forEach(key => {
      expect(result[key]).toHaveProperty('average_score');
      expect(result[key]).toHaveProperty('average_sentiment');
    });
  });
});

//
// AUTHOR COMPARISON TEST
//
describe('Author Comparison Endpoint', () => {
  it('should compute author statistics and return top 10', async () => {
    // Simulate two dummy Reddit docs for the same author.
    const doc1 = { created_utc: 1630000000, selftext: "Great product", score: 10, author: "user1", num_comments: 5 };
    const doc2 = { created_utc: 1630000100, selftext: "Really enjoyed", score: 20, author: "user1", num_comments: 3 };
    const Model = require('../models/Reddit');
    Model.find = jest.fn().mockReturnValue({
      cursor: () => createMockCursor([doc1, doc2])
    });
    // For other models, return an empty cursor.
    const otherModels = ['Covid19Twitter2020', 'Covid19Twitter2021', 'Sentiment140', 'TwitterUSAirlineSentiment', 'GeotagNintendo'];
    otherModels.forEach(modelName => {
      const M = require(`../models/${modelName}`);
      M.find = jest.fn().mockReturnValue({
        cursor: () => createMockCursor([])
      });
    });
    
    const req = { query: {} };
    const res = createRes();
    await authorComparison(req, res);
    const results = res.json.mock.calls[0][0];
    expect(Array.isArray(results)).toBe(true);
    // Expect one entry for 'Reddit::user1'
    expect(results.length).toBe(1);
    expect(results[0]).toMatchObject({
      dataset: 'Reddit',
      author: 'user1',
      post_count: 2,
      avg_score: 15 // (10+20)/2
    });
  });
});