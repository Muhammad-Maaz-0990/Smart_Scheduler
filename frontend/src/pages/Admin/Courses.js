import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { FaPlus, FaFileImport, FaFileExport, FaSearch, FaFilter, FaEdit, FaTrash, FaBook } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const MotionCard = motion.create(Card);
const MotionButton = motion.create(Button);
const MotionTr = motion.tr;

const Courses = () => {
  const { instituteObjectId } = useAuth();
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentCourse, setCurrentCourse] = useState({
    courseCode: '',
    courseTitle: '',
    courseType: 'Theory',
    creditHours: 3
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({ type: 'All', creditHours: '', });
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (instituteObjectId) {
      fetchCourses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instituteObjectId]);

  const fetchCourses = async () => {
    if (!instituteObjectId) {
      setError('Institute ID not found');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${instituteObjectId}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (mode, course = null) => {
    setModalMode(mode);
    if (mode === 'edit' && course) {
      // If editing a Lab, force creditHours to 1 and lock it
      const next = { ...course };
      if (next.courseType === 'Lab') next.creditHours = 1;
      setCurrentCourse(next);
    } else {
      setCurrentCourse({ courseCode: '', courseTitle: '', courseType: 'Theory', creditHours: 3 });
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
    setCurrentCourse({ courseCode: '', courseTitle: '', courseType: 'Theory', creditHours: 3 });
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
    setSubmitting(true);

    try {
      const url = modalMode === 'add' 
        ? 'http://localhost:5000/api/courses'
        : `http://localhost:5000/api/courses/${currentCourse._id}`;
      
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentCourse,
          // Enforce Lab creditHours = 1 on submit
          creditHours: currentCourse.courseType === 'Lab' ? 1 : currentCourse.creditHours,
          instituteID: instituteObjectId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Course ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
        fetchCourses();
        handleCloseModal();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Course deleted successfully');
        fetchCourses();
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
      const required = ['courseCode','courseTitle','courseType','creditHours'];
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
        const body = { courseCode: c.courseCode, courseTitle: c.courseTitle, courseType: c.courseType, creditHours: Number(c.creditHours)|| (c.courseType==='Lab'?1:3), instituteID: instituteObjectId };
        const res = await fetch('http://localhost:5000/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to add some rows'); }
      }
      setSuccess('Imported courses added successfully'); setImportPreview([]); fetchCourses();
    } catch (e) { setError(e.message || 'Import add failed'); }
  };
  const exportCSV = () => {
    const headers = ['courseCode','courseTitle','courseType','creditHours'];
    const rows = courses.map(c => ({ courseCode: c.courseCode, courseTitle: c.courseTitle, courseType: c.courseType, creditHours: c.creditHours }));
    downloadCSV('courses.csv', toCSV(headers, rows));
  };

  return (
    <>
      <Sidebar activeMenu="courses" />
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
                <FaBook style={{ fontSize: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: '#6941db',
                  lineHeight: '1.2',
                  margin: 0
                }}>
                  Courses Management
                </h2>
                <p style={{
                  fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
                  color: '#6941db',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Manage all courses in your institute
                </p>
              </div>
            </div>
            
            <div className="d-flex gap-2 flex-wrap">
              <Button
                onClick={() => handleShowModal('add')}
                className="action-btn action-btn-purple"
              >
                <FaPlus /> Add Course
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
                  placeholder="Search by course code or title..."
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
                      <div className="col-md-4">
                        <label style={{ 
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#6941db',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Course Type
                        </label>
                        <Form.Select
                          value={filters.type || ''}
                          onChange={e => { setFilters({ ...filters, type: e.target.value }); }}
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
                          <option value="All">All Types</option>
                          <option value="Theory">Theory</option>
                          <option value="Lab">Lab</option>
                        </Form.Select>
                      </div>

                      <div className="col-md-4">
                        <label style={{ 
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#6941db',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Credit Hours
                        </label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., 3"
                          value={filters.creditHours}
                          onChange={(e) => setFilters({ ...filters, creditHours: e.target.value })}
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

                      <div className="col-md-4 d-flex align-items-end">
                        <MotionButton 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFilters({ type: 'All', creditHours: '' })}
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
                    Import Preview ({importPreview.length} courses)
                  </h5>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    <Table hover responsive style={{ marginBottom: 0 }}>
                      <thead>
                        <tr style={{ 
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderBottom: '2px solid rgba(105, 65, 219, 0.2)'
                        }}>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>#</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Course Code</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Course Title</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Type</th>
                          <th style={{ color: '#6941db', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Credit Hours</th>
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
                              <td style={{ padding: '0.75rem', fontWeight: '600' }}>{r.courseCode}</td>
                              <td style={{ padding: '0.75rem', fontWeight: '500' }}>{r.courseTitle}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <Badge style={{ 
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '8px',
                                  background: r.courseType === 'Lab' ? '#3b82f6' : '#6941db',
                                  color: 'white'
                                }}>
                                  {r.courseType}
                                </Badge>
                              </td>
                              <td style={{ padding: '0.75rem' }}>{r.creditHours}</td>
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
                      Add Imported Courses
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
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Course Code</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Course Title</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Type</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Credit Hours</th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: '#4338CA', textAlign: 'center', borderBottom: 'none', backgroundColor: 'rgba(79, 70, 229, 0.12)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : courses.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        No courses found. Add your first course!
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {courses
                        .filter(c => (filters.type === 'All' ? true : c.courseType === filters.type))
                        .filter(c => (!filters.creditHours ? true : String(c.creditHours || '').includes(String(filters.creditHours))))
                        .filter(c => (
                          String(c.courseCode || '').toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                          String(c.courseTitle || '').toLowerCase().includes(searchTerm.trim().toLowerCase())
                        ))
                        .map((course, index) => (
                          <MotionTr
                            key={course._id}
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
                            <td style={{ padding: '1rem', fontWeight: '400', color: '#374151' }}>{course.courseCode}</td>
                            <td style={{ padding: '1rem', fontWeight: '400', color: '#374151' }}>{course.courseTitle}</td>
                            <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>{course.courseType}</td>
                            <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>{course.creditHours}</td>
                            <td style={{ padding: '1rem' }}>
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  onClick={() => handleShowModal('edit', course)}
                                  className="table-action-btn table-action-edit"
                                >
                                  <FaEdit /> Edit
                                </Button>

                                <Button
                                  onClick={() => handleDelete(course._id)}
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
              {modalMode === 'add' ? 'Add New Course' : 'Edit Course'}
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
                    Course Code
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter course code (e.g., CS101, MATH201)"
                    value={currentCourse.courseCode}
                    onChange={(e) => setCurrentCourse({ ...currentCourse, courseCode: e.target.value })}
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
                    Course Title
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter course title"
                    value={currentCourse.courseTitle}
                    onChange={(e) => setCurrentCourse({ ...currentCourse, courseTitle: e.target.value })}
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

              <Row>
                <Col md={6}>
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
                        Course Type
                      </Form.Label>
                      <Form.Select
                        value={currentCourse.courseType || ''}
                        onChange={e => {
                          const type = e.target.value;
                          setCurrentCourse({
                            ...currentCourse,
                            courseType: type,
                            creditHours: type === 'Lab' ? 1 : currentCourse.creditHours || 3
                          });
                          e.target.blur();
                        }}
                        required
                        disabled={submitting}
                        style={{
                          borderRadius: '12px',
                          border: '1px solid #e0e0e0',
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
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab</option>
                      </Form.Select>
                    </Form.Group>
                  </motion.div>
                </Col>
                <Col md={6}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
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
                        Credit Hours
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min={currentCourse.courseType === 'Lab' ? '1' : '1'}
                        max={currentCourse.courseType === 'Lab' ? '1' : '6'}
                        placeholder="Credit hours"
                        value={currentCourse.creditHours}
                        onChange={(e) => setCurrentCourse({ ...currentCourse, creditHours: parseInt(e.target.value) })}
                        required
                        disabled={currentCourse.courseType === 'Lab' || submitting}
                        style={{
                          borderRadius: '12px',
                          border: '1px solid #e0e0e0',
                          padding: '1rem 1.25rem',
                          fontSize: '1rem',
                          background: currentCourse.courseType === 'Lab' ? '#f5f5f5' : 'white',
                          transition: 'all 0.3s ease',
                          boxShadow: 'none'
                        }}
                        onFocus={(e) => {
                          if (currentCourse.courseType !== 'Lab') {
                            e.target.style.borderColor = '#6941db';
                            e.target.style.boxShadow = '0 0 0 3px rgba(105, 65, 219, 0.1)';
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e0e0e0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </Form.Group>
                  </motion.div>
                </Col>
              </Row>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
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
                  onClick={handleCloseModal}
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
                    modalMode === 'add' ? 'Add Course' : 'Update Course'
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

export default Courses;
