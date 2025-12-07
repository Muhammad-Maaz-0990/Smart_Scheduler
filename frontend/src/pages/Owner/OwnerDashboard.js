import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import { FaBuilding, FaChalkboardTeacher, FaGraduationCap, FaTrophy, FaChartLine } from 'react-icons/fa';
import '../Dashboard.css';
import Sidebar from '../../components/Sidebar';
import OwnerDashboardGraphs from './OwnerDashboardGraphs';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ institutes: 0, teachers: 0, students: 0 });

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
    <>
      <Sidebar activeMenu="dashboard" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content p-3 p-md-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="welcome-section mb-4"
          >
            <div className="d-flex align-items-center gap-3 mb-2">
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(126, 34, 206, 0.3)'
              }}>
                <FaTrophy style={{ color: '#fff', fontSize: '24px' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.25rem',
                  letterSpacing: '-0.5px'
                }}>
                  Welcome Back, {user?.userName}! 
                </h1>
                <p style={{
                  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                  color: '#6b7280',
                  fontWeight: 500,
                  marginBottom: 0
                }}>
                  Owner Dashboard - Manage your entire system
                </p>
              </div>
            </div>
          </motion.div>

          <Row className="g-3 g-md-4 mb-4">
            <Col xs={12} md={6} lg={4}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={scaleIn}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <Card style={{
                  border: '1px solid rgba(126, 34, 206, 0.15)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(126, 34, 206, 0.2)'
                      }}>
                        <FaBuilding style={{ color: '#fff', fontSize: '24px' }} />
                      </div>
                      <FaChartLine style={{ color: '#10b981', fontSize: '20px' }} />
                    </div>
                    <h3 style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#111827',
                      marginBottom: '0.5rem',
                      background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {stats.institutes}
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      fontWeight: 600,
                      marginBottom: 0
                    }}>
                      Total Institutes
                    </p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={scaleIn}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <Card style={{
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                      }}>
                        <FaChalkboardTeacher style={{ color: '#fff', fontSize: '24px' }} />
                      </div>
                      <FaChartLine style={{ color: '#10b981', fontSize: '20px' }} />
                    </div>
                    <h3 style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#111827',
                      marginBottom: '0.5rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {stats.teachers}
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      fontWeight: 600,
                      marginBottom: 0
                    }}>
                      Total Teachers
                    </p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={scaleIn}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <Card style={{
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                      }}>
                        <FaGraduationCap style={{ color: '#fff', fontSize: '24px' }} />
                      </div>
                      <FaChartLine style={{ color: '#10b981', fontSize: '20px' }} />
                    </div>
                    <h3 style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#111827',
                      marginBottom: '0.5rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {stats.students}
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      fontWeight: 600,
                      marginBottom: 0
                    }}>
                      Total Students
                    </p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>

          <OwnerDashboardGraphs />
        </Container>
      </div>
    </>
  );
};

export default OwnerDashboard;
