import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { scaleIn } from '../../components/shared/animation_variants';
import { FaBuilding, FaChalkboardTeacher, FaGraduationCap, FaTrophy, FaChartLine } from 'react-icons/fa';
import '../Dashboard.css';
import Sidebar from '../../components/Sidebar';
import OwnerDashboardGraphs from './OwnerDashboardGraphs';
import { apiUrl } from '../../utils/api';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ institutes: 0, teachers: 0, students: 0 });

  useEffect(() => {
    fetch(apiUrl('/api/auth/owner-stats'), {
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
        <Container fluid className="dashboard-content">
          {/* Title Section */}
          <motion.div 
            style={{ textAlign: 'center', marginBottom: '3rem' }}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge 
              bg="light" 
              style={{
                background: '#f3f4f6',
                color: '#000000',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 1.25rem',
                borderRadius: '50px',
                marginTop: '1.5rem',
                marginBottom: '1rem',
                border: '2px solid #e5e7eb',
                display: 'inline-block'
              }}
            >
              <FaTrophy style={{ marginRight: '0.5rem' }} />
              Welcome to Your Dashboard
            </Badge>
            
            <h1 style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
              fontWeight: 600,
              color: '#000000',
              marginBottom: '1rem',
              letterSpacing: '-1.5px'
            }}>
              Owner Dashboard
            </h1>
            <p style={{
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              color: '#000000',
              fontWeight: 500
            }}>
              Welcome back, <span style={{ fontWeight: 700 }}>{user?.userName || 'Owner'}</span>! 
              Manage your <span style={{ fontWeight: 700 }}>entire system</span>
            </p>
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
                        background: 'var(--theme-color)',
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
                      color: 'var(--theme-color)',
                      marginBottom: '0.5rem'
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
