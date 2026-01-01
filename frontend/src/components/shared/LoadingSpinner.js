import React from 'react';
import { Spinner } from 'react-bootstrap';
import { motion } from 'framer-motion';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...', size = 'large', fullScreen = false }) => {
  return (
    <motion.div 
      className={`loading-spinner-container${fullScreen ? ' fullscreen' : ''}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`loading-content ${size}`}>
        <div className="spinner-wrapper">
          <div className="spinner-gradient-ring"></div>
          <div className="spinner-gradient-ring ring-2"></div>
          <Spinner animation="border" className="spinner-inner" />
        </div>
        <motion.p 
          className="loading-text"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {message}
        </motion.p>
        <div className="loading-dots">
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          >.</motion.span>
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          >.</motion.span>
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          >.</motion.span>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingSpinner;
