import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';

const Statistics = ({ files }) => {
  if (!files || files.length === 0) {
    return (
      <Card className="text-center p-5">
        <Card.Body>
          <Card.Title>No Repository Data</Card.Title>
          <Card.Text>Please analyze a repository to view statistics.</Card.Text>
        </Card.Body>
      </Card>
    );
  }

  // Calculate statistics
  const totalFiles = files.length;
  const logicFiles = files.filter(file => file.classification === 'logic').length;
  const boilerplateFiles = files.filter(file => file.classification === 'boilerplate').length;
  const errorFiles = files.filter(file => file.classification !== 'logic' && file.classification !== 'boilerplate').length;
  const logicPercentage = Math.round((logicFiles / totalFiles) * 100);
  const boilerplatePercentage = Math.round((boilerplateFiles / totalFiles) * 100);
  const errorPercentage = Math.round((errorFiles / totalFiles) * 100);

  // Calculate average file size
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const averageSize = totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0;
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="statistics mb-4">
      <h3>Repository Statistics</h3>
      <Row>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>File Count</Card.Title>
              <h2>{totalFiles}</h2>
              <Card.Text>Total C# files analyzed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Logic Files</Card.Title>
              <h2>{logicFiles}</h2>
              <Card.Text>{logicPercentage}% of total files</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Boilerplate Files</Card.Title>
              <h2>{boilerplateFiles}</h2>
              <Card.Text>{boilerplatePercentage}% of total files</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>File Classification Breakdown</Card.Title>
          <div className="mb-2">Logic Files ({logicPercentage}%)</div>
          <ProgressBar variant="success" now={logicPercentage} className="mb-3" />
          
          <div className="mb-2">Boilerplate Files ({boilerplatePercentage}%)</div>
          <ProgressBar variant="secondary" now={boilerplatePercentage} className="mb-3" />
          
          {errorFiles > 0 && (
            <>
              <div className="mb-2">Error/Unknown Files ({errorPercentage}%)</div>
              <ProgressBar variant="danger" now={errorPercentage} className="mb-3" />
            </>
          )}
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          <Card.Title>File Size Information</Card.Title>
          <Row>
            <Col md={6}>
              <Card.Text>
                <strong>Average File Size:</strong> {formatFileSize(averageSize)}
              </Card.Text>
            </Col>
            <Col md={6}>
              <Card.Text>
                <strong>Total Repository Size:</strong> {formatFileSize(totalSize)}
              </Card.Text>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Statistics;
