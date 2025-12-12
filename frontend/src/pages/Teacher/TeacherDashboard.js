import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Row, Col, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import { FaChalkboardTeacher, FaBookOpen, FaDoorOpen, FaClock, FaCalendarDay, FaUserTie, FaUsers } from 'react-icons/fa';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [todaySlot, setTodaySlot] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterDay, setFilterDay] = useState(''); // '' means auto-select today
  const [showMine, setShowMine] = useState(true); // default show my classes

  const to12hAmpm = (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string') return hhmm;
    const m = hhmm.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!m) return hhmm;
    let h24 = parseInt(m[1], 10);
    const min = m[2];
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    return `${h12}:${min} ${suffix}`;
  };

  const formatTimeText = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (match) => to12hAmpm(match));
  };

  const fetchForFilters = async (selectedDay, onlyMine) => {
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
        // Determine target day: if selectedDay is empty, use today's
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const todayFull = dayNames[new Date().getDay()];
        const short = (selectedDay ? String(selectedDay).slice(0,3) : todayFull.slice(0,3));
        const params = new URLSearchParams();
        params.set('day', short);
        const isTeacher = String(user?.role || user?.designation || '').toLowerCase() === 'teacher';
        const instructorName = user?.userName || user?.name || '';
        if (onlyMine && isTeacher && instructorName) {
          params.set('instructor', instructorName);
        }
        const detailsRes = await axios.get(`/api/timetables-gen/details/${encodeURIComponent(current.instituteTimeTableID)}/by-day?${params.toString()}`);
        const details = detailsRes.data?.details || [];
        setTodayClasses(details);
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
        const tsRes = await axios.get('/api/timeslots/my/today');
        const ts = tsRes.data || null;
        setTodaySlot(ts);

        const listRes = await axios.get('/api/timetables-gen/list');
        const items = listRes.data?.items || [];
        const current = items.find(h => !!h.currentStatus);
        if (!current) {
          setTodayClasses([]);
        } else {
          // Initial load uses "today" and current showMine
          const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const todayFull = dayNames[new Date().getDay()];
          const short = todayFull.slice(0,3);
          const params = new URLSearchParams();
          params.set('day', short);
          const isTeacher = String(user?.role || user?.designation || '').toLowerCase() === 'teacher';
          const instructorName = user?.userName || user?.name || '';
          if (showMine && isTeacher && instructorName) {
            params.set('instructor', instructorName);
          }
          const detailsRes = await axios.get(`/api/timetables-gen/details/${encodeURIComponent(current.instituteTimeTableID)}/by-day?${params.toString()}`);
          const details = detailsRes.data?.details || [];
          setTodayClasses(details);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load today\'s schedule');
        setTodayClasses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showMine, user?.designation, user?.name, user?.role, user?.userName]);

  // Refetch when filters change
  useEffect(() => {
    fetchForFilters(filterDay, showMine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDay, showMine]);

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
                <FaChalkboardTeacher style={{ fontSize: '2.5rem' }} />
                Teacher Dashboard
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
                    <Col md={4} sm={12}>
                      <Form.Label style={{ fontWeight: 600, color: '#6b21a8' }}>Filter by Day</Form.Label>
                      <Form.Select size="sm" value={filterDay} onChange={(e)=>setFilterDay(e.target.value)}>
                        <option value="">Today</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </Form.Select>
                    </Col>
                    <Col md={4} sm={12}>
                      <Form.Check
                        type="switch"
                        id="show-mine-switch"
                        label="Show only my classes"
                        checked={showMine}
                        onChange={(e)=>setShowMine(e.target.checked)}
                        style={{ fontWeight: 600, color: '#6b21a8' }}
                      />
                    </Col>
                    <Col md={4} sm={12} className="text-md-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm me-3"
                        onClick={() => { setFilterDay(''); setShowMine(true); fetchForFilters('', true); }}
                        style={{ fontWeight: 600 }}
                      >
                        Reset
                      </button>
                      {todaySlot && todaySlot.startTime && (
                        <span style={{ color: '#7e22ce', fontWeight: 600 }}>
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
                          <FaUsers className="me-2" />Class
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

export default TeacherDashboard;
