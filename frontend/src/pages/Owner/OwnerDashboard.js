import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import Sidebar from '../../components/Sidebar';
import OwnerDashboardGraphs from './OwnerDashboardGraphs';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ institutes: 0, teachers: 0, students: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/owner-stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats({
          institutes: data.institutes ?? 0,
          teachers: data.teachers ?? 0,
          students: data.students ?? 0
        });
      })
      .catch(() => setStats({ institutes: 0, teachers: 0, students: 0 }));
  }, []);

  return (
    <div className="dashboard-page">
      <Sidebar activeMenu="dashboard" />
      <div className="bg-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>
      <Container className="dashboard-content py-5">
        <div className="welcome-section mb-5">
          <h1 className="dashboard-title">Welcome Back, {user?.userName}! 👋</h1>
          <p className="dashboard-subtitle">Owner Dashboard - Manage your entire system</p>
        </div>
        <Row className="g-4">
          <Col md={6} lg={4}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">🏢</div>
                <h3 className="stat-value">{stats.institutes}</h3>
                <p className="stat-label">Total Institutes</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={4}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">👨‍🏫</div>
                <h3 className="stat-value">{stats.teachers}</h3>
                <p className="stat-label">Total Teachers</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={4}>
            <Card className="stat-card glass-effect">
              <Card.Body>
                <div className="stat-icon">🎓</div>
                <h3 className="stat-value">{stats.students}</h3>
                <p className="stat-label">Total Students</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <OwnerDashboardGraphs />
      </Container>
    </div>
  );
};

export default OwnerDashboard;
