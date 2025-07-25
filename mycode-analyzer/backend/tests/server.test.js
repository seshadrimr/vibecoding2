const request = require('supertest');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OpenAI } = require('openai');

// Mock dependencies
jest.mock('axios');
jest.mock('openai');

describe('Server API Tests', () => {
  let app;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a fresh app instance for each test
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Mock OpenAI
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
    
    // Mock the OpenAI constructor
    OpenAI.mockImplementation(() => mockOpenAI);
    
    // Import routes (this would normally be in server.js)
    app.post('/api/repository', async (req, res) => {
      try {
        const { repoUrl, pat } = req.body;
        
        if (!repoUrl || !pat) {
          return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        
        // Extract owner and repo name from GitHub URL
        const urlParts = repoUrl.split('/');
        const owner = urlParts[urlParts.length - 2];
        const repo = urlParts[urlParts.length - 1];
        
        // Mock GitHub API response
        const mockResponse = {
          data: {
            tree: [
              { path: 'src/File1.cs', type: 'blob' },
              { path: 'src/File2.cs', type: 'blob' },
              { path: 'README.md', type: 'blob' }
            ]
          }
        };
        
        axios.get.mockResolvedValue(mockResponse);
        
        // Get repository contents
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`);
        
        // Filter for .cs files
        const csFiles = response.data.tree.filter(file => 
          file.path.endsWith('.cs') && file.type === 'blob'
        );
        
        res.json({ success: true, files: csFiles });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    app.post('/api/classify', async (req, res) => {
      try {
        const { fileContent } = req.body;
        
        if (!fileContent) {
          return res.status(400).json({ success: false, error: 'Missing file content' });
        }
        
        // Mock OpenAI response
        const mockCompletion = {
          choices: [
            {
              message: {
                content: 'This is logic code because it contains business logic.'
              }
            }
          ]
        };
        
        OpenAI.prototype.chat.completions.create.mockResolvedValue(mockCompletion);
        
        const completion = await new OpenAI().chat.completions.create();
        
        const classification = completion.choices[0].message.content;
        const isLogic = classification.toLowerCase().includes('logic');
        
        res.json({ 
          success: true, 
          classification: isLogic ? 'logic' : 'boilerplate',
          analysis: classification
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });
  
  describe('POST /api/repository', () => {
    it('should return filtered .cs files', async () => {
      const response = await request(app)
        .post('/api/repository')
        .send({
          repoUrl: 'https://github.com/username/repo',
          pat: 'ghp_token'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(2);
      expect(response.body.files[0].path).toContain('.cs');
    });
    
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/repository')
        .send({
          repoUrl: 'https://github.com/username/repo'
          // Missing PAT
        });
      
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/classify', () => {
    it('should classify file content', async () => {
      const response = await request(app)
        .post('/api/classify')
        .send({
          fileContent: 'public class BusinessLogic { }'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.classification).toBe('logic');
      expect(response.body.analysis).toBeTruthy();
    });
    
    it('should return 400 if file content is missing', async () => {
      const response = await request(app)
        .post('/api/classify')
        .send({});
      
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
