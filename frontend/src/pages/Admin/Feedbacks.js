import React from 'react';
import { Container } from 'react-bootstrap';
import Feedback from '../../components/shared/Feedback';
import '../Dashboard.css';

const AdminFeedbacksPage = () => {
  return (
    <Container fluid className="pb-4" style={{ height: '100vh', overflow: 'hidden', padding: 0, maxWidth: 'none', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <Feedback />
    </Container>
  );
};

export default AdminFeedbacksPage;
