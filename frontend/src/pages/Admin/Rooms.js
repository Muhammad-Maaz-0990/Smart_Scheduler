import { Container, Card, Button, Table, Modal, Form, Alert, InputGroup } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import { FaDoorOpen, FaPlus, FaFileImport, FaFileExport, FaSearch, FaFilter, FaEdit, FaTrash, FaFlask, FaChalkboard, FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const MotionCard = motion.create(Card);
const MotionButton = motion.create(Button);
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
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All | Class | Lab
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [previousRoom, setPreviousRoom] = useState(null);
  const [sortField, setSortField] = useState('_id'); // Default sort by ID
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
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
      setCurrentRoom({
        _id: room._id,
        roomNumber: room.roomNumber,
        roomStatus: room.roomStatus
      });
    } else {
      setCurrentRoom({
        roomNumber: '',
        roomStatus: 'Class'
      });
    }
    // Remove focus from button immediately when opening modal
    if (document.activeElement) {
      document.activeElement.blur();
    }
    setShowModal(true);
    setError('');
    setSuccess('');
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

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentRoom({
      roomNumber: '',
      roomStatus: 'Class'
    });
    setTouched(false);
    setError('');
    setSuccess('');
    // Remove focus from button to reset hover state
    setTimeout(() => {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentRoom.roomNumber.trim()) {
      setError('Room number is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = modalMode === 'add' 
        ? 'http://localhost:5000/api/rooms'
        : `http://localhost:5000/api/rooms/${currentRoom._id}`;
      
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      
      const body = {
        roomNumber: currentRoom.roomNumber,
        roomStatus: currentRoom.roomStatus,
        instituteID: instituteObjectId
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const actionText = modalMode === 'add' ? 'added' : 'updated';
        
        // Show snackbar for updates only
        if (modalMode === 'edit') {
          // Find the previous room data for undo
          const oldRoom = rooms.find(r => r._id === currentRoom._id);
          setPreviousRoom({ ...oldRoom, _id: currentRoom._id });
          setSnackbarMessage(`Room ${currentRoom.roomNumber} status updated to ${currentRoom.roomStatus}`);
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 5000);
        } else {
          setSuccess(`Room ${actionText} successfully`);
          setTimeout(() => setSuccess(''), 3000);
        }
        
        fetchRooms();
        handleCloseModal();
      } else {
        const data = await response.json();
        setError(data.message || `Failed to ${modalMode} room`);
      }
    } catch (err) {
      setError(`An error occurred while ${modalMode === 'add' ? 'adding' : 'updating'} the room`);
    }
  };

  const handleUndo = async () => {
    if (!previousRoom) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/rooms/${previousRoom._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          roomNumber: previousRoom.roomNumber,
          roomStatus: previousRoom.roomStatus,
          instituteID: instituteObjectId
        })
      });

      if (response.ok) {
        fetchRooms();
        setSnackbarMessage(`Room ${previousRoom.roomNumber} status undo successful`);
        setTimeout(() => {
          setShowSnackbar(false);
          setPreviousRoom(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Undo failed:', err);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending order
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedRooms = () => {
    let filtered = rooms.filter(r =>
      r.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => r.roomStatus === statusFilter);
    }

    if (sortField) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // For ID sorting (MongoDB ObjectId)
        if (sortField === '_id') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // For room numbers, try to parse as numbers if possible
        if (sortField === 'roomNumber') {
          const aNum = parseInt(aVal.replace(/\D/g, ''));
          const bNum = parseInt(bVal.replace(/\D/g, ''));
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
          }
        }

        // String comparison for room status or text-based room numbers
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });
    }

    return filtered;
  };

  return (
    <>
      <Sidebar activeMenu="rooms" />
      <div className="dashboard-page">
        {/* Animated Background */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(105, 65, 219, 0.08) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 20s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', top: '60%', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)', borderRadius: '50%)', animation: 'float 15s ease-in-out infinite reverse' }}></div>

        <Container fluid className="dashboard-content">
          {/* Header Section */}
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
                <FaDoorOpen style={{ fontSize: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: '#6941db',
                  lineHeight: '1.2',
                  margin: 0
                }}>
                  Rooms Management
                </h2>
                <p style={{
                  fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
                  color: '#6941db',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Manage all classrooms and labs in your institute
                </p>
              </div>
            </div>
            
            <div className="d-flex gap-2 flex-wrap">
              <Button
                onClick={() => handleShowModal('add')}
                className="action-btn action-btn-purple"
              >
                <FaPlus /> Add Room
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
              
              <input type="file" accept=".csv,text/csv" ref={fileInputRef} style={{ display:'none' }} onChange={onFileSelected} />
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
            <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-3 mb-3">
              <InputGroup style={{ flex: 1 }}>
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
                  placeholder="Search by room number..."
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
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilterMenu(s => !s)}
                style={{
                  background: showFilterMenu ? '#6941db' : 'linear-gradient(135deg, rgba(105, 65, 219, 0.1), rgba(59, 130, 246, 0.1))',
                  border: '2px solid rgba(105, 65, 219, 0.2)',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  fontWeight: 400,
                  color: showFilterMenu ? 'white' : '#6941db',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaFilter /> Filter
              </MotionButton>
            </div>

            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      color: '#6941db',
                      whiteSpace: 'nowrap'
                    }}>
                      Room Status
                    </span>
                    <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                      <div style={{ flex: 1 }}>
                        <Form.Select
                          value={statusFilter || ''}
                          onChange={e => { setStatusFilter(e.target.value); }}
                          className="custom-select"
                          style={{
                            background: 'white',
                            borderRadius: '10px',
                            border: '2px solid rgba(105, 65, 219, 0.2)',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#1f2937',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            outline: 'none',
                            boxShadow: 'none'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.borderColor = '#6941db';
                          }}
                          onMouseOut={(e) => {
                            if (document.activeElement !== e.target) {
                              e.target.style.borderColor = 'rgba(105, 65, 219, 0.2)';
                            }
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#6941db';
                            e.target.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(105, 65, 219, 0.2)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <option value="All">All</option>
                          <option value="Class">Class</option>
                          <option value="Lab">Lab</option>
                        </Form.Select>
                      </div>
                      <MotionButton 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setStatusFilter('All'); }}
                        style={{
                          background: 'transparent',
                          border: '2px solid rgba(105, 65, 219, 0.2)',
                          color: '#6941db',
                          borderRadius: '12px',
                          fontWeight: 400,
                          padding: '0.75rem 0.875rem',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Reset
                      </MotionButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                    borderRadius: '12px',
                    padding: '1rem 1.5rem',
                    fontWeight: 400,
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
                    borderRadius: '12px',
                    padding: '1rem 1.5rem',
                    fontWeight: 400,
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
                    borderRadius: '12px',
                    padding: '1rem 1.5rem',
                    fontWeight: 400,
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
                  border: '2px solid rgba(105, 65, 219, 0.12)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(105, 65, 219, 0.1)',
                  overflow: 'hidden'
                }}>
                  <Card.Header style={{
                    background: 'rgba(79, 70, 229, 0.12)',
                    color: '#4338CA',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid rgba(79, 70, 229, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                    Import Preview ({importPreview.length} rooms)
                  </Card.Header>
                  <Card.Body style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                      <Table hover responsive style={{ marginBottom: 0 }}>
                        <thead style={{ backgroundColor: '#6941db' }}>
                          <tr>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'white', borderBottom: 'none', backgroundColor: '#6941db' }}>#</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'white', borderBottom: 'none', backgroundColor: '#6941db' }}>Room Number</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'white', borderBottom: 'none', backgroundColor: '#6941db' }}>Room Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((r, idx) => (
                            <motion.tr 
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{
                                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                                transition: { duration: 0.2 }
                              }}
                              style={{ borderBottom: '1px solid rgba(105, 65, 219, 0.1)' }}
                            >
                              <td style={{ padding: '1rem' }}>{idx+1}</td>
                              <td style={{ padding: '1rem', fontWeight: 400 }}>{r.roomNumber}</td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: '#111827',
                                  fontWeight: 500
                                }}>
                                  {r.roomStatus === 'Lab' ? <><FaFlask /> Lab</> : <><FaChalkboard /> Class</>}
                                </span>
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
                          fontWeight: 400,
                          color: 'white',
                          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'center'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Add Imported Rooms
                      </MotionButton>
                      <MotionButton
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={()=>setImportPreview([])}
                        style={{
                          background: 'transparent',
                          border: '2px solid rgba(105, 65, 219, 0.2)',
                          borderRadius: '12px',
                          padding: '0.75rem 1.5rem',
                          fontWeight: 400,
                          color: '#6941db',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'center'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear Preview
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
              border: '2px solid rgba(105, 65, 219, 0.12)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(105, 65, 219, 0.1)',
              overflow: 'hidden'
            }}>
              <Card.Body style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <Table hover responsive style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th 
                          onClick={() => handleSort('_id')}
                          style={{ 
                            padding: '1rem', 
                            fontWeight: 600, 
                            color: '#4338CA', 
                            borderBottom: 'none', 
                            backgroundColor: 'rgba(79, 70, 229, 0.12)',
                            border: '1px solid rgba(79, 70, 229, 0.25)',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            #
                            {sortField === '_id' && (
                              <span style={{ fontSize: '0.75rem' }}>
                                {sortDirection === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('roomNumber')}
                          style={{ 
                            padding: '1rem', 
                            fontWeight: 600, 
                            color: '#4338CA', 
                            borderBottom: 'none', 
                            backgroundColor: 'rgba(79, 70, 229, 0.12)',
                            border: '1px solid rgba(79, 70, 229, 0.25)',
                            cursor: 'pointer',
                            userSelect: 'none',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Room Number
                            {sortField === 'roomNumber' && (
                              <span style={{ fontSize: '0.75rem' }}>
                                {sortDirection === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('roomStatus')}
                          style={{ 
                            padding: '1rem', 
                            fontWeight: 600, 
                            color: '#4338CA', 
                            borderBottom: 'none', 
                            backgroundColor: 'rgba(79, 70, 229, 0.12)',
                            border: '1px solid rgba(79, 70, 229, 0.25)',
                            cursor: 'pointer',
                            userSelect: 'none',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Room Status
                            {sortField === 'roomStatus' && (
                              <span style={{ fontSize: '0.75rem' }}>
                                {sortDirection === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th style={{ 
                          padding: '1rem', 
                          fontWeight: 600, 
                          color: '#4338CA', 
                          textAlign: 'center', 
                          borderBottom: 'none', 
                          backgroundColor: 'rgba(79, 70, 229, 0.12)',
                          border: '1px solid rgba(79, 70, 229, 0.25)'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                            <LoadingSpinner />
                          </td>
                        </tr>
                      ) : getSortedRooms().length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ 
                            textAlign: 'center', 
                            padding: '3rem 1rem',
                            color: '#6b7280',
                            fontSize: '1.125rem'
                          }}>
                            <div style={{
                              background: 'linear-gradient(135deg, rgba(105, 65, 219, 0.1), rgba(59, 130, 246, 0.1))',
                              padding: '2rem',
                              borderRadius: '12px',
                              margin: '1rem'
                            }}>
                              <FaDoorOpen style={{ fontSize: '3rem', color: '#6941db', marginBottom: '1rem' }} />
                              <div style={{ fontWeight: 400 }}>No rooms found</div>
                              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Click "Add Room" to create your first room!</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        getSortedRooms()
                          .map((room, index) => (
                            <MotionTr 
                              key={room._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ 
                                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                                transition: { duration: 0.2 }
                              }}
                              style={{ borderBottom: '1px solid rgba(105, 65, 219, 0.1)' }}
                            >
                              <td style={{ padding: '1rem', fontWeight: 400 }}>{index + 1}</td>
                              <td style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 400, color: '#374151' }}>
                                {room.roomNumber}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  color: '#111827',
                                  fontWeight: 500,
                                  fontSize: '0.95rem'
                                }}>
                                  {room.roomStatus === 'Lab' ? <><FaFlask /> Lab</> : <><FaChalkboard /> Class</>}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button
                                    onClick={() => handleShowModal('edit', room)}
                                    className="table-action-btn table-action-edit"
                                  >
                                    <FaEdit /> Edit
                                  </Button>

                                  <Button
                                    onClick={() => handleDelete(room._id)}
                                    className="table-action-btn table-action-delete"
                                  >
                                    <FaTrash /> Delete
                                  </Button>
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
        style={{
          zIndex: 1050
        }}
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
            borderRadius: '12px 12px 0 0',
            padding: '0.75rem 1rem'
          }}
          closeVariant="white"
        >
          <Modal.Title style={{ fontWeight: 600, fontSize: '1.25rem' }}>
            {modalMode === 'add' ? 'Add New Room' : 'Edit Room'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{
            background: '#ffffff',
            padding: '2rem',
            border: 'none',
            borderRadius: '0 0 12px 12px',
            overflow: 'visible'
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
                      fontWeight: 400
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
                      fontWeight: 400
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
                  color: '#232323',
                  fontSize: '0.95rem',
                  letterSpacing: '0.01em',
                  lineHeight: 1.2
                }}>
                  Room Number
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter room number (e.g., R101, Lab-01)"
                  value={currentRoom.roomNumber}
                  onChange={(e) => setCurrentRoom({ ...currentRoom, roomNumber: e.target.value })}
                  required
                  isInvalid={touched && currentRoom.roomNumber === ''}
                  style={{
                    padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                    fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                    border: (touched && currentRoom.roomNumber === '') ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    boxShadow: (touched && currentRoom.roomNumber === '') ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    color: '#000000',
                    background: '#fff'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = (touched && currentRoom.roomNumber === '') ? '#ef4444' : '#6941db';
                    e.target.style.boxShadow = (touched && currentRoom.roomNumber === '') ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px rgba(105, 65, 219, 0.15)';
                    e.target.style.color = '#6941db';
                  }}
                  onBlur={e => {
                    setTouched(true);
                    e.target.style.borderColor = (currentRoom.roomNumber === '') ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = (currentRoom.roomNumber === '') ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                    e.target.style.color = '#000000';
                  }}
                  onMouseOver={e => {
                    e.target.style.borderColor = (touched && currentRoom.roomNumber === '') ? '#ef4444' : '#6941db';
                  }}
                  onMouseOut={e => {
                    if (!e.target.matches(':focus')) e.target.style.borderColor = (touched && currentRoom.roomNumber === '') ? '#ef4444' : '#e5e7eb';
                  }}
                />
                {touched && currentRoom.roomNumber === '' && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Room number is required
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label style={{
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  color: '#232323',
                  fontSize: '0.95rem',
                  letterSpacing: '0.01em',
                  lineHeight: 1.2
                }}>
                  Room Status
                </Form.Label>
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.5rem',
                  background: '#f3f4f6',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}>
                  <motion.div
                    whileHover={{ scale: currentRoom.roomStatus !== 'Class' ? 1.02 : 1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentRoom({ ...currentRoom, roomStatus: 'Class' })}
                    style={{
                      flex: 1,
                      padding: '0.875rem 1.25rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      background: currentRoom.roomStatus === 'Class' 
                        ? '#e0d4f7'
                        : '#ffffff',
                      color: currentRoom.roomStatus === 'Class' ? '#6941db' : '#6b7280',
                      boxShadow: currentRoom.roomStatus === 'Class' 
                        ? 'none'
                        : '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <FaChalkboard /> Class
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: currentRoom.roomStatus !== 'Lab' ? 1.02 : 1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentRoom({ ...currentRoom, roomStatus: 'Lab' })}
                    style={{
                      flex: 1,
                      padding: '0.875rem 1.25rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      background: currentRoom.roomStatus === 'Lab' 
                        ? '#e0d4f7'
                        : '#ffffff',
                      color: currentRoom.roomStatus === 'Lab' ? '#6941db' : '#6b7280',
                      boxShadow: currentRoom.roomStatus === 'Lab' 
                        ? 'none'
                        : '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <FaFlask /> Lab
                  </motion.div>
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end gap-3 mt-4">
                <MotionButton
                  type="button"
                  whileHover={{ 
                    background: '#ffffff',
                    color: '#6b7280',
                    borderColor: '#6b7280'
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleCloseModal}
                  style={{
                    background: '#6b7280',
                    border: '2px solid #6b7280',
                    borderRadius: '12px',
                    padding: '0.5rem 1rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#ffffff'
                  }}
                >
                  Cancel
                </MotionButton>
                <MotionButton
                  type="submit"
                  whileHover={{ 
                    background: '#fff',
                    color: '#6941db',
                    border: '2px solid #6941db'
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    background: '#6941db',
                    border: '2px solid #6941db',
                    borderRadius: '12px',
                    padding: '0.5rem 1rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(105, 65, 219, 0.08)'
                  }}
                >
                  {modalMode === 'add' ? 'Add Room' : 'Update Room'}
                </MotionButton>
              </div>
            </Form>
          </Modal.Body>
        </motion.div>
      </Modal>

      <AnimatePresence>
        {showSnackbar && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ffffff',
              color: '#1f2937',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              minWidth: '400px',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              flex: 1
            }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
                  fill="#10b981"
                />
              </svg>
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                {snackbarMessage}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUndo}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6941db',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  padding: '0.25rem 0.75rem',
                  cursor: 'pointer'
                }}
              >
                UNDO
              </MotionButton>
              
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSnackbar(false);
                  setPreviousRoom(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  padding: '0.25rem 0.75rem',
                  cursor: 'pointer'
                }}
              >
                DISMISS
              </MotionButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Rooms;
