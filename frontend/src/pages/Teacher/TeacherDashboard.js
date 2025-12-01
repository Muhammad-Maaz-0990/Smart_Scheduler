import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/timeslots/my/today');
        setToday(res.data || null);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load today\'s schedule');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const classesToday = today && today.startTime ? 1 : 0;

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
          <h1 className="dashboard-title">Teacher Dashboard 👨‍🏫</h1>
          <p className="dashboard-subtitle">Welcome, {user?.userName}!</p>
        </div>

        <Row className="g-4">
          <Col md={6} lg={3}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">📚</div>
                <h3 className="stat-value">0</h3>
                <p className="stat-label">Courses</p>
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
                <div className="stat-icon">📅</div>
                <h3 className="stat-value">{classesToday}</h3>
                <p className="stat-label">Classes Today</p>
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
                        <th>Day</th>
                        <th>Start</th>
                        <th>End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="3" className="text-center text-white-50">Loading…</td></tr>
                      ) : today && today.startTime ? (
                        <tr>
                          <td>{today.days}</td>
                          <td>{today.startTime}</td>
                          <td>{today.endTime}</td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-white-50">
                            {error || 'No schedule found for today'}
                          </td>
                        </tr>
                      )}
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
                  <Col md={4}>
                    <Button variant="primary" className="action-btn btn-futuristic w-100" onClick={() => navigate('/teacher/timetables')}>
                      <span className="btn-icon">📅</span>
                      View Schedule
                    </Button>
                  </Col>
                  <Col md={4}>
                    <Button variant="primary" className="action-btn btn-futuristic w-100" onClick={() => navigate('/teacher/feedbacks')}>
                      <span className="btn-icon">💬</span>
                      Feedbacks
                    </Button>
                  </Col>
                  <Col md={4}>
                    <Button variant="primary" className="action-btn btn-futuristic w-100" onClick={() => navigate('/teacher/profile')}>
                      <span className="btn-icon">👤</span>
                      My Profile
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
                  <div className="profile-avatar teacher-avatar">
                    {user?.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-details">
                    <p><strong>Name:</strong> {user?.userName}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Institute:</strong> {user?.instituteName}</p>
                    <p><strong>Role:</strong> <span className="role-badge teacher-badge">Teacher</span></p>
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

export default TeacherDashboard;
