import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Form, Alert, Modal, Row, Col, Badge } from 'react-bootstrap';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaLock, FaEdit, FaSave, FaTimes, FaUserCircle, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const OwnerProfile = () => {
  const { setUser } = useAuth();
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [country, setCountry] = useState('PK');

  const fetchProfile = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
                  <FaUserCircle style={{ color: '#fff', fontSize: '26px' }} />
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
                    Owner Profile
                  </h2>
                  <p style={{
                    fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                    color: '#6b7280',
                    fontWeight: 500,
                    marginBottom: 0
                  }}>
                    Manage your personal information
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowPasswordModal(true)} style={{
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
                <FaLock /> Change Password
              </Button>
            </div>
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
          </AnimatePresence>
          
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
          >
            <Card style={{
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <Card.Body className="p-4">
                {loading ? (
                  <div className="text-center py-5">
                    <LoadingSpinner message="Loading profile..." size="large" />
                  </div>
                ) : (
                  <Form>
                    <Row className="g-4">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            <FaUser className="me-2" />Full Name
                          </Form.Label>
                          {editMode ? (
                            <Form.Control 
                              type="text" 
                              value={profile.userName} 
                              onChange={(e) => setProfile({ ...profile, userName: e.target.value })}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                padding: '10px 12px',
                                fontSize: '0.9rem'
                              }}
                            />
                          ) : (
                            <div style={{
                              background: '#f9fafb',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              fontSize: '0.9rem',
                              color: '#111827',
                              fontWeight: 600
                            }}>
                              {profile.userName || '-'}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            <FaEnvelope className="me-2" />Email
                          </Form.Label>
                          {editMode ? (
                            <Form.Control 
                              type="email" 
                              value={profile.email} 
                              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                padding: '10px 12px',
                                fontSize: '0.9rem'
                              }}
                            />
                          ) : (
                            <div style={{
                              background: '#f9fafb',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              fontSize: '0.9rem',
                              color: '#111827',
                              fontWeight: 600
                            }}>
                              {profile.email || '-'}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            <FaPhone className="me-2" />Phone Number
                          </Form.Label>
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
                            <div style={{
                              background: '#f9fafb',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              fontSize: '0.9rem',
                              color: '#111827',
                              fontWeight: 600
                            }}>
                              {profile.phoneNumber || '-'}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            <FaIdCard className="me-2" />{getCNICLabel(country)}
                          </Form.Label>
                          {editMode ? (
                            <>
                              <Form.Control 
                                type="text" 
                                value={profile.cnic} 
                                onChange={handleCNICInput}
                                placeholder={`Enter ${getCNICLabel(country)}`}
                                maxLength={getCNICMaxLength(country)}
                                style={{
                                  borderRadius: '8px',
                                  border: '1px solid #d1d5db',
                                  padding: '10px 12px',
                                  fontSize: '0.9rem'
                                }}
                              />
                              <Form.Text style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Country: <Badge bg="secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{country}</Badge> | Max {getCNICMaxLength(country)} characters
                              </Form.Text>
                            </>
                          ) : (
                            <div style={{
                              background: '#f9fafb',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              fontSize: '0.9rem',
                              color: '#111827',
                              fontWeight: 600
                            }}>
                              {profile.cnic || '-'}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex gap-2 mt-4">
                      {!editMode ? (
                        <Button onClick={() => setEditMode(true)} style={{
                          background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          boxShadow: '0 1px 3px rgba(126, 34, 206, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <FaEdit /> Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button onClick={handleSave} style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <FaSave /> Save Changes
                          </Button>
                          <Button onClick={() => { setEditMode(false); setProfile(originalProfile); }} style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <FaTimes /> Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Container>
      </div>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
          borderBottom: 'none'
        }}>
          <Modal.Title style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            <FaKey className="me-2" />Change Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: '#f9fafb' }}>
          <AnimatePresence>
            {passwordError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="danger" onClose={() => setPasswordError('')} dismissible className="mb-3">
                  {passwordError}
                </Alert>
              </motion.div>
            )}
            {passwordSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="success" className="mb-3">{passwordSuccess}</Alert>
              </motion.div>
            )}
          </AnimatePresence>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                <FaLock className="me-1" />Current Password
              </Form.Label>
              <div style={{ position: 'relative' }}>
                <Form.Control
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
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
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                <FaKey className="me-1" />New Password
              </Form.Label>
              <div style={{ position: 'relative' }}>
                <Form.Control
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  minLength={6}
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
                  onClick={() => setShowNewPassword(!showNewPassword)}
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
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                <FaKey className="me-1" />Confirm New Password
              </Form.Label>
              <div style={{ position: 'relative' }}>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  minLength={6}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
              }} style={{
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
              <Button onClick={handleChangePassword} style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)'
              }}>
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
