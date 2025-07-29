import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import './App.css';
import FileList from './components/FileList';
import FileDetails from './components/FileDetails';
import LoadingState from './components/LoadingState';
import ErrorMessage from './components/ErrorMessage';
import Statistics from './components/Statistics';
import LogicAnalysis from './components/LogicAnalysis';
import { downloadAnalysisReport } from './utils/pdfExport';
import { fetchRepositoryFiles, classifyFile, generateTest as generateTestApi, runTest as runTestApi, analyzeLogicFiles as analyzeLogicFilesApi } from './utils/api';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [pat, setPat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [testCode, setTestCode] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFiles([]);
    setSelectedFile(null);
    setTestCode('');
    setTestResult(null);

    try {
      // Validate inputs
      if (!repoUrl.includes('github.com')) {
        throw new Error('Please enter a valid GitHub repository URL');
      }

      if (!pat) {
        throw new Error('Please enter your GitHub Personal Access Token');
      }

      // Fetch repository files
      const response = await fetchRepositoryFiles(repoUrl, pat);
      const fetchedFiles = response.files || [];
      
      // Classify each file
      const classifiedFiles = [];
      
      for (const file of fetchedFiles) {
        try {
          // Get file content
          const contentResponse = await fetch(`https://api.github.com/repos/${repoUrl.split('/').slice(-2).join('/')}/contents/${file.path}`, {
            headers: { 'Authorization': `token ${pat}` }
          });
          
          const contentData = await contentResponse.json();
          const fileContent = atob(contentData.content);
          
          // Classify file
          const classifyResponse = await classifyFile(fileContent);
          
          classifiedFiles.push({
            ...file,
            content: fileContent,
            classification: classifyResponse.classification,
            analysis: classifyResponse.analysis
          });
        } catch (err) {
          console.error(`Error processing file ${file.path}:`, err);
          classifiedFiles.push({
            ...file,
            classification: 'error',
            analysis: 'Error processing file'
          });
        }
      }
      
      setFiles(classifiedFiles);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setTestCode('');
    setTestResult(null);
    
    if (file.classification === 'logic') {
      generateTest(file);
    }
  };

  const generateTest = async (file) => {
    setTestLoading(true);
    
    try {
      const response = await generateTestApi(file.content, file.path);
      
      if (response.success) {
        setTestCode(response.testCode);
      } else {
        throw new Error('Failed to generate test code');
      }
    } catch (err) {
      setError(`Error generating test: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const runTest = async () => {
    if (!selectedFile || !testCode) {
      setError('No test code available to run');
      return;
    }
    
    setTestLoading(true);
    try {
      // Pass the source code along with test code and file path
      const result = await runTestApi(testCode, selectedFile.path, selectedFile.content);
      setTestResult(result);
    } catch (err) {
      setError(`Error running tests: ${err.message}`);
      setTestResult({
        success: false,
        message: 'Test execution failed',
        details: err.message
      });
    } finally {
      setTestLoading(false);
    }
  };
  
  const handleAnalyzeLogic = async () => {
    if (!files || files.length === 0) {
      setAnalysisError('No files available for analysis');
      return;
    }
    
    setAnalysisLoading(true);
    setAnalysisError('');
    
    try {
      // Only analyze files classified as logic
      const logicFiles = files.filter(file => file.classification === 'logic');
      
      console.log('Logic files for analysis:', logicFiles);
      
      if (logicFiles.length === 0) {
        setAnalysisError('No logic files found for analysis');
        setAnalysisLoading(false);
        return;
      }
      
      // Make sure files have the required content property
      const filesToAnalyze = logicFiles.map(file => ({
        path: file.path,
        content: file.content,
        classification: file.classification
      }));
      
      console.log('Sending files to API for analysis:', filesToAnalyze);
      
      const result = await analyzeLogicFilesApi(filesToAnalyze);
      console.log('Analysis results from API:', result);
      console.log('Coverage percentage from API:', result.coveragePercentage);
      console.log('Results structure:', JSON.stringify(result, null, 2));
      
      setAnalysisResults(result);
    } catch (err) {
      console.error('Error in handleAnalyzeLogic:', err);
      setAnalysisError(`Error analyzing logic files: ${err.message}`);
      setAnalysisResults(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h1 className="mb-4">MyCodeAnalyzer</h1>
      <p className="lead mb-4">Analyze C# repositories, classify files, and generate unit tests</p>
      
      <ErrorMessage 
        message={error} 
        onDismiss={() => setError('')} 
      />

      <Form onSubmit={handleSubmit} className="mb-4">
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>GitHub Repository URL</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="https://github.com/username/repo" 
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>GitHub Personal Access Token (PAT)</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="ghp_xxxxxxxxxxxx" 
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              {' '}Loading...
            </>
          ) : 'Analyze Repository'}
        </Button>
      </Form>

      {loading && (
        <LoadingState message="Analyzing repository files..." />
      )}

      {files.length > 0 && !loading && (
        <div className="mt-4">
          <Tabs defaultActiveKey="files" id="repository-tabs" className="mb-4">
            <Tab eventKey="files" title="Files">
              <Row>
                <Col md={4}>
                  <FileList 
                    files={files} 
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                  />
                </Col>
                <Col md={8}>
                  {selectedFile ? (
                    <FileDetails 
                      file={selectedFile}
                      onGenerateTest={generateTest}
                      onRunTest={runTest}
                      testCode={testCode}
                      testResults={testResult}
                      testLoading={testLoading}
                      testError={error}
                    />
                  ) : (
                    <Alert variant="info">
                      Select a file from the list to view details and generate tests.
                    </Alert>
                  )}
                </Col>
              </Row>
            </Tab>
            <Tab eventKey="statistics" title="Repository Statistics">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Repository Statistics</h3>
                <Button 
                  variant="outline-primary" 
                  onClick={() => downloadAnalysisReport({ files, repoUrl })}
                  disabled={files.length === 0}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Export as PDF
                </Button>
              </div>
              <Statistics files={files} />
            </Tab>
            <Tab eventKey="logicAnalysis" title="Logic Analysis">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Application Logic Analysis</h3>
                <Button 
                  variant="primary" 
                  onClick={handleAnalyzeLogic}
                  disabled={analysisLoading || files.filter(f => f.classification === 'logic').length === 0}
                >
                  {analysisLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      {' '}Analyzing...
                    </>
                  ) : 'Analyze Logic Files'}
                </Button>
              </div>
              <LogicAnalysis 
                analysisResults={analysisResults}
                loading={analysisLoading}
                error={analysisError}
              />
            </Tab>
          </Tabs>
        </div>
      )}
    </Container>
  );
}

export default App;
