import axios from 'axios';

// Determine the API base URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use the deployed backend URL in production
    return process.env.REACT_APP_API_URL || 'https://mycode-analyzer-api.herokuapp.com';
  }
  // Use localhost in development
  return 'http://localhost:5000';
};

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Changed to false to avoid CORS preflight issues
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle CORS errors specifically
    if (error.message === 'Network Error') {
      console.error('CORS or network issue detected:', error);
      // You could dispatch to an error handling service/state here
    }
    return Promise.reject(error);
  }
);

// API methods
export const fetchRepositoryFiles = async (repoUrl, pat) => {
  try {
    const response = await api.post('/api/repository', { repoUrl, pat });
    return response.data; // This already contains the { success, files } structure
  } catch (error) {
    console.error('Error fetching repository files:', error);
    throw error;
  }
};

export const classifyFile = async (fileContent) => {
  try {
    const response = await api.post('/api/classify', { fileContent });
    return response.data;
  } catch (error) {
    console.error('Error classifying file:', error);
    throw error;
  }
};

export const generateTest = async (fileContent, fileName) => {
  try {
    const response = await api.post('/api/generate-test', { fileContent, fileName });
    return response.data;
  } catch (error) {
    console.error('Error generating test:', error);
    throw error;
  }
};

export const runTest = async (testCode, fileName, sourceCode) => {
  try {
    const response = await api.post('/api/run-test', { testCode, fileName, sourceCode });
    return response.data;
  } catch (error) {
    console.error('Error running test:', error);
    throw error;
  }
};

export const analyzeLogicFiles = async (files) => {
  try {
    const response = await api.post('/api/analyze-logic', { files });
    return response.data;
  } catch (error) {
    console.error('Error analyzing logic files:', error);
    throw error;
  }
};

export default api;
