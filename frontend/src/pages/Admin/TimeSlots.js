import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Alert, Button, Modal, Form } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const TimeSlots = () => {
  const { instituteObjectId } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('add');
  const [current, setCurrent] = useState({ days: 'Monday', startTime: '08:00', endTime: '14:00' });

  const tokenHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchList = async () => {
    if (!instituteObjectId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/timeslots/institute', { headers: { ...tokenHeader() } });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || 'Failed to load time slots');
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (instituteObjectId) {
      fetchList();
    }
  // eslint-disable-next-line
  }, [instituteObjectId]);

  const usedDays = useMemo(() => new Set(list.map(x => x.days)), [list]);
  const availableDays = DAY_ORDER.filter(d => !usedDays.has(d) || (mode === 'edit' && d === current.days));
  const isFullWeek = usedDays.size >= 7;

  const openAdd = () => {
    setMode('add');
    const firstAvailable = DAY_ORDER.find(d => !usedDays.has(d)) || 'Monday';
    setCurrent({ days: firstAvailable, startTime: '08:00', endTime: '14:00' });
    setShow(true);
    setError(''); setSuccess('');
  };

  const openEdit = (row) => {
    setMode('edit');
    setCurrent({ _id: row._id, days: row.days, startTime: row.startTime, endTime: row.endTime });
    setShow(true);
    setError(''); setSuccess('');
  };

  const close = () => setShow(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // start < end
    const a = current.startTime; const b = current.endTime;
    if (!(a && b) || a >= b) { setError('End time must be after start time'); return; }

    try {
      const url = mode === 'add' ? 'http://localhost:5000/api/timeslots' : `http://localhost:5000/api/timeslots/${current._id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...tokenHeader() },
        body: JSON.stringify({ days: current.days, startTime: current.startTime, endTime: current.endTime })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Operation failed');
      setSuccess(mode === 'add' ? 'TimeSlot added' : 'TimeSlot updated');
      await fetchList();
      setTimeout(() => { setShow(false); setSuccess(''); }, 800);
    } catch (e) {
      setError(e.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this time slot?')) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/timeslots/${id}`, { method: 'DELETE', headers: { ...tokenHeader() } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setSuccess('TimeSlot deleted');
      await fetchList();
      setTimeout(() => setSuccess(''), 800);
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  return (
    <>
      <Sidebar activeMenu="timeslots" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
            <div>
              <h1 className="dashboard-title mb-2">Institute Time Slots</h1>
              <p className="dashboard-subtitle mb-0">Configure daily timings</p>
            </div>
            <Button variant="primary" className="btn-futuristic" onClick={openAdd} disabled={isFullWeek}>
              <span className="btn-icon">➕</span> Add TimeSlot
            </Button>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          <Card className="glass-effect">
            <Card.Body>
              <Table hover className="table-custom">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Day</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="text-center">Loading...</td></tr>
                  ) : list.length === 0 ? (
                    <tr><td colSpan="5" className="text-center">No time slots yet. Add one!</td></tr>
                  ) : (
                    list
                      .sort((a,b)=>DAY_ORDER.indexOf(a.days)-DAY_ORDER.indexOf(b.days))
                      .map((row, idx) => (
                      <tr key={row._id}>
                        <td>{idx + 1}</td>
                        <td>{row.days}</td>
                        <td>{row.startTime}</td>
                        <td>{row.endTime}</td>
                        <td>
                          <Button size="sm" variant="warning" className="me-2" onClick={() => openEdit(row)}>✏️ Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>🗑️ Delete</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Container>
      </div>

      <Modal show={show} onHide={close} centered>
        <Modal.Header closeButton className="glass-effect">
          <Modal.Title>{mode === 'add' ? 'Add Time Slot' : 'Edit Time Slot'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass-effect">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Day</Form.Label>
              <Form.Select
                value={current.days}
                onChange={(e) => setCurrent({ ...current, days: e.target.value })}
                required
              >
                {availableDays.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-light-muted"><small>One record per day. Unavailable days are already configured.</small></Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control type="time" value={current.startTime} onChange={(e)=>setCurrent({...current, startTime: e.target.value})} required />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>End Time</Form.Label>
              <Form.Control type="time" value={current.endTime} onChange={(e)=>setCurrent({...current, endTime: e.target.value})} required />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={close}>Cancel</Button>
              <Button variant="primary" type="submit" className="btn-futuristic">{mode === 'add' ? 'Add' : 'Update'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TimeSlots;
