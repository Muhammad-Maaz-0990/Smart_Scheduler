import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Alert, Badge, OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import { FaChalkboardTeacher, FaUserGraduate, FaBook, FaCalendarAlt, FaDoorOpen, FaUsers, FaTrophy } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const MotionCol = motion(Col);

const AdminDashboard = () => {
  const { user, instituteObjectId } = useAuth();
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

        // Rooms (query with institute ObjectId like Rooms page)
        let rooms = 0;
        try {
          const resRooms = await fetch(`http://localhost:5000/api/rooms?instituteID=${encodeURIComponent(instituteObjectId || '')}`, { headers });
          if (resRooms.ok) {
            const list = await resRooms.json();
            rooms = Array.isArray(list) ? list.length : (Array.isArray(list?.items) ? list.items.length : 0);
          }
        } catch {}

        // Classes (use institute ObjectId like Classes page)
        let classes = 0;
        try {
          const resClasses = await fetch(`http://localhost:5000/api/classes/${encodeURIComponent(instituteObjectId || '')}`, { headers });
          if (resClasses.ok) {
            const list = await resClasses.json();
            classes = Array.isArray(list) ? list.length : (Array.isArray(list?.items) ? list.items.length : 0);
          }
        } catch {}

        // Courses (use institute ObjectId like Courses page)
        let courses = 0;
        try {
          const resCourses = await fetch(`http://localhost:5000/api/courses/${encodeURIComponent(instituteObjectId || '')}`, { headers });
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
  }, [user, instituteObjectId]);

  const statsData = [
    { icon: FaChalkboardTeacher, value: counts.teachers, label: 'Teachers', color: '#7e22ce', delay: 0, description: 'Total active teachers', trend: '+12%' },
    { icon: FaUserGraduate, value: counts.students, label: 'Students', color: '#3b82f6', delay: 0.1, description: 'Total enrolled students', trend: '+8%' },
    { icon: FaBook, value: counts.courses, label: 'Courses', color: '#8b5cf6', delay: 0.2, description: 'Active courses offered', trend: '+5%' },
    { icon: FaCalendarAlt, value: counts.schedules, label: 'Schedules', color: '#6366f1', delay: 0.3, description: 'Generated timetables', trend: 'New' },
    { icon: FaDoorOpen, value: counts.rooms, label: 'Rooms', color: '#7e22ce', delay: 0.4, description: 'Available classrooms', trend: '+2' },
    { icon: FaUsers, value: counts.classes, label: 'Classes', color: '#3b82f6', delay: 0.5, description: 'Total class sections', trend: '+3' },
  ];

  return (
    <>
      <Sidebar activeMenu="dashboard" />
      <div 
        className="w-100"
        style={{ 
          marginLeft: window.innerWidth > 992 ? '260px' : '0', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          padding: window.innerWidth > 992 ? '2rem' : '1rem',
          paddingTop: window.innerWidth > 992 ? '2rem' : '70px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'margin-left 0.3s ease',
          maxWidth: '100vw',
          overflowX: 'hidden',
          boxSizing: 'border-box'
        }}>
        {/* Animated Background Elements */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(126, 34, 206, 0.08) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 20s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', top: '60%', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 15s ease-in-out infinite reverse' }}></div>

        <Container fluid>
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
                background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.1), rgba(59, 130, 246, 0.1))',
                color: '#7e22ce',
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.5rem 1.25rem',
                borderRadius: '50px',
                marginBottom: '1rem',
                border: '2px solid rgba(126, 34, 206, 0.2)',
                display: 'inline-block'
              }}
            >
              <FaTrophy style={{ marginRight: '0.5rem' }} />
              Welcome to Your Dashboard
            </Badge>
            
            <h1 style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1rem',
              letterSpacing: '-1.5px'
            }}>
              Admin Dashboard
            </h1>
            <p style={{
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 600
            }}>
              Welcome back, <span style={{ fontWeight: 700 }}>{user?.userName || 'Admin'}</span>! 
              Managing <span style={{ fontWeight: 700 }}>{user?.instituteName || 'your institute'}</span>
            </p>
          </motion.div>

          {/* Loading Spinner */}
          {loading && <LoadingSpinner message="Loading dashboard statistics" />}
          
          {/* Error Alert */}
          {!!error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Alert 
                variant="danger" 
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 245, 250, 0.95) 100%)',
                  border: '2px solid rgba(220, 38, 38, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(220, 38, 38, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
                  backdropFilter: 'blur(10px)',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}
              >
                <Alert.Heading style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  marginBottom: '0.75rem'
                }}>
                  Oops! Something went wrong
                </Alert.Heading>
                <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: 0 }}>{error}</p>
              </Alert>
            </motion.div>
          )}

          {/* Stats Cards */}
          {!loading && !error && (
            <Row className="g-3 g-md-4">
              {statsData.map((stat, index) => (
                <MotionCol 
                  key={stat.label} 
                  xs={12} 
                  sm={6} 
                  lg={4} 
                  xl={4}
                  xxl={2}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: stat.delay,
                    ease: [0.43, 0.13, 0.23, 0.96]
                  }}
                >
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip 
                        id={`tooltip-${stat.label}`}
                        className="custom-gradient-tooltip"
                      >
                        <div style={{
                          background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                          color: 'white',
                          borderRadius: '16px',
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          border: 'none',
                          boxShadow: '0 8px 24px rgba(126, 34, 206, 0.4)'
                        }}>
                          {stat.description}
                        </div>
                      </Tooltip>
                    }
                  >
                    <motion.div whileHover={{ scale: 1.03, y: -8 }}>
                      <Card style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '2px solid rgba(126, 34, 206, 0.12)',
                        borderRadius: '24px',
                        boxShadow: '0 10px 40px rgba(126, 34, 206, 0.1), 0 3px 12px rgba(59, 130, 246, 0.05)',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}>

                        {/* Bottom gradient bar */}
                        <motion.div 
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, #7e22ce, #3b82f6, #7e22ce)'
                          }}
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                        
                        <Card.Body style={{ 
                          textAlign: 'center', 
                          padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2vw, 1.5rem)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {/* Icon */}
                          <motion.div 
                            style={{
                              position: 'relative',
                              marginBottom: '1.5rem'
                            }}
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                          >
                            <div style={{
                              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                              background: `linear-gradient(135deg, ${stat.color} 0%, #3b82f6 100%)`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 'clamp(80px, 15vw, 110px)',
                              height: 'clamp(80px, 15vw, 110px)',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                background: `linear-gradient(135deg, ${stat.color}20, rgba(59, 130, 246, 0.08))`,
                                borderRadius: '50%',
                                zIndex: -1,
                                boxShadow: `0 8px 24px ${stat.color}30`
                              }}></div>
                              <stat.icon />
                            </div>
                          </motion.div>
                          
                          {/* Value */}
                          <motion.h3 
                            style={{
                              fontSize: 'clamp(2.25rem, 5.5vw, 3.25rem)',
                              fontWeight: 900,
                              background: `linear-gradient(135deg, ${stat.color} 0%, #3b82f6 100%)`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              marginBottom: '0.5rem',
                              letterSpacing: '-2px',
                              lineHeight: 1.2
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: stat.delay + 0.3, type: "spring", stiffness: 200 }}
                          >
                            {stat.value}
                          </motion.h3>
                          
                          {/* Label */}
                          <p style={{
                            fontSize: 'clamp(0.8rem, 1.75vw, 1rem)',
                            background: `linear-gradient(135deg, ${stat.color} 0%, #3b82f6 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            margin: 0,
                            marginTop: '0.5rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            position: 'relative',
                            paddingBottom: '0.75rem'
                          }}>
                            {stat.label}
                            <span style={{
                              position: 'absolute',
                              bottom: 0,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '50px',
                              height: '3px',
                              background: `linear-gradient(90deg, transparent, ${stat.color}, #3b82f6, transparent)`,
                              borderRadius: '2px',
                              display: 'block'
                            }}></span>
                          </p>
                          
                          {/* Progress Bar */}
                          <ProgressBar 
                            now={Math.min((stat.value / 10) * 100, 100)} 
                            style={{
                              height: '6px',
                              width: '80%',
                              marginTop: '1rem',
                              borderRadius: '50px',
                              background: 'rgba(126, 34, 206, 0.1)',
                              overflow: 'hidden'
                            }}
                          >
                            <ProgressBar 
                              now={Math.min((stat.value / 10) * 100, 100)}
                              style={{
                                background: `linear-gradient(90deg, ${stat.color}, #3b82f6)`,
                                borderRadius: '50px',
                                boxShadow: `0 0 10px ${stat.color}80`
                              }}
                            />
                          </ProgressBar>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </OverlayTrigger>
                </MotionCol>
              ))}
            </Row>
          )}

        </Container>
      </div>
    </>
  );
};

export default AdminDashboard;
