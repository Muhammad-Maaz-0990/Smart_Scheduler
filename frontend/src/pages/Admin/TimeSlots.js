import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Container, Card, Table, Alert, Button, Modal, Form, Badge, InputGroup } from 'react-bootstrap';
import AdminPageHeader from '../../components/AdminPageHeader';
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
  const [sortField, setSortField] = useState('days'); // Default sort by days
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [previousTimeSlot, setPreviousTimeSlot] = useState(null);
  const [originalTimeSlot, setOriginalTimeSlot] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [timeSlotToDelete, setTimeSlotToDelete] = useState(null);
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

  const getSortedTimeSlots = () => {
    let filtered = list.filter(row => row.days.toLowerCase().includes(searchTerm.toLowerCase()));

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

        // For days sorting using DAY_ORDER
        if (sortField === 'days') {
          const aIdx = DAY_ORDER.indexOf(aVal);
          const bIdx = DAY_ORDER.indexOf(bVal);
          return sortDirection === 'asc' ? aIdx - bIdx : bIdx - aIdx;
        }

        // For time fields (startTime, endTime)
        if (sortField === 'startTime' || sortField === 'endTime') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // String comparison for other fields
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
    setOriginalTimeSlot(null);
    // Remove focus from button immediately when opening modal
    if (document.activeElement) {
      document.activeElement.blur();
    }
    setShow(true);
    setError(''); setSuccess('');
  };

  const openEdit = (row) => {
    setMode('edit');
    const timeSlotData = { _id: row._id, days: row.days, startTime: row.startTime, endTime: row.endTime };
    setCurrent(timeSlotData);
    setOriginalTimeSlot(timeSlotData);
    setShow(true);
    setError(''); setSuccess('');
  };

  const close = () => {
    setShow(false);
    setOriginalTimeSlot(null);
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
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Operation failed');
      }
      
      await fetchList();
      setShow(false);
      
      // Show snackbar for both add and update
      if (mode === 'edit') {
        // Find the previous timeslot data for undo
        const oldTimeSlot = list.find(t => t._id === current._id);
        setPreviousTimeSlot({ ...oldTimeSlot, _id: current._id });
        const timeSlotName = `${current.days} ${current.startTime}-${current.endTime}`;
        setSnackbarMessage({ itemName: timeSlotName, action: 'updated', extra: 'successfully' });
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 5000);
      } else {
        // For add operation, get the newly created timeslot data after fetch
        setTimeout(async () => {
          const res = await fetch('http://localhost:5000/api/timeslots/institute', { headers: { ...tokenHeader() } });
          if (res.ok) {
            const timeSlotsData = await res.json().catch(() => []);
            const newlyAddedTimeSlot = timeSlotsData.find(t => 
              t.days === current.days && 
              t.startTime === current.startTime && 
              t.endTime === current.endTime
            );
            if (newlyAddedTimeSlot) {
              setPreviousTimeSlot({ ...newlyAddedTimeSlot, isAdded: true });
            }
          }
        }, 100);
        
        const timeSlotName = `${current.days} ${current.startTime}-${current.endTime}`;
        setSnackbarMessage({ itemName: timeSlotName, action: 'added', extra: 'successfully' });
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 5000);
      }
    } catch (e) {
      setError(e.message || 'Operation failed');
      // Don't close modal - keep it open to show error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (timeSlot) => {
    setTimeSlotToDelete(timeSlot);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!timeSlotToDelete) return;

    setError(''); setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/timeslots/${timeSlotToDelete._id}`, { method: 'DELETE', headers: { ...tokenHeader() } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Delete failed');
      }
      
      // Store deleted timeslot for undo
      setPreviousTimeSlot({ ...timeSlotToDelete, isDeleted: true });
      const timeSlotName = `${timeSlotToDelete.days} ${timeSlotToDelete.startTime}-${timeSlotToDelete.endTime}`;
      setSnackbarMessage({ itemName: timeSlotName, action: 'deleted', extra: 'successfully' });
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 5000);
      
      await fetchList();
    } catch (e) {
      setError(e.message || 'Delete failed');
    } finally {
      setShowDeleteModal(false);
      setTimeSlotToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTimeSlotToDelete(null);
  };

  const handleUndo = async () => {
    if (!previousTimeSlot) return;
    
    try {
      // Check if it was a delete operation
      if (previousTimeSlot.isDeleted) {
        // Restore deleted timeslot by creating it again
        const response = await fetch(`http://localhost:5000/api/timeslots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tokenHeader() },
          body: JSON.stringify({
            days: previousTimeSlot.days,
            startTime: previousTimeSlot.startTime,
            endTime: previousTimeSlot.endTime,
            instituteID: instituteObjectId
          })
        });

        if (response.ok) {
          fetchList();
          const timeSlotName = `${previousTimeSlot.days} ${previousTimeSlot.startTime}-${previousTimeSlot.endTime}`;
          setSnackbarMessage({ itemName: timeSlotName, action: 'restored', extra: 'successfully' });
          setTimeout(() => {
            setShowSnackbar(false);
            setPreviousTimeSlot(null);
          }, 3000);
        }
      } else if (previousTimeSlot.isAdded) {
        // Undo add operation by deleting the newly added timeslot
        const response = await fetch(`http://localhost:5000/api/timeslots/${previousTimeSlot._id}`, {
          method: 'DELETE',
          headers: { ...tokenHeader() }
        });

        if (response.ok) {
          fetchList();
          const timeSlotName = `${previousTimeSlot.days} ${previousTimeSlot.startTime}-${previousTimeSlot.endTime}`;
          setSnackbarMessage({ itemName: timeSlotName, action: 'removed', extra: 'successfully' });
          setTimeout(() => {
            setShowSnackbar(false);
            setPreviousTimeSlot(null);
          }, 3000);
        }
      } else {
        // Update operation undo
        const response = await fetch(`http://localhost:5000/api/timeslots/${previousTimeSlot._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...tokenHeader() },
          body: JSON.stringify({
            days: previousTimeSlot.days,
            startTime: previousTimeSlot.startTime,
            endTime: previousTimeSlot.endTime
          })
        });

        if (response.ok) {
          fetchList();
          const timeSlotName = `${previousTimeSlot.days} ${previousTimeSlot.startTime}-${previousTimeSlot.endTime}`;
          setSnackbarMessage({ itemName: timeSlotName, action: 'undo', extra: 'successful' });
          setTimeout(() => {
            setShowSnackbar(false);
            setPreviousTimeSlot(null);
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Undo failed:', err);
    }
  };

  return (
    <>
      <AdminPageHeader
        icon={FaClock}
        title="Time Slots Management"
        subtitle="Configure daily timings for your institute"
        actions={
          <>
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
          </>
        }
      />

      {/* Search */}
          <div
            className="mb-4"
            style={{ position: 'relative', zIndex: 100 }}
          >
            <InputGroup>
              <InputGroup.Text style={{
                background: 'var(--theme-color-light)',
                border: '1.5px solid var(--theme-color)',
                borderRadius: '12px 0 0 12px',
                color: 'var(--theme-color)',
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
                  border: '2px solid var(--theme-color)',
                  borderRadius: '0 12px 12px 0',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid var(--theme-color)';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid var(--theme-color)';
                  e.target.style.background = 'white';
                }}
              />
            </InputGroup>
          </div>

          {/* Alerts */}
          <AnimatePresence>
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
                    background: 'var(--theme-color)',
                    color: 'var(--theme-color)',
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
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Day</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Start Time</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>End Time</th>
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
                              backgroundColor: 'var(--theme-color-light)',
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
                    <th 
                      onClick={() => handleSort('_id')}
                      style={{ 
                        padding: '1rem', 
                        fontWeight: 600, 
                        color: 'var(--theme-color)', 
                        borderBottom: 'none', 
                        backgroundColor: 'var(--theme-color-light)', 
                        border: '1px solid var(--theme-color)',
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
                      onClick={() => handleSort('days')}
                      style={{ 
                        padding: '1rem', 
                        fontWeight: 600, 
                        color: 'var(--theme-color)', 
                        borderBottom: 'none', 
                        backgroundColor: 'var(--theme-color-light)', 
                        border: '1px solid var(--theme-color)',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Day
                        {sortField === 'days' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('startTime')}
                      style={{ 
                        padding: '1rem', 
                        fontWeight: 600, 
                        color: 'var(--theme-color)', 
                        borderBottom: 'none', 
                        backgroundColor: 'var(--theme-color-light)', 
                        border: '1px solid var(--theme-color)',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Start Time
                        {sortField === 'startTime' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('endTime')}
                      style={{ 
                        padding: '1rem', 
                        fontWeight: 600, 
                        color: 'var(--theme-color)', 
                        borderBottom: 'none', 
                        backgroundColor: 'var(--theme-color-light)', 
                        border: '1px solid var(--theme-color)',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        End Time
                        {sortField === 'endTime' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', textAlign: 'center', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>Actions</th>
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
                      {getSortedTimeSlots().map((row, index) => (
                          <MotionTr
                            key={row._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{
                              backgroundColor: 'var(--theme-color-light)'
                            }}
                            style={{
                              fontSize: '0.875rem',
                              borderBottom: '1px solid rgba(105, 65, 219, 0.1)'
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
                                  onClick={() => handleDeleteClick(row)}
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
              background: 'var(--theme-color)',
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
                    color: 'var(--theme-color)',
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
                      e.target.style.borderColor = 'var(--theme-color)';
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
                    color: 'var(--theme-color)',
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
                      e.target.style.borderColor = 'var(--theme-color)';
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
                    color: 'var(--theme-color)',
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
                      e.target.style.borderColor = 'var(--theme-color)';
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
                  disabled={submitting || (mode === 'edit' && originalTimeSlot && 
                    current.days === originalTimeSlot.days && 
                    current.startTime === originalTimeSlot.startTime && 
                    current.endTime === originalTimeSlot.endTime)}
                  whileHover={{ 
                    background: submitting || (mode === 'edit' && originalTimeSlot && 
                      current.days === originalTimeSlot.days && 
                      current.startTime === originalTimeSlot.startTime && 
                      current.endTime === originalTimeSlot.endTime) ? undefined : '#fff',
                    color: submitting || (mode === 'edit' && originalTimeSlot && 
                      current.days === originalTimeSlot.days && 
                      current.startTime === originalTimeSlot.startTime && 
                      current.endTime === originalTimeSlot.endTime) ? undefined : 'var(--theme-color)',
                    border: submitting || (mode === 'edit' && originalTimeSlot && 
                      current.days === originalTimeSlot.days && 
                      current.startTime === originalTimeSlot.startTime && 
                      current.endTime === originalTimeSlot.endTime) ? undefined : '2px solid var(--theme-color)'
                  }}
                  whileTap={{ scale: submitting || (mode === 'edit' && originalTimeSlot && 
                    current.days === originalTimeSlot.days && 
                    current.startTime === originalTimeSlot.startTime && 
                    current.endTime === originalTimeSlot.endTime) ? 1 : 0.98 }}
                  transition={{ duration: 0.15 }}
                  type="submit"
                  style={{
                    background: submitting || (mode === 'edit' && originalTimeSlot && 
                      current.days === originalTimeSlot.days && 
                      current.startTime === originalTimeSlot.startTime && 
                      current.endTime === originalTimeSlot.endTime) ? '#9ca3af' : 'var(--theme-color)',
                    border: '2px solid var(--theme-color)',
                    borderRadius: '12px',
                    padding: '0.5rem 1rem',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    boxShadow: submitting || (mode === 'edit' && originalTimeSlot && 
                      current.days === originalTimeSlot.days && 
                      current.startTime === originalTimeSlot.startTime && 
                      current.endTime === originalTimeSlot.endTime) ? 'none' : '0 2px 8px rgba(105, 65, 219, 0.08)',
                    cursor: submitting || (mode === 'edit' && originalTimeSlot && 
                      current.days === originalTimeSlot.days && 
                      current.startTime === originalTimeSlot.startTime && 
                      current.endTime === originalTimeSlot.endTime) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '120px',
                    justifyContent: 'center',
                    opacity: submitting || (mode === 'edit' && originalTimeSlot && 
                      current.days === originalTimeSlot.days && 
                      current.startTime === originalTimeSlot.startTime && 
                      current.endTime === originalTimeSlot.endTime) ? 0.6 : 1
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

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={handleCancelDelete}
        centered
        backdrop="static"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Modal.Header 
            closeButton
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '12px 12px 0 0',
              padding: '0.75rem 1rem'
            }}
            closeVariant="white"
          >
            <Modal.Title style={{ 
              fontWeight: 600, 
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaTrash size={18} />
              Confirm Delete
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{
              background: '#ffffff',
              padding: '2rem',
              border: 'none',
              borderRadius: '0 0 12px 12px',
              overflow: 'visible'
            }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ 
                fontSize: '1rem', 
                color: '#374151',
                marginBottom: '1rem',
                lineHeight: 1.6
              }}>
                Are you sure you want to delete time slot <strong style={{ color: '#ef4444' }}>{timeSlotToDelete ? `${timeSlotToDelete.days} ${timeSlotToDelete.startTime}-${timeSlotToDelete.endTime}` : ''}</strong>?
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280',
                marginBottom: 0
              }}>
                This action cannot be undone.
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <MotionButton
                type="button"
                whileHover={{ 
                  background: '#ffffff',
                  color: '#6b7280',
                  borderColor: '#6b7280'
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onClick={handleCancelDelete}
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
                type="button"
                whileHover={{ 
                  background: '#fff',
                  color: '#ef4444',
                  border: '2px solid #ef4444'
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                onClick={handleConfirmDelete}
                style={{
                  background: '#ef4444',
                  border: '2px solid #ef4444',
                  borderRadius: '12px',
                  padding: '0.5rem 1rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)'
                }}
              >
                Delete
              </MotionButton>
            </div>
          </Modal.Body>
        </motion.div>
      </Modal>

      <AnimatePresence>
        {showSnackbar && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ 
              duration: 0.4,
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ffffff',
              color: '#1f2937',
              padding: '1.25rem 1.75rem',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              minWidth: '420px',
              maxWidth: '90vw',
              backdropFilter: 'blur(10px)',
              border: '1px solid #e5e7eb'
            }}
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
                  fill="var(--theme-color)"
                />
              </svg>
            </motion.div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              flex: 1
            }}>
              <span style={{ 
                fontSize: '0.95rem',
                lineHeight: 1.5,
                letterSpacing: '0.01em',
                color: '#1f2937'
              }}>
                {typeof snackbarMessage === 'string' ? snackbarMessage : (
                  <>
                    TimeSlot <strong>{snackbarMessage.itemName}</strong> <strong>{snackbarMessage.action}</strong> {snackbarMessage.extra}
                  </>
                )}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem',
              borderLeft: '1px solid #e5e7eb',
              paddingLeft: '1rem'
            }}>
              <MotionButton
                whileHover={{ scale: 1.05, backgroundColor: '#f3f4f6' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUndo}
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  color: 'var(--theme-color)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s ease'
                }}
              >
                UNDO
              </MotionButton>
              
              <MotionButton
                whileHover={{ scale: 1.05, opacity: 0.6 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSnackbar(false);
                  setPreviousTimeSlot(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  fontWeight: 600,
                  fontSize: '1.25rem',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                  lineHeight: 1,
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </MotionButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TimeSlots;
