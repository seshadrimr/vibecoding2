import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status" variant="primary" />
      <p className="mt-3">{message}</p>
    </div>
  );
};

export default LoadingState;
