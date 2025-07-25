import React from 'react';
import { Tabs, Tab, Alert, Spinner } from 'react-bootstrap';
import TestRunner from './TestRunner';

const FileDetails = ({ file, testCode, testLoading, onGenerateTest, onRunTest, testResults, testError }) => {
  if (!file) {
    return <p>Select a file to view details</p>;
  }

  return (
    <div className="file-details">
      <h3>{file.path}</h3>
      <Tabs defaultActiveKey="analysis" className="mb-3">
        <Tab eventKey="analysis" title="Analysis">
          <div className="p-3 border rounded">
            <h5>
              Classification: {' '}
              <span className={`badge bg-${
                file.classification === 'logic' 
                  ? 'success' 
                  : file.classification === 'boilerplate' 
                    ? 'secondary' 
                    : 'danger'
              }`}>
                {file.classification || 'Unknown'}
              </span>
            </h5>
            {file.analysis ? (
              <div>
                <h6>Analysis:</h6>
                <p>{file.analysis}</p>
              </div>
            ) : (
              <Alert variant="info">No analysis available</Alert>
            )}
          </div>
        </Tab>
        
        <Tab eventKey="code" title="Code">
          <div className="p-3 border rounded">
            {file.content ? (
              <pre className="bg-light p-3 rounded">
                <code>{file.content}</code>
              </pre>
            ) : (
              <Alert variant="info">Code content not available</Alert>
            )}
          </div>
        </Tab>
        
        {file.classification === 'logic' && (
          <Tab eventKey="tests" title="Generated Tests">
            {testLoading ? (
              <div className="text-center p-5">
                <Spinner animation="border" />
                <p className="mt-2">Generating tests...</p>
              </div>
            ) : testCode ? (
              <div>
                <pre className="p-3 border rounded bg-light">
                  <code>{testCode}</code>
                </pre>
                <TestRunner testCode={testCode} fileName={file.path} file={file} result={testResults} />
              </div>
            ) : (
              <Alert variant="info">No test code generated yet</Alert>
            )}
          </Tab>
        )}
      </Tabs>
    </div>
  );
};

export default FileDetails;
