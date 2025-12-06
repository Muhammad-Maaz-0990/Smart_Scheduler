import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, Alert, Modal, Row, Col } from 'react-bootstrap';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';

const OwnerProfile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ userName: '', email: '', phoneNumber: '', cnic: '' });
  const [originalProfile, setOriginalProfile] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [country, setCountry] = useState('PK');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/owner-profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      // Ensure phone number is in E.164 format or empty
      let phoneNumber = data.phoneNumber || '';
      if (phoneNumber && !phoneNumber.startsWith('+')) {
        phoneNumber = '+92' + phoneNumber; // Default to Pakistan
      }
      const profileData = {
        userName: data.userName || '',
        email: data.email || '',
        phoneNumber: phoneNumber,
        cnic: data.cnic || ''
      };
      setProfile(profileData);
      setOriginalProfile(profileData);
      setCountry(getCountryFromPhone(phoneNumber));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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

  const handlePhoneChange = (value) => {
    if (typeof value !== 'string') value = '';
    const cleaned = value.replace(/[^\d+]/g, '');
    setProfile(prev => ({ ...prev, phoneNumber: cleaned }));
  };

  useEffect(() => {
    if (profile.phoneNumber) {
      setCountry(getCountryFromPhone(profile.phoneNumber));
    }
  }, [profile.phoneNumber]);

  const handleCNICInput = (e) => {
    const { value } = e.target;
    const c = country;
    if (['PK', 'US', 'IN', 'SA'].includes(c)) {
      const numericValue = value.replace(/[^0-9]/g, '');
      setProfile(prev => ({ ...prev, cnic: numericValue.slice(0, getCNICMaxLength(c)) }));
    } else if (c === 'GB') {
      const gbValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      setProfile(prev => ({ ...prev, cnic: gbValue.slice(0, 9) }));
    } else if (c === 'AE') {
      const aeValue = value.replace(/[^0-9-]/g, '');
      setProfile(prev => ({ ...prev, cnic: aeValue.slice(0, 18) }));
    } else {
      setProfile(prev => ({ ...prev, cnic: value.slice(0, 20) }));
    }
  };

  const handleSave = async () => {
    setError(''); setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/owner-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      setSuccess('Profile updated successfully');
      setOriginalProfile(profile);
      setEditMode(false);
      // Update context
      if (setUser && data.user) {
        setUser(prev => ({ ...prev, ...data.user }));
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(''); setPasswordSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/owner-change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');
      setPasswordSuccess('Password changed successfully');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordSuccess('');
      }, 1500);
    } catch (e) {
      setPasswordError(e.message);
    }
  };

  return (
    <>
      <Sidebar activeMenu="profile" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="dashboard-title mb-0">Owner Profile</h1>
            <Button variant="outline-secondary" onClick={() => setShowPasswordModal(true)}>
              🔒 Change Password
            </Button>
          </div>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Card className="glass-effect">
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Full Name</strong></Form.Label>
                        {editMode ? (
                          <Form.Control 
                            type="text" 
                            value={profile.userName} 
                            onChange={(e) => setProfile({ ...profile, userName: e.target.value })}
                          />
                        ) : (
                          <div className="form-control-plaintext">{profile.userName || '-'}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Email</strong></Form.Label>
                        {editMode ? (
                          <Form.Control 
                            type="email" 
                            value={profile.email} 
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          />
                        ) : (
                          <div className="form-control-plaintext">{profile.email || '-'}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Phone Number</strong></Form.Label>
                        {editMode ? (
                          <PhoneInput
                            international
                            defaultCountry="PK"
                            value={profile.phoneNumber}
                            onChange={handlePhoneChange}
                            className="phone-input-custom"
                            placeholder="Enter phone number"
                          />
                        ) : (
                          <div className="form-control-plaintext">{profile.phoneNumber || '-'}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>{getCNICLabel(country)}</strong></Form.Label>
                        {editMode ? (
                          <Form.Control 
                            type="text" 
                            value={profile.cnic} 
                            onChange={handleCNICInput}
                            placeholder={`Enter ${getCNICLabel(country)}`}
                            maxLength={getCNICMaxLength(country)}
                          />
                        ) : (
                          <div className="form-control-plaintext">{profile.cnic || '-'}</div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex gap-2 mt-3">
                    {!editMode ? (
                      <Button variant="primary" onClick={() => setEditMode(true)}>✏️ Edit Profile</Button>
                    ) : (
                      <>
                        <Button variant="success" onClick={handleSave}>💾 Save Changes</Button>
                        <Button variant="secondary" onClick={() => { setEditMode(false); setProfile(originalProfile); }}>✖️ Cancel</Button>
                      </>
                    )}
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="glass-effect">
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass-effect">
          {passwordError && <Alert variant="danger" onClose={() => setPasswordError('')} dismissible>{passwordError}</Alert>}
          {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                minLength={6}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                minLength={6}
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
              }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleChangePassword}>
                Change Password
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OwnerProfile;
