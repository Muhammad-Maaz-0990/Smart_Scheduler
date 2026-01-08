import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fadeInUp,
  heroReveal,
  staggerChildren,
  scaleIn
} from '../components/shared/animation_variants';
import { useAuth } from '../context/AuthContext';
import { apiUrl, API_BASE } from '../utils/api';
import { updateFavicon, getThemeLogo } from '../utils/theme';

const MotionButton = motion.create(Button);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loginWithToken, loading: authLoading } = useAuth();

  // Initialize theme and favicon
  useEffect(() => {
    updateFavicon();
  }, []);

  // Redirect if already logged in (separate effect)
  useEffect(() => {
    if (user && user.designation && !authLoading) {
      redirectToDashboard(user.designation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Handle Google OAuth callback (separate effect)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const designation = params.get('designation');
    const oauthError = params.get('error');

    if (oauthError) {
      const messageByCode = {
        oauth_failed: 'Google sign-in failed. Please try again.',
        login_failed: 'Google sign-in succeeded but login failed. Please try again.',
      };
      setError(messageByCode[oauthError] || 'Google sign-in failed. Please try again.');
      return;
    }

    if (token && designation) {
      // Ensure AuthContext token state updates so axios headers and verification are set
      loginWithToken(token, { designation });
      redirectToDashboard(designation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const redirectToDashboard = (designation) => {
    const routes = {
      'Owner': '/owner',
      'Admin': '/admin',
      'Student': '/student',
      'Teacher': '/teacher'
    };
    navigate(routes[designation] || '/login');
  };

  const handleGoogleLogin = () => {
    // In production (Cloudflare Pages), OAuth must go to the hosted backend.
    // If REACT_APP_API_URL isn't set, apiUrl() will produce a relative /api/auth/google
    // which Cloudflare will rewrite to index.html and it looks like "nothing happened".
    if (!API_BASE && window.location.hostname !== 'localhost') {
      setError('Google sign-in is not configured yet (missing REACT_APP_API_URL).');
      return;
    }
    window.location.href = apiUrl('/api/auth/google');
  };

  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    
    // Validate fields
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (emailValidation || passwordValidation) {
      setEmailError(emailValidation);
      setPasswordError(passwordValidation);
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        redirectToDashboard(result.user.designation);
      } else {
        // Check if user needs to register
        if (result.redirectTo === 'register') {
          navigate('/register', { state: { email } });
        } else {
          setError(result.message || 'Invalid credentials');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        padding: '1rem',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <style>{`
        @media (min-width: 576px) {
          .login-container-wrapper { padding: 1.5rem !important; }
        }
        @media (min-width: 768px) {
          .login-container-wrapper { padding: 2rem !important; }
        }
        
        .login-card {
          position: relative;
          z-index: 10;
        }
        
        .gradient-text {
          color: var(--theme-color);
        }
        
        /* Remove autofill background */
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
      
      {/* Floating Background Shapes - Using Framer Motion */}
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -30, 30, 0],
          rotate: [0, 120, 240, 360]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          top: '-200px',
          left: '-200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none'
        }}
      />
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -30, 30, 0],
          rotate: [0, 120, 240, 360]
        }}
        transition={{
          duration: 25,
          delay: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          bottom: '-150px',
          right: '-150px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none'
        }}
      />
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -30, 30, 0],
          rotate: [0, 120, 240, 360]
        }}
        transition={{
          duration: 25,
          delay: 16,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          width: '250px',
          height: '250px',
          top: '40%',
          right: '10%',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none'
        }}
      />
      <Container as={motion.div} variants={staggerChildren} className="login-card">
        <Row className="justify-content-center">
          <Col xs={12} sm={11} md={9} lg={7} xl={6} xxl={5}>
            <motion.div
              variants={heroReveal}
              className="p-4 p-sm-5"
              style={{
                background: 'white',
                borderRadius: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <motion.div variants={staggerChildren} className="text-center mb-4 mb-sm-5">
                <motion.div
                  variants={scaleIn}
                  className="d-flex align-items-center justify-content-center mx-auto mb-2 position-relative"
                  style={{
                    width: 'clamp(140px, 28vw, 180px)',
                    height: 'clamp(140px, 28vw, 180px)',
                    background: 'transparent',
                    borderRadius: '50%',
                    padding: '0',
                    cursor: 'pointer'
                  }}
                  whileHover={{ 
                    scale: 1.15,
                    transition: { duration: 0.3, ease: "easeInOut" }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLogoPreview(true)}
                  title="Click to preview logo"
                >
                  <img 
                    src={getThemeLogo()} 
                    alt="Schedule Hub Logo" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </motion.div>
                <motion.h2
                  variants={fadeInUp}
                  className="mb-2 gradient-text"
                  style={{
                    fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                    fontWeight: '600',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Schedule Hub
                </motion.h2>
                <motion.p
                  variants={fadeInUp}
                  className="mb-0"
                  style={{
                    fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
                    color: '#1a1a1a',
                    fontWeight: '600'
                  }}
                >
                  Sign in to your account
                </motion.p>
                <motion.p
                  variants={fadeInUp}
                  className="mb-0 mt-1"
                  style={{
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#6b7280',
                    fontWeight: '400'
                  }}
                >
                  Or{' '}
                  <a
                    href="/register"
                    style={{
                      color: 'var(--theme-color)',
                      textDecoration: 'none',
                      fontWeight: '600'
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    register here
                  </a>
                </motion.p>
              </motion.div>

              {error && (
                <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError('')}
                    className="mb-3 mb-sm-4"
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {!showManualLogin ? (
                  <motion.div
                    key="oauth"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <MotionButton
                      variant="outline-secondary"
                      className="w-100 d-flex align-items-center justify-content-center shadow-sm position-relative overflow-hidden mb-3 mb-sm-4"
                      onClick={() => setShowManualLogin(true)}
                      style={{
                        padding: 'clamp(0.875rem, 3vw, 1.125rem)',
                        fontSize: 'clamp(0.9375rem, 2.5vw, 1.0625rem)',
                        fontWeight: '600',
                        background: 'var(--theme-color)',
                        border: '2px solid var(--theme-color)',
                        borderRadius: '1rem',
                        color: 'white',
                        gap: 'clamp(0.5rem, 2vw, 0.75rem)',
                        transition: 'all 0.3s ease'
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        background: 'white',
                        color: 'var(--theme-color)',
                        borderColor: '#d1d5db'
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>Sign in with Email</span>
                    </MotionButton>

                    <div
                      className="d-flex align-items-center my-3 my-sm-4 position-relative"
                      style={{ gap: 'clamp(0.75rem, 3vw, 1rem)' }}
                    >
                      <div 
                        style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)' }}
                      />
                      <span 
                        style={{ 
                          color: '#9ca3af', 
                          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', 
                          fontWeight: '600',
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(243, 244, 246, 0.8)',
                          borderRadius: '1rem'
                        }}
                      >
                        OR
                      </span>
                      <div 
                        style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)' }}
                      />
                    </div>

                    <MotionButton
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-100 d-flex align-items-center justify-content-center"
                      style={{
                        padding: 'clamp(0.875rem, 3vw, 1.125rem)',
                        fontSize: 'clamp(0.9375rem, 2.5vw, 1.0625rem)',
                        fontWeight: '600',
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
                      <svg width="22" height="22" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Continue with Google</span>
                    </MotionButton>
                  </motion.div>
                ) : (
                  <motion.div
                    key="manual"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Form
                      onSubmit={handleManualSubmit}
                      as={motion.form}
                      variants={staggerChildren}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.div variants={fadeInUp}>
                        <Form.Group className="mb-3 mb-sm-4 position-relative">
                          <motion.label
                            htmlFor="email-input"
                            initial={false}
                            animate={{
                              top: (email || emailError) ? '-0.5rem' : '50%',
                              fontSize: (email || emailError) ? 'clamp(0.75rem, 1.8vw, 0.8125rem)' : 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                              color: emailError ? '#ef4444' : (email ? 'var(--theme-color)' : '#9ca3af'),
                              y: (email || emailError) ? 0 : '-50%'
                            }}
                            transition={{ duration: 0.2 }}
                            style={{
                              position: 'absolute',
                              left: 'clamp(1rem, 3vw, 1.25rem)',
                              fontWeight: '600',
                              pointerEvents: 'none',
                              background: 'white',
                              padding: '0 0.5rem',
                              zIndex: 1
                            }}
                          >
                            Email Address
                          </motion.label>
                          <motion.div
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Form.Control
                              id="email-input"
                              type="text"
                              autoComplete="email"
                              placeholder=""
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) setEmailError('');
                              }}
                              style={{
                                padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                                fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                                border: emailError ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                borderRadius: '0.875rem',
                                transition: 'all 0.3s ease',
                                boxShadow: emailError ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                                WebkitBoxShadow: emailError ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = emailError ? '#ef4444' : 'var(--theme-color)';
                                e.currentTarget.style.boxShadow = emailError ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px var(--theme-color-light)';
                                const label = e.currentTarget.previousSibling;
                                if (label) {
                                  label.style.top = '-0.5rem';
                                  label.style.fontSize = 'clamp(0.75rem, 1.8vw, 0.8125rem)';
                                  label.style.color = emailError ? '#ef4444' : 'var(--theme-color)';
                                  label.style.transform = 'translateY(0)';
                                }
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = emailError ? '#ef4444' : '#e5e7eb';
                                e.currentTarget.style.boxShadow = emailError ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                                if (!email) {
                                  const label = e.currentTarget.previousSibling;
                                  if (label) {
                                    label.style.top = '50%';
                                    label.style.fontSize = 'clamp(0.875rem, 2.5vw, 0.9375rem)';
                                    label.style.color = emailError ? '#ef4444' : '#9ca3af';
                                    label.style.transform = 'translateY(-50%)';
                                  }
                                }
                              }}
                            />
                          </motion.div>
                          <AnimatePresence>
                            {emailError && (
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
                                {emailError}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Form.Group>
                      </motion.div>

                      <motion.div variants={fadeInUp}>
                        <Form.Group className="mb-3 mb-sm-4 position-relative">
                          <motion.label
                            htmlFor="password-input"
                            initial={false}
                            animate={{
                              top: (password || passwordError) ? '-0.5rem' : '50%',
                              fontSize: (password || passwordError) ? 'clamp(0.75rem, 1.8vw, 0.8125rem)' : 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                              color: passwordError ? '#ef4444' : (password ? 'var(--theme-color)' : '#9ca3af'),
                              y: (password || passwordError) ? 0 : '-50%'
                            }}
                            transition={{ duration: 0.2 }}
                            style={{
                              position: 'absolute',
                              left: 'clamp(1rem, 3vw, 1.25rem)',
                              fontWeight: '600',
                              pointerEvents: 'none',
                              background: 'white',
                              padding: '0 0.5rem',
                              zIndex: 1
                            }}
                          >
                            Password
                          </motion.label>
                          <motion.div
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Form.Control
                              id="password-input"
                              type="password"
                              autoComplete="current-password"
                              placeholder=""
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (passwordError) setPasswordError('');
                              }}
                              style={{
                                padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                                fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                                border: passwordError ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                borderRadius: '0.875rem',
                                transition: 'all 0.3s ease',
                                boxShadow: passwordError ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                                WebkitBoxShadow: passwordError ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = passwordError ? '#ef4444' : 'var(--theme-color)';
                                e.currentTarget.style.boxShadow = passwordError ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px var(--theme-color-light)';
                                const label = e.currentTarget.previousSibling;
                                if (label) {
                                  label.style.top = '-0.5rem';
                                  label.style.fontSize = 'clamp(0.75rem, 1.8vw, 0.8125rem)';
                                  label.style.color = passwordError ? '#ef4444' : 'var(--theme-color)';
                                  label.style.transform = 'translateY(0)';
                                }
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = passwordError ? '#ef4444' : '#e5e7eb';
                                e.currentTarget.style.boxShadow = passwordError ? '0 2px 8px rgba(239, 68, 68, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                                if (!password) {
                                  const label = e.currentTarget.previousSibling;
                                  if (label) {
                                    label.style.top = '50%';
                                    label.style.fontSize = 'clamp(0.875rem, 2.5vw, 0.9375rem)';
                                    label.style.color = passwordError ? '#ef4444' : '#9ca3af';
                                    label.style.transform = 'translateY(-50%)';
                                  }
                                }
                              }}
                            />
                          </motion.div>
                          <AnimatePresence>
                            {passwordError && (
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
                                {passwordError}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Form.Group>
                      </motion.div>

                      <MotionButton
                        type="submit"
                        disabled={loading}
                        className="w-100 position-relative overflow-hidden"
                        style={{
                          padding: 'clamp(0.875rem, 3vw, 1.125rem)',
                          fontSize: 'clamp(0.9375rem, 2.5vw, 1.0625rem)',
                          fontWeight: '600',
                          background: 'var(--theme-color)',
                          border: '2px solid var(--theme-color)',
                          borderRadius: '1rem',
                          color: 'white',
                          transition: 'all 0.3s ease'
                        }}
                        whileHover={{ 
                          scale: 1.02,
                          background: 'white',
                          color: 'var(--theme-color)',
                          borderColor: '#d1d5db'
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Signing In...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </MotionButton>
                    </Form>

                    <MotionButton
                      variant="link"
                      onClick={() => setShowManualLogin(false)}
                      className="w-100 mt-3"
                      style={{
                        color: 'var(--theme-color)',
                        textDecoration: 'none',
                        fontSize: 'clamp(0.8125rem, 2vw, 0.9375rem)',
                        fontWeight: '600',
                        padding: '0.5rem'
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        x: -4
                      }}
                    >
                      ← Back to Google Sign In
                    </MotionButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Col>
        </Row>
      </Container>

      {/* Logo Preview Modal */}
      <AnimatePresence>
        {showLogoPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoPreview(false)}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '3rem',
                width: '500px',
                height: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <button
                onClick={() => setShowLogoPreview(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'var(--theme-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                ×
              </button>
              <img 
                src={getThemeLogo()} 
                alt="Schedule Hub Logo Preview" 
                style={{
                  maxWidth: '400px',
                  maxHeight: '400px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Login;
