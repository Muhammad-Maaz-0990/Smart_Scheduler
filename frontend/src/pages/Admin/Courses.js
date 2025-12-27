import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import { useAuth } from '../../context/AuthContext';
import AdminPageHeader from '../../components/AdminPageHeader';
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
  const [sortField, setSortField] = useState('_id'); // Default sort by ID
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [previousCourse, setPreviousCourse] = useState(null);
  const [originalCourse, setOriginalCourse] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

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
      const courseCopy = {
        _id: course._id,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        courseType: course.courseType,
        creditHours: course.courseType === 'Lab' ? 1 : course.creditHours
      };
      setCurrentCourse(courseCopy);
      setOriginalCourse(courseCopy);
    } else {
      setCurrentCourse({ courseCode: '', courseTitle: '', courseType: 'Theory', creditHours: 3 });
      setOriginalCourse(null);
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
    setOriginalCourse(null);
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

      if (response.ok) {
        fetchCourses();
        handleCloseModal();
        
        // Show snackbar for both add and update
        if (modalMode === 'edit') {
          // Find the previous course data for undo
          const oldCourse = courses.find(c => c._id === currentCourse._id);
          setPreviousCourse({ ...oldCourse, _id: currentCourse._id });
          setSnackbarMessage({ itemName: currentCourse.courseCode, action: 'updated', extra: 'successfully' });
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 5000);
        } else {
          // For add operation, get the newly created course data after fetch
          setTimeout(async () => {
            const coursesResponse = await fetch(`http://localhost:5000/api/courses/${instituteObjectId}`);
            if (coursesResponse.ok) {
              const coursesData = await coursesResponse.json();
              const newlyAddedCourse = coursesData.find(c => 
                c.courseCode === currentCourse.courseCode && 
                c.courseTitle === currentCourse.courseTitle
              );
              if (newlyAddedCourse) {
                setPreviousCourse({ ...newlyAddedCourse, isAdded: true });
              }
            }
          }, 100);
          
          setSnackbarMessage({ itemName: currentCourse.courseCode, action: 'added', extra: 'successfully' });
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 5000);
        }
        
      } else {
        const data = await response.json();
        setError(data.message || 'Operation failed');
        // Don't close modal - keep it open to show error
      }
    } catch (err) {
      setError('An error occurred');
      // Don't close modal - keep it open to show error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseToDelete._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Store deleted course for undo
        setPreviousCourse({ ...courseToDelete, isDeleted: true });
        setSnackbarMessage({ itemName: courseToDelete.courseCode, action: 'deleted', extra: 'successfully' });
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 5000);
        
        fetchCourses();
      } else {
        const data = await response.json();
        setError(data.message || 'Delete failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setShowDeleteModal(false);
      setCourseToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCourseToDelete(null);
  };

  const handleUndo = async () => {
    if (!previousCourse) return;
    
    try {
      // Check if it was a delete operation
      if (previousCourse.isDeleted) {
        // Restore deleted course by creating it again
        const response = await fetch(`http://localhost:5000/api/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseCode: previousCourse.courseCode,
            courseTitle: previousCourse.courseTitle,
            courseType: previousCourse.courseType,
            creditHours: previousCourse.creditHours,
            instituteID: instituteObjectId
          })
        });

        if (response.ok) {
          fetchCourses();
          setSnackbarMessage({ itemName: previousCourse.courseCode, action: 'restored', extra: 'successfully' });
          setTimeout(() => {
            setShowSnackbar(false);
            setPreviousCourse(null);
          }, 3000);
        }
      } else if (previousCourse.isAdded) {
        // Undo add operation by deleting the newly added course
        const response = await fetch(`http://localhost:5000/api/courses/${previousCourse._id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchCourses();
          setSnackbarMessage({ itemName: previousCourse.courseCode, action: 'removed', extra: 'successfully' });
          setTimeout(() => {
            setShowSnackbar(false);
            setPreviousCourse(null);
          }, 3000);
        }
      } else {
        // Update operation undo
        const response = await fetch(`http://localhost:5000/api/courses/${previousCourse._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseCode: previousCourse.courseCode,
            courseTitle: previousCourse.courseTitle,
            courseType: previousCourse.courseType,
            creditHours: previousCourse.creditHours,
            instituteID: instituteObjectId
          })
        });

        if (response.ok) {
          fetchCourses();
          setSnackbarMessage({ itemName: previousCourse.courseCode, action: 'undo', extra: 'successful' });
          setTimeout(() => {
            setShowSnackbar(false);
            setPreviousCourse(null);
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Undo failed:', err);
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

  const getSortedCourses = () => {
    let filtered = courses
      .filter(c => (filters.type === 'All' ? true : c.courseType === filters.type))
      .filter(c => (!filters.creditHours ? true : String(c.creditHours || '').includes(String(filters.creditHours))))
      .filter(c => (
        String(c.courseCode || '').toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        String(c.courseTitle || '').toLowerCase().includes(searchTerm.trim().toLowerCase())
      ));

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

        // For numeric fields
        if (sortField === 'creditHours') {
          const aNum = parseInt(aVal);
          const bNum = parseInt(bVal);
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
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

  return (
    <>
      <AdminPageHeader
        icon={FaBook}
        title="Courses Management"
        subtitle="Manage all courses in your institute"
        actions={
          <>
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
          </>
        }
      />

      {/* Search and Filter */}
      <div
        className="mb-4"
        style={{ position: 'relative', zIndex: 100 }}
      >
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-3 mb-3">
          <InputGroup style={{ flex: 1 }}>
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
              placeholder="Search by course code or title..."
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
          <MotionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilterMenu(s => !s)}
            style={{
              background: showFilterMenu ? 'var(--theme-color)' : 'var(--theme-color-light)',
              border: '2px solid var(--theme-color)',
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
              fontWeight: 400,
              color: showFilterMenu ? 'white' : 'var(--theme-color)',
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
                background: 'var(--theme-color-light)',
                borderRadius: '12px',
                border: '2px solid var(--theme-color)',
                padding: '1.25rem',
                marginBottom: '0.5rem'
              }}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label style={{ 
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--theme-color)',
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
                            e.target.style.borderColor = 'var(--theme-color)';
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
                          color: 'var(--theme-color)',
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
                            e.target.style.borderColor = 'var(--theme-color)';
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
                            color: 'var(--theme-color)',
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
                    Import Preview ({importPreview.length} courses)
                  </h5>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    <Table hover responsive style={{ marginBottom: 0 }}>
                      <thead>
                        <tr style={{ 
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderBottom: '2px solid rgba(105, 65, 219, 0.2)'
                        }}>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>#</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Course Code</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Course Title</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Type</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Credit Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {importPreview.map((r, idx) => (
                            <MotionTr
                              key={idx}
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
                              <td style={{ padding: '0.75rem' }}>{idx + 1}</td>
                              <td style={{ padding: '0.75rem', fontWeight: '600' }}>{r.courseCode}</td>
                              <td style={{ padding: '0.75rem', fontWeight: '500' }}>{r.courseTitle}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <Badge style={{ 
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '8px',
                                  background: r.courseType === 'Lab' ? '#3b82f6' : 'var(--theme-color)',
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
                      onClick={() => handleSort('courseCode')}
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
                        Course Code
                        {sortField === 'courseCode' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('courseTitle')}
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
                        Course Title
                        {sortField === 'courseTitle' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('courseType')}
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
                        Type
                        {sortField === 'courseType' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('creditHours')}
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
                        Credit Hours
                        {sortField === 'creditHours' && (
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
                      {getSortedCourses().map((course, index) => (
                          <MotionTr
                            key={course._id}
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
                                  onClick={() => handleDeleteClick(course)}
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
              background: 'var(--theme-color)',
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
                    color: 'var(--theme-color)',
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
                        color: 'var(--theme-color)',
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
                          e.target.style.borderColor = 'var(--theme-color)';
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
                        color: 'var(--theme-color)',
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
                            e.target.style.borderColor = 'var(--theme-color)';
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
                  disabled={modalMode === 'edit' && originalCourse && 
                    currentCourse.courseCode === originalCourse.courseCode && 
                    currentCourse.courseTitle === originalCourse.courseTitle && 
                    currentCourse.courseType === originalCourse.courseType && 
                    currentCourse.creditHours === originalCourse.creditHours}
                  whileHover={{ 
                    background: submitting || (modalMode === 'edit' && originalCourse && 
                      currentCourse.courseCode === originalCourse.courseCode && 
                      currentCourse.courseTitle === originalCourse.courseTitle && 
                      currentCourse.courseType === originalCourse.courseType && 
                      currentCourse.creditHours === originalCourse.creditHours) ? undefined : '#fff',
                    color: submitting || (modalMode === 'edit' && originalCourse && 
                      currentCourse.courseCode === originalCourse.courseCode && 
                      currentCourse.courseTitle === originalCourse.courseTitle && 
                      currentCourse.courseType === originalCourse.courseType && 
                      currentCourse.creditHours === originalCourse.creditHours) ? undefined : 'var(--theme-color)',
                    border: submitting || (modalMode === 'edit' && originalCourse && 
                      currentCourse.courseCode === originalCourse.courseCode && 
                      currentCourse.courseTitle === originalCourse.courseTitle && 
                      currentCourse.courseType === originalCourse.courseType && 
                      currentCourse.creditHours === originalCourse.creditHours) ? undefined : '2px solid var(--theme-color)'
                  }}
                  whileTap={{ scale: submitting || (modalMode === 'edit' && originalCourse && 
                    currentCourse.courseCode === originalCourse.courseCode && 
                    currentCourse.courseTitle === originalCourse.courseTitle && 
                    currentCourse.courseType === originalCourse.courseType && 
                    currentCourse.creditHours === originalCourse.creditHours) ? 1 : 0.98 }}
                  transition={{ duration: 0.15 }}
                  type="submit"
                  style={{
                    background: submitting || (modalMode === 'edit' && originalCourse && 
                      currentCourse.courseCode === originalCourse.courseCode && 
                      currentCourse.courseTitle === originalCourse.courseTitle && 
                      currentCourse.courseType === originalCourse.courseType && 
                      currentCourse.creditHours === originalCourse.creditHours) ? '#9ca3af' : 'var(--theme-color)',
                    border: '2px solid var(--theme-color)',
                    borderRadius: '12px',
                    padding: '0.5rem 1rem',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    boxShadow: submitting || (modalMode === 'edit' && originalCourse && 
                      currentCourse.courseCode === originalCourse.courseCode && 
                      currentCourse.courseTitle === originalCourse.courseTitle && 
                      currentCourse.courseType === originalCourse.courseType && 
                      currentCourse.creditHours === originalCourse.creditHours) ? 'none' : '0 2px 8px rgba(105, 65, 219, 0.08)',
                    cursor: submitting || (modalMode === 'edit' && originalCourse && 
                      currentCourse.courseCode === originalCourse.courseCode && 
                      currentCourse.courseTitle === originalCourse.courseTitle && 
                      currentCourse.courseType === originalCourse.courseType && 
                      currentCourse.creditHours === originalCourse.creditHours) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '120px',
                    justifyContent: 'center',
                    opacity: submitting || (modalMode === 'edit' && originalCourse && 
                      currentCourse.courseCode === originalCourse.courseCode && 
                      currentCourse.courseTitle === originalCourse.courseTitle && 
                      currentCourse.courseType === originalCourse.courseType && 
                      currentCourse.creditHours === originalCourse.creditHours) ? 0.6 : 1
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
                Are you sure you want to delete course <strong style={{ color: '#ef4444' }}>{courseToDelete?.courseCode}</strong>?
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
                    Course <strong>{snackbarMessage.itemName}</strong> <strong>{snackbarMessage.action}</strong> {snackbarMessage.extra}
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
                  setPreviousCourse(null);
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

export default Courses;
