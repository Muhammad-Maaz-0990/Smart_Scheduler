import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import { useAuth } from '../../context/AuthContext';
import AdminPageHeader from '../../components/AdminPageHeader';
import { FaPlus, FaFileImport, FaFileExport, FaSearch, FaFilter, FaEdit, FaTrash, FaUsers, FaLeaf, FaSnowflake, FaSeedling, FaBan, FaChalkboard } from 'react-icons/fa';
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
  const [sortField, setSortField] = useState('_id'); // Default sort by ID
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [previousClass, setPreviousClass] = useState(null);
  const [originalClass, setOriginalClass] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

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
      const classDataCopy = {
        _id: classData._id,
        degree: classData.degree,
        session: classData.session,
        section: classData.section,
        year: classData.year,
        rank: classData.rank
      };
      setCurrentClass(classDataCopy);
      setOriginalClass(classDataCopy);
    } else {
      setCurrentClass({ degree: '', session: 'Fall', section: '', year: '', rank: 1 });
      setOriginalClass(null);
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
    setOriginalClass(null);
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

      if (response.ok) {
        fetchClasses();
        handleCloseModal();
        
        // Show snackbar for both add and update
        if (modalMode === 'edit') {
          // Find the previous class data for undo
          const oldClass = classes.find(c => c._id === currentClass._id);
          setPreviousClass({ ...oldClass, _id: currentClass._id });
          const className = `${currentClass.degree}-${currentClass.session}-${currentClass.section || 'Single'}-${currentClass.year}`;
          setSnackbarMessage({ itemName: className, action: 'updated', extra: 'successfully' });
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 5000);
        } else {
          // For add operation, get the newly created class data after fetch
          setTimeout(async () => {
            const classesResponse = await fetch(`http://localhost:5000/api/classes/${instituteObjectId}`);
            if (classesResponse.ok) {
              const classesData = await classesResponse.json();
              const newlyAddedClass = classesData.find(c => 
                c.degree === currentClass.degree && 
                c.session === currentClass.session && 
                c.section === currentClass.section && 
                c.year === currentClass.year &&
                c.rank === currentClass.rank
              );
              if (newlyAddedClass) {
                setPreviousClass({ ...newlyAddedClass, isAdded: true });
              }
            }
          }, 100);
          
          const className = `${currentClass.degree}-${currentClass.session}-${currentClass.section || 'Single'}-${currentClass.year}`;
          setSnackbarMessage({ itemName: className, action: 'added', extra: 'successfully' });
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
    }
  };

  const handleDeleteClick = (classItem) => {
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classToDelete._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Store deleted class for undo
        setPreviousClass({ ...classToDelete, isDeleted: true });
        const className = `${classToDelete.degree}-${classToDelete.session}-${classToDelete.section || 'Single'}-${classToDelete.year}`;
        setSnackbarMessage({ itemName: className, action: 'deleted', extra: 'successfully' });
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 5000);
        
        fetchClasses();
      } else {
        const data = await response.json();
        setError(data.message || 'Delete failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setShowDeleteModal(false);
      setClassToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setClassToDelete(null);
  };

  const handleUndo = async () => {
    if (!previousClass) return;
    
    try {
      // Check if it was a delete operation
      if (previousClass.isDeleted) {
        // Restore deleted class by creating it again
        const response = await fetch(`http://localhost:5000/api/classes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            degree: previousClass.degree,
            session: previousClass.session,
            section: previousClass.section,
            year: previousClass.year,
            rank: previousClass.rank,
            instituteID: instituteObjectId
          })
        });

        if (response.ok) {
          fetchClasses();
          const className = `${previousClass.degree}-${previousClass.session}-${previousClass.section || 'Single'}-${previousClass.year}`;
          setSnackbarMessage({ itemName: className, action: 'restored', extra: 'successfully' });
          setTimeout(() => {
            setShowSnackbar(false);
            setPreviousClass(null);
          }, 3000);
        }
      } else if (previousClass.isAdded) {
        // Undo add operation by deleting the newly added class
        const response = await fetch(`http://localhost:5000/api/classes/${previousClass._id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchClasses();
          const className = `${previousClass.degree}-${previousClass.session}-${previousClass.section || 'Single'}-${previousClass.year}`;
          setSnackbarMessage({ itemName: className, action: 'removed', extra: 'successfully' });
          setTimeout(() => {
            setShowSnackbar(false);
            setPreviousClass(null);
          }, 3000);
        }
      } else {
        // Update operation undo
        const response = await fetch(`http://localhost:5000/api/classes/${previousClass._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            degree: previousClass.degree,
            session: previousClass.session,
            section: previousClass.section,
            year: previousClass.year,
            rank: previousClass.rank,
            instituteID: instituteObjectId
          })
        });

        if (response.ok) {
          fetchClasses();
          const className = `${previousClass.degree}-${previousClass.session}-${previousClass.section || 'Single'}-${previousClass.year}`;
          setSnackbarMessage({ itemName: className, action: 'undo', extra: 'successful' });
          setTimeout(() => {
            setShowSnackbar(false);
            setPreviousClass(null);
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

  const getSortedClasses = () => {
    let filtered = classes
      .filter(c => (filters.session === 'All' ? true : c.session === filters.session))
      .filter(c => (filters.section === 'All' ? true : c.section === filters.section))
      .filter(c => (!filters.year ? true : String(c.year || '').includes(filters.year)))
      .filter(c => (!filters.rank ? true : String(c.rank || '').includes(String(filters.rank))))
      .filter(c => String(c.degree || '').toLowerCase().includes(searchTerm.trim().toLowerCase()));

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
        if (sortField === 'year' || sortField === 'rank') {
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
        icon={FaChalkboard}
        title="Classes Management"
        subtitle="Manage all classes in your institute"
        actions={
          <>
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
                  placeholder="Search by degree/program..."
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
                      <div className="col-md-3">
                        <label style={{ 
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--theme-color)',
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
                            e.target.style.borderColor = 'var(--theme-color)';
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
                          color: 'var(--theme-color)',
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
                            e.target.style.borderColor = 'var(--theme-color)';
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
                          color: 'var(--theme-color)',
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
                            e.target.style.borderColor = 'var(--theme-color)';
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
                          color: 'var(--theme-color)',
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
                            e.target.style.borderColor = 'var(--theme-color)';
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
                    Import Preview ({importPreview.length} classes)
                  </h5>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    <Table hover responsive style={{ marginBottom: 0 }}>
                      <thead>
                        <tr style={{
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderBottom: '2px solid rgba(105, 65, 219, 0.2)'
                        }}>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>#</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Degree</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Session</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Section</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Year</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Rank</th>
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
                      onClick={() => handleSort('degree')}
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
                        Degree
                        {sortField === 'degree' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('session')}
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
                        Session
                        {sortField === 'session' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('section')}
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
                        Section
                        {sortField === 'section' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('year')}
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
                        Year
                        {sortField === 'year' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('rank')}
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
                        Rank
                        {sortField === 'rank' && (
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
                      {getSortedClasses().map((classItem, index) => (
                          <MotionTr
                            key={classItem._id}
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
                                  onClick={() => handleDeleteClick(classItem)}
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
            background: 'var(--theme-color)',
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
                onFocus={(e) => e.target.style.borderColor = 'var(--theme-color)'}
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
                      whileHover={{ borderColor: 'var(--theme-color)' }}
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
                              whileHover={{ background: 'linear-gradient(135deg, rgba(105, 65, 219, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', color: 'var(--theme-color)' }}
                              onClick={() => {
                                setCurrentClass({ ...currentClass, session });
                                setSessionDropdownOpen(false);
                              }}
                              style={{
                                padding: '0.75rem 1rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: currentClass.session === session ? 'var(--theme-color)' : '#1f2937',
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
                      whileHover={{ borderColor: 'var(--theme-color)' }}
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
                              whileHover={{ background: 'linear-gradient(135deg, rgba(105, 65, 219, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', color: 'var(--theme-color)' }}
                              onClick={() => {
                                setCurrentClass({ ...currentClass, section: section.value });
                                setSectionDropdownOpen(false);
                              }}
                              style={{
                                padding: '0.75rem 1rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: currentClass.section === section.value ? 'var(--theme-color)' : '#1f2937',
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
                    onFocus={(e) => e.target.style.borderColor = 'var(--theme-color)'}
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
                    onFocus={(e) => e.target.style.borderColor = 'var(--theme-color)'}
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
                disabled={modalMode === 'edit' && originalClass && 
                  currentClass.degree === originalClass.degree && 
                  currentClass.session === originalClass.session && 
                  currentClass.section === originalClass.section && 
                  currentClass.year === originalClass.year && 
                  currentClass.rank === originalClass.rank}
                whileHover={{ 
                  background: modalMode === 'edit' && originalClass && 
                    currentClass.degree === originalClass.degree && 
                    currentClass.session === originalClass.session && 
                    currentClass.section === originalClass.section && 
                    currentClass.year === originalClass.year && 
                    currentClass.rank === originalClass.rank ? '#9ca3af' : '#fff',
                  color: modalMode === 'edit' && originalClass && 
                    currentClass.degree === originalClass.degree && 
                    currentClass.session === originalClass.session && 
                    currentClass.section === originalClass.section && 
                    currentClass.year === originalClass.year && 
                    currentClass.rank === originalClass.rank ? '#fff' : 'var(--theme-color)',
                  border: modalMode === 'edit' && originalClass && 
                    currentClass.degree === originalClass.degree && 
                    currentClass.session === originalClass.session && 
                    currentClass.section === originalClass.section && 
                    currentClass.year === originalClass.year && 
                    currentClass.rank === originalClass.rank ? '2px solid #9ca3af' : '2px solid var(--theme-color)'
                }}
                whileTap={{ scale: modalMode === 'edit' && originalClass && 
                  currentClass.degree === originalClass.degree && 
                  currentClass.session === originalClass.session && 
                  currentClass.section === originalClass.section && 
                  currentClass.year === originalClass.year && 
                  currentClass.rank === originalClass.rank ? 1 : 0.98 }}
                transition={{ duration: 0.15 }}
                type="submit"
                style={{
                  background: modalMode === 'edit' && originalClass && 
                    currentClass.degree === originalClass.degree && 
                    currentClass.session === originalClass.session && 
                    currentClass.section === originalClass.section && 
                    currentClass.year === originalClass.year && 
                    currentClass.rank === originalClass.rank ? '#9ca3af' : 'var(--theme-color)',
                  border: modalMode === 'edit' && originalClass && 
                    currentClass.degree === originalClass.degree && 
                    currentClass.session === originalClass.session && 
                    currentClass.section === originalClass.section && 
                    currentClass.year === originalClass.year && 
                    currentClass.rank === originalClass.rank ? '2px solid #9ca3af' : '2px solid var(--theme-color)',
                  borderRadius: '12px',
                  padding: '0.5rem 1rem',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: modalMode === 'edit' && originalClass && 
                    currentClass.degree === originalClass.degree && 
                    currentClass.session === originalClass.session && 
                    currentClass.section === originalClass.section && 
                    currentClass.year === originalClass.year && 
                    currentClass.rank === originalClass.rank ? 'none' : '0 2px 8px rgba(105, 65, 219, 0.08)',
                  cursor: modalMode === 'edit' && originalClass && 
                    currentClass.degree === originalClass.degree && 
                    currentClass.session === originalClass.session && 
                    currentClass.section === originalClass.section && 
                    currentClass.year === originalClass.year && 
                    currentClass.rank === originalClass.rank ? 'not-allowed' : 'pointer',
                  opacity: modalMode === 'edit' && originalClass && 
                    currentClass.degree === originalClass.degree && 
                    currentClass.session === originalClass.session && 
                    currentClass.section === originalClass.section && 
                    currentClass.year === originalClass.year && 
                    currentClass.rank === originalClass.rank ? 0.6 : 1
                }}
              >
                {modalMode === 'add' ? 'Add Class' : 'Update Class'}
              </MotionButton>
            </div>
          </Form>
        </Modal.Body>
        </motion.div>
      </Modal>

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
                Are you sure you want to delete class <strong style={{ color: '#ef4444' }}>{classToDelete ? `${classToDelete.degree}-${classToDelete.session}-${classToDelete.section || 'Single'}-${classToDelete.year}` : ''}</strong>?
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
                    Class <strong>{snackbarMessage.itemName}</strong> <strong>{snackbarMessage.action}</strong> {snackbarMessage.extra}
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
                  setPreviousClass(null);
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

export default Classes;
