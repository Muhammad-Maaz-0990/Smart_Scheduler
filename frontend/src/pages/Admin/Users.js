import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Alert, Button, Modal, Form } from 'react-bootstrap';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';

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
  const fileInputRef = React.useRef(null);

  const tokenHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    if (!instituteObjectId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/users/institute', {
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
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
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

    try {
      const url = mode === 'add' 
        ? 'http://localhost:5000/api/users'
        : `http://localhost:5000/api/users/${current._id}`;
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
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 1000);
    } catch (e) {
      setError(e.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
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
      const required = ['userName','email','designation','phoneNumber','cnic'];
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
        const res = await fetch('http://localhost:5000/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', ...tokenHeader() }, body: JSON.stringify(payload) });
        if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to add some rows'); }
      }
      setSuccess('Imported users added successfully'); setImportPreview([]); await fetchUsers();
    } catch (e) { setError(e.message || 'Import add failed'); }
  };
  const exportCSV = () => {
    const headers = ['userName','email','designation','phoneNumber','cnic'];
    const rows = users.map(u => ({ userName: u.userName, email: u.email, designation: u.designation, phoneNumber: u.phoneNumber, cnic: u.cnic }));
    downloadCSV('users.csv', toCSV(headers, rows));
  };

  return (
    <>
      <Sidebar activeMenu="users" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
            <div>
              <h1 className="dashboard-title mb-2">Institute Users</h1>
              <p className="dashboard-subtitle mb-0">Manage users in your institute</p>
            </div>
            <Button variant="primary" className="btn-futuristic" onClick={openAdd}>
              <span className="btn-icon">➕</span> Add User
            </Button>
            <div className="d-inline-flex gap-2 ms-2">
              <Button className="btn-futuristic" onClick={onImportClick}>📥 Import CSV</Button>
              <Button className="btn-futuristic" onClick={exportCSV}>📤 Export CSV</Button>
              <input type="file" accept=".csv,text/csv" ref={fileInputRef} style={{ display:'none' }} onChange={onFileSelected} />
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="error-alert" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="error-alert" onClose={() => setSuccess('')} dismissible>
              {success}
            </Alert>
          )}
          {importError && (
            <Alert variant="warning" className="error-alert" onClose={() => setImportError('')} dismissible>
              {importError}
            </Alert>
          )}
          {importPreview.length > 0 && (
            <Card className="glass-effect mb-3">
              <Card.Header>Import Preview</Card.Header>
              <Card.Body>
                <Table size="sm" hover>
                  <thead><tr><th>#</th><th>userName</th><th>email</th><th>designation</th><th>phoneNumber</th><th>cnic</th></tr></thead>
                  <tbody>
                    {importPreview.map((r, idx) => (
                      <tr key={idx}><td>{idx+1}</td><td>{r.userName}</td><td>{r.email}</td><td>{r.designation}</td><td>{r.phoneNumber}</td><td>{r.cnic}</td></tr>
                    ))}
                  </tbody>
                </Table>
                <Button variant="primary" onClick={addImported}>Add Imported</Button>
                <Button variant="secondary" className="ms-2" onClick={()=>setImportPreview([])}>Clear</Button>
              </Card.Body>
            </Card>
          )}

          <Card className="glass-effect">
            <Card.Body>
              <div className="table-responsive">
                <Table hover className="table-custom">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Designation</th>
                      <th>National ID</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" className="text-center">Loading...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan="7" className="text-center">No users found</td></tr>
                    ) : (
                      users.map((u, idx) => (
                        <tr key={u._id}>
                          <td>{idx + 1}</td>
                          <td>{u.userName}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`badge ${u.designation === 'Admin' ? 'bg-danger' : u.designation === 'Teacher' ? 'bg-info' : 'bg-success'}`}>
                              {u.designation}
                            </span>
                          </td>
                          <td>{u.cnic === 'N/A' ? '-' : u.cnic}</td>
                          <td>{u.phoneNumber === 'N/A' ? '-' : u.phoneNumber}</td>
                          <td>
                            <Button size="sm" variant="warning" className="me-2" onClick={() => openEdit(u)} disabled={u.designation === 'Admin'}>✏️ Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(u._id)} disabled={u.designation === 'Admin'}>🗑️ Delete</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton className="glass-effect">
          <Modal.Title>{mode === 'add' ? 'Add New User' : 'Edit User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass-effect">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={current.userName}
                onChange={(e) => setCurrent({ ...current, userName: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={current.email}
                onChange={(e) => setCurrent({ ...current, email: e.target.value })}
                required
              />
            </Form.Group>

            {mode === 'add' && (
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={current.password}
                  onChange={(e) => setCurrent({ ...current, password: e.target.value })}
                  minLength={6}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Designation</Form.Label>
              <Form.Select
                value={current.designation}
                onChange={(e) => setCurrent({ ...current, designation: e.target.value })}
                required
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
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
              <Form.Label>{getCNICLabel(country)}</Form.Label>
              <Form.Control
                type="text"
                value={current.cnic}
                onChange={handleCNICInput}
                placeholder={`Enter ${getCNICLabel(country)}`}
                maxLength={getCNICMaxLength(country)}
                pattern={getCNICPattern(country)}
                required
              />
              <Form.Text className="text-light-muted">
                <small>Selected country: {country} | Max {getCNICMaxLength(country)} characters</small>
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" type="submit" className="btn-futuristic">
                {mode === 'add' ? 'Add User' : 'Update User'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Users;
