// tests/analysis.test.js
jest.setTimeout(30000); // Increase timeout if needed

// Suppress all console output globally.
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const controllers = require('../controllers/analysisController'); // adjust path to your controllers module
const Reddit = require('../models/Reddit');
const Sentiment140 = require('../models/Sentiment140');
const Covid19Twitter2020 = require('../models/Covid19Twitter2020');
const Covid19Twitter2021 = require('../models/Covid19Twitter2021');
const TwitterUSAirlineSentiment = require('../models/TwitterUSAirlineSentiment');
const GeoNintendo = require('../models/GeotagNintendo');

// Helper to create a fake res object.
const createRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(() => {
  // Prevent unhandledRejection events from printing errors.
  process.on('unhandledRejection', () => {});
});

afterAll(() => {
  // No need to restore since we globally override console methods.
});

describe('Error Handling Endpoints (with suppressed console output)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('wordFrequency', () => {
    it('should handle errors when fetchDocuments fails', async () => {
      const req = { query: { dataset: 'reddit' } };
      const res = createRes();
      const error = new Error("Test error");

      // Simulate error by making Reddit.find return a rejected promise via exec()
      Reddit.find = jest.fn().mockReturnValue({
        exec: () => Promise.reject(error)
      });

      await controllers.wordFrequency(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  describe('ngramFrequency', () => {
    it('should handle errors when fetchDocuments fails', async () => {
      const req = { query: { dataset: 'sentiment140', limit: '100' } };
      const res = createRes();
      const error = new Error("Test error");

      // Simulate error by making Sentiment140.find return a rejected promise via exec()
      Sentiment140.find = jest.fn().mockReturnValue({
        exec: () => Promise.reject(error)
      });

      await controllers.ngramFrequency(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error", details: error.message });
    });
  });

  describe('tfidfKeywords', () => {
    it('should handle errors when fetchDocuments fails', async () => {
      const req = { query: { dataset: 'covid2020' } };
      const res = createRes();
      const error = new Error("Test error");

      // Simulate error by making Covid19Twitter2020.find return a rejected promise via exec()
      Covid19Twitter2020.find = jest.fn().mockReturnValue({
        exec: () => Promise.reject(error)
      });

      await controllers.tfidfKeywords(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error", details: error.message });
    });
  });

  describe('keywordCloud', () => {
    it('should handle errors when fetchDocuments fails', async () => {
      const req = { query: { dataset: 'covid2021', limit: '50' } };
      const res = createRes();
      const error = new Error("Test error");

      // Simulate error by making Covid19Twitter2021.find return a rejected promise via exec()
      Covid19Twitter2021.find = jest.fn().mockReturnValue({
        exec: () => Promise.reject(error)
      });

      await controllers.keywordCloud(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error", details: error.message });
    });
  });

  describe('textSimilarity', () => {
    it('should handle errors when no documents are available', async () => {
      const req = { query: { dataset: 'airline' } };
      const res = createRes();

      // Simulate error by making TwitterUSAirlineSentiment.find return an empty array via exec()
      TwitterUSAirlineSentiment.find = jest.fn().mockReturnValue({
        exec: () => Promise.resolve([])
      });

      await controllers.textSimilarity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "No documents available" });
    });
  });

  describe('mostSimilarPosts', () => {
    it('should return 404 when post_id is not found', async () => {
      const req = { query: { dataset: 'geonintendo', post_id: 'nonexistent' } };
      const res = createRes();

      // Simulate valid documents by making GeoNintendo.find return documents via exec()
      GeoNintendo.find = jest.fn().mockReturnValue({
        exec: () =>
          Promise.resolve([
            { id: 'doc1', text: "Test document one" },
            { id: 'doc2', text: "Test document two" }
          ])
      });

      await controllers.mostSimilarPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Post ID not found in the sample" });
    });
  });

  describe('getPostIdentifiers', () => {
    it('should handle errors when an invalid dataset is provided', async () => {
      const req = { query: { dataset: 'invalid_dataset' } };
      const res = createRes();

      await controllers.getPostIdentifiers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid dataset parameter" });
    });
  });
});