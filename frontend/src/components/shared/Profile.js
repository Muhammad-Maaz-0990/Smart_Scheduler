import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaEdit, FaLock, FaCheckCircle, FaExclamationCircle, FaUserCog } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const MotionCard = motion(Card);
const MotionButton = motion(Button);

const Profile = () => {
  const navigate = useNavigate();
  const { user, loadInstituteOnce, loadSubscriptionOnce, loadPaymentsHistoryOnce } = useAuth();
  const [institute, setInstitute] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        if (user.instituteID) {
          const cachedInst = await loadInstituteOnce(user.instituteID);
          if (cachedInst) setInstitute(cachedInst);
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
  }, [user, loadInstituteOnce, loadSubscriptionOnce]);

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
  }, [user, loadSubscriptionOnce, loadPaymentsHistoryOnce]);

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
  }, [user, loadPaymentsHistoryOnce]);

  const getLogoUrl = (logo) => {
    if (!logo) return null;
    if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${apiUrl}${logo.startsWith('/') ? '' : '/'}${logo}`;
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
            color: '#7c3aed'
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
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1.5rem 0',
        marginBottom: '2rem'
      }}>
        <Container>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
              }}>
                <FaUserCog style={{ fontSize: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: '#7c3aed',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Profile
                </h1>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                  Manage your account information
                </p>
              </div>
            </div>
            
            {user?.designation === 'Admin' && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <MotionButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/admin/profile/edit')}
                  variant="outline-primary"
                  style={{
                    borderRadius: '10px',
                    padding: '0.625rem 1.25rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    border: '2px solid #7c3aed',
                    color: '#7c3aed',
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
                    background: '#7c3aed',
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
          </div>
        </Container>
      </div>

      <Container>
        <Row className="g-4">
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
                background: '#7c3aed',
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h6 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  letterSpacing: '0.5px'
                }}>
                  PERSONAL INFORMATION
                </h6>
              </div>
              <Card.Body style={{ padding: '2rem' }}>
                {/* Avatar */}
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                }}>
                  <FaUser style={{ fontSize: '3rem', color: 'white' }} />
                </div>

                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#111827',
                  textAlign: 'center',
                  marginBottom: '0.5rem'
                }}>
                  {user?.userName}
                </h3>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <Badge
                    style={{
                      background: user?.designation === 'Admin' ? '#ef4444' : user?.designation === 'Teacher' ? '#3b82f6' : '#10b981',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      borderRadius: '6px'
                    }}
                  >
                    {user?.designation}
                  </Badge>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <FaEnvelope style={{ color: '#7c3aed', fontSize: '1.125rem' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Email
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#111827', fontWeight: '500', fontSize: '0.875rem', paddingLeft: '2rem', wordBreak: 'break-word' }}>
                      {user?.email}
                    </p>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <FaPhone style={{ color: '#7c3aed', fontSize: '1.125rem' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Phone
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#111827', fontWeight: '500', fontSize: '0.875rem', paddingLeft: '2rem' }}>
                      {user?.phoneNumber || '—'}
                    </p>
                  </div>

                  {user?.instituteName && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <FaIdCard style={{ color: '#7c3aed', fontSize: '1.125rem' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Institute
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#111827', fontWeight: '500', fontSize: '0.875rem', paddingLeft: '2rem' }}>
                        {user.instituteName}
                      </p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </MotionCard>
          </Col>

          {/* Institute & Billing */}
          <Col lg={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    background: '#7c3aed',
                    padding: '0.75rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <h6 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
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
                      <Col md={6}>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            Subscription
                          </div>
                          <Badge
                            style={{
                              background: institute.subscription === 'Trial' ? '#f59e0b' : institute.subscription === 'Monthly' ? '#3b82f6' : '#10b981',
                              padding: '0.375rem 0.75rem',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              borderRadius: '6px'
                            }}
                          >
                            {institute.subscription}
                          </Badge>
                        </div>
                      </Col>
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
                      <Col xs={12}>
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

              {/* Billing Section - Only for Admin */}
              {user?.designation === 'Admin' && status && (
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
                    background: '#7c3aed',
                    padding: '0.75rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <h6 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
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
                        </div>
                      </div>
                    )}

                    {/* Payment History */}
                    {history && history.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>
                          Recent Payments
                        </div>
                        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem' }}>
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
                              <Badge
                                bg="success"
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  borderRadius: '6px'
                                }}
                              >
                                {p.amount}
                              </Badge>
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
                              border: '2px solid #7c3aed',
                              background: 'white',
                              color: '#7c3aed',
                              fontWeight: '700',
                              fontSize: '1rem'
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Monthly</div>
                            <div>PKR 100</div>
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
                              background: '#7c3aed',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '1rem',
                              position: 'relative'
                            }}
                          >
                            <Badge
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: '#10b981',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.625rem',
                                fontWeight: '700',
                                borderRadius: '4px'
                              }}
                            >
                              SAVE
                            </Badge>
                            <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Yearly</div>
                            <div>{paying ? 'Processing...' : 'PKR 1200'}</div>
                          </MotionButton>
                        </Col>
                      </Row>
                    )}
                  </Card.Body>
                </MotionCard>
              )}

              {/* Expired Notice for Non-Admin */}
              <AnimatePresence>
                {status && status.isExpired && user?.designation !== 'Admin' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
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
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Profile;
