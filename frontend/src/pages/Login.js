import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fadeIn,
  fadeInUp,
  heroReveal,
  staggerChildren,
  scaleIn
} from '../components/shared/animation_variants';
import { useAuth } from '../context/AuthContext';

const MotionButton = motion(Button);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loginWithToken, loading: authLoading } = useAuth();

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
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

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
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
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
          background: linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
              animate={{
                boxShadow: [
                  '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 20px rgba(126, 34, 206, 0.3)',
                  '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(126, 34, 206, 0.6), 0 0 60px rgba(59, 130, 246, 0.4)',
                  '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 20px rgba(126, 34, 206, 0.3)'
                ]
              }}
              transition={{
                boxShadow: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <motion.div variants={staggerChildren} className="text-center mb-4 mb-sm-5">
                <motion.div
                  variants={scaleIn}
                  className="d-flex align-items-center justify-content-center mx-auto mb-3 mb-sm-4 position-relative"
                  style={{
                    width: 'clamp(80px, 20vw, 100px)',
                    height: 'clamp(80px, 20vw, 100px)',
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    borderRadius: '50%',
                    boxShadow: '0 10px 40px rgba(126, 34, 206, 0.5), 0 0 0 8px rgba(126, 34, 206, 0.1)'
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 360,
                    transition: { duration: 0.6, ease: "easeInOut" }
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', border: '2px dashed rgba(126, 34, 206, 0.3)' }}
                  />
                  <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '50%', height: '50%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    <motion.circle 
                      cx="50" 
                      cy="50" 
                      r="35" 
                      stroke="white" 
                      strokeWidth="4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    <motion.path 
                      d="M50 25V50L65 65" 
                      stroke="white" 
                      strokeWidth="5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                    />
                    <circle cx="50" cy="50" r="5" fill="white" />
                  </svg>
                </motion.div>
                <motion.h2
                  variants={fadeInUp}
                  className="mb-2 gradient-text"
                  style={{
                    fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                    fontWeight: '800',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Welcome Back
                </motion.h2>
                <motion.p
                  variants={fadeInUp}
                  className="mb-0"
                  style={{
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}
                >
                  Access your Smart Scheduler account
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
                    variants={staggerChildren}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <MotionButton
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-100 d-flex align-items-center justify-content-center mb-3 mb-sm-4 position-relative overflow-hidden"
                      style={{
                        padding: 'clamp(0.875rem, 3vw, 1.125rem)',
                        fontSize: 'clamp(0.9375rem, 2.5vw, 1.0625rem)',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                        border: 'none',
                        borderRadius: '1rem',
                        color: 'white',
                        gap: 'clamp(0.5rem, 2vw, 0.75rem)',
                        boxShadow: '0 8px 24px rgba(126, 34, 206, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                        position: 'relative',
                        zIndex: 1
                      }}
                      variants={{
                        rest: { scale: 1 },
                        hover: { 
                          scale: 1.02,
                          boxShadow: '0 12px 32px rgba(126, 34, 206, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                          transition: { duration: 0.2 }
                        },
                        tap: { 
                          scale: 0.98,
                          transition: { duration: 0.1 }
                        }
                      }}
                      initial="rest"
                      animate="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <motion.div
                        animate={{
                          backgroundPosition: ['-200% 0', '200% 0']
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ 
                          zIndex: -1, 
                          borderRadius: '1rem',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          backgroundSize: '200% 100%'
                        }}
                      />
                      <svg width="22" height="22" viewBox="0 0 24 24">
                        <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Continue with Google</span>
                    </MotionButton>

                    <motion.div
                      variants={fadeInUp}
                      className="d-flex align-items-center my-3 my-sm-4 position-relative"
                      style={{ gap: 'clamp(0.75rem, 3vw, 1rem)' }}
                    >
                      <motion.div 
                        style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)' }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                      <motion.span 
                        style={{ 
                          color: '#9ca3af', 
                          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', 
                          fontWeight: '600',
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(243, 244, 246, 0.8)',
                          borderRadius: '1rem'
                        }}
                        whileHover={{ scale: 1.1 }}
                      >
                        OR
                      </motion.span>
                      <motion.div 
                        style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)' }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </motion.div>

                    <MotionButton
                      variant="outline-secondary"
                      className="w-100 d-flex align-items-center justify-content-center shadow-sm position-relative overflow-hidden"
                      onClick={() => setShowManualLogin(true)}
                      style={{
                        padding: 'clamp(0.875rem, 3vw, 1.125rem)',
                        fontSize: 'clamp(0.9375rem, 2.5vw, 1.0625rem)',
                        fontWeight: '600',
                        background: 'white',
                        border: '2px solid transparent',
                        borderRadius: '1rem',
                        color: '#1a1a1a',
                        gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #7e22ce, #3b82f6)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                      }}
                      variants={{
                        rest: { scale: 1 },
                        hover: { 
                          scale: 1.02,
                          boxShadow: '0 8px 24px rgba(126, 34, 206, 0.2)',
                          transition: { duration: 0.2 }
                        },
                        tap: { 
                          scale: 0.98,
                          transition: { duration: 0.1 }
                        }
                      }}
                      initial="rest"
                      animate="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span className="gradient-text">Sign in with Email</span>
                    </MotionButton>
                  </motion.div>
                ) : (
                  <motion.div
                    key="manual"
                    variants={staggerChildren}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <Form
                      onSubmit={handleManualSubmit}
                      as={motion.form}
                      variants={staggerChildren}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.div variants={fadeInUp}>
                        <Form.Group className="mb-3 mb-sm-4">
                          <Form.Label className="mb-2" style={{
                            fontSize: 'clamp(0.8125rem, 2vw, 0.9375rem)',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Email Address
                          </Form.Label>
                          <motion.div
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Form.Control
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              style={{
                                padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                                fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                                border: '2px solid #e5e7eb',
                                borderRadius: '0.875rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#7e22ce';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(126, 34, 206, 0.15)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                              }}
                            />
                          </motion.div>
                        </Form.Group>
                      </motion.div>

                      <motion.div variants={fadeInUp}>
                        <Form.Group className="mb-3 mb-sm-4">
                          <Form.Label className="mb-2" style={{
                            fontSize: 'clamp(0.8125rem, 2vw, 0.9375rem)',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Password
                          </Form.Label>
                          <motion.div
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Form.Control
                              type="password"
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              style={{
                                padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                                fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                                border: '2px solid #e5e7eb',
                                borderRadius: '0.875rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#7e22ce';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(126, 34, 206, 0.15)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                              }}
                            />
                          </motion.div>
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
                          background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                          border: 'none',
                          borderRadius: '1rem',
                          color: 'white',
                          boxShadow: '0 8px 24px rgba(126, 34, 206, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                        }}
                        variants={{
                          rest: { scale: 1 },
                          hover: { 
                            scale: 1.02,
                            boxShadow: '0 12px 32px rgba(126, 34, 206, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                            transition: { duration: 0.2 }
                          },
                          tap: { 
                            scale: 0.98,
                            transition: { duration: 0.1 }
                          }
                        }}
                        initial="rest"
                        animate="rest"
                        whileHover="hover"
                        whileTap="tap"
                      >
                          <motion.div
                            animate={{
                              backgroundPosition: ['-200% 0', '200% 0']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{ 
                              zIndex: -1, 
                              borderRadius: '1rem',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                              backgroundSize: '200% 100%'
                            }}
                          />
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
                        color: '#7e22ce',
                        textDecoration: 'none',
                        fontSize: 'clamp(0.8125rem, 2vw, 0.9375rem)',
                        fontWeight: '600',
                        padding: '0.5rem'
                      }}
                      variants={{
                        rest: { scale: 1, x: 0 },
                        hover: { 
                          scale: 1.02,
                          x: -4,
                          transition: { duration: 0.2 }
                        }
                      }}
                      initial="rest"
                      animate="rest"
                      whileHover="hover"
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
    </motion.div>
  );
};

export default Login;
