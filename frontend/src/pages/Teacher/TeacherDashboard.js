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

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [todaySlot, setTodaySlot] = useState(null);
  const [allDetails, setAllDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterDay, setFilterDay] = useState(''); // '' means all days
  const [showMine, setShowMine] = useState(true); // default show my classes
  const [searchQuery, setSearchQuery] = useState(''); // search across course/instructor (highlight in grid)

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
          setAllDetails([]);
        } else {
          const allDetailsRes = await axios.get(`/api/timetables-gen/details/${encodeURIComponent(current.instituteTimeTableID)}`);
          const allDetailsData = allDetailsRes.data?.details || [];
          setAllDetails(allDetailsData);
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

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayFull = dayNames[new Date().getDay()];

  const isTeacher = String(user?.role || user?.designation || '').toLowerCase() === 'teacher';
  const instructorName = String(user?.userName || user?.name || '').trim();
  const instructorNameLower = instructorName.toLowerCase();

  const mineDetails = (showMine && isTeacher && instructorName)
    ? allDetails.filter(d => String(d.instructorName || d.teacher || '').trim().toLowerCase() === instructorNameLower)
    : allDetails;

  const filterDayShort = String(filterDay || '').slice(0, 3).toLowerCase();
  const dayFilteredDetails = filterDayShort
    ? mineDetails.filter(d => String(d.day || '').slice(0, 3).toLowerCase() === filterDayShort)
    : mineDetails;

  const classGroupedDetails = React.useMemo(() => {
    const map = new Map();
    for (const d of dayFilteredDetails) {
      const className = String(d?.class || 'Unknown').trim() || 'Unknown';
      if (!map.has(className)) map.set(className, []);
      map.get(className).push(d);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [dayFilteredDetails]);

  // Find current lecture based on current time (from today's filtered list)
  const getCurrentLecture = (rows) => {
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    for (const lecture of rows) {
      if (!lecture?.time || typeof lecture.time !== 'string') continue;
      const [startTime, endTime] = lecture.time.split('-');
      if (!startTime || !endTime) continue;

      const [startHour, startMin] = startTime.split(':').map(n => parseInt(n, 10));
      const [endHour, endMin] = endTime.split(':').map(n => parseInt(n, 10));
      if ([startHour, startMin, endHour, endMin].some(n => Number.isNaN(n))) continue;

      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = endHour * 60 + endMin;

      if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes) {
        return lecture;
      }
    }
    return null;
  };

  const todayShort = todayFull.slice(0, 3).toLowerCase();
  const todaysMineDetails = mineDetails.filter(d => String(d.day || '').slice(0, 3).toLowerCase() === todayShort);
  const currentLecture = getCurrentLecture(todaysMineDetails);

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
              Teacher Dashboard
            </h1>
            <p style={{
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              color: '#000000',
              fontWeight: 500
            }}>
              Welcome back, <span style={{ fontWeight: 700 }}>{user?.userName || 'Teacher'}</span>!
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
                  padding: '1.5rem',
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
                      padding: '0.65rem 0.9rem',
                      background: '#ffffff',
                      border: '1px solid var(--theme-color)',
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
                      <Col lg={4} md={6} sm={12}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: 0
                          }}>
                            Filter by Day
                          </label>
                          <Form.Select
                            value={filterDay}
                            onChange={(e)=>setFilterDay(e.target.value)}
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
                            <option value="">All Days</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Sunday">Sunday</option>
                          </Form.Select>
                        </div>
                      </Col>

                      <Col lg={4} md={6} sm={12}>
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

                      <Col lg={4} md={12} sm={12}>
                        {currentLecture && (
                          <div style={{
                            padding: '0.75rem 1rem',
                            background: '#ecfdf5',
                            border: '1px solid #10b981',
                            borderRadius: '8px'
                          }}>
                            <div style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#059669',
                              textTransform: 'uppercase',
                              letterSpacing: '0.025em',
                              marginBottom: '0.25rem'
                            }}>
                              Current Lecture
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#111827',
                              marginBottom: '0.25rem'
                            }}>
                              {currentLecture.course}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'flex',
                              gap: '0.5rem'
                            }}>
                              <span><FaDoorOpen style={{ fontSize: '0.7rem' }} /> {currentLecture.roomNumber}</span>
                              <span>•</span>
                              <span>{formatTimeText(currentLecture.time)}</span>
                            </div>
                          </div>
                        )}
                      </Col>
                    </Row>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: '1rem',
                      paddingTop: '1rem'
                    }}>
                      <div />

                      <button
                        type="button"
                        onClick={() => { setFilterDay(''); setShowMine(true); setSearchQuery(''); }}
                        style={{
                          fontWeight: 600,
                          borderRadius: '8px',
                          padding: '0.625rem 1.5rem',
                          border: '1px solid #d1d5db',
                          background: '#ffffff',
                          color: '#374151',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          width: '170px'
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
                        Reset Filter
                      </button>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.6rem 0.9rem',
                          background: 'rgba(105, 65, 219, 0.10)',
                          border: '1px solid rgba(105, 65, 219, 0.25)',
                          borderRadius: '12px'
                        }}>
                          <Form.Check>
                            <Form.Check.Input
                              type="checkbox"
                              id="show-mine-checkbox"
                              checked={showMine}
                              onChange={(e)=>setShowMine(e.target.checked)}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '6px',
                                border: `2px solid ${showMine ? PURPLE_COLOR : 'rgba(105, 65, 219, 0.6)'}`,
                                backgroundColor: '#ffffff',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                display: 'inline-block',
                                cursor: 'pointer',
                                backgroundImage: showMine
                                  ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='${encodeURIComponent(PURPLE_COLOR)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M3.2 8.6l2.6 2.7L12.8 4.6'/%3E%3C/svg%3E")`
                                  : 'none',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                backgroundSize: '14px 14px'
                              }}
                            />
                            <Form.Check.Label
                              htmlFor="show-mine-checkbox"
                              style={{
                                marginLeft: '0.5rem',
                                fontWeight: 700,
                                color: '#111827'
                              }}
                            >
                              Show only my classes
                            </Form.Check.Label>
                          </Form.Check>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem' }}>
                    {dayFilteredDetails.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {classGroupedDetails.map(([className, details]) => (
                          <DailyTimetableGrid
                            key={className}
                            data={details}
                            currentDay={todayFull}
                            searchQuery={searchQuery}
                          />
                        ))}
                      </div>
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

export default TeacherDashboard;
