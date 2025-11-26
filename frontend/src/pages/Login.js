import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, setUser } = useAuth();

  useEffect(() => {
    // Handle Google OAuth callback
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const designation = params.get('designation');

    if (token && designation) {
      localStorage.setItem('token', token);
      setUser({ designation });
      redirectToDashboard(designation);
    }

    // Redirect if already logged in
    if (user) {
      redirectToDashboard(user.designation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location]);

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
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="bg-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>

      <Container className="login-container">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} md={6} lg={5} xl={4}>
            <div className="login-card glass-effect">
              {/* Logo/Icon */}
              <div className="login-icon-wrapper">
                <div className="login-icon">
                  <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="url(#gradient)" strokeWidth="4"/>
                    <path d="M50 25V50L65 65" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="50" cy="50" r="6" fill="url(#gradient)"/>
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="100" y2="100">
                        <stop offset="0%" stopColor="#7e22ce"/>
                        <stop offset="100%" stopColor="#3b82f6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <h2 className="login-title">Welcome Back</h2>
              <p className="login-subtitle">Access your Smart Scheduler account</p>

              {error && (
                <Alert variant="danger" className="error-alert" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {!showManualLogin ? (
                <>
                  {/* Google Sign In Button */}
                  <Button 
                    onClick={handleGoogleLogin}
                    className="google-signin-button w-100 mb-4"
                    disabled={loading}
                  >
                    <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>

                  {/* Divider */}
                  <div className="divider-wrapper">
                    <div className="divider-line"></div>
                    <span className="divider-text">OR</span>
                    <div className="divider-line"></div>
                  </div>

                  {/* Manual Login Toggle */}
                  <Button 
                    variant="outline-light" 
                    className="manual-login-toggle w-100 mt-3"
                    onClick={() => setShowManualLogin(true)}
                  >
                    <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Sign in with Email
                  </Button>
                </>
              ) : (
                <>
                  {/* Manual Login Form */}
                  <Form onSubmit={handleManualSubmit} className="login-form">
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">Email Address</Form.Label>
                      <div className="input-wrapper">
                        <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <Form.Control
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="futuristic-input"
                          required
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">Password</Form.Label>
                      <div className="input-wrapper">
                        <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <Form.Control
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="futuristic-input"
                          required
                        />
                      </div>
                    </Form.Group>

                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="login-button btn-futuristic w-100"
                      disabled={loading}
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
                    className="back-button mt-3 w-100"
                    onClick={() => setShowManualLogin(false)}
                  >
                    ← Back to Google Sign In
                  </Button>
                </>
              )}

              {/* Decorative Elements */}
              <div className="card-glow"></div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
