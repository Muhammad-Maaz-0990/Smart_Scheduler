import React, { useEffect, useState } from 'react';
import { Container, Card, Table } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import '../Dashboard.css';

const TeacherTimeTablesPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/timeslots/my/week');
        setSlots(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Sidebar activeMenu="timetables" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content">
          <h1 className="dashboard-title mb-4">Weekly Time Table</h1>
          <Card className="glass-effect">
            <Card.Body>
              <div className="table-responsive">
                <Table hover className="table-custom">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Start</th>
                      <th>End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="3" className="text-center">Loading…</td></tr>
                    ) : slots.length === 0 ? (
                      <tr><td colSpan="3" className="text-center">No time slots found</td></tr>
                    ) : (
                      slots.map(s => (
                        <tr key={s._id || s.timeSlotID}>
                          <td>{s.days}</td>
                          <td>{s.startTime}</td>
                          <td>{s.endTime}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
              {error && <div className="text-danger mt-2">{error}</div>}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default TeacherTimeTablesPage;
