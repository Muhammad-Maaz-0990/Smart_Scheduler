import React from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <Navbar className="dashboard-navbar glass-effect" variant="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand className="navbar-brand-custom">
            <span className="brand-icon">⚡</span> Smart Scheduler
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link className="nav-link-custom">
                <span className="user-badge student-badge">Student</span>
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

      <div className="bg-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <Container className="dashboard-content py-5">
        <div className="welcome-section mb-5">
          <h1 className="dashboard-title">Student Dashboard 🎓</h1>
          <p className="dashboard-subtitle">Welcome, {user?.userName}!</p>
        </div>

        <Row className="g-4">
          <Col md={6} lg={3}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">📚</div>
                <h3 className="stat-value">0</h3>
                <p className="stat-label">Enrolled Courses</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">✅</div>
                <h3 className="stat-value">0</h3>
                <p className="stat-label">Completed</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">📝</div>
                <h3 className="stat-value">0</h3>
                <p className="stat-label">Assignments</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">⭐</div>
                <h3 className="stat-value">0</h3>
                <p className="stat-label">Average Grade</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4 mt-4">
          <Col lg={8}>
            <Card className="schedule-card glass-effect">
              <Card.Header>
                <h4 className="card-title">Today's Schedule</h4>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table variant="dark" className="schedule-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="4" className="text-center text-white-50">
                          No classes scheduled for today
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>

            <Card className="action-card glass-effect mt-4">
              <Card.Header>
                <h4 className="card-title">Quick Actions</h4>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Button variant="primary" className="action-btn btn-futuristic w-100">
                      <span className="btn-icon">📚</span>
                      My Courses
                    </Button>
                  </Col>
                  <Col md={6}>
                    <Button variant="primary" className="action-btn btn-futuristic w-100">
                      <span className="btn-icon">📝</span>
                      Assignments
                    </Button>
                  </Col>
                  <Col md={6}>
                    <Button variant="primary" className="action-btn btn-futuristic w-100">
                      <span className="btn-icon">📊</span>
                      My Grades
                    </Button>
                  </Col>
                  <Col md={6}>
                    <Button variant="primary" className="action-btn btn-futuristic w-100">
                      <span className="btn-icon">📅</span>
                      Full Schedule
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="profile-card glass-effect">
              <Card.Header>
                <h4 className="card-title">Profile</h4>
              </Card.Header>
              <Card.Body>
                <div className="profile-info">
                  <div className="profile-avatar student-avatar">
                    {user?.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-details">
                    <p><strong>Name:</strong> {user?.userName}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Institute:</strong> {user?.instituteName}</p>
                    <p><strong>Role:</strong> <span className="role-badge student-badge">Student</span></p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StudentDashboard;
