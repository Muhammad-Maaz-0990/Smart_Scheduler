import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Row, Col, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import { FaGraduationCap, FaChalkboardTeacher, FaBookOpen, FaDoorOpen, FaClock, FaCalendarDay, FaUserTie } from 'react-icons/fa';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [todaySlot, setTodaySlot] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [selectedClass, setSelectedClass] = useState(''); // '' means all classes
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
    setLoading(true);
    setError('');
    try {
      const tsRes = await axios.get('/api/timeslots/my/today');
      const ts = tsRes.data || null;
      setTodaySlot(ts);

      const listRes = await axios.get('/api/timetables-gen/list');
      const items = listRes.data?.items || [];
      const current = items.find(h => !!h.currentStatus);
      if (!current) {
        setTodayClasses([]);
      } else {
        // Determine target day: today
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const todayFull = dayNames[new Date().getDay()];
        const short = todayFull.slice(0,3);
        const params = new URLSearchParams();
        params.set('day', short);
        const detailsRes = await axios.get(`/api/timetables-gen/details/${encodeURIComponent(current.instituteTimeTableID)}/by-day?${params.toString()}`);
        const details = detailsRes.data?.details || [];
        // Filter by selected class if provided
        const filtered = selectedCls ? details.filter(d => String(d.class || '') === selectedCls) : details;
        setTodayClasses(filtered);
        // Populate class options from current timetable (unique class names)
        const allDetailsRes = await axios.get(`/api/timetables-gen/details/${encodeURIComponent(current.instituteTimeTableID)}`);
        const allDetails = allDetailsRes.data?.details || [];
        const uniqueClasses = Array.from(new Set(allDetails.map(d => String(d.class || '').trim()).filter(Boolean)));
        setClassOptions(uniqueClasses);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load today\'s schedule');
      setTodayClasses([]);
    } finally {
      setLoading(false);
    }
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
          setTodayClasses([]);
        } else {
          // 3) Fetch details for today via backend filter and build class options
          const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const todayFull = dayNames[new Date().getDay()];
          const short = todayFull.slice(0,3);
          const params = new URLSearchParams();
          params.set('day', short);
          const detailsRes = await axios.get(`/api/timetables-gen/details/${encodeURIComponent(current.instituteTimeTableID)}/by-day?${params.toString()}`);
          const details = detailsRes.data?.details || [];
          setTodayClasses(details);
          const allDetailsRes = await axios.get(`/api/timetables-gen/details/${encodeURIComponent(current.instituteTimeTableID)}`);
          const allDetails = allDetailsRes.data?.details || [];
          const uniqueClasses = Array.from(new Set(allDetails.map(d => String(d.class || '').trim()).filter(Boolean)));
          setClassOptions(uniqueClasses);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load today\'s schedule');
        setTodayClasses([]);
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

  return (
    <>
      <Sidebar activeMenu="dashboard" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>

        <Container fluid className="dashboard-content" style={{ padding: '2rem' }}>
          {/* Welcome Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-4"
          >
            <div style={{
              background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 6px rgba(126, 34, 206, 0.2)',
              color: '#fff'
            }}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaGraduationCap style={{ fontSize: '2.5rem' }} />
                Student Dashboard
              </h1>
              <p style={{ fontSize: '1.1rem', marginBottom: 0, opacity: 0.9 }}>
                Welcome back, <strong>{user?.userName}</strong>!
              </p>
            </div>
          </motion.div>

          {/* Today's Schedule Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
          >
            <Card style={{
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <Card.Header style={{
                background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FaCalendarDay />
                Today's Schedule
              </Card.Header>
              <Card.Body className="p-0">
                {/* Filters */}
                <div style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(126, 34, 206, 0.2)',
                  background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.06) 0%, rgba(107, 33, 168, 0.06) 100%)'
                }}>
                  <Row className="align-items-center g-3">
                    <Col md={6} sm={12}>
                      <Form.Label style={{ fontWeight: 600, color: '#6b21a8' }}>Filter by Class</Form.Label>
                      <Form.Select size="sm" value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)}>
                        <option value="">All Classes</option>
                        {classOptions.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={6} sm={12} className="text-md-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => { setSelectedClass(''); fetchForFilters(''); }}
                        style={{ fontWeight: 600 }}
                      >
                        Reset
                      </button>
                      {todaySlot && todaySlot.startTime && (
                        <span style={{ color: '#7e22ce', fontWeight: 600, marginLeft: '1rem' }}>
                          <FaClock className="me-2" />
                          Institute Hours: {todaySlot.days} • {to12hAmpm(todaySlot.startTime)} - {to12hAmpm(todaySlot.endTime)}
                        </span>
                      )}
                    </Col>
                  </Row>
                </div>
                {todaySlot && todaySlot.startTime && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.1) 0%, rgba(107, 33, 168, 0.1) 100%)',
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(126, 34, 206, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#7e22ce',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>
                    <FaClock />
                    Institute Hours: {todaySlot.days} • {to12hAmpm(todaySlot.startTime)} - {to12hAmpm(todaySlot.endTime)}
                  </div>
                )}
                <div className="table-responsive">
                  <Table hover style={{ marginBottom: 0 }}>
                    <thead style={{
                      background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      color: '#fff'
                    }}>
                      <tr>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>#</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaChalkboardTeacher className="me-2" />Class
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaBookOpen className="me-2" />Course
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaDoorOpen className="me-2" />Room
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaClock className="me-2" />Time
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaUserTie className="me-2" />Instructor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <LoadingSpinner message="Loading schedule..." size="large" />
                          </td>
                        </tr>
                      ) : todayClasses.length > 0 ? (
                        todayClasses.map((c, idx) => (
                          <motion.tr
                            key={`${c.timeTableID}-${idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{ borderBottom: '1px solid #e5e7eb' }}
                          >
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>
                              <Badge bg="primary" style={{
                                background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem'
                              }}>
                                {c.class}
                              </Badge>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#111827', fontWeight: 500 }}>{c.course}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#6b7280' }}>
                              <Badge bg="secondary" style={{
                                background: '#6b7280',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem'
                              }}>
                                {c.roomNumber}
                              </Badge>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#7e22ce', fontWeight: 600 }}>
                              {formatTimeText(c.time)}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#111827', fontWeight: 500 }}>{c.instructorName}</td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <FaCalendarDay style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }} />
                            <p style={{ color: '#6b7280', fontWeight: 500, fontSize: '1rem' }}>
                              {error || 'No classes scheduled for today'}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Container>
      </div>
    </>
  );
};

export default StudentDashboard;
