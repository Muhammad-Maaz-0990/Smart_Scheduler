import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/api';
import { Card, Button, Alert, Spinner, Container, Row, Col, Modal, Form } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaEdit, FaLock, FaCheckCircle, FaExclamationCircle, FaUserCog, FaImage, FaMoneyBillAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const MotionCard = motion.create(Card);
const MotionButton = motion.create(Button);

const Profile = () => {
  const navigate = useNavigate();
  const { user, loadInstituteOnce, loadSubscriptionOnce, loadPaymentsHistoryOnce, refreshInstituteData, refreshSubscriptionData, refreshPaymentsHistory } = useAuth();
  const [institute, setInstitute] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    instituteName: '',
    address: '',
    contactNumber: '',
    instituteLogo: '',
    themeColor: '#7c3aed'
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Apply theme whenever institute changes (even from cache)
  useEffect(() => {
    if (institute?.themeColor) {
      const colorPresets = [
        { name: 'Purple', value: '#7c3aed', light: '#ede9fe', dark: '#5b21b6' },
        { name: 'Blue', value: '#2563eb', light: '#dbeafe', dark: '#1e40af' },
        { name: 'Emerald', value: '#059669', light: '#d1fae5', dark: '#047857' }
      ];
      const selectedColor = colorPresets.find(c => c.value.toLowerCase() === institute.themeColor.toLowerCase()) || colorPresets[0];
      console.log('🎨 Profile - Applying theme on mount/update:', selectedColor.name);
      document.documentElement.style.setProperty('--theme-color', selectedColor.value);
      document.documentElement.style.setProperty('--theme-color-light', selectedColor.light);
      document.documentElement.style.setProperty('--theme-color-dark', selectedColor.dark);
      
      // Update localStorage so theme persists on reload
      localStorage.setItem('appTheme', JSON.stringify(selectedColor));
    }
  }, [institute]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        if (user.instituteID) {
          const cachedInst = await loadInstituteOnce(user.instituteID);
          if (cachedInst) {
            setInstitute(cachedInst);
          }
          const cachedStatus = await loadSubscriptionOnce(user.instituteID);
          if (cachedStatus) setStatus(cachedStatus);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // If redirected back from Stripe Checkout success, confirm and record payment
  useEffect(() => {
    const url = new URL(window.location.href);
    const checkout = url.searchParams.get('checkout');
    const sessionId = url.searchParams.get('session_id');
    if (checkout === 'success' && sessionId) {
      const confirm = async () => {
        try {
          setPaying(true);
          setNotice('Finalizing payment...');
          const res = await axios.get(`/api/payments/confirm`, { params: { session_id: sessionId } });
          if (res.data?.ok) {
            setNotice('Payment recorded successfully. Refreshing status...');
            // Refresh status
            if (user?.instituteID) {
              const st = await loadSubscriptionOnce(user.instituteID);
              if (st) setStatus(st);
              try {
                const h = await loadPaymentsHistoryOnce(user.instituteID);
                setHistory(h?.items || []);
              } catch {}
            }
          }
        } catch (err) {
          setError(err?.response?.data?.message || 'Failed to confirm payment');
        } finally {
          setPaying(false);
          // Clean URL params
          url.searchParams.delete('checkout');
          url.searchParams.delete('session_id');
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      };
      confirm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startPayment = async (plan) => {
    try {
      setPaying(true);
      setNotice('Redirecting to Stripe Checkout...');
      const res = await axios.post('/api/payments/checkout', { plan });
      const url = res.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        setError('Failed to start checkout');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to begin payment');
    } finally {
      // don't clear paying here because we redirect on success
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (user?.instituteID && (user?.designation || '').toLowerCase() === 'admin') {
          const h = await loadPaymentsHistoryOnce(user.instituteID);
          setHistory(h?.items || []);
        }
      } catch (e) {
        // silently ignore history errors
      }
    };
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getLogoUrl = (logo) => {
    if (!logo) return null;
    if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }
    return apiUrl(logo);
  };

  const handleEditClick = () => {
    if (institute) {
      setEditForm({
        instituteName: institute.instituteName || '',
        address: institute.address || '',
        contactNumber: institute.contactNumber || '',
        instituteLogo: institute.instituteLogo || '',
        themeColor: institute.themeColor || '#7c3aed'
      });
      document.documentElement.style.setProperty('--theme-color', institute.themeColor || '#7c3aed');
      setShowEditModal(true);
      setEditError('');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((f) => ({ ...f, instituteLogo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.instituteName?.trim()) {
      setEditError('Institute name is required');
      return;
    }
    try {
      setSaving(true);
      setEditError('');
      const token = localStorage.getItem('token');
      
      // Update on server
      await axios.put(
        `/api/auth/institute/${encodeURIComponent(user.instituteID)}`, 
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh institute data from server to update cache in AuthContext
      const updatedInstitute = await refreshInstituteData(user.instituteID);
      if (updatedInstitute) {
        setInstitute(updatedInstitute);
      }
      
      console.log('✅ Institute data and theme saved to DB and cache updated');
      
      // Also refresh subscription and payment history
      if (user?.instituteID) {
        try {
          const st = await refreshSubscriptionData(user.instituteID);
          if (st) setStatus(st);
          
          if ((user?.designation || '').toLowerCase() === 'admin') {
            const h = await refreshPaymentsHistory(user.instituteID);
            setHistory(h?.items || []);
          }
        } catch (err) {
          console.error('Error reloading data:', err);
        }
      }
      
      setShowEditModal(false);
      setEditError('');
    } catch (e) {
      setEditError(e?.response?.data?.message || 'Failed to update institute');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f8f9fa'
      }}>
        <Spinner
          animation="border"
          style={{
            width: '3rem',
            height: '3rem',
            color: 'var(--theme-color)'
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <Container style={{ paddingTop: '2rem' }}>
        <Alert variant="danger" style={{ borderRadius: '12px' }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      paddingBottom: '3rem'
    }}>
      {/* Header */}
      <Container style={{ 
        padding: '1rem 2rem',
        marginBottom: '2rem', 
        maxWidth: 'none',
        minHeight: '82px',
        borderBottom: '1px solid rgba(17, 24, 39, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'var(--theme-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(105, 65, 219, 0.3)',
            flexShrink: 0
          }}>
            <FaUserCog style={{ fontSize: '1.5rem', color: 'white' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: 'var(--theme-color)',
              lineHeight: '1.2',
              margin: 0
            }}>
              Profile
            </h1>
            <p style={{ color: 'var(--theme-color)', margin: 0, fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)', fontWeight: '600' }}>
              Manage your account information
            </p>
          </div>
        </div>
        
        {user?.designation === 'Admin' && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <MotionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEditClick}
              variant="outline-primary"
              style={{
                borderRadius: '10px',
                padding: '0.625rem 1.25rem',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: '2px solid var(--theme-color)',
                color: 'var(--theme-color)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaEdit /> Edit Institute
            </MotionButton>
            <MotionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin/profile/password')}
              style={{
                borderRadius: '10px',
                padding: '0.625rem 1.25rem',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: 'none',
                background: 'var(--theme-color)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaLock /> Change Password
            </MotionButton>
          </div>
        )}
      </Container>

      <Container style={{ maxWidth: 'none', paddingLeft: '2rem', paddingRight: '2rem' }}>
        {/* First Row: Personal Information and Institute Information */}
        <Row className="g-4 mb-4">
          {/* Personal Information */}
          <Col lg={4}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                height: '100%',
                overflow: 'hidden'
              }}
            >
              <div style={{
                background: 'var(--theme-color-light)',
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid var(--theme-color)'
              }}>
                <h6 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--theme-color)',
                  letterSpacing: '0.5px'
                }}>
                  PERSONAL INFORMATION
                </h6>
              </div>
              <Card.Body style={{ padding: '2rem' }}>
                {/* Avatar */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '20px',
                  background: 'var(--theme-color-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  border: '2px solid var(--theme-color)',
                  boxShadow: '0 2px 8px var(--theme-color-light)'
                }}>
                  <FaUser style={{ fontSize: '2.5rem', color: 'var(--theme-color)' }} />
                </div>

                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#111827',
                  textAlign: 'center',
                  marginBottom: '0.5rem'
                }}>
                  {user?.userName}
                </h3>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      background: 'var(--theme-color)',
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '8px',
                      color: '#ffffff',
                      display: 'inline-block'
                    }}
                  >
                    {user?.designation}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--theme-color-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--theme-color)',
                        flexShrink: 0
                      }}>
                        <FaEnvelope style={{ color: 'var(--theme-color)', fontSize: '0.875rem' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '36px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                          Email
                        </span>
                        <p style={{ margin: 0, color: '#111827', fontWeight: '500', fontSize: '0.875rem', wordBreak: 'break-word', lineHeight: '1.4' }}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--theme-color-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--theme-color)',
                        flexShrink: 0
                      }}>
                        <FaPhone style={{ color: 'var(--theme-color)', fontSize: '0.875rem' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '36px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                          Phone
                        </span>
                        <p style={{ margin: 0, color: '#111827', fontWeight: '500', fontSize: '0.875rem', lineHeight: '1.4' }}>
                          {user?.phoneNumber || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {user?.instituteName && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'var(--theme-color-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--theme-color)',
                          flexShrink: 0
                        }}>
                          <FaIdCard style={{ color: 'var(--theme-color)', fontSize: '0.875rem' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '36px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                            Institute
                          </span>
                          <p style={{ margin: 0, color: '#111827', fontWeight: '500', fontSize: '0.875rem', lineHeight: '1.4' }}>
                            {user.instituteName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </MotionCard>
          </Col>

          {/* Institute & Billing */}
          <Col lg={8}>
            {/* Institute Information */}
            {institute && (
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                style={{
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  height: '100%',
                  overflow: 'hidden'
                }}
                >
                  <div style={{
                    background: 'var(--theme-color-light)',
                    padding: '0.75rem 1.5rem',
                    borderBottom: '1px solid var(--theme-color)'
                  }}>
                    <h6 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--theme-color)',
                      letterSpacing: '0.5px'
                    }}>
                      INSTITUTE INFORMATION
                    </h6>
                  </div>
                  <Card.Body style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                      {institute.instituteLogo && (
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '12px',
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.5rem',
                          flexShrink: 0,
                          border: '2px solid #e5e7eb'
                        }}>
                          <img 
                            src={getLogoUrl(institute.instituteLogo)} 
                            alt="Institute Logo" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
                          {institute.instituteName}
                        </h4>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                          ID: {institute.instituteID}
                        </p>
                      </div>
                    </div>

                    <Row className="g-3">
                      <Col md={6}>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            Type
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                            {institute.instituteType}
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            Contact
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                            {institute.contactNumber}
                          </div>
                        </div>
                      </Col>
                      {user?.designation === 'Admin' && (
                        <Col md={6}>
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                              Subscription
                            </div>
                            <div
                              style={{
                                background: 'var(--theme-color)',
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                borderRadius: '8px',
                                color: '#ffffff',
                                display: 'inline-block'
                              }}
                            >
                              {institute.subscription}
                            </div>
                          </div>
                        </Col>
                      )}
                      {institute.created_at && (
                        <Col md={6}>
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                              Created
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                              {new Date(institute.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </Col>
                      )}
                      <Col md={6}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            Address
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                            {institute.address}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </MotionCard>
              )}
          </Col>
        </Row>

        {/* Second Row: Billing Section on the left */}
        {user?.designation === 'Admin' && status && (
          <Row className="g-4">
            <Col lg={8}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  background: 'var(--theme-color-light)',
                  padding: '0.75rem 1.5rem',
                  borderBottom: '1px solid var(--theme-color)'
                }}>
                  <h6 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--theme-color)',
                    letterSpacing: '0.5px'
                  }}>
                    BILLING & SUBSCRIPTION
                  </h6>
                </div>
                <Card.Body style={{ padding: '2rem' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '1.5rem' }}>
                    Billing & Subscription
                  </h4>

                  <AnimatePresence>
                    {notice && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Alert
                          variant="info"
                          style={{
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            border: '1px solid #3b82f6',
                            background: '#eff6ff'
                          }}
                        >
                          {paying && <Spinner animation="border" size="sm" style={{ marginRight: '0.5rem' }} />}
                          {notice}
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Status */}
                  <div style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: status.hasPaymentThisPeriod ? '#d1fae5' : '#fef3c7',
                    border: `1px solid ${status.hasPaymentThisPeriod ? '#10b981' : '#f59e0b'}`,
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    {status.hasPaymentThisPeriod ? (
                      <FaCheckCircle style={{ color: '#10b981', fontSize: '1.25rem', flexShrink: 0 }} />
                    ) : (
                      <FaExclamationCircle style={{ color: '#f59e0b', fontSize: '1.25rem', flexShrink: 0 }} />
                    )}
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: status.hasPaymentThisPeriod ? '#065f46' : '#92400e' }}>
                      {status.subscriptionType === 'Trial'
                        ? 'You are currently on a Trial subscription.'
                        : status.hasPaymentThisPeriod
                          ? `Current ${status.currentPeriod?.type?.toLowerCase()} payment is recorded. ${status.daysLeft != null ? `${status.daysLeft} day(s) left.` : ''}`
                          : `No payment found for this ${status.currentPeriod?.type?.toLowerCase()} period.`}
                    </div>
                  </div>

                  {/* Period & Last Payment */}
                  {status.currentPeriod && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                        Current Period
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                        {status.currentPeriod.label} ({new Date(status.currentPeriod.start).toLocaleDateString()} - {new Date(status.currentPeriod.end).toLocaleDateString()})
                      </div>
                    </div>
                  )}

                  {status.lastPayment && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                        Last Payment
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                        {new Date(status.lastPayment.paymentDate).toLocaleDateString()} • {status.lastPayment.amount}
                        {status.subscriptionType && status.subscriptionType !== 'Trial' ? ` • ${status.subscriptionType}` : ''}
                      </div>
                    </div>
                  )}

                  {/* Payment History */}
                  {history && history.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>
                        Recent Payments
                      </div>
                      <div style={{ background: 'transparent', borderRadius: '12px', padding: '1rem' }}>
                        {history.slice(0, 3).map((p, index) => (
                          <div
                            key={p.paymentID}
                            style={{
                              paddingBottom: index < Math.min(2, history.length - 1) ? '0.75rem' : '0',
                              marginBottom: index < Math.min(2, history.length - 1) ? '0.75rem' : '0',
                              borderBottom: index < Math.min(2, history.length - 1) ? '1px solid #e5e7eb' : 'none',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                                {new Date(p.paymentDate).toLocaleDateString()}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                ID: {p.paymentID}
                              </div>
                            </div>
                            <div
                              style={{
                                background: '#ffffff',
                                padding: '0.6rem 0.9rem',
                                fontSize: '1rem',
                                fontWeight: '700',
                                borderRadius: '4px',
                                color: '#10b981',
                                border: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <FaMoneyBillAlt style={{ color: '#10b981' }} />
                              {`${typeof p.amount === 'string' ? p.amount.replace('$', '') : p.amount} USD`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Buttons */}
                  {status.showPaymentButton && (
                    <Row className="g-3">
                      <Col md={6}>
                        <MotionButton
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={paying}
                          onClick={() => startPayment('Monthly')}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '2px solid var(--theme-color)',
                            background: 'white',
                            color: 'var(--theme-color)',
                            fontWeight: '700',
                            fontSize: '1rem'
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Monthly</div>
                          <div>$49 USD</div>
                        </MotionButton>
                      </Col>
                      <Col md={6}>
                        <MotionButton
                          whileHover={{ scale: paying ? 1 : 1.02 }}
                          whileTap={{ scale: paying ? 1 : 0.98 }}
                          disabled={paying}
                          onClick={() => startPayment('Yearly')}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'var(--theme-color)',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '1rem',
                            position: 'relative'
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#10b981',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.625rem',
                              fontWeight: '700',
                              borderRadius: '6px',
                              color: '#ffffff'
                            }}
                          >
                            SAVE
                          </div>
                          <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Yearly</div>
                          <div>{paying ? 'Processing...' : '$300 USD'}</div>
                        </MotionButton>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </MotionCard>
            </Col>
          </Row>
        )}

        {/* Expired Notice for Non-Admin */}
        <AnimatePresence>
          {status && status.isExpired && user?.designation !== 'Admin' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ marginTop: '1.5rem' }}
            >
              <Alert
                variant="warning"
                style={{
                  borderRadius: '12px',
                  border: '1px solid #f59e0b',
                  background: '#fef3c7'
                }}
              >
                <FaExclamationCircle style={{ marginRight: '0.5rem' }} />
                Your institute subscription has expired. Please contact your Admin to renew.
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Edit Institute Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        size="lg"
        style={{ zIndex: 1050 }}
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
          .PhoneInput {
            width: 100%;
          }
          .PhoneInput input {
            padding: clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem);
            font-size: clamp(0.875rem, 2.5vw, 0.9375rem);
            border: 2px solid #e5e7eb !important;
            border-radius: 12px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            color: #000000;
            background: #fff;
            width: 100%;
          }
          .PhoneInput input:focus {
            border-color: var(--theme-color) !important;
            box-shadow: 0 4px 12px rgba(105, 65, 219, 0.15);
            color: var(--theme-color);
            outline: none;
          }
          .PhoneInput input:hover {
            border-color: var(--theme-color) !important;
          }
          .PhoneInputCountry {
            padding: 0 0.5rem;
            margin-right: 0.5rem;
            border-right: 2px solid #e5e7eb;
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
              borderRadius: '12px 12px 0 0',
              padding: '0.75rem 1rem'
            }}
            closeVariant="white"
          >
            <Modal.Title style={{ fontWeight: 600, fontSize: '1.25rem' }}>
              Edit Institute
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{
            background: '#ffffff',
            padding: '2rem',
            border: 'none',
            borderRadius: '0 0 12px 12px',
            overflow: 'visible'
          }}>
            <AnimatePresence>
              {editError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert
                    variant="danger"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.1))',
                      border: '2px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      fontWeight: 400
                    }}
                  >
                    {editError}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Form onSubmit={handleEditSubmit}>
              <Form.Group className="mb-4">
                <Form.Label style={{
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  color: '#232323',
                  fontSize: '0.95rem',
                  letterSpacing: '0.01em',
                  lineHeight: 1.2
                }}>
                  Profile Picture
                </Form.Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ flexShrink: 0 }}>
                    {editForm.instituteLogo ? (
                      <img
                        src={getLogoUrl(editForm.instituteLogo)}
                        alt="Profile"
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: '3px solid var(--theme-color)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '12px',
                        background: '#f3f4f6',
                        border: '3px dashed #d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af',
                        fontSize: '2rem'
                      }}>
                        <FaImage />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      style={{
                        padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                        fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        color: '#000000',
                        background: '#fff'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'var(--theme-color)';
                        e.target.style.boxShadow = '0 4px 12px rgba(105, 65, 219, 0.15)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                      }}
                      onMouseOver={e => {
                        e.target.style.borderColor = 'var(--theme-color)';
                      }}
                      onMouseOut={e => {
                        if (!e.target.matches(':focus')) e.target.style.borderColor = '#e5e7eb';
                      }}
                    />
                  </div>
                </div>
              </Form.Group>

              {/* Theme Color Selector */}
              <Form.Group className="mb-4">
                <Form.Label style={{
                  fontWeight: 700,
                  color: '#232323',
                  fontSize: '0.95rem',
                  letterSpacing: '0.01em',
                  lineHeight: 1.2,
                  marginBottom: '1rem'
                }}>
                  Theme Color
                </Form.Label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {[
                    { name: 'Purple', value: '#7c3aed', light: '#ede9fe', dark: '#5b21b6' },
                    { name: 'Blue', value: '#2563eb', light: '#dbeafe', dark: '#1e40af' },
                    { name: 'Emerald', value: '#059669', light: '#d1fae5', dark: '#047857' }
                  ].map((color) => (
                    <div
                      key={color.value}
                      onClick={() => {
                        console.log(`🎨 Theme changed to ${color.name}:`, {
                          main: color.value,
                          light: color.light,
                          dark: color.dark
                        });
                        setEditForm(f => ({ ...f, themeColor: color.value }));
                        document.documentElement.style.setProperty('--theme-color', color.value);
                        document.documentElement.style.setProperty('--theme-color-light', color.light);
                        document.documentElement.style.setProperty('--theme-color-dark', color.dark);
                        console.log('✅ CSS variables set successfully');
                      }}
                      style={{
                        width: '80px',
                        padding: '0.5rem',
                        borderRadius: '12px',
                        border: (editForm.themeColor || '#7c3aed') === color.value ? `3px solid ${color.value}` : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: 'white',
                        boxShadow: (editForm.themeColor || '#7c3aed') === color.value ? `0 4px 12px ${color.value}40` : '0 2px 4px rgba(0,0,0,0.1)',
                        transform: (editForm.themeColor || '#7c3aed') === color.value ? 'scale(1.05)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = (editForm.themeColor || '#7c3aed') === color.value ? 'scale(1.05)' : 'scale(1)'}
                    >
                      <div style={{
                        width: '100%',
                        height: '40px',
                        borderRadius: '8px',
                        background: color.value,
                        marginBottom: '0.5rem',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {(editForm.themeColor || '#7c3aed') === color.value && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: (editForm.themeColor || '#7c3aed') === color.value ? color.value : '#6b7280',
                        textAlign: 'center'
                      }}>
                        {color.name}
                        {(editForm.themeColor || '#7c3aed') === color.value && ' ✓'}
                      </div>
                    </div>
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <Form.Label style={{
                    fontWeight: 700,
                    color: '#232323',
                    fontSize: '0.95rem',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                    margin: 0,
                    minWidth: '150px',
                    flexShrink: 0
                  }}>
                    Institute Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="instituteName"
                    value={editForm.instituteName}
                    onChange={handleEditChange}
                    placeholder="Enter institute name"
                    required
                    style={{
                      padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                      fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      color: '#000000',
                      background: '#fff',
                      flex: 1
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--theme-color)';
                      e.target.style.boxShadow = '0 4px 12px rgba(105, 65, 219, 0.15)';
                      e.target.style.color = 'var(--theme-color)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                      e.target.style.color = '#000000';
                    }}
                    onMouseOver={e => {
                      e.target.style.borderColor = 'var(--theme-color)';
                    }}
                    onMouseOut={e => {
                      if (!e.target.matches(':focus')) e.target.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                  <Form.Label style={{
                    fontWeight: 700,
                    color: '#232323',
                    fontSize: '0.95rem',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                    margin: 0,
                    minWidth: '150px',
                    flexShrink: 0,
                    paddingTop: '0.875rem'
                  }}>
                    Address
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    placeholder="Enter address"
                    required
                    style={{
                      padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                      fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      color: '#000000',
                      background: '#fff',
                      flex: 1
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--theme-color)';
                      e.target.style.boxShadow = '0 4px 12px rgba(105, 65, 219, 0.15)';
                      e.target.style.color = 'var(--theme-color)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                      e.target.style.color = '#000000';
                    }}
                    onMouseOver={e => {
                      e.target.style.borderColor = 'var(--theme-color)';
                    }}
                    onMouseOut={e => {
                      if (!e.target.matches(':focus')) e.target.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <Form.Label style={{
                    fontWeight: 700,
                    color: '#232323',
                    fontSize: '0.95rem',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                    margin: 0,
                    minWidth: '150px',
                    flexShrink: 0
                  }}>
                    Contact Number
                  </Form.Label>
                  <div style={{ flex: 1 }}>
                    <PhoneInput
                      international
                      defaultCountry="PK"
                      value={editForm.contactNumber}
                      onChange={(value) => setEditForm((f) => ({ ...f, contactNumber: value || '' }))}
                      style={{
                        borderRadius: '12px'
                      }}
                    />
                  </div>
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end gap-3 mt-4">
                <MotionButton
                  type="button"
                  whileHover={{
                    background: '#ffffff',
                    color: '#6b7280',
                    borderColor: '#6b7280'
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setShowEditModal(false)}
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
                  type="submit"
                  disabled={saving}
                  whileHover={{
                    background: saving ? 'var(--theme-color)' : '#fff',
                    color: saving ? '#fff' : 'var(--theme-color)',
                    border: '2px solid var(--theme-color)'
                  }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    background: 'var(--theme-color)',
                    border: '2px solid var(--theme-color)',
                    borderRadius: '12px',
                    padding: '0.5rem 1rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#fff',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </MotionButton>
              </div>
            </Form>
          </Modal.Body>
        </motion.div>
      </Modal>
    </div>
  );
};

export default Profile;
