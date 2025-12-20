import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { FaPlus, FaFileImport, FaFileExport, FaSearch, FaFilter, FaEdit, FaTrash, FaUsers, FaLeaf, FaSnowflake, FaSeedling, FaBan } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const MotionCard = motion.create(Card);
const MotionButton = motion.create(Button);
const MotionTr = motion.tr;

const Classes = () => {
  const { instituteObjectId } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentClass, setCurrentClass] = useState({
    degree: '',
    session: 'Fall',
    section: '',
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
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);

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
      setCurrentClass({ degree: '', session: 'Fall', section: '', year: '', rank: 1 });
    }
    // Remove focus from button immediately when opening modal
    if (document.activeElement) {
      document.activeElement.blur();
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentClass({ degree: '', session: 'Fall', section: '', year: '', rank: 1 });
    setError('');
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
      const required = ['degree', 'session', 'year', 'rank'];
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
          body: JSON.stringify({ degree: c.degree, session: c.session, section: c.section || '', year: c.year, rank: Number(c.rank) || 1, instituteID: instituteObjectId })
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed to add some rows'); }
      }
      setSuccess('Imported classes added successfully'); setImportPreview([]); fetchClasses();
    } catch (e) { setError(e.message || 'Import add failed'); }
  };
  const exportCSV = () => {
    const headers = ['degree', 'session', 'section', 'year', 'rank'];
    const rows = classes.map(c => ({ degree: c.degree, session: c.session, section: c.section || '', year: c.year, rank: c.rank }));
    downloadCSV('classes.csv', toCSV(headers, rows));
  };

  return (
    <>
      <Sidebar activeMenu="classes" />
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
                <FaUsers style={{ fontSize: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: '#6941db',
                  lineHeight: '1.2',
                  margin: 0
                }}>
                  Classes Management
                </h2>
                <p style={{
                  fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
                  color: '#6941db',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Manage all classes in your institute
                </p>
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <Button
                onClick={() => handleShowModal('add')}
                className="action-btn action-btn-purple"
              >
                <FaPlus /> Add Class
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
                accept=".csv,text/csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onFileSelected}
              />
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
                  placeholder="Search by degree/program..."
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
                  <div style={{ 
                    background: 'white',
                    borderRadius: '12px',
                    border: '2px solid rgba(105, 65, 219, 0.2)',
                    padding: '1.25rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label style={{ 
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#6941db',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Session
                        </label>
                        <Form.Select
                          value={filters.session}
                          onChange={(e) => setFilters({ ...filters, session: e.target.value })}
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
                            outline: 'none'
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
                          <option value="All">All Sessions</option>
                          <option value="Fall">Fall</option>
                          <option value="Spring">Spring</option>
                        </Form.Select>
                      </div>

                      <div className="col-md-3">
                        <label style={{ 
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#6941db',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Section
                        </label>
                        <Form.Select
                          value={filters.section}
                          onChange={(e) => setFilters({ ...filters, section: e.target.value })}
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
                            outline: 'none'
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
                          <option value="All">All Sections</option>
                          <option value="">None</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </Form.Select>
                      </div>

                      <div className="col-md-2">
                        <label style={{ 
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#6941db',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Year
                        </label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., 2024"
                          value={filters.year}
                          onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                          style={{
                            background: 'white',
                            borderRadius: '10px',
                            border: '2px solid rgba(105, 65, 219, 0.2)',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#1f2937',
                            transition: 'all 0.3s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#6941db';
                            e.target.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(105, 65, 219, 0.2)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>

                      <div className="col-md-2">
                        <label style={{ 
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#6941db',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Semester
                        </label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., 1, 2..."
                          value={filters.rank}
                          onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
                          style={{
                            background: 'white',
                            borderRadius: '10px',
                            border: '2px solid rgba(105, 65, 219, 0.2)',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#1f2937',
                            transition: 'all 0.3s ease',
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#6941db';
                            e.target.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(105, 65, 219, 0.2)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>

                      <div className="col-md-2 d-flex align-items-end">
                        <MotionButton 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFilters({ session: 'All', section: 'All', year: '', rank: '' })}
                          style={{
                            background: 'transparent',
                            border: '2px solid rgba(105, 65, 219, 0.2)',
                            color: '#6941db',
                            borderRadius: '12px',
                            fontWeight: 400,
                            padding: '0.75rem 0.875rem',
                            fontSize: '0.875rem',
                            width: '100%'
                          }}
                        >
                          Reset
                        </MotionButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                    Import Preview ({importPreview.length} classes)
                  </h5>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    <Table hover responsive style={{ marginBottom: 0 }}>
                      <thead>
                        <tr style={{
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderBottom: '2px solid rgba(105, 65, 219, 0.2)'
                        }}>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>#</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Degree</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Session</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Section</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Year</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Rank</th>
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
                              whileHover={{
                                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                                transition: { duration: 0.2 }
                              }}
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
                                  background: r.section ? '#6b7280' : '#94a3b8',
                                  color: 'white'
                                }}>
                                  {r.section || 'None'}
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
              boxShadow: '0 4px 20px rgba(105, 65, 219, 0.1)',
              overflow: 'hidden'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <Table hover responsive style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>#</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Degree</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Session</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Section</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Year</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Rank</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', textAlign: 'center', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Actions</th>
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
                            <td style={{ padding: '1rem', fontWeight: '400', color: '#374151' }}>{classItem.degree}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#374151',
                                fontWeight: '500'
                              }}>
                                {classItem.session === 'Fall' ? (
                                  <FaLeaf style={{ color: '#000000', fontSize: '1.1rem' }} />
                                ) : classItem.session === 'Spring' ? (
                                  <FaSeedling style={{ color: '#000000', fontSize: '1.1rem' }} />
                                ) : classItem.session === 'Winter' ? (
                                  <FaSnowflake style={{ color: '#000000', fontSize: '1.1rem' }} />
                                ) : null}
                                {classItem.session}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>
                              {classItem.section ? classItem.section : <FaBan style={{ color: '#000000', fontSize: '1rem' }} />}
                            </td>
                            <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>{classItem.year}</td>
                            <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>
                              {classItem.rank}{(() => {
                                const rank = parseInt(classItem.rank);
                                if (isNaN(rank)) return '';
                                const lastDigit = rank % 10;
                                const lastTwoDigits = rank % 100;
                                if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return 'th';
                                if (lastDigit === 1) return 'st';
                                if (lastDigit === 2) return 'nd';
                                if (lastDigit === 3) return 'rd';
                                return 'th';
                              })()}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  onClick={() => handleShowModal('edit', classItem)}
                                  className="table-action-btn table-action-edit"
                                >
                                  <FaEdit /> Edit
                                </Button>

                                <Button
                                  onClick={() => handleDelete(classItem._id)}
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
        show={showModal}
        onHide={handleCloseModal}
        centered
        style={{ zIndex: 10000 }}
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
            border: 'none',
            borderRadius: '16px 16px 0 0',
            padding: '0.75rem 1rem'
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
            padding: '2rem',
            overflow: 'visible'
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
                  border: '2px solid rgba(105, 65, 219, 0.2)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6941db'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(105, 65, 219, 0.2)'}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Session
                  </Form.Label>
                  <div style={{ position: 'relative' }}>
                    <motion.div
                      whileHover={{ borderColor: '#6941db' }}
                      onClick={() => setSessionDropdownOpen(!sessionDropdownOpen)}
                      style={{
                        background: 'white',
                        borderRadius: '10px',
                        border: '2px solid rgba(105, 65, 219, 0.2)',
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#1f2937',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>{currentClass.session}</span>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>▼</span>
                    </motion.div>
                    <AnimatePresence>
                      {sessionDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            left: 0,
                            right: 0,
                            background: 'white',
                            borderRadius: '10px',
                            border: '2px solid rgba(105, 65, 219, 0.2)',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}
                        >
                          {['Fall', 'Spring'].map((session) => (
                            <motion.div
                              key={session}
                              whileHover={{ background: 'linear-gradient(135deg, rgba(105, 65, 219, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', color: '#6941db' }}
                              onClick={() => {
                                setCurrentClass({ ...currentClass, session });
                                setSessionDropdownOpen(false);
                              }}
                              style={{
                                padding: '0.75rem 1rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: currentClass.session === session ? '#6941db' : '#1f2937',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: currentClass.session === session ? 'rgba(105, 65, 219, 0.05)' : 'transparent'
                              }}
                            >
                              {session}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Section
                  </Form.Label>
                  <div style={{ position: 'relative' }}>
                    <motion.div
                      whileHover={{ borderColor: '#6941db' }}
                      onClick={() => setSectionDropdownOpen(!sectionDropdownOpen)}
                      style={{
                        background: 'white',
                        borderRadius: '10px',
                        border: '2px solid rgba(105, 65, 219, 0.2)',
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#1f2937',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>{currentClass.section || 'None (Single Section)'}</span>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>▼</span>
                    </motion.div>
                    <AnimatePresence>
                      {sectionDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            left: 0,
                            right: 0,
                            background: 'white',
                            borderRadius: '10px',
                            border: '2px solid rgba(105, 65, 219, 0.2)',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}
                        >
                          {[{ value: '', label: 'None (Single Section)' }, { value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'D', label: 'D' }].map((section) => (
                            <motion.div
                              key={section.value}
                              whileHover={{ background: 'linear-gradient(135deg, rgba(105, 65, 219, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', color: '#6941db' }}
                              onClick={() => {
                                setCurrentClass({ ...currentClass, section: section.value });
                                setSectionDropdownOpen(false);
                              }}
                              style={{
                                padding: '0.75rem 1rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: currentClass.section === section.value ? '#6941db' : '#1f2937',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: currentClass.section === section.value ? 'rgba(105, 65, 219, 0.05)' : 'transparent'
                              }}
                            >
                              {section.label}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
                      border: '2px solid rgba(105, 65, 219, 0.2)',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6941db'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(105, 65, 219, 0.2)'}
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
                      border: '2px solid rgba(105, 65, 219, 0.2)',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6941db'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(105, 65, 219, 0.2)'}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <MotionButton
                whileHover={{ 
                  background: '#ffffff',
                  color: '#6b7280',
                  borderColor: '#6b7280'
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: '#6b7280',
                  border: '2px solid #6b7280',
                  borderRadius: '12px',
                  padding: '0.5rem 1rem',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </MotionButton>
              <MotionButton
                whileHover={{ 
                  background: '#fff',
                  color: '#6941db',
                  border: '2px solid #6941db'
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                type="submit"
                style={{
                  background: '#6941db',
                  border: '2px solid #6941db',
                  borderRadius: '12px',
                  padding: '0.5rem 1rem',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 2px 8px rgba(105, 65, 219, 0.08)'
                }}
              >
                {modalMode === 'add' ? 'Add Class' : 'Update Class'}
              </MotionButton>
            </div>
          </Form>
        </Modal.Body>
        </motion.div>
      </Modal>
    </>
  );
};

export default Classes;
