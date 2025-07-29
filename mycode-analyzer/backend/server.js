const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development/testing
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false // Set to false to avoid preflight issues
}));
app.use(express.json({ limit: '10mb' }));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// GitHub API routes
app.post('/api/repository', async (req, res) => {
  try {
    const { repoUrl, pat } = req.body;
    
    // Extract owner and repo name from GitHub URL
    const urlParts = repoUrl.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];
    
    // Set up GitHub API request with PAT
    const config = {
      headers: {
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    // First, get repository info to determine the default branch
    const repoInfoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, config);
    const defaultBranch = repoInfoResponse.data.default_branch;
    
    // Get repository contents using the default branch
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, config);
    
    // Filter for .cs files
    const csFiles = response.data.tree.filter(file => 
      file.path.endsWith('.cs') && file.type === 'blob'
    );
    
    res.json({ success: true, files: csFiles });
  } catch (error) {
    console.error('Error fetching repository:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// OpenAI API route for code classification
app.post('/api/classify', async (req, res) => {
  try {
    const { fileContent } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a C# code analyzer. Classify the given code as either 'logic' or 'boilerplate'. Logic files contain business logic, algorithms, or core functionality. Boilerplate files contain setup code, configuration, or generated code."
        },
        {
          role: "user",
          content: fileContent
        }
      ]
    });
    
    const classification = completion.choices[0].message.content;
    const isLogic = classification.toLowerCase().includes('logic');
    
    res.json({ 
      success: true, 
      classification: isLogic ? 'logic' : 'boilerplate',
      analysis: classification
    });
  } catch (error) {
    console.error('Error classifying code:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import utilities
const { generateTestCode, runTestCode } = require('./utils/testGenerator');
const { analyzeLogicFiles } = require('./utils/logicAnalyzer');

// NUnit test generation route
app.post('/api/generate-test', async (req, res) => {
  try {
    const { fileContent, fileName } = req.body;
    
    const testCode = await generateTestCode(fileContent, fileName);
    
    res.json({ 
      success: true, 
      testCode: testCode
    });
  } catch (error) {
    console.error('Error generating test code:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run NUnit tests route
app.post('/api/run-test', async (req, res) => {
  try {
    const { testCode, fileName, sourceCode } = req.body;
    
    const testResults = await runTestCode(testCode, fileName, sourceCode);
    
    res.json({ 
      success: true, 
      results: testResults
    });
  } catch (error) {
    console.error('Error running test code:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logic analysis route
app.post('/api/analyze-logic', async (req, res) => {
  try {
    const { files } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files provided for analysis' 
      });
    }
    
    const analysisResults = await analyzeLogicFiles(files);
    
    res.json({
      success: true,
      results: analysisResults
    });
  } catch (error) {
    console.error('Error analyzing logic files:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
