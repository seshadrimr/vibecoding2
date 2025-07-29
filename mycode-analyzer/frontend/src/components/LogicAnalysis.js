import React from 'react';
import { Alert, Card, Table, Badge, ProgressBar, ListGroup } from 'react-bootstrap';

const LogicAnalysis = ({ analysisResults, loading, error }) => {
  if (loading) {
    return (
      <Alert variant="info">
        <Alert.Heading>Analyzing Logic Files...</Alert.Heading>
        <p>Please wait while we analyze the logic files...</p>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Analysis Error</Alert.Heading>
        <p>{analysisResults.error || 'An unknown error occurred during analysis.'}</p>
      </Alert>
    );
  }

  if (!analysisResults) {
    return (
      <Alert variant="info">
        <Alert.Heading>No Analysis Available</Alert.Heading>
        <p>Click the "Analyze Logic Files" button above to start the analysis process.</p>
      </Alert>
    );
  }
  
  if (!analysisResults.success) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Analysis Failed</Alert.Heading>
        <p>{analysisResults.error || 'An unknown error occurred during analysis.'}</p>
      </Alert>
    );
  }

  const { results } = analysisResults;
  
  // Determine progress bar variant based on coverage percentage
  const getCoverageVariant = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'danger';
  };

  return (
    <div>
      {/* Coverage Percentage Card */}
      <Card className="mb-4">
        <Card.Header as="h5">Core Functionality Coverage</Card.Header>
        <Card.Body>
          <h2 className="text-center mb-3">{results.coveragePercentage || 0}% Coverage</h2>
          <ProgressBar 
            now={results.coveragePercentage || 0} 
            variant={getCoverageVariant(results.coveragePercentage || 0)}
            className="mb-3"
            style={{ height: '30px' }}
          />
          <div className="d-flex justify-content-between text-muted">
            <small>0%</small>
            <small>50%</small>
            <small>100%</small>
          </div>
          
          {results.fileCount && (
            <Alert variant="secondary" className="mt-3">
              <small>
                Analyzed {results.fileCount.analyzed} core logic files 
                {results.fileCount.skipped > 0 && (
                  <span> (excluded {results.fileCount.skipped} error handling files)</span>
                )}
              </small>
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header as="h5">Application Logic Summary</Card.Header>
        <Card.Body>
          <Card.Text>
            {results.summary || 'No successful file analyses to generate summary'}
          </Card.Text>
        </Card.Body>
      </Card>
      
      {/* Missing Core Functionalities Card */}
      {results.missingCoreFunctionalities && results.missingCoreFunctionalities.length > 0 && (
        <Card className="mb-4">
          <Card.Header as="h5">Missing Core Functionalities</Card.Header>
          <Card.Body>
            <ListGroup>
              {results.missingCoreFunctionalities.map((func, index) => (
                <ListGroup.Item key={index} variant="warning">
                  {func}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4">
        <Card.Header as="h5">Expected vs Actual Functionalities</Card.Header>
        <Card.Body>
          {results.functionalityComparison && results.functionalityComparison.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Functionality</th>
                  <th>Status</th>
                  <th>Implemented In</th>
                </tr>
              </thead>
              <tbody>
                {results.functionalityComparison.map((item, index) => (
                  <tr key={index}>
                    <td>{item.functionality}</td>
                    <td>
                      <Badge bg={item.implemented ? 'success' : 'danger'}>
                        {item.implementationStatus}
                      </Badge>
                    </td>
                    <td>
                      {item.implementedIn && item.implementedIn.length > 0
                        ? item.implementedIn.join(', ')
                        : 'Not implemented'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info">No functionality comparison data available.</Alert>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header as="h5">Missing Negative Test Cases</Card.Header>
        <Card.Body>
          {results.criticalTestCases && results.criticalTestCases.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Criticality</th>
                  <th>Impact</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {results.criticalTestCases.map((testCase, index) => (
                  <tr key={index}>
                    <td>{testCase.description}</td>
                    <td>
                      <Badge 
                        bg={
                          testCase.criticality === 'High' ? 'danger' :
                          testCase.criticality === 'Medium' ? 'warning' : 'info'
                        }
                      >
                        {testCase.criticality}
                      </Badge>
                    </td>
                    <td>{testCase.impact}</td>
                    <td>{testCase.fileName}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info">No missing negative test cases identified.</Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default LogicAnalysis;
