import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import '../Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [todaySlot, setTodaySlot] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
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
          // 3) Fetch details and filter by today's day name
          const detailsRes = await axios.get(`/api/timetables-gen/details/${encodeURIComponent(current.instituteTimeTableID)}`);
          const details = detailsRes.data?.details || [];
          const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const todayName = dayNames[new Date().getDay()];
          const filtered = details.filter(d => String(d.day) === todayName);
          setTodayClasses(filtered);
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
          <h1 className="dashboard-title" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Student Dashboard 🎓</h1>
          <p className="dashboard-subtitle" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Welcome, {user?.userName}!</p>
        </div>
        
        <Row className="g-4 mt-4">
          <Col lg={8}>
            <Card className="schedule-card glass-effect">
              <Card.Header>
                <h4 className="card-title">Today's Schedule</h4>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table variant="dark" className="schedule-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Class</th>
                        <th>Course</th>
                        <th>Room</th>
                        <th>Time</th>
                        <th>Instructor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" className="text-center text-white-50">Loading…</td></tr>
                      ) : todayClasses.length > 0 ? (
                        todayClasses.map((c, idx) => (
                          <tr key={`${c.timeTableID}-${idx}`}>
                            <td>{idx + 1}</td>
                            <td>{c.class}</td>
                            <td>{c.course}</td>
                            <td>{c.roomNumber}</td>
                            <td>{formatTimeText(c.time)}</td>
                            <td>{c.instructorName}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center text-white-50">
                            {error || 'No classes scheduled for today'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                  {todaySlot && todaySlot.startTime && (
                    <div style={{ color: '#ddd', marginTop: 8 }}>
                      Institute timeslot: {todaySlot.days} • {to12hAmpm(todaySlot.startTime)} - {to12hAmpm(todaySlot.endTime)}
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      </div>
    </>
  );
};

export default StudentDashboard;
