import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaLock, FaKey, FaCheckCircle, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

const MotionCard = motion(Card);
const MotionButton = motion(Button);

const ChangePassword = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [oldFocus, setOldFocus] = useState(false);
  const [newFocus, setNewFocus] = useState(false);
  const [passwordLengthError, setPasswordLengthError] = useState('');
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setOldPasswordError('');
    setNewPasswordError('');
    setPasswordLengthError('');
    
    // Validate fields
    let hasError = false;
    
    if (!oldPassword) {
      setOldPasswordError('Current password is required');
      hasError = true;
    }
    
    if (!newPassword) {
      setNewPasswordError('New password is required');
      hasError = true;
    } else if (newPassword.length < 6) {
      setNewPasswordError('Password must be at least 6 characters');
      hasError = true;
    }
    
    if (hasError) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await axios.put('/api/auth/change-password', { oldPassword, newPassword });
      if (res.data?.ok) {
        setSuccess('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
      } else {
        setError(res.data?.message || 'Unable to change password');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        padding: '1rem',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <style>{`
        .change-container-wrapper { position: relative; z-index: 2; width: 100%; }
        .eye-button { border: none; background: transparent; color: #6c6c6c; }
        .back-button { color: #6941db; text-decoration: none; }
        .back-button:hover { color: #5a36c4; }
        .gradient-text { color: var(--theme-color, #6941db); }
        @media (min-width: 576px) {
          .change-container-wrapper { padding: 1.5rem !important; }
        }
        @media (min-width: 768px) {
          .change-container-wrapper { padding: 2rem !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #1a1a1a !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      <Container fluid className="change-container-wrapper">
        <Row className="justify-content-center">
          <Col xs={12} sm={11} md={9} lg={6} xl={5} style={{ maxWidth: 'calc(100% + 10px)' }}>
            <MotionCard
              className="border-0"
              style={{
                borderRadius: '1.5rem',
                overflow: 'hidden',
                background: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Card.Body className="p-4 p-sm-5">
                <div className="text-center mb-4 mb-sm-5">
                  <motion.div
                    className="d-flex align-items-center justify-content-center mx-auto mb-3 position-relative"
                    style={{
                      width: 'clamp(80px, 20vw, 100px)',
                      height: 'clamp(80px, 20vw, 100px)',
                      background: 'var(--theme-color, #6941db)',
                      borderRadius: '50%',
                      boxShadow: '0 10px 40px var(--theme-color), 0 0 0 8px var(--theme-color-light)'
                    }}
                  >
                    <FaLock color="white" size={30} />
                  </motion.div>
                  <h2 className="mb-2 gradient-text" style={{ fontWeight: 700 }}>Change Password</h2>
                  <p className="mb-0" style={{ color: '#1a1a1a', fontWeight: 600 }}>
                     Update your credentials below
                  </p>
                  
                </div>

                {error && (
                  <Alert variant="danger" className="d-flex align-items-center mb-3">
                    <FaLock className="me-2" />
                    <span>{error}</span>
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" className="d-flex align-items-center">
                    <FaCheckCircle className="me-2" />
                    <span>{success}</span>
                  </Alert>
                )}

                <Form onSubmit={submit}>
                  <Form.Group className="mb-3" controlId="oldPassword" style={{ position: 'relative' }}>
                    <div className="position-relative">
                      <motion.label
                        initial={false}
                        animate={{
                          top: oldFocus || oldPassword ? '-0.5rem' : '50%',
                          fontSize: oldFocus || oldPassword ? '0.8rem' : '0.9rem',
                          color: oldFocus || oldPassword ? 'var(--theme-color, #7e22ce)' : '#9ca3af',
                          y: oldFocus || oldPassword ? 0 : '-50%'
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute',
                          left: 'clamp(1rem, 3vw, 1.25rem)',
                          fontWeight: 600,
                          pointerEvents: 'none',
                          background: 'white',
                          padding: '0 0.5rem',
                          zIndex: 1
                        }}
                      >
                        Current Password
                      </motion.label>
                      <Form.Control
                        type={showOldPassword ? 'text' : 'password'}
                        placeholder=""
                        value={oldPassword}
                        onChange={(e) => {
                          setOldPassword(e.target.value);
                          if (oldPasswordError) setOldPasswordError('');
                        }}
                        onFocus={() => setOldFocus(true)}
                        onBlur={() => setOldFocus(false)}
                        style={{
                          padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                          fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                          border: oldPasswordError ? '2px solid #ef4444' : '2px solid #e5e7eb',
                          borderRadius: '0.875rem',
                          transition: 'all 0.3s ease',
                          boxShadow: oldPasswordError ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = oldPasswordError ? '#ef4444' : 'var(--theme-color, #7e22ce)';
                          e.currentTarget.style.boxShadow = oldPasswordError ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px var(--theme-color-light)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = oldPasswordError ? '#ef4444' : '#e5e7eb';
                          e.currentTarget.style.boxShadow = oldPasswordError ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                        }}
                      />
                    </div>
                    {oldPasswordError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#ef4444',
                          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                          fontWeight: '500'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {oldPasswordError}
                      </motion.div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="newPassword" style={{ position: 'relative' }}>
                    <div className="position-relative">
                      <motion.label
                        initial={false}
                        animate={{
                          top: newFocus || newPassword ? '-0.5rem' : '50%',
                          fontSize: newFocus || newPassword ? '0.8rem' : '0.9rem',
                          color: newFocus || newPassword ? 'var(--theme-color, #7e22ce)' : '#9ca3af',
                          y: newFocus || newPassword ? 0 : '-50%'
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute',
                          left: 'clamp(1rem, 3vw, 1.25rem)',
                          fontWeight: 600,
                          pointerEvents: 'none',
                          background: 'white',
                          padding: '0 0.5rem',
                          zIndex: 1
                        }}
                      >
                        New Password
                      </motion.label>
                      <Form.Control
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder=""
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (newPasswordError) setNewPasswordError('');
                          if (e.target.value.length > 0 && e.target.value.length < 6) {
                            setPasswordLengthError('Password must be at least 6 characters');
                          } else {
                            setPasswordLengthError('');
                          }
                        }}
                        onFocus={() => setNewFocus(true)}
                        onBlur={() => setNewFocus(false)}
                        disabled={!oldPassword}
                        style={{
                          padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                          fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                          border: (passwordLengthError || newPasswordError) ? '2px solid #ef4444' : '2px solid #e5e7eb',
                          borderRadius: '0.875rem',
                          transition: 'all 0.3s ease',
                          boxShadow: (passwordLengthError || newPasswordError) ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                          opacity: !oldPassword ? 0.6 : 1,
                          cursor: !oldPassword ? 'not-allowed' : 'text'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = (passwordLengthError || newPasswordError) ? '#ef4444' : 'var(--theme-color, #7e22ce)';
                          e.currentTarget.style.boxShadow = (passwordLengthError || newPasswordError) ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px var(--theme-color-light)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = (passwordLengthError || newPasswordError) ? '#ef4444' : '#e5e7eb';
                          e.currentTarget.style.boxShadow = (passwordLengthError || newPasswordError) ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                        }}
                      />
                    </div>
                    {(passwordLengthError || newPasswordError) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#ef4444',
                          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                          fontWeight: '500'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {newPasswordError || passwordLengthError}
                      </motion.div>
                    )}
                    {!(passwordLengthError || newPasswordError) && (
                      <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>Use minimum 6 characters</small>
                    )}
                  </Form.Group>

                  <MotionButton
                    type="submit"
                    className="w-100 fw-semibold"
                    whileHover={{ scale: 1.02, background: 'white', color: 'var(--theme-color, #6941db)', borderColor: '#d1d5db' }}
                    whileTap={{ scale: 0.98 }}
                    disabled={saving}
                    style={{
                      padding: 'clamp(0.875rem, 3vw, 1.125rem)',
                      fontSize: 'clamp(0.9375rem, 2.5vw, 1.0625rem)',
                      fontWeight: 600,
                      background: 'var(--theme-color, #6941db)',
                      border: '2px solid var(--theme-color, #6941db)',
                      borderRadius: '1rem',
                      color: 'white',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {saving ? 'Saving...' : 'Update Password'}
                  </MotionButton>

                  <MotionButton
                    className="w-100 mt-3 d-flex align-items-center justify-content-center"
                    onClick={() => navigate(-1)}
                    style={{
                      padding: 'clamp(0.875rem, 3vw, 1.125rem)',
                      fontSize: 'clamp(0.9375rem, 2.5vw, 1.0625rem)',
                      fontWeight: 600,
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '1rem',
                      color: '#1a1a1a',
                      gap: 'clamp(0.375rem, 1.5vw, 0.5rem)'
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      borderColor: '#d1d5db'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Return to Profile</span>
                  </MotionButton>
                </Form>
              </Card.Body>
            </MotionCard>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ChangePassword;
