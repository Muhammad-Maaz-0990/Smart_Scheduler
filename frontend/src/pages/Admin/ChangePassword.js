import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaLock, FaKey, FaCheckCircle, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

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

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await axios.put('/api/auth/change-password', { oldPassword, newPassword });
      if (res.data?.ok) {
        setSuccess('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Change password failed');
    } finally {
      setSaving(false);
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
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <MotionButton
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/profile')}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.6rem 0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Back to Profile"
            >
              <FaArrowLeft style={{ fontSize: '1.1rem', color: 'white' }} />
            </MotionButton>
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: '#7c3aed',
                marginBottom: '0.5rem',
                margin: 0
              }}>
                Change Password
              </h1>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                Update your account password
              </p>
            </div>
          </div>

          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              background: '#7c3aed',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaLock style={{ fontSize: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h5 style={{ color: 'white', margin: 0, fontWeight: '700' }}>Security Settings</h5>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, fontSize: '0.875rem' }}>
                  Keep your account secure
                </p>
              </div>
            </div>

            <Card.Body style={{ padding: '2rem' }}>
              {error && (
                <Alert variant="danger" style={{ borderRadius: '12px', marginBottom: '1.5rem' }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert
                  variant="success"
                  style={{
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaCheckCircle /> {success}
                </Alert>
              )}

              <Form onSubmit={submit}>
                <Form.Group className="mb-4">
                  <Form.Label style={{
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <FaKey style={{ marginRight: '0.5rem', color: '#7c3aed' }} />
                    Current Password
                  </Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      style={{
                        borderRadius: '10px',
                        padding: '0.75rem',
                        paddingRight: '3rem',
                        border: '2px solid #e5e7eb',
                        fontSize: '0.875rem'
                      }}
                      className="gradient-border-input"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#7c3aed',
                        fontSize: '1.1rem',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label style={{
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <FaLock style={{ marginRight: '0.5rem', color: '#7c3aed' }} />
                    New Password
                  </Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      style={{
                        borderRadius: '10px',
                        padding: '0.75rem',
                        paddingRight: '3rem',
                        border: '2px solid #e5e7eb',
                        fontSize: '0.875rem'
                      }}
                      className="gradient-border-input"
                      placeholder="Enter your new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#7c3aed',
                        fontSize: '1.1rem',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <Form.Text style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Password must be at least 6 characters long
                  </Form.Text>
                </Form.Group>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                  <MotionButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving}
                    style={{
                      background: '#7c3aed',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.75rem 2rem',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      flex: 1
                    }}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </MotionButton>
                </div>
              </Form>
            </Card.Body>
          </MotionCard>
        </Container>
      </div>

      <style>{`
        .gradient-border-input {
          transition: all 0.2s ease;
        }
        
        .gradient-border-input:focus {
          outline: none !important;
          box-shadow: none !important;
          border: 2px solid transparent !important;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%) border-box !important;
        }
      `}</style>
    </>
  );
};

export default ChangePassword;
