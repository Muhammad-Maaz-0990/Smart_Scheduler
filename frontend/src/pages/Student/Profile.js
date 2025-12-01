import React from 'react';
import { Container } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Profile from '../../components/shared/Profile';
import '../Dashboard.css';

const StudentProfilePage = () => {
  return (
    <>
      <Sidebar activeMenu="profile" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content">
          <h1 className="dashboard-title mb-4">Profile</h1>
          <Profile />
        </Container>
      </div>
    </>
  );
};

export default StudentProfilePage;
