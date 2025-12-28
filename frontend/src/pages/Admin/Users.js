import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Alert, Button, Modal, Form, Badge, InputGroup } from 'react-bootstrap';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaFileImport, FaFileExport, FaSearch, FaFilter, FaEdit, FaTrash, FaUserShield, FaUsers } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { apiUrl } from '../../utils/api';
import '../Dashboard.css';

const MotionCard = motion.create(Card);
const MotionButton = motion.create(Button);
const MotionTr = motion.tr;

const Users = () => {
  const { user, instituteObjectId } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState('add'); // 'add' | 'edit'
  const [current, setCurrent] = useState({
    userName: '',
    email: '',
    password: '',
    designation: 'Student',
    phoneNumber: '',
    cnic: ''
  });
  const [country, setCountry] = useState('PK');
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);
  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterCNIC, setFilterCNIC] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('All'); // All | Student | Teacher
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortField, setSortField] = useState('_id'); // Default sort by ID
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const tokenHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    if (!instituteObjectId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/users/institute'), {
        headers: {
          'Content-Type': 'application/json',
          ...tokenHeader()
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load users');
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      // Frontend safeguard: hide current logged-in user if present
      const currentUserId = user?.id || user?._id;
      setUsers(currentUserId ? arr.filter(u => u._id !== currentUserId) : arr);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instituteObjectId) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instituteObjectId]);

  const openAdd = () => {
    setMode('add');
    setCurrent({ userName: '', email: '', password: '', designation: 'Student', phoneNumber: '', cnic: '' });
    setCountry('PK');
    // Remove focus from button immediately when opening modal
    if (document.activeElement) {
      document.activeElement.blur();
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (u) => {
    setMode('edit');
    setCurrent({
      _id: u._id,
      userName: u.userName || '',
      email: u.email || '',
      password: '',
      designation: u.designation || 'Student',
      phoneNumber: u.phoneNumber === 'N/A' ? '' : (u.phoneNumber || ''),
      cnic: u.cnic === 'N/A' ? '' : (u.cnic || '')
    });
    // derive country from phone (fallback to PK)
    setCountry(getCountryFromPhone(u.phoneNumber === 'N/A' ? '' : (u.phoneNumber || '')));
    // Remove focus from button immediately when opening modal
    if (document.activeElement) {
      document.activeElement.blur();
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    // Remove focus from button to reset hover state
    setTimeout(() => {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  // ---- Validations copied from Register page ----
  const getCountryFromPhone = (phone) => {
    if (!phone) return 'PK';
    if (phone.startsWith('+1')) return 'US';
    if (phone.startsWith('+92')) return 'PK';
    if (phone.startsWith('+44')) return 'GB';
    if (phone.startsWith('+91')) return 'IN';
    if (phone.startsWith('+971')) return 'AE';
    if (phone.startsWith('+966')) return 'SA';
    return 'PK';
  };

  const getCNICLabel = (c) => {
    const labels = {
      PK: 'CNIC (13 digits)',
      US: 'SSN (9 digits)',
      GB: 'National Insurance Number',
      IN: 'Aadhaar Number (12 digits)',
      AE: 'Emirates ID',
      SA: 'National ID (10 digits)',
      default: 'National ID'
    };
    return labels[c] || labels.default;
  };

  const getCNICMaxLength = (c) => {
    const len = { PK: 13, US: 9, IN: 12, GB: 9, AE: 18, SA: 10 };
    return len[c] || 20;
  };

  const getCNICPattern = (c) => {
    const patterns = {
      PK: '[0-9]{13}',
      US: '[0-9]{9}',
      IN: '[0-9]{12}',
      GB: '[A-Za-z]{2}[0-9]{6}[A-Za-z]',
      AE: '[0-9-]{18}',
      SA: '[0-9]{10}'
    };
    return patterns[c] || '';
  };

  const validateCNIC = (cnicVal, c) => {
    const validations = {
      PK: /^\d{13}$/,
      US: /^\d{9}$/,
      IN: /^\d{12}$/,
      GB: /^[A-Z]{2}\d{6}[A-Z]$/i,
      AE: /^\d{3}-?\d{4}-?\d{7}-?\d$/,
      SA: /^\d{10}$/
    };
    const pattern = validations[c];
    if (!cnicVal) return true; // optional
    if (pattern) return pattern.test(cnicVal.replace(/[-\s]/g, ''));
    return cnicVal.length >= 5;
  };

  const handlePhoneChange = (value) => {
    if (typeof value !== 'string') value = '';
    const cleaned = value.replace(/[^\d+]/g, '');
    setCurrent(prev => ({ ...prev, phoneNumber: cleaned }));
  };

  // derive country from phone automatically like Register page
  useEffect(() => {
    if (current.phoneNumber) {
      setCountry(getCountryFromPhone(current.phoneNumber));
    }
  }, [current.phoneNumber]);

  const handleCNICInput = (e) => {
    const { value } = e.target;
    const c = country;
    if (['PK', 'US', 'IN', 'SA'].includes(c)) {
      const numericValue = value.replace(/[^0-9]/g, '');
      setCurrent(prev => ({ ...prev, cnic: numericValue.slice(0, getCNICMaxLength(c)) }));
    } else if (c === 'GB') {
      const gbValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      setCurrent(prev => ({ ...prev, cnic: gbValue.slice(0, 9) }));
    } else if (c === 'AE') {
      const aeValue = value.replace(/[^0-9-]/g, '');
      setCurrent(prev => ({ ...prev, cnic: aeValue.slice(0, 18) }));
    } else {
      setCurrent(prev => ({ ...prev, cnic: value.slice(0, 20) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Require phone and CNIC and validate CNIC according to country
    if (!current.phoneNumber) {
      setError('Please enter phone number');
      return;
    }
    if (!current.cnic || !validateCNIC(current.cnic, country)) {
      setError('Invalid ' + getCNICLabel(country) + ' format');
      return;
    }

    setSubmitting(true);
    try {
      const url = mode === 'add'
        ? apiUrl('/api/users')
        : apiUrl(`/api/users/${current._id}`);
      const method = mode === 'add' ? 'POST' : 'PUT';

      const payload = mode === 'add'
        ? {
          userName: current.userName.trim(),
          email: current.email.trim(),
          password: current.password,
          designation: current.designation,
          phoneNumber: current.phoneNumber,
          cnic: current.cnic
        }
        : {
          userName: current.userName.trim(),
          email: current.email.trim(),
          designation: current.designation,
          phoneNumber: current.phoneNumber,
          cnic: current.cnic
        };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...tokenHeader()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      setSuccess(mode === 'add' ? 'User added' : 'User updated');
      await fetchUsers();
      setShowModal(false);
    } catch (e) {
      setError(e.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(apiUrl(`/api/users/${id}`), {
        method: 'DELETE',
        headers: { ...tokenHeader() }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Delete failed');
      }
      setSuccess('User deleted');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 1200);
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  const onImportClick = () => { setImportError(''); fileInputRef.current?.click(); };
  const onFileSelected = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const { headers, items } = parseCSV(text);
      const required = ['userName', 'email', 'designation', 'phoneNumber', 'cnic'];
      if (!required.every(h => headers.includes(h))) { setImportError('CSV must include headers: ' + required.join(', ')); setImportPreview([]); return; }
      setImportPreview(items);
    } catch { setImportError('Failed to parse CSV'); setImportPreview([]); }
    finally { e.target.value = ''; }
  };
  const addImported = async () => {
    setError(''); setSuccess('');
    try {
      for (const u of importPreview) {
        const payload = { userName: u.userName, email: u.email, password: 'ChangeMe123', designation: u.designation, phoneNumber: u.phoneNumber, cnic: u.cnic };
        const res = await fetch(apiUrl('/api/users'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...tokenHeader() }, body: JSON.stringify(payload) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed to add some rows'); }
      }
      setSuccess('Imported users added successfully'); setImportPreview([]); await fetchUsers();
    } catch (e) { setError(e.message || 'Import add failed'); }
  };
  const exportCSV = () => {
    const headers = ['userName', 'email', 'designation', 'phoneNumber', 'cnic'];
    const rows = users.map(u => ({ userName: u.userName, email: u.email, designation: u.designation, phoneNumber: u.phoneNumber, cnic: u.cnic }));
    downloadCSV('users.csv', toCSV(headers, rows));
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

  const getSortedUsers = () => {
    let filtered = users
      .filter(u => String(u.userName || '').toLowerCase().includes(searchName.trim().toLowerCase()))
      .filter(u => filterDesignation === 'All' ? true : String(u.designation || '') === filterDesignation)
      .filter(u => filterCNIC.trim() ? String(u.cnic || '').toLowerCase().includes(filterCNIC.trim().toLowerCase()) : true);

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

        // String comparison for all fields
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
        icon={FaUsers}
        title="Users Management"
        subtitle="Manage users in your institute"
        actions={
          <>
            <Button
              onClick={openAdd}
              className="action-btn action-btn-purple"
            >
              <FaPlus /> Add User
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
                  border: '1px solid var(--theme-color)',
                  borderRadius: '12px 0 0 12px',
                  color: 'var(--theme-color)',
                  padding: '0.75rem 1rem'
                }}>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
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
                    e.target.style.backgroundImage = 'linear-gradient(white, white), linear-gradient(135deg, var(--theme-color) 0%, #3b82f6 100%)';
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
                  background: showFilterMenu ? 'var(--theme-color)' : 'linear-gradient(135deg, rgba(105, 65, 219, 0.1), rgba(59, 130, 246, 0.1))',
                  border: '2px solid rgba(105, 65, 219, 0.2)',
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
                          color: 'var(--theme-color)',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          National ID
                        </label>
                        <Form.Control
                          type="text"
                          placeholder="CNIC/SSN"
                          value={filterCNIC}
                          onChange={(e) => setFilterCNIC(e.target.value)}
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

                      <div className="col-md-4">
                        <label style={{ 
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--theme-color)',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Designation
                        </label>
                        <Form.Select
                          value={filterDesignation}
                          onChange={(e) => setFilterDesignation(e.target.value)}
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
                          <option value="All">All</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Student">Student</option>
                        </Form.Select>
                      </div>

                      <div className="col-md-4 d-flex align-items-end">
                        <MotionButton 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setFilterCNIC(''); setFilterDesignation('All'); }}
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
                    background: 'var(--theme-color)',
                    color: 'var(--theme-color)',
                    marginBottom: '1rem'
                  }}>
                    Import Preview ({importPreview.length} users)
                  </h5>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    <Table hover responsive style={{ marginBottom: 0 }}>
                      <thead>
                        <tr style={{
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderBottom: '2px solid rgba(105, 65, 219, 0.2)'
                        }}>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>#</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Name</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Email</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Designation</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>Phone</th>
                          <th style={{ color: 'var(--theme-color)', fontWeight: 700, fontSize: '0.875rem', padding: '0.75rem' }}>National ID</th>
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
                              backgroundColor: 'var(--theme-color-light)',
                              transition: { duration: 0.2 }
                            }}
                            style={{ fontSize: '0.875rem', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <td style={{ padding: '0.75rem' }}>{idx + 1}</td>
                            <td style={{ padding: '0.75rem', fontWeight: '600' }}>{r.userName}</td>
                            <td style={{ padding: '0.75rem' }}>{r.email}</td>
                            <td style={{ padding: '0.75rem' }}>{r.designation}</td>
                            <td style={{ padding: '0.75rem' }}>{r.phoneNumber}</td>
                            <td style={{ padding: '0.75rem' }}>{r.cnic}</td>
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
                      onClick={() => handleSort('userName')}
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
                        Name
                        {sortField === 'userName' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('email')}
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
                        Email
                        {sortField === 'email' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('designation')}
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
                        Designation
                        {sortField === 'designation' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('cnic')}
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
                        National ID
                        {sortField === 'cnic' && (
                          <span style={{ fontSize: '0.75rem' }}>
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('phoneNumber')}
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
                        Phone
                        {sortField === 'phoneNumber' && (
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
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        No users found. Add your first user!
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {getSortedUsers().map((u, index) => (
                          <MotionTr
                            key={u._id}
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
                            <td style={{ padding: '1rem', fontWeight: '400', color: '#374151' }}>{u.userName}</td>
                            <td style={{ padding: '1rem', color: '#374151', fontWeight: '400' }}>{u.email}</td>
                            <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>{u.designation}</td>
                            <td style={{ padding: '1rem', fontWeight: '500', color: '#374151' }}>{u.cnic === 'N/A' ? '-' : u.cnic}</td>
                            <td style={{ padding: '1rem', fontWeight: '500', color: '#374151' }}>{u.phoneNumber === 'N/A' ? '-' : u.phoneNumber}</td>
                            <td style={{ padding: '1rem' }}>
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  onClick={() => openEdit(u)}
                                  disabled={u.designation === 'Admin'}
                                  className="table-action-btn table-action-edit"
                                  style={{
                                    opacity: u.designation === 'Admin' ? 0.5 : 1,
                                    cursor: u.designation === 'Admin' ? 'not-allowed' : 'pointer',
                                    pointerEvents: u.designation === 'Admin' ? 'none' : 'auto'
                                  }}
                                >
                                  <FaEdit /> Edit
                                </Button>

                                <Button
                                  onClick={() => handleDelete(u._id)}
                                  disabled={u.designation === 'Admin'}
                                  className="table-action-btn table-action-delete"
                                  style={{
                                    opacity: u.designation === 'Admin' ? 0.5 : 1,
                                    cursor: u.designation === 'Admin' ? 'not-allowed' : 'pointer',
                                    pointerEvents: u.designation === 'Admin' ? 'none' : 'auto'
                                  }}
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
        onHide={closeModal}
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
              {mode === 'add' ? 'Add New User' : 'Edit User'}
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
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: 'var(--theme-color)', fontSize: '0.875rem' }}>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={current.userName}
                    onChange={(e) => setCurrent({ ...current, userName: e.target.value })}
                    required
                    disabled={submitting}
                    placeholder="Enter full name"
                    className="gradient-border-input"
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: 'var(--theme-color)', fontSize: '0.875rem' }}>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={current.email}
                    onChange={(e) => setCurrent({ ...current, email: e.target.value })}
                    required
                    disabled={submitting}
                    placeholder="Enter email address"
                    className="gradient-border-input"
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </motion.div>

              {mode === 'add' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '600', color: 'var(--theme-color)', fontSize: '0.875rem' }}>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={current.password}
                      onChange={(e) => setCurrent({ ...current, password: e.target.value })}
                      minLength={6}
                      required
                      disabled={submitting}
                      placeholder="Enter password (min 6 characters)"
                      className="gradient-border-input"
                      style={{
                        borderRadius: '12px',
                        border: '2px solid #e0e0e0',
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        background: 'white',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Form.Group>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: mode === 'add' ? 0.25 : 0.2 }}
              >
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: 'var(--theme-color)', fontSize: '0.875rem' }}>Designation</Form.Label>
                  <Form.Select
                    value={current.designation}
                    onChange={e => { setCurrent({ ...current, designation: e.target.value }); e.target.blur(); }}
                    required
                    disabled={submitting}
                    className="gradient-border-input"
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                  </Form.Select>
                </Form.Group>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: mode === 'add' ? 0.3 : 0.25 }}
              >
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: 'var(--theme-color)', fontSize: '0.875rem' }}>Phone</Form.Label>
                  <PhoneInput
                    international
                    defaultCountry="PK"
                    value={current.phoneNumber}
                    onChange={handlePhoneChange}
                    className="phone-input-custom gradient-border-input"
                    placeholder="Enter phone number"
                    smartCaret={true}
                    countryCallingCodeEditable={false}
                    limitMaxLength={true}
                    disabled={submitting}
                    style={{
                      borderRadius: '12px',
                      fontSize: '0.875rem'
                    }}
                  />
                </Form.Group>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: mode === 'add' ? 0.35 : 0.3 }}
              >
                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: '600', color: 'var(--theme-color)', fontSize: '0.875rem' }}>{getCNICLabel(country)}</Form.Label>
                  <Form.Control
                    type="text"
                    value={current.cnic}
                    onChange={handleCNICInput}
                    placeholder={`Enter ${getCNICLabel(country)}`}
                    maxLength={getCNICMaxLength(country)}
                    pattern={getCNICPattern(country)}
                    required
                    disabled={submitting}
                    className="gradient-border-input"
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Form.Text style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                    Selected country: {country} | Max {getCNICMaxLength(country)} characters
                  </Form.Text>
                </Form.Group>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mode === 'add' ? 0.4 : 0.35 }}
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
                  onClick={closeModal}
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
                    color: submitting ? undefined : 'var(--theme-color)',
                    border: submitting ? undefined : '2px solid var(--theme-color)'
                  }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  transition={{ duration: 0.15 }}
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? 'rgba(105, 65, 219, 0.6)' : 'var(--theme-color)',
                    border: '2px solid var(--theme-color)',
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
                    mode === 'add' ? 'Add User' : 'Update User'
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
        
        .gradient-border-input:focus {
          border: 2px solid transparent !important;
          border-radius: 12px !important;
          background: 
            linear-gradient(white, white) padding-box,
            linear-gradient(135deg, var(--theme-color) 0%, #3b82f6 100%) border-box !important;
          box-shadow: 0 0 0 3px rgba(105, 65, 219, 0.15) !important;
          outline: none !important;
        }
        
        .phone-input-custom input {
          border-radius: 12px !important;
          border: 2px solid #e0e0e0 !important;
          padding: 0.75rem 1rem !important;
          transition: all 0.3s ease !important;
        }
        
        .phone-input-custom input:focus {
          border: 2px solid transparent !important;
          border-radius: 12px !important;
          background: 
            linear-gradient(white, white) padding-box,
            linear-gradient(135deg, var(--theme-color) 0%, #3b82f6 100%) border-box !important;
          box-shadow: 0 0 0 3px rgba(105, 65, 219, 0.15) !important;
          outline: none !important;
        }
      `}</style>
    </>
  );
};

export default Users;
