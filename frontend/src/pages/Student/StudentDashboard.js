import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import '../Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
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
          </Col>
        </Row>
      </Container>
      </div>
    </>
  );
};

export default StudentDashboard;
