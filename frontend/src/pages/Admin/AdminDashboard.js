import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  // Simplified: remove unused institute fetch until needed

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

        </Container>
      </div>
    </>
  );
};

export default AdminDashboard;
