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
        <Container fluid className="dashboard-content" style={{ height: '100vh', overflow: 'hidden', padding: 0, paddingLeft: '2rem', paddingRight: '2rem' }}>
          <Feedback />
        </Container>
      </div>
    </>
  );
};

export default StudentFeedbacksPage;
