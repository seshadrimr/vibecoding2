import React, { useState } from 'react';
import { Button, Alert, Spinner, Card } from 'react-bootstrap';
import { runTest as runTestApi } from '../utils/api';

const TestRunner = ({ testCode, fileName, file, result: resultProp }) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(resultProp || null);
  const [error, setError] = useState('');

  const runTest = async () => {
    setRunning(true);
    setError('');
    setResult(null);

    try {
      // Send the test code and source code to the backend to be executed
      const response = await runTestApi(testCode, fileName, file?.content || '');
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred while running tests');
    } finally {
      setRunning(false);
    }
  };

  // Display raw test results
  const renderTestResults = () => {
    const displayResult = resultProp || result;
    if (!displayResult) return null;
    
    return (
      <Card className="mt-3">
        <Card.Header>Test Results</Card.Header>
        <Card.Body>
          <pre className="bg-light p-3 rounded" style={{ maxHeight: '400px', overflow: 'auto' }}>
            <code>{JSON.stringify(displayResult, null, 2)}</code>
          </pre>
        </Card.Body>
      </Card>
    );
  };
  
  return (
    <div className="test-runner mt-3">
      <Button 
        variant="success" 
        onClick={runTest}
        disabled={running || !testCode}
      >
        {running ? (
          <>
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            <span className="ms-2">Running Tests...</span>
          </>
        ) : (
          'Run Tests'
        )}
      </Button>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {renderTestResults()}
    </div>
  );
};

export default TestRunner;
