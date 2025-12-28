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
  FaUsers, FaUserPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaFileImport, FaFileExport,
  FaEnvelope, FaPhone, FaIdCard, FaTimes, FaDownload, FaUpload, FaUserShield, FaEye, FaEyeSlash
} from 'react-icons/fa';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { apiUrl } from '../../utils/api';
import '../Dashboard.css';

const MotionButton = motion.create(Button);

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
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const tokenHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/auth/owner-users'), {
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
        ? apiUrl('/api/auth/owner-users')
        : apiUrl(`/api/auth/owner-users/${current._id}`);
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
      const res = await fetch(apiUrl(`/api/auth/owner-users/${id}`), {
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
        const res = await fetch(apiUrl('/api/auth/owner-users'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...tokenHeader() }, body: JSON.stringify(payload) });
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
                  background: '#6941db',
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
                    color: '#6941db',
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
                <Button
                  onClick={openAdd}
                  className="action-btn action-btn-purple"
                >
                  <FaUserPlus /> Add Owner User
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
                    placeholder="Search by name or CNIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      paddingLeft: '36px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
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
                    <thead>
                      <tr>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>#</th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>
                          <FaUserShield className="me-2" />Name
                        </th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>
                          <FaEnvelope className="me-2" />Email
                        </th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>
                          <FaIdCard className="me-2" />National ID
                        </th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>
                          <FaPhone className="me-2" />Phone
                        </th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)', textAlign: 'center' }}>Actions</th>
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
                          .filter(u => {
                            const term = searchTerm.trim().toLowerCase();
                            if (!term) return true;
                            const userName = String(u.userName || '').toLowerCase();
                            const cnic = String(u.cnic || '').toLowerCase();
                            return userName.includes(term) || cnic.includes(term);
                          })
                          .map((u, idx) => (
                          <motion.tr
                            key={u._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ 
                              backgroundColor: 'rgba(79, 70, 229, 0.12)',
                              transition: { duration: 0.2 }
                            }}
                            style={{ borderBottom: '1px solid rgba(105, 65, 219, 0.1)' }}
                          >
                            <td style={{ padding: '1rem', fontWeight: 400 }}>{idx + 1}</td>
                            <td style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 400, color: '#374151' }}>{u.userName}</td>
                            <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#6b7280' }}>{u.email}</td>
                            <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#6b7280' }}>{u.cnic === 'N/A' ? '-' : u.cnic}</td>
                            <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#6b7280' }}>{u.phoneNumber === 'N/A' ? '-' : u.phoneNumber}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <div className="d-flex justify-content-center gap-2">
                                <Button
                                  onClick={() => openEdit(u)}
                                  className="table-action-btn table-action-edit"
                                >
                                  <FaEdit /> Edit
                                </Button>

                                <Button
                                  onClick={() => handleDelete(u._id)}
                                  className="table-action-btn table-action-delete"
                                >
                                  <FaTrash /> Delete
                                </Button>
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
        <Modal.Header closeButton style={{
          background: '#6941db',
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
                  e.target.style.border = '2px solid #6941db';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #d1d5db';
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
                  e.target.style.border = '2px solid #6941db';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #d1d5db';
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
                      e.target.style.border = '2px solid #6941db';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #d1d5db';
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
                      color: '#6941db',
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
                  e.target.style.border = '2px solid #6941db';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #d1d5db';
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
                background: '#6941db',
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
