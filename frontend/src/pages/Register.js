import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert } from 'react-bootstrap';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [formData, setFormData] = useState({
    // Step 1: Admin/User Information
    userName: '',
    email: '',
    phoneNumber: '+92',
    country: 'PK',
    cnic: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Institute Information
    instituteLogo: null,
    instituteLogoPreview: '',
    instituteID: '',
    instituteName: '',
    address: '',
    contactNumber: '+92',
    instituteType: '',
    
    // Step 3: Terms and Conditions
    termsAccepted: false,
    privacyAccepted: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  // Get user info from Google OAuth if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleEmail = params.get('email');
    const googleName = params.get('name');
    
    if (googleEmail) {
      setFormData(prev => ({
        ...prev,
        email: googleEmail,
        userName: googleName || ''
      }));
    }
  }, [location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setFormData(prev => ({
        ...prev,
        // Store as base64 data URL string so backend saves binary
        instituteLogo: typeof dataUrl === 'string' ? dataUrl : '',
        instituteLogoPreview: typeof dataUrl === 'string' ? dataUrl : ''
      }));
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read image. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handlePhoneChange = (value) => {
    // Remove any non-digit characters except the + sign at the start
    if (value) {
      const cleaned = value.replace(/[^\d+]/g, '');
      setFormData(prev => ({
        ...prev,
        phoneNumber: cleaned
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        phoneNumber: ''
      }));
    }
    setError('');
  };

  const handleContactNumberChange = (value) => {
    // Remove any non-digit characters except the + sign at the start
    if (value) {
      const cleaned = value.replace(/[^\d+]/g, '');
      setFormData(prev => ({
        ...prev,
        contactNumber: cleaned
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        contactNumber: ''
      }));
    }
    setError('');
  };

  // Removed unused working days checkbox handler

  const handleTermsChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getCNICLabel = (country) => {
    const cnicLabels = {
      'PK': 'CNIC (13 digits)',
      'US': 'SSN (9 digits)',
      'GB': 'National Insurance Number',
      'IN': 'Aadhaar Number (12 digits)',
      'AE': 'Emirates ID',
      'SA': 'National ID (10 digits)',
      'default': 'National ID'
    };
    return cnicLabels[country] || cnicLabels.default;
  };

  const getCNICMaxLength = (country) => {
    const maxLengths = {
      'PK': 13,
      'US': 9,
      'IN': 12,
      'GB': 9,
      'AE': 18, // Format: 784-1234-1234567-1
      'SA': 10
    };
    return maxLengths[country] || 20;
  };

  const getCNICPattern = (country) => {
    const patterns = {
      'PK': '[0-9]{13}',
      'US': '[0-9]{9}',
      'IN': '[0-9]{12}',
      'GB': '[A-Za-z]{2}[0-9]{6}[A-Za-z]',
      'AE': '[0-9-]{18}',
      'SA': '[0-9]{10}'
    };
    return patterns[country] || '';
  };

  const handleCNICInput = (e) => {
    const { value } = e.target;
    const country = formData.country;
    
    // For numeric-only countries, remove non-numeric characters
    if (['PK', 'US', 'IN', 'SA'].includes(country)) {
      const numericValue = value.replace(/[^0-9]/g, '');
      const maxLength = getCNICMaxLength(country);
      
      setFormData(prev => ({
        ...prev,
        cnic: numericValue.slice(0, maxLength)
      }));
    } else if (country === 'GB') {
      // For UK, allow letters and numbers
      const gbValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      setFormData(prev => ({
        ...prev,
        cnic: gbValue.slice(0, 9)
      }));
    } else if (country === 'AE') {
      // For UAE, allow numbers and dashes
      const aeValue = value.replace(/[^0-9-]/g, '');
      setFormData(prev => ({
        ...prev,
        cnic: aeValue.slice(0, 18)
      }));
    } else {
      // For other countries, limit to 20 characters
      setFormData(prev => ({
        ...prev,
        cnic: value.slice(0, 20)
      }));
    }
    setError('');
  };

  const validateCNIC = (cnic, country) => {
    const validations = {
      'PK': /^\d{13}$/,
      'US': /^\d{9}$/,
      'IN': /^\d{12}$/,
      'GB': /^[A-Z]{2}\d{6}[A-Z]$/i,
      'AE': /^\d{3}-?\d{4}-?\d{7}-?\d$/,
      'SA': /^\d{10}$/
    };
    
    const pattern = validations[country];
    if (pattern) {
      return pattern.test(cnic.replace(/[-\s]/g, ''));
    }
    return cnic.length >= 5; // Generic validation
  };

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

  useEffect(() => {
    if (formData.phoneNumber) {
      const country = getCountryFromPhone(formData.phoneNumber);
      setFormData(prev => ({
        ...prev,
        country
      }));
    }
  }, [formData.phoneNumber]);

  const validateStep = (step) => {
    switch(step) {
      case 0:
        if (!formData.userName || !formData.email) {
          setError('Please fill in name and email');
          return false;
        }
        if (!formData.phoneNumber) {
          setError('Please enter phone number');
          return false;
        }
        if (!formData.cnic) {
          setError('Please enter ' + getCNICLabel(formData.country));
          return false;
        }
        if (!validateCNIC(formData.cnic, formData.country)) {
          setError('Invalid ' + getCNICLabel(formData.country) + ' format');
          return false;
        }
        if (!formData.password || formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        break;
      case 1:
        if (!formData.instituteID || !formData.instituteName || !formData.address || !formData.contactNumber) {
          setError('Please fill in all institute information');
          return false;
        }
        // Require logo upload
        if (!formData.instituteLogo) {
          setError('Please upload your institute logo');
          return false;
        }
        if (!formData.instituteType) {
          setError('Please select institute type');
          return false;
        }
        break;
      case 2:
        if (!formData.termsAccepted) {
          setError('Please accept the Terms and Conditions');
          return false;
        }
        if (!formData.privacyAccepted) {
          setError('Please accept the Privacy Policy');
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    try {
      // Prepare data, converting null instituteLogo to empty string
      const submitData = {
        ...formData,
        instituteLogo: formData.instituteLogo || ''
      };
      
      // Submit registration data to backend
      const response = await fetch('http://localhost:5000/api/auth/register-institute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        // Set token and minimal user context so PrivateRoute allows access immediately
        const userPayload = {
          designation: 'Admin',
          userName: formData.userName,
          email: formData.email
        };
        loginWithToken(data.token, userPayload);
        navigate('/admin');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/login');
  };

  const renderStepIndicator = () => {
    const steps = ['Admin Info', 'Institute Info', 'Terms & Conditions'];
    return (
      <div className="step-indicator">
        {steps.map((step, index) => (
          <div key={index} className={`step-item ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}>
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="form-step">
            <h3 className="step-title">Admin Information</h3>
            
            <Form.Group className="mb-3">
              <Form.Label className="form-label">Full Name</Form.Label>
              <Form.Control
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="futuristic-input"
                readOnly={!!formData.userName && location.search.includes('email')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="futuristic-input"
                readOnly={!!formData.email && location.search.includes('email')}
              />
              {formData.email && location.search.includes('email') && (
                <Form.Text className="text-light-muted">
                  <small>✓ Retrieved from Google</small>
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Phone Number</Form.Label>
              <PhoneInput
                international
                defaultCountry="PK"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                className="phone-input-custom"
                placeholder="Enter phone number"
                smartCaret={true}
                countryCallingCodeEditable={false}
                limitMaxLength={true}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">{getCNICLabel(formData.country)}</Form.Label>
              <Form.Control
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleCNICInput}
                placeholder={`Enter your ${getCNICLabel(formData.country)}`}
                className="futuristic-input"
                maxLength={getCNICMaxLength(formData.country)}
                pattern={getCNICPattern(formData.country)}
              />
              <Form.Text className="text-light-muted">
                <small>Selected country: {formData.country} | Max {getCNICMaxLength(formData.country)} characters</small>
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password (min 6 characters)"
                className="futuristic-input"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="futuristic-input"
              />
            </Form.Group>
          </div>
        );

      case 1:
        return (
          <div className="form-step">
            <h3 className="step-title">Institute Information</h3>
            
            {/* Logo Upload */}
            <div className="logo-upload-section mb-4">
              <Form.Label className="form-label text-center d-block">Institute Logo</Form.Label>
              <div className="logo-preview-container">
                <label htmlFor="logo-upload" className="logo-upload-label">
                  {formData.instituteLogoPreview ? (
                    <img src={formData.instituteLogoPreview} alt="Institute Logo" className="logo-preview-image" />
                  ) : (
                    <div className="logo-placeholder">
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                      <p>Click to upload logo</p>
                    </div>
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="logo-input-hidden"
                />
              </div>
              <Form.Text className="text-light-muted text-center d-block">
                <small>Upload institute logo (Max 5MB, PNG, JPG, JPEG)</small>
              </Form.Text>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Institute ID</Form.Label>
              <Form.Control
                type="text"
                name="instituteID"
                value={formData.instituteID}
                onChange={handleInputChange}
                placeholder="Enter institute ID"
                className="futuristic-input"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Institute Name</Form.Label>
              <Form.Control
                type="text"
                name="instituteName"
                value={formData.instituteName}
                onChange={handleInputChange}
                placeholder="Enter institute name"
                className="futuristic-input"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Institute Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter institute address"
                className="futuristic-input"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Institute Contact Number</Form.Label>
              <PhoneInput
                international
                defaultCountry="PK"
                value={formData.contactNumber}
                onChange={handleContactNumberChange}
                className="phone-input-custom"
                placeholder="Enter institute contact number"
                smartCaret={true}
                countryCallingCodeEditable={false}
                limitMaxLength={true}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">Institute Type</Form.Label>
              <div className="institute-type-options">
                {['School', 'College', 'University'].map(type => (
                  <div key={type} className="type-option">
                    <Form.Check
                      type="radio"
                      id={`type-${type}`}
                      name="instituteType"
                      value={type}
                      label={type}
                      checked={formData.instituteType === type}
                      onChange={handleInputChange}
                      className="custom-radio"
                    />
                  </div>
                ))}
              </div>
            </Form.Group>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <h3 className="step-title">Complete Your Registration</h3>
            <p className="step-subtitle">
              Start your 7-day free trial today! No credit card required.
            </p>

            {/* Terms and Conditions */}
            <div className="terms-section">
              <div className="terms-item">
                <Form.Check
                  type="checkbox"
                  id="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={() => handleTermsChange('termsAccepted')}
                  className="custom-checkbox-terms"
                  label={
                    <span className="terms-label">
                      I agree to the <button type="button" className="terms-link btn btn-link p-0" onClick={(e) => e.preventDefault()}>Terms and Conditions</button>
                    </span>
                  }
                />
              </div>
              <div className="terms-item">
                <Form.Check
                  type="checkbox"
                  id="privacyAccepted"
                  checked={formData.privacyAccepted}
                  onChange={() => handleTermsChange('privacyAccepted')}
                  className="custom-checkbox-terms"
                  label={
                    <span className="terms-label">
                      I agree to the <button type="button" className="terms-link btn btn-link p-0" onClick={(e) => e.preventDefault()}>Privacy Policy</button>
                    </span>
                  }
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show welcome screen when currentStep is -1 (initial state changed to 0)
  if (currentStep === -1) {
    return (
      <div className="register-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
          <div className="floating-shape shape-4"></div>
        </div>

        <Container className="register-container">
          <Row className="justify-content-center align-items-center min-vh-100">
            <Col xs={12} md={6} lg={5} xl={4}>
              <div className="register-card glass-effect">
                <div className="welcome-header">
                  <h1 className="welcome-title">Welcome To Smart Scheduler</h1>
                </div>

                <div className="subtitle-box">
                  <p className="subtitle-text">
                    Subtitle to describe<br />
                    our service
                  </p>
                </div>

                <div className="register-message">
                  <p className="message-text">
                    Click here to register your<br />
                    institute
                  </p>
                </div>

                <Button 
                  variant="primary"
                  className="register-button w-100 mb-3"
                  onClick={() => setCurrentStep(0)}
                >
                  Register Institute
                </Button>

                <Button 
                  variant="outline-light" 
                  className="skip-button w-100"
                  onClick={handleSkip}
                >
                  Skip for landing
                </Button>

                <div className="card-glow"></div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="bg-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>

      <Container className="register-container">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} md={8} lg={7} xl={6}>
            <div className="register-form-card glass-effect">
              <h2 className="form-main-title">Register Your Institute</h2>
              
              {renderStepIndicator()}

              {error && (
                <Alert variant="danger" className="error-alert mt-3" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <div className="form-content">
                {renderStep()}
              </div>

              <div className="form-navigation">
                {currentStep > 0 && (
                  <Button 
                    variant="outline-light" 
                    className="nav-button prev-button"
                    onClick={handlePrevious}
                  >
                    ← Previous
                  </Button>
                )}

                {currentStep < 2 ? (
                  <Button 
                    variant="primary" 
                    className="nav-button next-button"
                    onClick={handleNext}
                  >
                    Next →
                  </Button>
                ) : (
                  <Button 
                    variant="success" 
                    className="nav-button submit-button"
                    onClick={handleSubmit}
                    disabled={loading || !formData.termsAccepted || !formData.privacyAccepted}
                  >
                    {loading ? 'Submitting...' : 'Register'}
                  </Button>
                )}
              </div>

              <Button 
                variant="link" 
                className="back-to-login mt-3"
                onClick={handleSkip}
              >
                Already have an account? Login
              </Button>

              <div className="card-glow"></div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
