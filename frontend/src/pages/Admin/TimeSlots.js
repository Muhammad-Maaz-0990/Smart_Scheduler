import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Container, Card, Table, Alert, Button, Modal, Form, Badge, InputGroup } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import { FaPlus, FaFileImport, FaFileExport, FaSearch, FaEdit, FaTrash, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const MotionCard = motion.create(Card);
const MotionButton = motion.create(Button);
const MotionTr = motion.tr;

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TimeSlots = () => {
  const { instituteObjectId } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('add');
  const [current, setCurrent] = useState({ days: 'Monday', startTime: '08:00', endTime: '14:00' });
  // Import/export states
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  // Import logic
  const onImportClick = () => {
    setImportError('');
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { headers, items } = parseCSV(text);
      const required = ['days', 'startTime', 'endTime'];
      const hasAll = required.every(h => headers.includes(h));
      if (!hasAll) {
        setImportError('CSV must include headers: days, startTime, endTime');
        setImportPreview([]);
        return;
      }
      setImportPreview(items);
    } catch (err) {
      setImportError('Failed to parse CSV');
      setImportPreview([]);
    } finally {
      e.target.value = '';
    }
  };

  const addImported = async () => {
    if (!instituteObjectId || importPreview.length === 0) return;
    setError('');
    setSuccess('');
    try {
      for (const t of importPreview) {
        const body = {
          days: t.days,
          startTime: t.startTime,
          endTime: t.endTime,
          instituteID: instituteObjectId
        };
        const res = await fetch('http://localhost:5000/api/timeslots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tokenHeader() },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to add some rows');
        }
      }
      setSuccess('Imported timeslots added successfully');
      setImportPreview([]);
      fetchList();
    } catch (err) {
      setError(err.message || 'Import add failed');
    }
  };

  const exportCSV = () => {
    const headers = ['days', 'startTime', 'endTime'];
    const rows = list.map(t => ({ days: t.days, startTime: t.startTime, endTime: t.endTime }));
    const csv = toCSV(headers, rows);
    downloadCSV('timeslots.csv', csv);
  };

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
    // Remove focus from button immediately when opening modal
    if (document.activeElement) {
      document.activeElement.blur();
    }
    setShow(true);
    setError(''); setSuccess('');
  };

  const openEdit = (row) => {
    setMode('edit');
    setCurrent({ _id: row._id, days: row.days, startTime: row.startTime, endTime: row.endTime });
    setShow(true);
    setError(''); setSuccess('');
  };

  const close = () => {
    setShow(false);
    // Remove focus from button to reset hover state
    setTimeout(() => {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // start < end
    const a = current.startTime; const b = current.endTime;
    if (!(a && b) || a >= b) { setError('End time must be after start time'); return; }

    setSubmitting(true);
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
      setShow(false);
    } catch (e) {
      setError(e.message || 'Operation failed');
    } finally {
      setSubmitting(false);
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
        {/* Animated Background */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(105, 65, 219, 0.08) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 20s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', top: '60%', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)', borderRadius: '50%)', animation: 'float 15s ease-in-out infinite reverse' }}></div>

        <Container fluid className="dashboard-content">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3"
            style={{ paddingTop: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: '#6941db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(105, 65, 219, 0.3)',
                flexShrink: 0
              }}>
                <FaClock style={{ fontSize: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: '#6941db',
                  lineHeight: '1.2',
                  margin: 0
                }}>
                  Time Slots Management
                </h2>
                <p style={{
                  fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
                  color: '#6941db',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Configure daily timings for your institute
                </p>
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <Button
                onClick={openAdd}
                disabled={isFullWeek}
                className={`action-btn action-btn-purple ${isFullWeek ? 'disabled' : ''}`}
                style={{
                  opacity: isFullWeek ? 0.5 : 1,
                  cursor: isFullWeek ? 'not-allowed' : 'pointer',
                  pointerEvents: isFullWeek ? 'none' : 'auto'
                }}
              >
                <FaPlus /> Add TimeSlot
              </Button>

              <Button
                onClick={onImportClick}
                className="action-btn action-btn-green"
              >
                <FaFileImport /> Import
              </Button>

              <Button
                onClick={exportCSV}
                className="action-btn action-btn-blue"
              >
                <FaFileExport /> Export
              </Button>

              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onFileSelected}
              />
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4"
            style={{ position: 'relative', zIndex: 100 }}
          >
            <InputGroup>
              <InputGroup.Text style={{
                background: 'rgba(79, 70, 229, 0.12)',
                border: '1px solid rgba(79, 70, 229, 0.25)',
                borderRadius: '12px 0 0 12px',
                color: '#4338CA',
                padding: '0.75rem 1rem'
              }}>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by day..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-gradient"
                style={{
                  border: '2px solid rgba(105, 65, 219, 0.2)',
                  borderRadius: '0 12px 12px 0',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid transparent';
                  e.target.style.backgroundImage = 'linear-gradient(white, white), linear-gradient(135deg, #6941db 0%, #3b82f6 100%)';
                  e.target.style.backgroundOrigin = 'border-box';
                  e.target.style.backgroundClip = 'padding-box, border-box';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid rgba(105, 65, 219, 0.2)';
                  e.target.style.backgroundImage = 'none';
                }}
              />
            </InputGroup>
          </motion.div>

          {/* Alerts */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="success"
                  onClose={() => setSuccess('')}
                  dismissible
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    color: '#059669',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}
                >
                  {success}
                </Alert>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="danger"
                  onClose={() => setError('')}
                  dismissible
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    color: '#dc2626',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
            {importError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="warning"
                  onClose={() => setImportError('')}
                  dismissible
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    color: '#d97706',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}
                >
                  {importError}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import Preview */}
          <AnimatePresence>
            {importPreview.length > 0 && (
              <MotionCard
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(105, 65, 219, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(105, 65, 219, 0.15)',
                  marginBottom: '1.5rem',
                  overflow: 'hidden'
                }}
              >
                <Card.Body>
                  <h5 style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    background: '#6941db',
                    color: '#6941db',
                    marginBottom: '1rem'
                  }}>
                    Import Preview ({importPreview.length} time slots)
                  </h5>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    <Table hover responsive style={{ marginBottom: 0 }}>
                      <thead>
                        <tr style={{
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderBottom: '2px solid rgba(105, 65, 219, 0.2)'
                        }}>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Day</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Start Time</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>End Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <motion.tr 
                            key={idx} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{
                              backgroundColor: 'rgba(79, 70, 229, 0.12)',
                              transition: { duration: 0.2 }
                            }}
                            style={{ fontSize: '0.875rem', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '600' }}>{row.days}</td>
                            <td style={{ padding: '0.75rem' }}>{row.startTime}</td>
                            <td style={{ padding: '0.75rem' }}>{row.endTime}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <div className="d-flex gap-2">
                    <MotionButton
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addImported}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.625rem 1.5rem',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      Add Imported
                    </MotionButton>
                    <MotionButton
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setImportPreview([])}
                      style={{
                        background: 'rgba(107, 114, 128, 0.1)',
                        border: '1px solid rgba(107, 114, 128, 0.3)',
                        borderRadius: '10px',
                        padding: '0.625rem 1.5rem',
                        color: '#6b7280',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}
                    >
                      Clear Preview
                    </MotionButton>
                  </div>
                </Card.Body>
              </MotionCard>
            )}
          </AnimatePresence>

          {/* Main Table */}
          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(105, 65, 219, 0.1)',
              overflow: 'hidden'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <Table hover responsive style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>#</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Day</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Start Time</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>End Time</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', textAlign: 'center', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : list.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        No time slots yet. Add your first time slot!
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {list
                        .sort((a, b) => DAY_ORDER.indexOf(a.days) - DAY_ORDER.indexOf(b.days))
                        .filter(row => row.days.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((row, index) => (
                          <MotionTr
                            key={row._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{
                              backgroundColor: 'rgba(79, 70, 229, 0.12)',
                              transition: { duration: 0.2 }
                            }}
                            style={{
                              fontSize: '0.875rem',
                              transition: 'background-color 0.2s ease',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                            }}
                          >
                            <td style={{ padding: '1rem', fontWeight: '500', color: '#6b7280' }}>{index + 1}</td>
                            <td style={{ padding: '1rem', fontWeight: '400', color: '#374151' }}>{row.days}</td>
                            <td style={{ padding: '1rem', fontWeight: '500', color: '#374151' }}>{row.startTime}</td>
                            <td style={{ padding: '1rem', fontWeight: '500', color: '#374151' }}>{row.endTime}</td>
                            <td style={{ padding: '1rem' }}>
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  onClick={() => openEdit(row)}
                                  className="table-action-btn table-action-edit"
                                >
                                  <FaEdit /> Edit
                                </Button>

                                <Button
                                  onClick={() => handleDelete(row._id)}
                                  className="table-action-btn table-action-delete"
                                >
                                  <FaTrash /> Delete
                                </Button>
                              </div>
                            </td>
                          </MotionTr>
                        ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Container>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        show={show}
        onHide={close}
        centered
        backdrop="static"
      >
        <style>{`
          .modal-header .btn-close {
            filter: brightness(0) invert(1);
            opacity: 1;
          }
          .modal-header .btn-close:hover {
            filter: brightness(0) invert(1);
            opacity: 0.8;
          }
        `}</style>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Modal.Header
            closeButton
            style={{
              background: '#6941db',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem'
            }}
          >
            <Modal.Title style={{ fontWeight: '700', fontSize: '1.25rem' }}>
              {mode === 'add' ? 'Add Time Slot' : 'Edit Time Slot'}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ padding: '2rem', background: '#fafafa' }}>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert
                    variant="danger"
                    onClose={() => setError('')}
                    dismissible
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      color: '#dc2626',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      marginBottom: '1.5rem'
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Form onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Form.Group className="mb-4">
                  <Form.Label style={{
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    color: '#6941db',
                    fontSize: '0.8rem',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2
                  }}>
                    Day
                  </Form.Label>
                  <Form.Select
                    value={current.days}
                    onChange={(e) => setCurrent({ ...current, days: e.target.value })}
                    required
                    disabled={submitting}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid #e0e0e0',
                      padding: '1rem 1.25rem',
                      fontSize: '1rem',
                      background: 'white',
                      transition: 'all 0.3s ease',
                      boxShadow: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6941db';
                      e.target.style.boxShadow = '0 0 0 3px rgba(105, 65, 219, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {availableDays.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Form.Select>
                  <Form.Text style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                    One record per day. Unavailable days are already configured.
                  </Form.Text>
                </Form.Group>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Form.Group className="mb-4">
                  <Form.Label style={{
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    color: '#6941db',
                    fontSize: '0.8rem',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2
                  }}>
                    Start Time
                  </Form.Label>
                  <Form.Control
                    type="time"
                    placeholder="Start Time"
                    value={current.startTime}
                    onChange={(e) => setCurrent({ ...current, startTime: e.target.value })}
                    required
                    disabled={submitting}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid #e0e0e0',
                      padding: '1rem 1.25rem',
                      fontSize: '1rem',
                      background: 'white',
                      transition: 'all 0.3s ease',
                      boxShadow: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6941db';
                      e.target.style.boxShadow = '0 0 0 3px rgba(105, 65, 219, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </Form.Group>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Form.Group className="mb-4">
                  <Form.Label style={{
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    color: '#6941db',
                    fontSize: '0.8rem',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2
                  }}>
                    End Time
                  </Form.Label>
                  <Form.Control
                    type="time"
                    placeholder="End Time"
                    value={current.endTime}
                    onChange={(e) => setCurrent({ ...current, endTime: e.target.value })}
                    required
                    disabled={submitting}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid #e0e0e0',
                      padding: '1rem 1.25rem',
                      fontSize: '1rem',
                      background: 'white',
                      transition: 'all 0.3s ease',
                      boxShadow: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6941db';
                      e.target.style.boxShadow = '0 0 0 3px rgba(105, 65, 219, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </Form.Group>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="d-flex justify-content-end gap-3"
                style={{ marginTop: '1.5rem' }}
              >
                <MotionButton
                  whileHover={{ 
                    background: '#ffffff',
                    color: '#6b7280',
                    borderColor: '#6b7280'
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={close}
                  disabled={submitting}
                  style={{
                    background: submitting ? '#9ca3af' : '#6b7280',
                    border: submitting ? '2px solid #9ca3af' : '2px solid #6b7280',
                    borderRadius: '12px',
                    padding: '0.5rem 1rem',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  Cancel
                </MotionButton>

                <MotionButton
                  whileHover={{ 
                    background: submitting ? undefined : '#fff',
                    color: submitting ? undefined : '#6941db',
                    border: submitting ? undefined : '2px solid #6941db'
                  }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  transition={{ duration: 0.15 }}
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? 'rgba(105, 65, 219, 0.6)' : '#6941db',
                    border: '2px solid #6941db',
                    borderRadius: '12px',
                    padding: '0.5rem 1rem',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    boxShadow: submitting ? 'none' : '0 2px 8px rgba(105, 65, 219, 0.08)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '120px',
                    justifyContent: 'center'
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    mode === 'add' ? 'Add Time Slot' : 'Update Time Slot'
                  )}
                </MotionButton>
              </motion.div>
            </Form>
          </Modal.Body>
        </motion.div>
      </Modal>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default TimeSlots;
