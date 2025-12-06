import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal, Form, Alert, Badge, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaDoorOpen, FaPlus, FaFileImport, FaFileExport, FaSearch, FaFilter, FaEdit, FaTrash, FaFlask, FaChalkboard } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const MotionCard = motion(Card);
const MotionButton = motion(Button);
const MotionTr = motion.tr;

const Rooms = () => {
  const { instituteObjectId } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentRoom, setCurrentRoom] = useState({
    roomNumber: '',
    roomStatus: 'Class'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All | Class | Lab
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (instituteObjectId) {
      fetchRooms();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instituteObjectId]);

  const fetchRooms = async () => {
    if (!instituteObjectId) {
      setError('Institute ID not found');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/rooms?instituteID=${encodeURIComponent(instituteObjectId)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to fetch rooms');
      }
    } catch (err) {
      setError('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

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
      const required = ['roomNumber','roomStatus'];
      const hasAll = required.every(h => headers.includes(h));
      if (!hasAll) {
        setImportError('CSV must include headers: roomNumber, roomStatus');
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
      const token = localStorage.getItem('token');
      for (const r of importPreview) {
        const body = {
          roomNumber: r.roomNumber,
          roomStatus: r.roomStatus || 'Class',
          instituteID: instituteObjectId
        };
        const res = await fetch('http://localhost:5000/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const data = await res.json().catch(()=>({}));
          throw new Error(data.message || 'Failed to add some rows');
        }
      }
      setSuccess('Imported rooms added successfully');
      setImportPreview([]);
      fetchRooms();
    } catch (err) {
      setError(err.message || 'Import add failed');
    }
  };

  const exportCSV = () => {
    const headers = ['roomNumber','roomStatus'];
    const rows = rooms.map(r => ({ roomNumber: r.roomNumber, roomStatus: r.roomStatus }));
    const csv = toCSV(headers, rows);
    downloadCSV('rooms.csv', csv);
  };

  const handleShowModal = (mode, room = null) => {
    setModalMode(mode);
    if (mode === 'edit' && room) {
      setCurrentRoom(room);
    } else {
      setCurrentRoom({ roomNumber: '', roomStatus: 'Class' });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentRoom({ roomNumber: '', roomStatus: 'Class' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = modalMode === 'add' 
        ? 'http://localhost:5000/api/rooms'
        : `http://localhost:5000/api/rooms/${currentRoom._id}`;
      
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      
      const token = localStorage.getItem('token');

      if (!instituteObjectId) {
        setError('Institute ID not resolved');
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...currentRoom,
          instituteID: instituteObjectId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Room ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
        fetchRooms();
        handleCloseModal();
        setSuccess('');
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Room deleted successfully');
        fetchRooms();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Delete failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <>
      <Sidebar activeMenu="rooms" />
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
        {/* Animated Background */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(126, 34, 206, 0.08) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 20s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', top: '60%', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)', borderRadius: '50%)', animation: 'float 15s ease-in-out infinite reverse' }}></div>

        <Container fluid>
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '2rem' }}
          >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <div>
                <h1 style={{
                  fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.5rem',
                  letterSpacing: '-1.5px'
                }}>
                  Rooms Management
                </h1>
                <p style={{
                  fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                  background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 600,
                  margin: 0
                }}>
                  Manage all classrooms and labs in your institute
                </p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <MotionButton
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShowModal('add')}
                  style={{
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 600,
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(126, 34, 206, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaPlus /> Add Room
                </MotionButton>
                <MotionButton
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onImportClick}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 600,
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaFileImport /> Import
                </MotionButton>
                <MotionButton
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportCSV}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 600,
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaFileExport /> Export
                </MotionButton>
                <input type="file" accept=".csv,text/csv" ref={fileInputRef} style={{ display:'none' }} onChange={onFileSelected} />
              </div>
            </div>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4"
            style={{ position: 'relative', zIndex: 100 }}
          >
            <Card style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(126, 34, 206, 0.12)',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(126, 34, 206, 0.1)',
              padding: '1.5rem',
              position: 'relative',
              zIndex: 100
            }}>
              <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-3">
                <InputGroup style={{ flex: 1 }}>
                  <InputGroup.Text style={{
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    border: 'none',
                    color: 'white'
                  }}>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by room number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-gradient"
                    style={{
                      border: '2px solid rgba(126, 34, 206, 0.2)',
                      borderRadius: '0 12px 12px 0',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid transparent';
                      e.target.style.backgroundImage = 'linear-gradient(white, white), linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)';
                      e.target.style.backgroundOrigin = 'border-box';
                      e.target.style.backgroundClip = 'padding-box, border-box';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(126, 34, 206, 0.2)';
                      e.target.style.backgroundImage = 'none';
                    }}
                  />
                </InputGroup>
                <div className="position-relative">
                  <MotionButton
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFilterMenu(s => !s)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.1), rgba(59, 130, 246, 0.1))',
                      border: '2px solid rgba(126, 34, 206, 0.2)',
                      borderRadius: '12px',
                      padding: '0.75rem 1.5rem',
                      fontWeight: 600,
                      color: '#7e22ce',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FaFilter /> Filter
                  </MotionButton>
                  <AnimatePresence>
                    {showFilterMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 0.5rem)',
                          zIndex: 9999,
                          minWidth: '280px'
                        }}
                      >
                        <Card style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
                          border: '2px solid rgba(126, 34, 206, 0.2)',
                          borderRadius: '20px',
                          boxShadow: '0 20px 60px rgba(126, 34, 206, 0.25), 0 10px 30px rgba(59, 130, 246, 0.15)',
                          padding: '1.5rem',
                          backdropFilter: 'blur(20px)'
                        }}>
                          <div style={{ 
                            fontWeight: 800, 
                            fontSize: '1.125rem',
                            marginBottom: '1.25rem',
                            background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}>
                            Filter Options
                          </div>
                          <Form.Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                              border: '2px solid rgba(126, 34, 206, 0.2)',
                              borderRadius: '12px',
                              padding: '0.875rem 1rem',
                              marginBottom: '1.25rem',
                              fontSize: '1rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: 'white',
                              transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#7e22ce'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(126, 34, 206, 0.2)'}
                          >
                            <option value="All">Status: All</option>
                            <option value="Class">Status: Class</option>
                            <option value="Lab">Status: Lab</option>
                          </Form.Select>
                          <div className="d-flex justify-content-end gap-2">
                            <MotionButton 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { setStatusFilter('All'); setShowFilterMenu(false); }}
                              style={{
                                background: 'transparent',
                                border: '2px solid rgba(126, 34, 206, 0.2)',
                                color: '#7e22ce',
                                borderRadius: '10px',
                                fontWeight: 600,
                                padding: '0.5rem 1.25rem',
                                fontSize: '0.95rem'
                              }}
                            >
                              Reset
                            </MotionButton>
                            <MotionButton 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowFilterMenu(false)}
                              style={{
                                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '10px',
                                fontWeight: 600,
                                padding: '0.5rem 1.25rem',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 12px rgba(126, 34, 206, 0.3)'
                              }}
                            >
                              Apply
                            </MotionButton>
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  variant="danger" 
                  dismissible 
                  onClose={() => setError('')}
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.1))',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '16px',
                    padding: '1rem 1.5rem',
                    fontWeight: 600,
                    color: '#dc2626'
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  variant="success" 
                  dismissible 
                  onClose={() => setSuccess('')}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1))',
                    border: '2px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '16px',
                    padding: '1rem 1.5rem',
                    fontWeight: 600,
                    color: '#059669'
                  }}
                >
                  {success}
                </Alert>
              </motion.div>
            )}
            {importError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  variant="warning" 
                  dismissible 
                  onClose={() => setImportError('')}
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1))',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '16px',
                    padding: '1rem 1.5rem',
                    fontWeight: 600,
                    color: '#d97706'
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
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                style={{ marginBottom: '2rem' }}
              >
                <MotionCard style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(126, 34, 206, 0.12)',
                  borderRadius: '20px',
                  boxShadow: '0 10px 40px rgba(126, 34, 206, 0.1)',
                  overflow: 'hidden'
                }}>
                  <Card.Header style={{
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    padding: '1.25rem 1.5rem',
                    border: 'none'
                  }}>
                    📋 Import Preview ({importPreview.length} rooms)
                  </Card.Header>
                  <Card.Body style={{ padding: '1.5rem' }}>
                    <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                      <Table hover responsive style={{ marginBottom: 0 }}>
                        <thead>
                          <tr style={{
                            background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.05), rgba(59, 130, 246, 0.05))',
                            borderBottom: '2px solid rgba(126, 34, 206, 0.2)'
                          }}>
                            <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>#</th>
                            <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>Room Number</th>
                            <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>Room Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((r, idx) => (
                            <motion.tr 
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              style={{ borderBottom: '1px solid rgba(126, 34, 206, 0.1)' }}
                            >
                              <td style={{ padding: '1rem' }}>{idx+1}</td>
                              <td style={{ padding: '1rem', fontWeight: 600 }}>{r.roomNumber}</td>
                              <td style={{ padding: '1rem' }}>
                                <Badge style={{
                                  background: r.roomStatus === 'Lab' ? 'linear-gradient(135deg, #06b6d4, #22d3ee)' : 'linear-gradient(135deg, #10b981, #34d399)',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '8px',
                                  fontWeight: 600
                                }}>
                                  {r.roomStatus === 'Lab' ? <><FaFlask /> Lab</> : <><FaChalkboard /> Class</>}
                                </Badge>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    <div className="d-flex gap-2">
                      <MotionButton
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addImported}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '0.75rem 1.5rem',
                          fontWeight: 600,
                          color: 'white',
                          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        ✅ Add Imported Rooms
                      </MotionButton>
                      <MotionButton
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={()=>setImportPreview([])}
                        style={{
                          background: 'transparent',
                          border: '2px solid rgba(126, 34, 206, 0.2)',
                          borderRadius: '12px',
                          padding: '0.75rem 1.5rem',
                          fontWeight: 600,
                          color: '#7e22ce'
                        }}
                      >
                        ❌ Clear Preview
                      </MotionButton>
                    </div>
                  </Card.Body>
                </MotionCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rooms Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <MotionCard style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(126, 34, 206, 0.12)',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(126, 34, 206, 0.1)',
              overflow: 'hidden'
            }}>
              <Card.Body style={{ padding: '1.5rem' }}>
                <div style={{ overflowX: 'auto' }}>
                  <Table hover responsive style={{ marginBottom: 0 }}>
                    <thead>
                      <tr style={{
                        background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.05), rgba(59, 130, 246, 0.05))',
                        borderBottom: '2px solid rgba(126, 34, 206, 0.2)'
                      }}>
                        <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>#</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>Room Number</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>Room Status</th>
                        <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                            <LoadingSpinner />
                          </td>
                        </tr>
                      ) : rooms.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ 
                            textAlign: 'center', 
                            padding: '3rem 1rem',
                            color: '#6b7280',
                            fontSize: '1.125rem'
                          }}>
                            <div style={{
                              background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.1), rgba(59, 130, 246, 0.1))',
                              padding: '2rem',
                              borderRadius: '16px',
                              margin: '1rem'
                            }}>
                              <FaDoorOpen style={{ fontSize: '3rem', color: '#7e22ce', marginBottom: '1rem' }} />
                              <div style={{ fontWeight: 600 }}>No rooms found</div>
                              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Click "Add Room" to create your first room!</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        rooms
                          .filter(r => (statusFilter === 'All' ? true : r.roomStatus === statusFilter))
                          .filter(r => String(r.roomNumber || '').toLowerCase().includes(searchTerm.trim().toLowerCase()))
                          .map((room, index) => (
                            <MotionTr 
                              key={room._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ 
                                backgroundColor: 'rgba(126, 34, 206, 0.05)',
                                transition: { duration: 0.2 }
                              }}
                              style={{ borderBottom: '1px solid rgba(126, 34, 206, 0.1)' }}
                            >
                              <td style={{ padding: '1rem', fontWeight: 600 }}>{index + 1}</td>
                              <td style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 600, color: '#374151' }}>
                                {room.roomNumber}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <Badge style={{
                                  background: room.roomStatus === 'Lab' ? 'linear-gradient(135deg, #06b6d4, #22d3ee)' : 'linear-gradient(135deg, #10b981, #34d399)',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  {room.roomStatus === 'Lab' ? <><FaFlask /> Lab</> : <><FaChalkboard /> Class</>}
                                </Badge>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <div className="d-flex gap-2 justify-content-center">
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={
                                      <Tooltip 
                                        id={`edit-${room._id}`}
                                        className="custom-gradient-tooltip"
                                      >
                                        <div style={{
                                          background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                                          color: 'white',
                                          borderRadius: '12px',
                                          padding: '0.5rem 1rem',
                                          fontSize: '0.875rem',
                                          fontWeight: 600,
                                          border: 'none',
                                          boxShadow: '0 8px 24px rgba(126, 34, 206, 0.4)'
                                        }}>
                                          Edit this room
                                        </div>
                                      </Tooltip>
                                    }
                                  >
                                    <MotionButton
                                      whileHover={{ scale: 1.1, y: -2 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleShowModal('edit', room)}
                                      style={{
                                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '0.5rem 1rem',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <FaEdit /> Edit
                                    </MotionButton>
                                  </OverlayTrigger>
                                  
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={
                                      <Tooltip 
                                        id={`delete-${room._id}`}
                                        className="custom-gradient-tooltip"
                                      >
                                        <div style={{
                                          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                                          color: 'white',
                                          borderRadius: '12px',
                                          padding: '0.5rem 1rem',
                                          fontSize: '0.875rem',
                                          fontWeight: 600,
                                          border: 'none',
                                          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
                                        }}>
                                          Delete this room
                                        </div>
                                      </Tooltip>
                                    }
                                  >
                                    <MotionButton
                                      whileHover={{ scale: 1.1, y: -2 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleDelete(room._id)}
                                      style={{
                                        background: 'linear-gradient(135deg, #942f04ff, #800343ff)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '0.5rem 1rem',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <FaTrash /> Delete
                                    </MotionButton>
                                  </OverlayTrigger>
                                </div>
                              </td>
                            </MotionTr>
                          ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </MotionCard>
          </motion.div>
        </Container>
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal} 
        centered
        style={{ zIndex: 9999 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <Modal.Header 
            closeButton 
            style={{
              background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '20px 20px 0 0',
              padding: '1.5rem'
            }}
          >
            <Modal.Title style={{ fontWeight: 800 }}>
              {modalMode === 'add' ? 'Add New Room' : 'Edit Room'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
            padding: '2rem',
            borderRadius: '0 0 20px 20px'
          }}>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert 
                    variant="danger"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.1))',
                      border: '2px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert 
                    variant="success"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1))',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}
                  >
                    {success}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label style={{ 
                  fontWeight: 700, 
                  marginBottom: '0.75rem',
                  background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Room Number
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter room number (e.g., R101, Lab-01)"
                  value={currentRoom.roomNumber}
                  onChange={(e) => setCurrentRoom({ ...currentRoom, roomNumber: e.target.value })}
                  required
                  style={{
                    border: '2px solid rgba(126, 34, 206, 0.2)',
                    borderRadius: '12px',
                    padding: '0.875rem 1.25rem',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7e22ce'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(126, 34, 206, 0.2)'}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label style={{ 
                  fontWeight: 700, 
                  marginBottom: '0.75rem',
                  background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Room Status
                </Form.Label>
                <Form.Select
                  value={currentRoom.roomStatus}
                  onChange={(e) => setCurrentRoom({ ...currentRoom, roomStatus: e.target.value })}
                  required
                  style={{
                    border: '2px solid rgba(126, 34, 206, 0.2)',
                    borderRadius: '12px',
                    padding: '0.875rem 1.25rem',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7e22ce'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(126, 34, 206, 0.2)'}
                >
                  <option value="Class">Class</option>
                  <option value="Lab">Lab</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex justify-content-end gap-3 mt-4">
                <MotionButton
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseModal}
                  style={{
                    background: 'transparent',
                    border: '2px solid rgba(126, 34, 206, 0.2)',
                    borderRadius: '12px',
                    padding: '0.75rem 2rem',
                    fontWeight: 600,
                    color: '#7e22ce'
                  }}
                >
                  Cancel
                </MotionButton>
                <MotionButton
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 2rem',
                    fontWeight: 600,
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(126, 34, 206, 0.3)'
                  }}
                >
                  {modalMode === 'add' ? 'Add Room' : 'Update Room'}
                </MotionButton>
              </div>
            </Form>
          </Modal.Body>
        </motion.div>
      </Modal>
    </>
  );
};

export default Rooms;
