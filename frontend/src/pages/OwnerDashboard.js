import React from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const OwnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      {/* Navbar */}
      <Navbar className="dashboard-navbar glass-effect" variant="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand className="navbar-brand-custom">
            <span className="brand-icon">⚡</span> Smart Scheduler
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link className="nav-link-custom">
                <span className="user-badge">Owner</span>
              </Nav.Link>
              <Nav.Link className="nav-link-custom">
                👤 {user?.userName}
              </Nav.Link>
              <Button variant="outline-light" size="sm" onClick={handleLogout} className="logout-btn">
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Background Effects */}
      <div className="bg-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      {/* Dashboard Content */}
      <Container className="dashboard-content py-5">
        <div className="welcome-section mb-5">
          <h1 className="dashboard-title">Welcome Back, {user?.userName}! 👋</h1>
          <p className="dashboard-subtitle">Owner Dashboard - Manage your entire system</p>
        </div>

        <Row className="g-4">
          {/* Statistics Cards */}
          <Col md={6} lg={3}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">🏢</div>
                <h3 className="stat-value">0</h3>
                <p className="stat-label">Total Institutes</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">👥</div>
                <h3 className="stat-value">0</h3>
                <p className="stat-label">Total Users</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">👨‍🏫</div>
                <h3 className="stat-value">0</h3>
                <p className="stat-label">Teachers</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">🎓</div>
                <h3 className="stat-value">0</h3>
                <p className="stat-label">Students</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4 mt-4">
          {/* Quick Actions */}
          <Col lg={8}>
            <Card className="action-card glass-effect">
              <Card.Header>
                <h4 className="card-title">Quick Actions</h4>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="action-btn-wrapper">
                      <Button variant="primary" className="action-btn btn-futuristic w-100">
                        <span className="btn-icon">➕</span>
                        Add New Institute
                      </Button>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="action-btn-wrapper">
                      <Button variant="primary" className="action-btn btn-futuristic w-100">
                        <span className="btn-icon">📊</span>
                        View Analytics
                      </Button>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="action-btn-wrapper">
                      <Button variant="primary" className="action-btn btn-futuristic w-100">
                        <span className="btn-icon">⚙️</span>
                        System Settings
                      </Button>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="action-btn-wrapper">
                      <Button variant="primary" className="action-btn btn-futuristic w-100">
                        <span className="btn-icon">📝</span>
                        Manage Users
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Profile Card */}
          <Col lg={4}>
            <Card className="profile-card glass-effect">
              <Card.Header>
                <h4 className="card-title">Profile Information</h4>
              </Card.Header>
              <Card.Body>
                <div className="profile-info">
                  <div className="profile-avatar">
                    {user?.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-details">
                    <p><strong>Name:</strong> {user?.userName}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Phone:</strong> {user?.phoneNumber}</p>
                    <p><strong>Role:</strong> <span className="role-badge">Owner</span></p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col lg={12}>
            <Card className="activity-card glass-effect">
              <Card.Header>
                <h4 className="card-title">Recent Activity</h4>
              </Card.Header>
              <Card.Body>
                <div className="activity-placeholder">
                  <p className="text-center text-white-50">No recent activity to display</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OwnerDashboard;
