import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({ teachers: 0, students: 0, courses: 0, schedules: 0, rooms: 0, classes: 0 });

  useEffect(() => {
    const run = async () => {
      if (!user?.instituteID && !user?.instituteObjectId) return;
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Users in institute
        let teachers = 0, students = 0;
        try {
          const resUsers = await fetch('http://localhost:5000/api/users/institute', { headers });
          if (resUsers.ok) {
            const users = await resUsers.json();
            teachers = users.filter(u => u.designation === 'Teacher').length;
            students = users.filter(u => u.designation === 'Student').length;
          }
        } catch {}

        // Rooms (defaults to authenticated user's institute on backend)
        let rooms = 0;
        try {
          const resRooms = await fetch('http://localhost:5000/api/rooms', { headers });
          if (resRooms.ok) {
            const list = await resRooms.json();
            rooms = Array.isArray(list) ? list.length : (Array.isArray(list?.items) ? list.items.length : 0);
          }
        } catch {}

        // Classes (expects institute business key string in path)
        let classes = 0;
        try {
          const instituteKey = user?.instituteID; // business key string
          const resClasses = await fetch(`http://localhost:5000/api/classes/${encodeURIComponent(instituteKey || '')}`, { headers });
          if (resClasses.ok) {
            const list = await resClasses.json();
            classes = Array.isArray(list) ? list.length : (Array.isArray(list?.items) ? list.items.length : 0);
          }
        } catch {}

        // Courses (expects institute business key string in path)
        let courses = 0;
        try {
          const instituteKey = user?.instituteID; // business key string
          const resCourses = await fetch(`http://localhost:5000/api/courses/${encodeURIComponent(instituteKey || '')}`, { headers });
          if (resCourses.ok) {
            const list = await resCourses.json();
            courses = Array.isArray(list) ? list.length : (Array.isArray(list?.items) ? list.items.length : 0);
          }
        } catch {}

        // Timetables (schedules)
        let schedules = 0;
        try {
          const resTT = await fetch('http://localhost:5000/api/timetables-gen/list', { headers });
          if (resTT.ok) {
            const data = await resTT.json();
            const items = Array.isArray(data?.items) ? data.items : [];
            schedules = items.length;
          }
        } catch {}

        setCounts({ teachers, students, courses, schedules, rooms, classes });
      } catch (e) {
        setError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

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

          {loading && (
            <div className="mb-3" style={{ color: '#6b7280' }}>Loading stats…</div>
          )}
          {!!error && (
            <div className="mb-3" style={{ color: '#dc2626' }}>{error}</div>
          )}

          <Row className="g-4">
            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">👨‍🏫</div>
                  <h3 className="stat-value">{counts.teachers}</h3>
                  <p className="stat-label">Teachers</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">🎓</div>
                  <h3 className="stat-value">{counts.students}</h3>
                  <p className="stat-label">Students</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">📚</div>
                  <h3 className="stat-value">{counts.courses}</h3>
                  <p className="stat-label">Courses</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">📅</div>
                  <h3 className="stat-value">{counts.schedules}</h3>
                  <p className="stat-label">Schedules</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">🏫</div>
                  <h3 className="stat-value">{counts.rooms}</h3>
                  <p className="stat-label">Rooms</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">👥</div>
                  <h3 className="stat-value">{counts.classes}</h3>
                  <p className="stat-label">Classes</p>
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
