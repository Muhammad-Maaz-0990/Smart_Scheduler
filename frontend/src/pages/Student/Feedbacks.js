import React from 'react';
import { Container } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Feedback from '../../components/shared/Feedback';
import '../Dashboard.css';

const StudentFeedbacksPage = () => {
  return (
    <>
      <Sidebar activeMenu="feedbacks" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content">
          <h1 className="dashboard-title mb-4">Feedback Conversations</h1>
          <Feedback />
        </Container>
      </div>
    </>
  );
};

export default StudentFeedbacksPage;
