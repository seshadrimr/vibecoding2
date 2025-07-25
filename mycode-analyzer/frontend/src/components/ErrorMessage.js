import React from 'react';
import { Alert } from 'react-bootstrap';

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;
  
  return (
    <Alert 
      variant="danger" 
      dismissible={!!onDismiss}
      onClose={onDismiss}
    >
      <Alert.Heading>Error</Alert.Heading>
      <p>{message}</p>
      {onDismiss && (
        <div className="d-flex justify-content-end">
          <Alert.Link onClick={onDismiss}>Dismiss</Alert.Link>
        </div>
      )}
    </Alert>
  );
};

export default ErrorMessage;
