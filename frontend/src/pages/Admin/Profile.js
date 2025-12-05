import React from 'react';
import { Container } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Profile from '../../components/shared/Profile';
import '../Dashboard.css';
import { Link } from 'react-router-dom';

const AdminProfilePage = () => {
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
          <div className="mb-3" style={{ display: 'flex', gap: 8 }}>
            <Link to="/admin/profile/edit" className="btn btn-primary">Edit Institute Info</Link>
            <Link to="/admin/profile/password" className="btn btn-outline-secondary">Change Password</Link>
          </div>
          <Profile />
        </Container>
      </div>
    </>
  );
};

export default AdminProfilePage;
