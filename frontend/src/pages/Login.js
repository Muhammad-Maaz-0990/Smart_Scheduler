import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
// import './Login.css';

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
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Poppins, sans-serif'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <div style={{
              background: '#ffffff',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '48px 40px',
              boxShadow: '0 10px 24px rgba(124, 58, 237, 0.15)',
              border: '1px solid #e5e7eb'
            }}>
              {/* Logo/Icon */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto 24px',
                  background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(126, 34, 206, 0.3)'
                }}>
                  <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="4"/>
                    <path d="M50 25V50L65 65" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="50" cy="50" r="5" fill="white"/>
                  </svg>
                </div>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Welcome Back</h2>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  marginBottom: '0'
                }}>Access your Smart Scheduler account</p>
              </div>

              {error && (
                <Alert 
                  variant="danger" 
                  dismissible 
                  onClose={() => setError('')}
                  style={{ marginBottom: '24px' }}
                >
                  {error}
                </Alert>
              )}

              {!showManualLogin ? (
                <>
                  {/* Google Sign In Button */}
                  <Button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '16px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      transition: 'all 0.3s ease',
                      marginBottom: '24px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)'}
                    // onMouseOut={(e) => e.currentTarget.style.background = '#1a73e8'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>

                  {/* Divider */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '24px 0',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                    <span style={{ color: '#9ca3af', fontSize: '14px', fontWeight: '500' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                  </div>

                  {/* Manual Login Toggle */}
                  <Button 
                    variant="outline-secondary"
                    className='shadow-sm'
                    onClick={() => setShowManualLogin(true)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '16px',
                      fontWeight: '600',
                      background: 'transparent',
                      border: '2px solid linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                      borderRadius: '12px',
                      color: '#1a1a1bff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)';
                      // e.currentTarget.style.borderColor = '#9ca3af';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.color = '#1a1a1a';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Sign in with Email
                  </Button>
                </>
              ) : (
                <>
                  {/* Manual Login Form */}
                  <Form onSubmit={handleManualSubmit}>
                    <Form.Group className="mb-4">
                      <Form.Label style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                          padding: '14px 16px',
                          fontSize: '15px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#7e22ce'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                          padding: '14px 16px',
                          fontSize: '15px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#7e22ce'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      />
                    </Form.Group>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '16px',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(126, 34, 206, 0.3)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Signing In...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </Form>

                  {/* Back to Google Login */}
                  <Button 
                    variant="link" 
                    onClick={() => setShowManualLogin(false)}
                    style={{
                      width: '100%',
                      marginTop: '16px',
                      color: '#7e22ce',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ← Back to Google Sign In
                  </Button>
                </>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
