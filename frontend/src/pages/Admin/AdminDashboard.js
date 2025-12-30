import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Alert, Badge } from 'react-bootstrap';
import { FaChalkboardTeacher, FaUserGraduate, FaBook, FaCalendarAlt, FaDoorOpen, FaUsers, FaTrophy } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { apiUrl } from '../../utils/api';
import '../Dashboard.css';

const MotionCol = motion.create(Col);

// Global purple color variable
const PURPLE_COLOR = 'var(--theme-color)';

const AdminDashboard = () => {
  const { user, instituteObjectId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({ teachers: 0, students: 0, courses: 0, schedules: 0, rooms: 0, classes: 0 });

  // Debug: Log theme variables
  useEffect(() => {
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
    const themeColorLight = getComputedStyle(document.documentElement).getPropertyValue('--theme-color-light').trim();
    const themeColorDark = getComputedStyle(document.documentElement).getPropertyValue('--theme-color-dark').trim();
    
    console.log('🎨 Admin Dashboard Theme Colors:', {
      main: themeColor,
      light: themeColorLight,
      dark: themeColorDark
    });
  }, []);

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
          const resUsers = await fetch(apiUrl('/api/users/institute'), { headers });
          if (resUsers.ok) {
            const users = await resUsers.json();
            teachers = users.filter(u => u.designation === 'Teacher').length;
            students = users.filter(u => u.designation === 'Student').length;
          }
        } catch {}

        // Rooms (query with institute ObjectId like Rooms page)
        let rooms = 0;
        try {
          const resRooms = await fetch(apiUrl(`/api/rooms?instituteID=${encodeURIComponent(instituteObjectId || '')}`), { headers });
          if (resRooms.ok) {
            const list = await resRooms.json();
            rooms = Array.isArray(list) ? list.length : (Array.isArray(list?.items) ? list.items.length : 0);
          }
        } catch {}

        // Classes (use institute ObjectId like Classes page)
        let classes = 0;
        try {
          const resClasses = await fetch(apiUrl(`/api/classes/${encodeURIComponent(instituteObjectId || '')}`), { headers });
          if (resClasses.ok) {
            const list = await resClasses.json();
            classes = Array.isArray(list) ? list.length : (Array.isArray(list?.items) ? list.items.length : 0);
          }
        } catch {}

        // Courses (use institute ObjectId like Courses page)
        let courses = 0;
        try {
          const resCourses = await fetch(apiUrl(`/api/courses/${encodeURIComponent(instituteObjectId || '')}`), { headers });
          if (resCourses.ok) {
            const list = await resCourses.json();
            courses = Array.isArray(list) ? list.length : (Array.isArray(list?.items) ? list.items.length : 0);
          }
        } catch {}

        // Timetables (schedules)
        let schedules = 0;
        try {
          const resTT = await fetch(apiUrl('/api/timetables-gen/list'), { headers });
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
    { icon: FaChalkboardTeacher, value: counts.teachers, label: 'Teachers', color: PURPLE_COLOR, delay: 0, description: 'Total active teachers', trend: '+12%' },
    { icon: FaUserGraduate, value: counts.students, label: 'Students', color: PURPLE_COLOR, delay: 0.1, description: 'Total enrolled students', trend: '+8%' },
    { icon: FaBook, value: counts.courses, label: 'Courses', color: PURPLE_COLOR, delay: 0.2, description: 'Active courses offered', trend: '+5%' },
    { icon: FaCalendarAlt, value: counts.schedules, label: 'Schedules', color: PURPLE_COLOR, delay: 0.3, description: 'Generated timetables', trend: 'New' },
    { icon: FaDoorOpen, value: counts.rooms, label: 'Rooms', color: PURPLE_COLOR, delay: 0.4, description: 'Available classrooms', trend: '+2' },
    { icon: FaUsers, value: counts.classes, label: 'Classes', color: PURPLE_COLOR, delay: 0.5, description: 'Total class sections', trend: '+3' },
  ];

  return (
      <div style={{ padding: 0 }}>
        <Container fluid style={{ maxWidth: 'none', paddingLeft: '2rem', paddingRight: '2rem' }}>
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
              Admin Dashboard
            </h1>
            <p style={{
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              color: '#000000',
              fontWeight: 500
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
                  background: '#ffffff',
                  border: '2px solid rgba(220, 38, 38, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(220, 38, 38, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}
              >
                <Alert.Heading style={{
                  color: '#dc2626',
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
                  <motion.div 
                    whileHover={{ y: -9 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{ height: '100%', position: 'relative' }}
                  >
                    <Card style={{
                      background: '#ffffff',
                      border: `2px solid ${PURPLE_COLOR}20`,
                      borderRadius: '24px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      height: '100%',
                      position: 'relative',
                      overflow: 'visible',
                      transition: 'box-shadow 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.16)';
                      e.currentTarget.style.borderRadius = '0 0 24px 24px';
                      e.currentTarget.style.border = `2px solid ${PURPLE_COLOR}`;
                      const iconBg = e.currentTarget.querySelector('[data-icon-bg]');
                      const icon = e.currentTarget.querySelector('svg');
                      const valueText = e.currentTarget.querySelector('h3');
                      const labelText = e.currentTarget.querySelector('p');
                      const topBar = e.currentTarget.querySelector('[data-top-bar]');
                      if (iconBg) iconBg.style.background = PURPLE_COLOR;
                      if (icon) icon.style.color = '#ffffff';
                      if (valueText) valueText.style.color = PURPLE_COLOR;
                      if (labelText) labelText.style.color = PURPLE_COLOR;
                      if (topBar) {
                        topBar.style.transform = 'translateY(-20px)';
                        topBar.style.opacity = '1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderRadius = '24px';
                      e.currentTarget.style.border = `2px solid ${PURPLE_COLOR}20`;
                      const iconBg = e.currentTarget.querySelector('[data-icon-bg]');
                      const icon = e.currentTarget.querySelector('svg');
                      const valueText = e.currentTarget.querySelector('h3');
                      const labelText = e.currentTarget.querySelector('p');
                      const topBar = e.currentTarget.querySelector('[data-top-bar]');
                      if (iconBg) iconBg.style.background = '#00000010';
                      if (icon) icon.style.color = '#000000';
                      if (valueText) valueText.style.color = '#000000';
                      if (labelText) labelText.style.color = '#000000';
                      if (topBar) {
                        topBar.style.transform = 'translateY(100%)';
                        topBar.style.opacity = '0';
                      }
                    }}
                    >
                        {/* Purple bar that slides UP from bottom */}
                        <div 
                          data-top-bar
                          style={{
                            position: 'absolute',
                            top: '5px',
                            left: '-2px',
                            right: '-2px',
                            height: '36px',
                            background: PURPLE_COLOR,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '0 1rem',
                            borderRadius: '12px 12px 0 0',
                            transform: 'translateY(100%)',
                            opacity: 0,
                            transition: 'all 0.4s ease',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(105, 65, 219, 0.3)'
                          }}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {stat.description} • {stat.trend}
                          </span>
                        </div>
                        
                        <Card.Body style={{ 
                          textAlign: 'center', 
                          padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2vw, 1.5rem)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {/* Icon */}
                          <div 
                            style={{
                              position: 'relative',
                              marginBottom: '1.5rem'
                            }}
                          >
                            <div style={{
                              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 'clamp(60px, 12vw, 80px)',
                              height: 'clamp(60px, 12vw, 80px)',
                              position: 'relative',
                              transition: 'color 0.15s ease'
                            }}>
                              <div data-icon-bg style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                background: '#00000010',
                                borderRadius: '50%',
                                zIndex: 0,
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                                transition: 'background 0.15s ease'
                              }}></div>
                              <stat.icon style={{ color: '#000000', transition: 'color 0.15s ease', position: 'relative', zIndex: 1 }} />
                            </div>
                          </div>
                          
                          {/* Value */}
                          <motion.h3 
                            style={{
                              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                              fontWeight: 700,
                              color: '#000000',
                              marginBottom: '0.5rem',
                              letterSpacing: '-1px',
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
                            fontSize: 'clamp(0.7rem, 1.5vw, 0.875rem)',
                            color: '#000000',
                            margin: 0,
                            marginTop: '0.5rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            position: 'relative',
                            paddingBottom: '0.75rem',
                            transition: 'color 0.3s ease'
                          }}>
                            {stat.label}
                          </p>
                          
                          {/* Progress Bar removed as requested */}
                        </Card.Body>
                      </Card>
                    </motion.div>
                </MotionCol>
              ))}
            </Row>
          )}

        </Container>
      </div>
  );
};

export default AdminDashboard;
