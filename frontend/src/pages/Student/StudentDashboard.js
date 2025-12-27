import React, { useEffect, useState } from 'react';
import { Container, Card, Badge, Row, Col, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaDoorOpen, FaCalendarDay, FaTrophy, FaRegClock } from 'react-icons/fa';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import DailyTimetableGrid from '../../components/shared/DailyTimetableGrid';
import '../Dashboard.css';

// Global purple color variable
const PURPLE_COLOR = 'var(--theme-color)';

const expandCourseName = (courseName) => {
  if (!courseName) return courseName;
  
  const abbreviations = {
    'OOP': 'Object Oriented Programming',
    'DSA': 'Data Structures and Algorithms',
    'DAA': 'Design and Analysis of Algorithms',
    'OS': 'Operating Systems',
    'DBMS': 'Database Management Systems',
    'SE': 'Software Engineering',
    'AI': 'Artificial Intelligence',
    'ML': 'Machine Learning',
    'DL': 'Deep Learning',
    'NLP': 'Natural Language Processing',
    'CV': 'Computer Vision',
    'CN': 'Computer Networks',
    'DC': 'Data Communications',
    'DIP': 'Digital Image Processing',
    'CC': 'Cloud Computing',
    'BD': 'Big Data',
    'IoT': 'Internet of Things',
    'HCI': 'Human Computer Interaction',
    'IR': 'Information Retrieval',
    'IS': 'Information Security',
    'CG': 'Computer Graphics',
    'TOA': 'Theory of Automata',
    'DLD': 'Digital Logic Design',
    'CA': 'Computer Architecture',
    'COA': 'Computer Organization and Architecture',
    'PF': 'Programming Fundamentals',
    'DS': 'Data Science',
    'WD': 'Web Development',
    'MD': 'Mobile Development',
    'GD': 'Game Development',
    'VP': 'Visual Programming',
    'LA': 'Linear Algebra',
    'DM': 'Discrete Mathematics',
    'PS': 'Probability and Statistics',
    'CAL': 'Calculus',
    'DE': 'Differential Equations',
    'NM': 'Numerical Methods',
    'PM': 'Project Management',
    'BPR': 'Business Process Reengineering',
    'ITM': 'IT Management',
    'MIS': 'Management Information Systems',
    'ICT': 'Information and Communication Technology',
    'IT': 'Information Technology',
    'CS': 'Computer Science',
    'TA': 'Technical Writing',
    'CE': 'Communication and Presentation Skills'
  };
  
  if (abbreviations[courseName.trim()]) {
    return abbreviations[courseName.trim()];
  }
  
  let expanded = courseName;
  Object.keys(abbreviations).forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    expanded = expanded.replace(regex, abbreviations[abbr]);
  });
  
  return expanded;
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [todaySlot, setTodaySlot] = useState(null);
  const [allDetails, setAllDetails] = useState([]); // full timetable details
  const [classOptions, setClassOptions] = useState([]);
  const [selectedClass, setSelectedClass] = useState(''); // '' means all classes
  const [searchQuery, setSearchQuery] = useState(''); // search across course/instructor
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const to12hAmpm = (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string') return hhmm;
    const m = hhmm.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!m) return hhmm;
    let h24 = parseInt(m[1], 10);
    const min = m[2];
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12; // 0,12->12; 13->1
    return `${h12}:${min} ${suffix}`;
  };

  const formatTimeText = (text) => {
    if (!text || typeof text !== 'string') return text;
    // Replace all HH:MM occurrences with 12h format
    return text.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (match) => to12hAmpm(match));
  };

  const fetchForFilters = async (selectedCls) => {
    // We now filter client-side from full timetable details; no extra network
    // kept only to preserve reference from useEffect, but no-op for fetching
    // (data comes from initial load effect)
    return selectedCls;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // 1) Get today's timeslot window
        const tsRes = await axios.get('/api/timeslots/my/today');
        const ts = tsRes.data || null;
        setTodaySlot(ts);

        // 2) Find current timetable header
        const listRes = await axios.get('/api/timetables-gen/list');
        const items = listRes.data?.items || [];
        const current = items.find(h => !!h.currentStatus);
        if (!current) {
          setAllDetails([]);
          setClassOptions([]);
        } else {
          // 3) Fetch full timetable details and build class options
          const allDetailsRes = await axios.get(`/api/timetables-gen/details/${encodeURIComponent(current.instituteTimeTableID)}`);
          const allDetailsData = allDetailsRes.data?.details || [];
          setAllDetails(allDetailsData);
          const uniqueClasses = Array.from(new Set(allDetailsData.map(d => String(d.class || '').trim()).filter(Boolean)));
          setClassOptions(uniqueClasses);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load today\'s schedule');
        setAllDetails([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Refetch when class filter changes
  useEffect(() => {
    fetchForFilters(selectedClass);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayFull = dayNames[new Date().getDay()];

  const filteredDetails = selectedClass
    ? allDetails.filter(d => String(d.class || '') === selectedClass)
    : allDetails;

  // Find current lecture based on current time
  const getCurrentLecture = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Get today's short day name
    const todayShort = todayFull.slice(0, 3);

    // Filter today's classes
    const todaysClasses = filteredDetails.filter(d => {
      const dayShort = String(d.day || '').slice(0, 3).toLowerCase();
      const todayShortLower = todayShort.toLowerCase();
      return dayShort === todayShortLower;
    });

    // Find the lecture happening now
    for (const lecture of todaysClasses) {
      if (!lecture.time || typeof lecture.time !== 'string') continue;
      
      const [startTime, endTime] = lecture.time.split('-');
      if (!startTime || !endTime) continue;

      const [startHour, startMin] = startTime.split(':').map(n => parseInt(n, 10));
      const [endHour, endMin] = endTime.split(':').map(n => parseInt(n, 10));

      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = endHour * 60 + endMin;

      if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes) {
        return lecture;
      }
    }

    return null;
  };

  const currentLecture = getCurrentLecture();

  return (
    <>
      <Sidebar activeMenu="dashboard" />
      <div className="dashboard-page">
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
              Student Dashboard
            </h1>
            <p style={{
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              color: '#000000',
              fontWeight: 500
            }}>
              Welcome back, <span style={{ fontWeight: 700 }}>{user?.userName || 'Student'}</span>! 
              View your classes at <span style={{ fontWeight: 700 }}>{user?.instituteName || 'your institute'}</span>
            </p>
          </motion.div>

          {/* Loading Spinner */}
          {loading && <LoadingSpinner message="Loading today's schedule" />}

          {/* Today's Schedule Card */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card style={{
                background: '#ffffff',
                border: `2px solid ${PURPLE_COLOR}20`,
                borderRadius: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden'
              }}>
                <Card.Header style={{
                  background: 'var(--theme-color-light)',
                  borderBottom: '1px solid var(--theme-color)',
                  border: '1px solid var(--theme-color)',
                  color: 'var(--theme-color)',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaCalendarDay style={{ color: 'var(--theme-color)' }} />
                    Today's Schedule
                  </div>

                  {todaySlot && todaySlot.startTime ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#111827'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <FaCalendarDay style={{ fontSize: '1.05rem', color: 'var(--theme-color)', flexShrink: 0 }} />
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em'
                          }}>
                            {todayFull}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <FaRegClock style={{ fontSize: '1.1rem', color: 'var(--theme-color)', flexShrink: 0 }} />
                          <span style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: '#111827'
                          }}>
                            {to12hAmpm(todaySlot.startTime)} - {to12hAmpm(todaySlot.endTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </Card.Header>
                <Card.Body className="p-0">
                  {/* Filters */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    background: '#fafafa'
                  }}>
                    <Row className="align-items-start g-3">
                      <Col lg={3} md={6} sm={12}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: 600, 
                            color: '#374151',
                            marginBottom: 0
                          }}>
                            Filter by Class
                          </label>
                          <Form.Select 
                            value={selectedClass} 
                            onChange={(e)=>setSelectedClass(e.target.value)}
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              padding: '0.625rem 1rem',
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              color: '#111827',
                              background: '#ffffff'
                            }}
                          >
                            <option value="">All Classes</option>
                            {classOptions.map(cls => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </Form.Select>
                        </div>
                      </Col>
                      
                      <Col lg={3} md={6} sm={12}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: 600, 
                            color: '#374151',
                            marginBottom: 0
                          }}>
                            Search Timetable
                          </label>
                          <Form.Control
                            type="text"
                            placeholder="Search by course or instructor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              padding: '0.625rem 1rem',
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              color: '#111827',
                              background: '#ffffff'
                            }}
                          />
                        </div>
                      </Col>
                      
                      <Col lg={1} md={6} sm={12}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: 600, 
                            color: '#374151',
                            marginBottom: 0,
                            visibility: 'hidden'
                          }}>
                            Action
                          </label>
                          <button
                            type="button"
                            onClick={() => { setSelectedClass(''); fetchForFilters(''); }}
                            style={{
                              fontWeight: 600,
                              borderRadius: '8px',
                              padding: '0.625rem 0.75rem',
                              border: '1px solid #d1d5db',
                              background: '#ffffff',
                              color: '#374151',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              width: '100%'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f3f4f6';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                          >
                            Reset
                          </button>
                        </div>
                      </Col>
                      
                      <Col lg={5} md={12} sm={12}>
                        <div style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '0',
                          boxShadow: 'none',
                          position: 'relative',
                          minHeight: 'auto'
                        }}>
                          {currentLecture ? (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start'
                            }}>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                              }}>
                                <div style={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: '#374151'
                                }}>
                                  Current Lecture
                                </div>
                                
                                <div style={{
                                  fontSize: '1.1rem',
                                  fontWeight: 700,
                                  color: '#111827',
                                  lineHeight: '1.3'
                                }}>
                                  {expandCourseName(currentLecture.course)}
                                </div>
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.25rem'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem'
                                }}>
                                  <FaDoorOpen style={{ fontSize: '0.9rem', color: '#059669' }} />
                                  <span style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    color: '#059669'
                                  }}>
                                    {currentLecture.roomNumber}
                                  </span>
                                </div>
                                
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem'
                                }}>
                                  <FaRegClock style={{ fontSize: '0.9rem', color: '#059669' }} />
                                  <span style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    color: '#059669'
                                  }}>
                                    {formatTimeText(currentLecture.time)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.25rem'
                            }}>
                              <div style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: '#374151'
                              }}>
                                Current Lecture
                              </div>
                              <div style={{
                                fontSize: '0.9rem',
                                color: '#6b7280',
                                fontStyle: 'italic'
                              }}>
                                No lecture at the moment
                              </div>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    {filteredDetails.length > 0 ? (
                      <DailyTimetableGrid data={filteredDetails} currentDay={todayFull} searchQuery={searchQuery} />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <FaCalendarDay style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }} />
                        <p style={{ color: '#6b7280', fontWeight: 500, fontSize: '1rem' }}>
                          {error || 'No timetable available to display'}
                        </p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          )}
        </Container>
      </div>
    </>
  );
};

export default StudentDashboard;
