import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Alert, Button, Modal, Form, Badge, Row, Col } from 'react-bootstrap';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence, } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import {
  FaUsers, FaUserPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaFileImport,
  FaEnvelope, FaPhone, FaIdCard, FaTimes, FaDownload, FaUpload, FaUserShield, FaEye, FaEyeSlash
} from 'react-icons/fa';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const MotionButton = motion(Button);

const OwnerUsers = () => {
  const { user } = useAuth();
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
    phoneNumber: '',
    cnic: ''
  });
  const [country, setCountry] = useState('PK');
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = React.useRef(null);
  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterCNIC, setFilterCNIC] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const tokenHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/owner-users', {
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
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setMode('add');
    setCurrent({ userName: '', email: '', password: '', phoneNumber: '', cnic: '' });
    setCountry('PK');
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (u) => {
    setMode('edit');
    // Ensure phone number is in E.164 format or empty
    let phoneNumber = u.phoneNumber === 'N/A' ? '' : (u.phoneNumber || '');
    if (phoneNumber && !phoneNumber.startsWith('+')) {
      phoneNumber = '+92' + phoneNumber; // Default to Pakistan
    }
    setCurrent({
      _id: u._id,
      userName: u.userName || '',
      email: u.email || '',
      password: '',
      phoneNumber: phoneNumber,
      cnic: u.cnic === 'N/A' ? '' : (u.cnic || '')
    });
    // derive country from phone (fallback to PK)
    setCountry(getCountryFromPhone(phoneNumber));
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // ---- Validations ----
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

  // derive country from phone automatically
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

    try {
      const url = mode === 'add' 
        ? 'http://localhost:5000/api/auth/owner-users'
        : `http://localhost:5000/api/auth/owner-users/${current._id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';

      const payload = mode === 'add'
        ? {
            userName: current.userName.trim(),
            email: current.email.trim(),
            password: current.password,
            phoneNumber: current.phoneNumber,
            cnic: current.cnic
          }
        : {
            userName: current.userName.trim(),
            email: current.email.trim(),
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

      setSuccess(mode === 'add' ? 'Owner user added' : 'Owner user updated');
      await fetchUsers();
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 1000);
    } catch (e) {
      setError(e.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this owner user?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/auth/owner-users/${id}`, {
        method: 'DELETE',
        headers: { ...tokenHeader() }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Delete failed');
      }
      setSuccess('Owner user deleted');
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
      const required = ['userName','email','phoneNumber','cnic'];
      if (!required.every(h => headers.includes(h))) { setImportError('CSV must include headers: ' + required.join(', ')); setImportPreview([]); return; }
      setImportPreview(items);
    } catch { setImportError('Failed to parse CSV'); setImportPreview([]); }
    finally { e.target.value = ''; }
  };
  const addImported = async () => {
    setError(''); setSuccess('');
    try {
      for (const u of importPreview) {
        const payload = { userName: u.userName, email: u.email, password: 'ChangeMe123', phoneNumber: u.phoneNumber, cnic: u.cnic };
        const res = await fetch('http://localhost:5000/api/auth/owner-users', { method: 'POST', headers: { 'Content-Type': 'application/json', ...tokenHeader() }, body: JSON.stringify(payload) });
        if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to add some rows'); }
      }
      setSuccess('Imported owner users added successfully'); setImportPreview([]); await fetchUsers();
    } catch (e) { setError(e.message || 'Import add failed'); }
  };
  const exportCSV = () => {
    const headers = ['userName','email','phoneNumber','cnic'];
    const rows = users.map(u => ({ userName: u.userName, email: u.email, phoneNumber: u.phoneNumber, cnic: u.cnic }));
    downloadCSV('owner-users.csv', toCSV(headers, rows));
  };

  return (
    <>
      <Sidebar activeMenu="ownerUsers" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content p-3 p-md-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-4"
          >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div className="d-flex align-items-center gap-3">
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(126, 34, 206, 0.3)'
                }}>
                  <FaUsers style={{ color: '#fff', fontSize: '24px' }} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '0.25rem',
                    letterSpacing: '-0.5px'
                  }}>
                    Owner Users
                  </h2>
                  <p style={{
                    fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                    color: '#6b7280',
                    fontWeight: 500,
                    marginBottom: 0
                  }}>
                    Manage owner users in the system
                  </p>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Button onClick={openAdd} style={{
                  background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  boxShadow: '0 1px 3px rgba(126, 34, 206, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FaUserPlus /> Add Owner User
                </Button>
                <Button onClick={onImportClick} style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FaUpload /> Import CSV
                </Button>
                <Button onClick={exportCSV} style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FaDownload /> Export CSV
                </Button>
                <input type="file" accept=".csv,text/csv" ref={fileInputRef} style={{ display:'none' }} onChange={onFileSelected} />
              </div>
            </div>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            className="mb-3"
            style={{ position: 'relative', zIndex: 10 }}
          >
            <Card style={{
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              position: 'relative'
            }}>
              <Card.Body className="p-3">
                <Row className="g-3">
                  <Col md={8}>
                    <div className="position-relative">
                      <FaSearch style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        fontSize: '14px'
                      }} />
                      <Form.Control
                        type="text"
                        placeholder="Search by name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        style={{
                          paddingLeft: '36px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="position-relative">
                      <Button
                        onClick={() => setShowFilterMenu(s => !s)}
                        style={{
                          width: '100%',
                          background: showFilterMenu ? 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)' : '#f3f4f6',
                          color: showFilterMenu ? '#fff' : '#374151',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <FaFilter /> Filter Options
                      </Button>
                      <AnimatePresence>
                        {showFilterMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 'calc(100% + 8px)',
                              zIndex: 9999,
                              minWidth: '280px',
                              background: '#fff',
                              borderRadius: '12px',
                              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                              padding: '16px',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                                <FaFilter className="me-2" />Filters
                              </span>
                              <Button
                                size="sm"
                                onClick={() => setShowFilterMenu(false)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#6b7280',
                                  padding: '4px'
                                }}
                              >
                                <FaTimes />
                              </Button>
                            </div>
                            <Form.Group className="mb-3">
                              <Form.Label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                                <FaIdCard className="me-1" />National ID
                              </Form.Label>
                              <Form.Control
                                size="sm"
                                type="text"
                                placeholder="Filter by CNIC/SSN"
                                value={filterCNIC}
                                onChange={(e) => setFilterCNIC(e.target.value)}
                                style={{
                                  borderRadius: '6px',
                                  fontSize: '0.85rem'
                                }}
                              />
                            </Form.Group>
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => { setFilterCNIC(''); setShowFilterMenu(false); }}
                                style={{
                                  background: '#f3f4f6',
                                  color: '#374151',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600
                                }}
                              >
                                Reset
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setShowFilterMenu(false)}
                                style={{
                                  background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600
                                }}
                              >
                                Apply
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-3">
                  {error}
                </Alert>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert variant="success" onClose={() => setSuccess('')} dismissible className="mb-3">
                  {success}
                </Alert>
              </motion.div>
            )}
            {importError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert variant="warning" onClose={() => setImportError('')} dismissible className="mb-3">
                  {importError}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {importPreview.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-3"
              >
                <Card style={{
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(59, 130, 246, 0.2)',
                  background: 'rgba(239, 246, 255, 0.5)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Card.Header style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaFileImport />Import Preview ({importPreview.length} rows)
                  </Card.Header>
                  <Card.Body className="p-3">
                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <Table size="sm" hover style={{ marginBottom: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>#</th>
                            <th style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>userName</th>
                            <th style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>email</th>
                            <th style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>phoneNumber</th>
                            <th style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>cnic</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((r, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: '8px', fontSize: '0.85rem', color: '#6b7280' }}>{idx+1}</td>
                              <td style={{ padding: '8px', fontSize: '0.85rem', color: '#111827', fontWeight: 500 }}>{r.userName}</td>
                              <td style={{ padding: '8px', fontSize: '0.85rem', color: '#6b7280' }}>{r.email}</td>
                              <td style={{ padding: '8px', fontSize: '0.85rem', color: '#6b7280' }}>{r.phoneNumber}</td>
                              <td style={{ padding: '8px', fontSize: '0.85rem', color: '#6b7280' }}>{r.cnic}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <Button onClick={addImported} style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)'
                      }}>
                        Add Imported Users
                      </Button>
                      <Button onClick={()=>setImportPreview([])} style={{
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}>
                        Clear Preview
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Card style={{
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              zIndex: 1
            }}>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover style={{ marginBottom: 0 }}>
                    <thead style={{
                      background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      color: '#fff'
                    }}>
                      <tr>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>#</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaUserShield className="me-2" />Name
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaEnvelope className="me-2" />Email
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaIdCard className="me-2" />National ID
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaPhone className="me-2" />Phone
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <LoadingSpinner message="Loading users..." size="large" />
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <FaUsers style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }} />
                            <p style={{ color: '#6b7280', fontWeight: 500, fontSize: '1rem' }}>No owner users found</p>
                          </td>
                        </tr>
                      ) : (
                        users
                          .filter(u => String(u.userName || '').toLowerCase().includes(searchName.trim().toLowerCase()))
                          .filter(u => filterCNIC.trim() ? String(u.cnic || '').toLowerCase().includes(filterCNIC.trim().toLowerCase()) : true)
                          .map((u, idx) => (
                          <motion.tr
                            key={u._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{ borderBottom: '1px solid #e5e7eb' }}
                          >
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>{u.userName}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#6b7280' }}>{u.email}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#6b7280' }}>{u.cnic === 'N/A' ? '-' : u.cnic}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#6b7280' }}>{u.phoneNumber === 'N/A' ? '-' : u.phoneNumber}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <div className="d-flex justify-content-center gap-2">
                                <MotionButton
                                whileHover={{
                                      background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                                      color: 'white',
                                      borderColor: '#7e22ce',
                                      scale: 1.1, y: -2
                                    }}
                                  whileTap={{ scale: 0.9 }}
                                  size="sm"
                                  onClick={() => openEdit(u)}
                                  style={{
                                    background: 'transparent',
                                    border: '2px solid #7e22ce',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    fontWeight: 600,
                                    color: '#7e22ce',
                                    fontSize: '0.8rem',
                                    boxShadow: '0 1px 2px rgba(245, 158, 11, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
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
                                  whileTap={{ scale: 0.9 }}
                                  size="sm"
                                  onClick={() => handleDelete(u._id)}
                                  style={{
                                    background: 'transparent',
                                    border: '2px solid #942f04',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    color: '#942f04',
                                    boxShadow: '0 1px 2px rgba(239, 68, 68, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <FaTrash /> Delete
                                </MotionButton>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Container>
      </div>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton style={{
          background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
          color: '#fff',
          borderBottom: 'none'
        }}>
          <Modal.Title style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            <FaUserPlus className="me-2" />
            {mode === 'add' ? 'Add New Owner User' : 'Edit Owner User'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: '#f9fafb' }}>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                <FaUserShield className="me-1" />Full Name
              </Form.Label>
              <Form.Control
                type="text"
                value={current.userName}
                onChange={(e) => setCurrent({ ...current, userName: e.target.value })}
                required
                style={{
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  padding: '10px 12px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid transparent';
                  e.target.style.backgroundImage = 'linear-gradient(white, white), linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)';
                  e.target.style.backgroundOrigin = 'border-box';
                  e.target.style.backgroundClip = 'padding-box, border-box';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #d1d5db';
                  e.target.style.backgroundImage = 'none';
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                <FaEnvelope className="me-1" />Email
              </Form.Label>
              <Form.Control
                type="email"
                value={current.email}
                onChange={(e) => setCurrent({ ...current, email: e.target.value })}
                required
                style={{
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  padding: '10px 12px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid transparent';
                  e.target.style.backgroundImage = 'linear-gradient(white, white), linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)';
                  e.target.style.backgroundOrigin = 'border-box';
                  e.target.style.backgroundClip = 'padding-box, border-box';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #d1d5db';
                  e.target.style.backgroundImage = 'none';
                }}
              />
            </Form.Group>

            {mode === 'add' && (
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                  Password
                </Form.Label>
                <div style={{ position: 'relative' }}>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={current.password}
                    onChange={(e) => setCurrent({ ...current, password: e.target.value })}
                    minLength={6}
                    required
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '10px 40px 10px 12px',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid transparent';
                      e.target.style.backgroundImage = 'linear-gradient(white, white), linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)';
                      e.target.style.backgroundOrigin = 'border-box';
                      e.target.style.backgroundClip = 'padding-box, border-box';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #d1d5db';
                      e.target.style.backgroundImage = 'none';
                    }}
                  />
                  <Button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#7e22ce',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </div>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                <FaPhone className="me-1" />Phone
              </Form.Label>
              <PhoneInput
                international
                defaultCountry="PK"
                value={current.phoneNumber}
                onChange={handlePhoneChange}
                className="phone-input-custom"
                placeholder="Enter phone number"
                smartCaret={true}
                countryCallingCodeEditable={false}
                limitMaxLength={true}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                <FaIdCard className="me-1" />{getCNICLabel(country)}
              </Form.Label>
              <Form.Control
                type="text"
                value={current.cnic}
                onChange={handleCNICInput}
                placeholder={`Enter ${getCNICLabel(country)}`}
                maxLength={getCNICMaxLength(country)}
                pattern={getCNICPattern(country)}
                required
                style={{
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  padding: '10px 12px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid transparent';
                  e.target.style.backgroundImage = 'linear-gradient(white, white), linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)';
                  e.target.style.backgroundOrigin = 'border-box';
                  e.target.style.backgroundClip = 'padding-box, border-box';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #d1d5db';
                  e.target.style.backgroundImage = 'none';
                }}
              />
              <Form.Text style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Selected country: <Badge bg="secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{country}</Badge> | Max {getCNICMaxLength(country)} characters
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button onClick={closeModal} style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>
                Cancel
              </Button>
              <Button type="submit" style={{
                background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 1px 3px rgba(126, 34, 206, 0.3)'
              }}>
                {mode === 'add' ? 'Add Owner User' : 'Update Owner User'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OwnerUsers;
