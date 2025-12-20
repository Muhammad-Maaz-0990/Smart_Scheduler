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
        <Container fluid className="pb-4" style={{ maxWidth: '1600px' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          </motion.div>
          <Feedback />
        </Container>
      </div>
    </>
  );
};

export default AdminFeedbacksPage;
