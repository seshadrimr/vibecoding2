import React from 'react';
import { Table, Badge, Spinner } from 'react-bootstrap';

const FileList = ({ files, selectedFile, onFileSelect }) => {
  return (
    <div className="file-list">
      <h3>Repository Files</h3>
      {files.length === 0 ? (
        <p>No files found.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>File Path</th>
              <th>Classification</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <tr 
                key={index} 
                onClick={() => onFileSelect(file)}
                className={selectedFile === file ? 'table-active' : ''}
                style={{ cursor: 'pointer' }}
              >
                <td>{file.path}</td>
                <td>
                  {file.classifying ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Badge bg={
                      file.classification === 'logic' 
                        ? 'success' 
                        : file.classification === 'boilerplate' 
                          ? 'secondary' 
                          : 'danger'
                    }>
                      {file.classification || 'Unknown'}
                    </Badge>
                  )}
                </td>
                <td>{formatFileSize(file.size)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileList;
