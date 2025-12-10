import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { FaPlus, FaFileImport, FaFileExport, FaSearch, FaFilter, FaEdit, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const MotionCard = motion(Card);
const MotionButton = motion(Button);
const MotionTr = motion.tr;

const Classes = () => {
  const { instituteObjectId } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentClass, setCurrentClass] = useState({
    degree: '',
    session: 'Fall',
    section: 'A',
    year: '',
    rank: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({ session: 'All', section: 'All', year: '', rank: '' });
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (instituteObjectId) {
      fetchClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instituteObjectId]);

  const fetchClasses = async () => {
    if (!instituteObjectId) {
      setError('Institute ID not found');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/classes/${instituteObjectId}`);
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (err) {
      setError('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (mode, classData = null) => {
    setModalMode(mode);
    if (mode === 'edit' && classData) {
      setCurrentClass(classData);
    } else {
      setCurrentClass({ degree: '', session: 'Fall', section: 'A', year: '', rank: 1 });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentClass({ degree: '', session: 'Fall', section: 'A', year: '', rank: 1 });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = modalMode === 'add'
        ? 'http://localhost:5000/api/classes'
        : `http://localhost:5000/api/classes/${currentClass._id}`;

      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentClass,
          instituteID: instituteObjectId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Class ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
        fetchClasses();
        handleCloseModal();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleDelete = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Class deleted successfully');
        fetchClasses();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Delete failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const onImportClick = () => { setImportError(''); fileInputRef.current?.click(); };
  const onFileSelected = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const { headers, items } = parseCSV(text);
      const required = ['degree', 'session', 'section', 'year', 'rank'];
      if (!required.every(h => headers.includes(h))) { setImportError('CSV must include headers: ' + required.join(', ')); setImportPreview([]); return; }
      setImportPreview(items);
    } catch { setImportError('Failed to parse CSV'); setImportPreview([]); }
    finally { e.target.value = ''; }
  };
  const addImported = async () => {
    if (!instituteObjectId || importPreview.length === 0) return;
    setError(''); setSuccess('');
    try {
      for (const c of importPreview) {
        const res = await fetch('http://localhost:5000/api/classes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ degree: c.degree, session: c.session, section: c.section, year: c.year, rank: Number(c.rank) || 1, instituteID: instituteObjectId })
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed to add some rows'); }
      }
      setSuccess('Imported classes added successfully'); setImportPreview([]); fetchClasses();
    } catch (e) { setError(e.message || 'Import add failed'); }
  };
  const exportCSV = () => {
    const headers = ['degree', 'session', 'section', 'year', 'rank'];
    const rows = classes.map(c => ({ degree: c.degree, session: c.session, section: c.section, year: c.year, rank: c.rank }));
    downloadCSV('classes.csv', toCSV(headers, rows));
  };

  return (
    <>
      <Sidebar activeMenu="classes" />
      <div className="dashboard-page">
        <Container fluid className="dashboard-content">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3"
          >
            <div>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                Classes Management
              </h2>
              <p style={{
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                fontWeight: '600'
              }}>
                Manage all classes in your institute
              </p>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShowModal('add')}
                style={{
                  background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                  border: 'none',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 15px rgba(126, 34, 206, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaPlus /> Add Class
              </MotionButton>

              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onImportClick}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  border: 'none',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaFileImport /> Import
              </MotionButton>

              <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportCSV}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  border: 'none',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaFileExport /> Export
              </MotionButton>

              <input
                type="file"
                accept=".csv,text/csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onFileSelected}
              />
            </div>
          </motion.div>

          {/* Search and Filter Card */}
          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(126, 34, 206, 0.1)',
              marginBottom: '1.5rem',
              padding: '1.5rem',
              position: 'relative',
              zIndex: 100
            }}
          >
            <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
              <InputGroup style={{ flex: 1, maxWidth: '100%' }}>
                <InputGroup.Text
                  style={{
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '12px 0 0 12px',
                    color: 'white',
                    padding: '0.75rem 1rem'
                  }}
                >
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by degree/program..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderLeft: 'none',
                    borderRadius: '0 12px 12px 0',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '2px solid';
                    e.target.style.borderImage = 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%) 1';
                    e.target.style.borderLeft = 'none';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '2px solid #e5e7eb';
                    e.target.style.borderImage = 'none';
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
                    border: '1px solid rgba(126, 34, 206, 0.2)',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: '600',
                    color: '#7e22ce',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '140px',
                    justifyContent: 'center',
                    fontSize: '0.9rem'
                  }}
                >
                  <FaFilter /> Filter
                </MotionButton>

                <AnimatePresence>
                  {showFilterMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 0.5rem)',
                          zIndex: 9999,
                          minWidth: '280px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          borderRadius: '16px',
                          boxShadow: '0 10px 40px rgba(126, 34, 206, 0.2)'
                        }}
                      >
                        <Card.Body className="p-3">
                          <h6 style={{
                            fontSize: '0.875rem',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '1rem'
                          }}>
                            Filter Classes
                          </h6>

                          <Form.Group className="mb-2">
                            <Form.Label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>Session</Form.Label>
                            <Form.Select
                              size="sm"
                              value={filters.session}
                              onChange={(e) => setFilters({ ...filters, session: e.target.value })}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                fontSize: '0.875rem',
                                padding: '0.5rem'
                              }}
                            >
                              <option value="All">All Sessions</option>
                              <option value="Fall">Fall</option>
                              <option value="Spring">Spring</option>
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-2">
                            <Form.Label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>Section</Form.Label>
                            <Form.Select
                              size="sm"
                              value={filters.section}
                              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                fontSize: '0.875rem',
                                padding: '0.5rem'
                              }}
                            >
                              <option value="All">All Sections</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-2">
                            <Form.Label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>Year</Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              placeholder="e.g., 2024"
                              value={filters.year}
                              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                fontSize: '0.875rem',
                                padding: '0.5rem'
                              }}
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>Semester/Rank</Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              placeholder="e.g., 1, 2, 3..."
                              value={filters.rank}
                              onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                fontSize: '0.875rem',
                                padding: '0.5rem'
                              }}
                            />
                          </Form.Group>

                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setFilters({ session: 'All', section: 'All', year: '', rank: '' })}
                              style={{
                                flex: 1,
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                padding: '0.5rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#dc2626'
                              }}
                            >
                              Clear
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setShowFilterMenu(false)}
                              style={{
                                flex: 1,
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                padding: '0.5rem',
                                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                                border: 'none',
                                color: 'white'
                              }}
                            >
                              Apply
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>

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
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(126, 34, 206, 0.15)',
                  marginBottom: '1.5rem',
                  overflow: 'hidden'
                }}
              >
                <Card.Body>
                  <h5 style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '1rem'
                  }}>
                    Import Preview ({importPreview.length} classes)
                  </h5>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    <Table hover responsive style={{ marginBottom: 0 }}>
                      <thead>
                        <tr style={{
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderBottom: '2px solid rgba(126, 34, 206, 0.2)'
                        }}>
                          <th style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>#</th>
                          <th style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Degree</th>
                          <th style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Session</th>
                          <th style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Section</th>
                          <th style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Year</th>
                          <th style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {importPreview.map((r, idx) => (
                            <MotionTr
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: idx * 0.05 }}
                              style={{
                                fontSize: '0.875rem',
                                transition: 'all 0.2s ease',
                                borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                              }}
                            >
                              <td style={{ padding: '0.75rem' }}>{idx + 1}</td>
                              <td style={{ padding: '0.75rem', fontWeight: '500' }}>{r.degree}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <Badge style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '8px',
                                  background: r.session === 'Fall' ? '#fbbf24' : '#3b82f6',
                                  color: 'white'
                                }}>
                                  {r.session}
                                </Badge>
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <Badge style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '8px',
                                  background: '#6b7280',
                                  color: 'white'
                                }}>
                                  {r.section}
                                </Badge>
                              </td>
                              <td style={{ padding: '0.75rem' }}>{r.year}</td>
                              <td style={{ padding: '0.75rem' }}>{r.rank}</td>
                            </MotionTr>
                          ))}
                        </AnimatePresence>
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
                      Add Imported Classes
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
              boxShadow: '0 4px 20px rgba(126, 34, 206, 0.1)',
              overflow: 'hidden'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <Table hover responsive style={{ marginBottom: 0 }}>
                <thead>
                  <tr style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderBottom: '2px solid rgba(126, 34, 206, 0.2)'
                  }}>
                    <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>#</th>
                    <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>Degree</th>
                    <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>Session</th>
                    <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>Section</th>
                    <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>Year</th>
                    <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce' }}>Rank</th>
                    <th style={{ padding: '1rem', fontWeight: 700, color: '#7e22ce', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : classes.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        No classes found. Add your first class!
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {classes
                        .filter(c => (filters.session === 'All' ? true : c.session === filters.session))
                        .filter(c => (filters.section === 'All' ? true : c.section === filters.section))
                        .filter(c => (!filters.year ? true : String(c.year || '').includes(filters.year)))
                        .filter(c => (!filters.rank ? true : String(c.rank || '').includes(String(filters.rank))))
                        .filter(c => String(c.degree || '').toLowerCase().includes(searchTerm.trim().toLowerCase()))
                        .map((classItem, index) => (
                          <MotionTr
                            key={classItem._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{
                              backgroundColor: 'rgba(139, 92, 246, 0.05)',
                              transition: { duration: 0.2 }
                            }}
                            style={{
                              fontSize: '0.875rem',
                              transition: 'background-color 0.2s ease',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                            }}
                          >
                            <td style={{ padding: '1rem', fontWeight: '500', color: '#6b7280' }}>{index + 1}</td>
                            <td style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>{classItem.degree}</td>
                            <td style={{ padding: '1rem' }}>
                              <Badge
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '8px',
                                  background: classItem.session === 'Fall' ? '#fbbf24' : '#3b82f6',
                                  color: 'white'
                                }}
                              >
                                {classItem.session}
                              </Badge>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <Badge
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '8px',
                                  background: '#6b7280',
                                  color: 'white'
                                }}
                              >
                                {classItem.section}
                              </Badge>
                            </td>
                            <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>{classItem.year}</td>
                            <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>{classItem.rank}</td>
                            <td style={{ padding: '1rem' }}>
                              <div className="d-flex gap-2 justify-content-center">
                                <MotionButton
                                  whileHover={{
                                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                                    color: 'white',
                                    borderColor: '#7e22ce',
                                    scale: 1.1, y: -2
                                  }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleShowModal('edit', classItem)}
                                  style={{
                                    background: 'transparent',
                                    border: '2px solid #7e22ce',
                                    borderRadius: '10px',
                                    padding: '0.5rem 1rem',
                                    color: '#7e22ce',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <FaEdit /> Edit
                                </MotionButton>

                                <MotionButton
                                  whileHover={{
                                    background: 'linear-gradient(135deg, #942f04 0%, #800343 100%)',
                                    color: 'white',
                                    borderColor: '#942f04',
                                    scale: 1.1, y: -2
                                  }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDelete(classItem._id)}
                                  style={{
                                    background: 'transparent',
                                    border: '2px solid #942f04',
                                    borderRadius: '10px',
                                    padding: '0.5rem 1rem',
                                    color: '#942f04',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.1)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <FaTrash /> Delete
                                </MotionButton>
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
        show={showModal}
        onHide={handleCloseModal}
        centered
        style={{ zIndex: 10000 }}
      >
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
            border: 'none',
            borderRadius: '16px 16px 0 0'
          }}
        >
          <Modal.Title style={{ color: 'white', fontWeight: '700', fontSize: '1.25rem' }}>
            {modalMode === 'add' ? 'Add New Class' : 'Edit Class'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            padding: '2rem'
          }}
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert
                  variant="danger"
                  onClose={() => setError('')}
                  dismissible
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '1rem'
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
                  onClose={() => setSuccess('')}
                  dismissible
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '1rem'
                  }}
                >
                  {success}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Degree/Program
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., BS Computer Science, Bachelors, Intermediate, Matric"
                value={currentClass.degree}
                onChange={(e) => setCurrentClass({ ...currentClass, degree: e.target.value })}
                required
                style={{
                  borderRadius: '10px',
                  border: '2px solid rgba(139, 92, 246, 0.2)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Session
                  </Form.Label>
                  <Form.Select
                    value={currentClass.session}
                    onChange={(e) => setCurrentClass({ ...currentClass, session: e.target.value })}
                    required
                    style={{
                      borderRadius: '10px',
                      border: '2px solid rgba(139, 92, 246, 0.2)',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      color: '#000'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
                  >
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Section
                  </Form.Label>
                  <Form.Select
                    value={currentClass.section}
                    onChange={(e) => setCurrentClass({ ...currentClass, section: e.target.value })}
                    required
                    style={{
                      borderRadius: '10px',
                      border: '2px solid rgba(139, 92, 246, 0.2)',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      color: '#000'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Year
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., 2024"
                    value={currentClass.year}
                    onChange={(e) => setCurrentClass({ ...currentClass, year: e.target.value })}
                    required
                    style={{
                      borderRadius: '10px',
                      border: '2px solid rgba(139, 92, 246, 0.2)',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Semester/Rank
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="8"
                    placeholder="Enter semester (1-8)"
                    value={currentClass.rank}
                    onChange={(e) => setCurrentClass({ ...currentClass, rank: parseInt(e.target.value) })}
                    required
                    style={{
                      borderRadius: '10px',
                      border: '2px solid rgba(139, 92, 246, 0.2)',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCloseModal}
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
                Cancel
              </MotionButton>
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.625rem 1.5rem',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 15px rgba(126, 34, 206, 0.3)'
                }}
              >
                {modalMode === 'add' ? 'Add Class' : 'Update Class'}
              </MotionButton>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Classes;
