import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Sidebar activeMenu="dashboard" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>

        <Container fluid className="dashboard-content">
          <div className="welcome-section mb-5">
            <h1 className="dashboard-title">Admin Dashboard 🛡️</h1>
            <p className="dashboard-subtitle">Manage {user?.instituteName || 'your institute'}</p>
          </div>

          <Row className="g-4">
            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">👨‍🏫</div>
                  <h3 className="stat-value">0</h3>
                  <p className="stat-label">Teachers</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">🎓</div>
                  <h3 className="stat-value">0</h3>
                  <p className="stat-label">Students</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">📚</div>
                  <h3 className="stat-value">0</h3>
                  <p className="stat-label">Courses</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">📅</div>
                  <h3 className="stat-value">0</h3>
                  <p className="stat-label">Schedules</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4 mt-4">
            <Col xs={12} lg={8}>
              <Card className="action-card glass-effect">
                <Card.Header>
                  <h4 className="card-title">Quick Actions</h4>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col xs={12} sm={6}>
                      <Button variant="primary" className="action-btn btn-futuristic w-100">
                        <span className="btn-icon">➕</span>
                        Add Teacher
                      </Button>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Button variant="primary" className="action-btn btn-futuristic w-100">
                        <span className="btn-icon">➕</span>
                        Add Student
                      </Button>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Button variant="primary" className="action-btn btn-futuristic w-100">
                        <span className="btn-icon">📅</span>
                        Create Schedule
                      </Button>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Button variant="primary" className="action-btn btn-futuristic w-100">
                        <span className="btn-icon">📊</span>
                        View Reports
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} lg={4}>
              <Card className="profile-card glass-effect">
                <Card.Header>
                  <h4 className="card-title">Profile</h4>
                </Card.Header>
                <Card.Body>
                  <div className="profile-info">
                    <div className="profile-avatar admin-avatar">
                      {user?.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-details">
                      <p><strong>Name:</strong> {user?.userName}</p>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Institute:</strong> {user?.instituteName}</p>
                      <p><strong>Role:</strong> <span className="role-badge admin-badge">Admin</span></p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AdminDashboard;
