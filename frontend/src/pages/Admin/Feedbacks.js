import React from 'react';
import { Container } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Feedback from '../../components/shared/Feedback';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const AdminFeedbacksPage = () => {
  return (
    <>
      <Sidebar activeMenu="feedbacks" />
      <div className="dashboard-page">
        <Container fluid className="py-4" style={{ maxWidth: '1600px' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 
              className="mb-0" 
              style={{ 
                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 900,
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                marginBottom: '0.4rem'
              }}
            >
             
            </h1>
          </motion.div>
          <Feedback />
        </Container>
      </div>
    </>
  );
};

export default AdminFeedbacksPage;
