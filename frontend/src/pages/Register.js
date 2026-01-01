import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../utils/api';
import PhoneInput from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en.json';
import 'react-phone-number-input/style.css';
import {
  slideInFromLeft,
  slideInFromRight,
  slideInFromBottom,
  fadeInUp,
  rotateIn,
  blurIn,
  popInSpring,
  staggerChildren
} from '../components/shared/animation_variants';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const MotionButton = motion.create(Button);
const MotionDiv = motion.div;

// Country names mapping
const countryNames = {
  'PK': 'Pakistan',
  'US': 'United States',
  'GB': 'United Kingdom',
  'IN': 'India',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia'
};

const Register = () => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [selectedCountry, setSelectedCountry] = useState('PK');
  const [selectedContactCountry, setSelectedContactCountry] = useState('PK');
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  const logoInputRef = useRef(null);
  const formCardRef = useRef(null);

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

  const getPhoneDigitLength = (phone) => {
    // Check for specific country codes (longer codes first to avoid partial match)
    if (phone.startsWith('+971')) return 9;  // UAE
    if (phone.startsWith('+966')) return 9;  // Saudi Arabia
    if (phone.startsWith('+92')) return 10;  // Pakistan
    if (phone.startsWith('+91')) return 10;  // India
    if (phone.startsWith('+44')) return 10;  // UK
    if (phone.startsWith('+1')) return 10;   // US/Canada
    return 10; // Default
  };

  const getCountryCodeLength = (phone) => {
    // Return length of country code for each country
    if (phone.startsWith('+971')) return 4;  // UAE
    if (phone.startsWith('+966')) return 4;  // Saudi Arabia
    if (phone.startsWith('+92')) return 3;   // Pakistan
    if (phone.startsWith('+91')) return 3;   // India
    if (phone.startsWith('+44')) return 3;   // UK
    if (phone.startsWith('+1')) return 2;    // US/Canada
    return 0;
  };

  const handlePhoneChange = (value) => {
    if (typeof value !== 'string') value = '';
    const cleaned = value.replace(/[^\d+]/g, '');
    setFormData(prev => ({
      ...prev,
      phoneNumber: cleaned
    }));
    setError('');
  };

  const handleContactNumberChange = (value) => {
    if (typeof value !== 'string') value = '';
    const cleaned = value.replace(/[^\d+]/g, '');
    setFormData(prev => ({
      ...prev,
      contactNumber: cleaned
    }));
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
      const prevCountry = formData.country;
      
      // Only reset CNIC if country actually changed
      if (prevCountry !== country) {
        setFormData(prev => ({
          ...prev,
          country,
          cnic: '' // Clear CNIC when country changes
        }));
      }
    }
  }, [formData.phoneNumber, formData.country]);

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
        // Validate phone number length
        const codeLen = getCountryCodeLength(formData.phoneNumber);
        if (codeLen > 0) {
          const digits = formData.phoneNumber.slice(codeLen);
          const requiredLength = getPhoneDigitLength(formData.phoneNumber);
          if (digits.length !== requiredLength) {
            const countryCode = formData.phoneNumber.slice(0, codeLen);
            setError(`Phone number must have exactly ${requiredLength} digits after ${countryCode}`);
            return false;
          }
        } else {
          setError('Invalid phone number format');
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
          // Scroll to logo upload section
          setTimeout(() => {
            const logoLabel = document.querySelector('.logo-upload-label');
            if (logoLabel) {
              logoLabel.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Add shake animation to draw attention
              logoLabel.style.animation = 'shake 0.5s';
              setTimeout(() => {
                logoLabel.style.animation = '';
              }, 500);
            }
          }, 100);
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
      // Force immediate scroll to top
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
    // Force immediate scroll to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
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
      const response = await fetch(apiUrl('/api/auth/register-institute'), {
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
      <motion.div 
        className="step-indicator"
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step, index) => (
          <motion.div 
            key={index} 
            className={`step-item ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            variants={slideInFromBottom}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step}</div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderStep = () => {
    switch(currentStep) {
      case 0:
        return (
          <motion.div 
            className="form-step"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            <motion.h3 className="step-title" variants={slideInFromLeft}>Admin Information</motion.h3>
            
            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
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
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
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
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
                <Form.Label className="form-label">Phone Number</Form.Label>
                <div className="phone-input-wrapper">
                  <PhoneInput
                    international
                    defaultCountry="PK"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    onCountryChange={(country) => {
                      setSelectedCountry(country);
                      setFormData(prev => ({ ...prev, country }));
                    }}
                    className="phone-input-custom"
                    placeholder="Enter phone number"
                    countryCallingCodeEditable={false}
                    limitMaxLength={true}
                    labels={en}
                  />
                  <span className="country-name-display">
                    {selectedCountry ? (en[selectedCountry] || countryNames[selectedCountry] || 'Select your country') : 'Select your country'}
                  </span>
                </div>
              </Form.Group>
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
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
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
                <Form.Label className="form-label">Password</Form.Label>
                <div className="password-input-wrapper">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password (min 6 characters)"
                    className="futuristic-input"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </Form.Group>
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
                <Form.Label className="form-label">Confirm Password</Form.Label>
                <div className="password-input-wrapper">
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="futuristic-input"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </Form.Group>
            </motion.div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div 
            className="form-step"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            <motion.h3 className="step-title" variants={slideInFromRight}>Institute Information</motion.h3>
            
            {/* Logo Upload */}
            <motion.div className="logo-upload-section mb-3" variants={rotateIn}>
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
                  ref={logoInputRef}
                />
              </div>
              <Form.Text className="text-light-muted text-center d-block">
                <small>Upload institute logo (Max 5MB, PNG, JPG, JPEG)</small>
              </Form.Text>
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
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
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
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
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
                <Form.Label className="form-label">Institute Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter institute address"
                  className="futuristic-input"
                />
              </Form.Group>
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
                <Form.Label className="form-label">Institute Contact Number</Form.Label>
                <div className="phone-input-wrapper">
                  <PhoneInput
                    international
                    defaultCountry="PK"
                    value={formData.contactNumber}
                    onChange={handleContactNumberChange}
                    onCountryChange={(country) => {
                      setSelectedContactCountry(country);
                    }}
                    className="phone-input-custom"
                    placeholder="Enter institute contact number"
                    countryCallingCodeEditable={false}
                    limitMaxLength={true}
                    labels={en}
                  />
                  <span className="country-name-display">
                    {selectedContactCountry ? (en[selectedContactCountry] || countryNames[selectedContactCountry] || 'Select your country') : 'Select your country'}
                  </span>
                </div>
              </Form.Group>
            </motion.div>

            <motion.div variants={slideInFromBottom}>
              <Form.Group className="mb-2">
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
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            className="form-step"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            <motion.h3 className="step-title" variants={fadeInUp}>Complete Your Registration</motion.h3>
            <motion.p className="step-subtitle" variants={fadeInUp}>
              Start your 7-day free trial today! No credit card required.
            </motion.p>

            {/* Terms and Conditions */}
            <motion.div className="terms-section" variants={slideInFromBottom}>
              <div className="terms-item">
                <Form.Check
                  type="checkbox"
                  id="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={() => handleTermsChange('termsAccepted')}
                  className="custom-checkbox-terms"
                  label={
                    <span className="terms-label">
                      I agree to the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="terms-link">Terms and Conditions</a>
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
                      I agree to the <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="terms-link">Privacy Policy</a>
                    </span>
                  }
                />
              </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Show welcome screen when currentStep is -1 (initial state changed to 0)
  if (currentStep === -1) {
    return (
      <MotionDiv
        className="register-page position-relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          minHeight: '100vh',
          background: '#f5f5f5',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        <style>{`
          @keyframes floatSlow {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(20px, -20px) rotate(180deg); }
          }
          .float-shape {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.05);
            animation: floatSlow 20s infinite ease-in-out;
            pointer-events: none;
          }
          .shape-a { width: 350px; height: 350px; top: -150px; right: -150px; animation-delay: 0s; }
          .shape-b { width: 280px; height: 280px; bottom: -100px; left: -100px; animation-delay: 10s; }
        `}</style>
        <div className="float-shape shape-a"></div>
        <div className="float-shape shape-b"></div>
        <Container className="register-container" as={motion.div} variants={staggerChildren}>
          <Row className="justify-content-center align-items-center min-vh-100">
            <Col xs={12} sm={11} md={8} lg={6} xl={5}>
              <MotionDiv
                className="register-card position-relative"
                variants={popInSpring}
                initial="hidden"
                animate="visible"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                  borderRadius: '2rem',
                  padding: 'clamp(1.5rem, 4vw, 2rem)'
                }}
              >
                <motion.div 
                  style={{ textAlign: 'center', marginBottom: 'clamp(1rem, 3vw, 1.5rem)' }}
                  variants={staggerChildren}
                  initial="hidden"
                  animate="visible"
                >
                  <MotionDiv 
                    variants={rotateIn}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    style={{
                      width: 'clamp(80px, 18vw, 100px)',
                      height: 'clamp(80px, 18vw, 100px)',
                      margin: '0 auto clamp(0.75rem, 2vw, 1rem)',
                      background: 'var(--theme-color)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 10px 40px rgba(105, 65, 219, 0.5), 0 0 0 8px rgba(105, 65, 219, 0.1)',
                      position: 'relative'
                    }}
                  >
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.3)' }}
                    />
                    <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '50%', height: '50%', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}>
                      <motion.circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        stroke="white" 
                        strokeWidth="4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                      />
                      <motion.path 
                        d="M50 25V50L65 65" 
                        stroke="white" 
                        strokeWidth="5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                      />
                      <circle cx="50" cy="50" r="5" fill="white"/>
                    </svg>
                  </MotionDiv>
                </motion.div>
                <motion.div 
                  className="welcome-header" 
                  style={{ marginBottom: 'clamp(0.5rem, 1.5vw, 1rem)', border: 'none', padding: '0'}}
                  variants={slideInFromBottom}
                >
                  <h1 className="welcome-title" style={{ 
                    color: 'var(--theme-color)',
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                    fontWeight: '800',
                    margin: 0,
                    letterSpacing: '-0.5px'
                  }}>Welcome To<br/>Smart Scheduler</h1>
                </motion.div>

                <motion.div 
                  className="subtitle-box" 
                  style={{ marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)', border: 'none'}}
                  variants={slideInFromBottom}
                >
                  <p className="subtitle-text" style={{ 
                    color: '#6b7280', 
                    margin: 0,
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    fontWeight: '500',
                    lineHeight: '1.5'
                  }}>
                    Create conflict‑free timetables for your Institute.
                  </p>
                </motion.div>

                <MotionButton
                  className="w-100 position-relative overflow-hidden"
                  onClick={() => setCurrentStep(0)}
                  style={{
                    background: 'var(--theme-color)',
                    border: '2px solid var(--theme-color)',
                    padding: 'clamp(0.875rem, 3vw, 1.125rem)',
                    fontWeight: 600,
                    fontSize: 'clamp(0.9375rem, 2.5vw, 1.0625rem)',
                    borderRadius: '1rem',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    marginBottom: 'clamp(0.75rem, 2vw, 1rem)'
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    background: 'white',
                    color: 'var(--theme-color)',
                    borderColor: '#d1d5db'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Register Institute
                </MotionButton>
              </MotionDiv>
            </Col>
          </Row>
        </Container>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv 
      className="register-page position-relative overflow-hidden" 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <style>{`
        @keyframes floatAlt {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-25px, 25px) rotate(-120deg); }
          66% { transform: translate(25px, -25px) rotate(120deg); }
        }
        .float-alt { animation: floatAlt 22s infinite ease-in-out; }
      `}</style>
      <div className="float-shape shape-a float-alt"></div>
      <div className="float-shape shape-b"></div>
      
      <Container className="register-container">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} sm={11} md={10} lg={8} xl={7}>
            <MotionDiv 
              ref={formCardRef}
              className="register-form-card position-relative"
              variants={blurIn}
              initial="hidden"
              animate="visible"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '2rem',
                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)'
              }}
            >
              <motion.h2 
                className="form-main-title"
                variants={slideInFromLeft}
                initial="hidden"
                animate="visible"
                style={{
                  color: 'var(--theme-color)',
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: '800',
                  textAlign: 'center',
                  marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
                }}
              >
                Register Your Institute
              </motion.h2>
              
              <motion.div
                variants={slideInFromRight}
                initial="hidden"
                animate="visible"
              >
                {renderStepIndicator()}
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert variant="danger" className="error-alert mt-3" dismissible onClose={() => setError('')}>
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentStep}
                  className="form-content"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              <motion.div 
                className="form-navigation d-flex gap-2 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentStep > 0 && (
                  <MotionButton 
                    variant="outline-secondary" 
                    className="nav-button prev-button"
                    onClick={handlePrevious}
                    style={{
                      flex: 1,
                      padding: 'clamp(0.625rem, 2vw, 0.875rem)',
                      borderRadius: '0.875rem',
                      fontWeight: '600',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                      border: '2px solid #e5e7eb'
                    }}
                    whileHover={{ scale: 1.02, borderColor: 'var(--theme-color)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ← Previous
                  </MotionButton>
                )}

                {currentStep < 2 ? (
                  <MotionButton 
                    className="nav-button next-button"
                    onClick={handleNext}
                    style={{
                      flex: 1,
                      background: 'var(--theme-color)',
                      border: '2px solid var(--theme-color)',
                      padding: 'clamp(0.625rem, 2vw, 0.875rem)',
                      borderRadius: '0.875rem',
                      fontWeight: '600',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
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
                    Next →
                  </MotionButton>
                ) : (
                  <MotionButton 
                    className="nav-button submit-button"
                    onClick={handleSubmit}
                    disabled={loading || !formData.termsAccepted || !formData.privacyAccepted}
                    style={{
                      flex: 1,
                      background: 'var(--theme-color)',
                      border: '2px solid var(--theme-color)',
                      padding: 'clamp(0.625rem, 2vw, 0.875rem)',
                      borderRadius: '0.875rem',
                      fontWeight: '600',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                      color: 'white',
                      transition: 'all 0.3s ease'
                    }}
                    whileHover={{ 
                      scale: loading ? 1 : 1.02,
                      background: loading ? 'var(--theme-color)' : 'white',
                      color: loading ? 'white' : 'var(--theme-color)',
                      borderColor: loading ? 'var(--theme-color)' : '#d1d5db'
                    }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? 'Submitting...' : 'Register'}
                  </MotionButton>
                )}
              </motion.div>

              <MotionButton 
                variant="link" 
                className="back-to-login mt-3 d-block text-center"
                onClick={handleSkip}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  color: 'var(--theme-color)',
                  fontWeight: '600',
                  fontSize: 'clamp(0.8125rem, 1.8vw, 0.9375rem)',
                  textDecoration: 'none'
                }}
                whileHover={{ scale: 1.02, x: -3 }}
              >
                Already have an account? Login
              </MotionButton>
            </MotionDiv>
          </Col>
        </Row>
      </Container>
    </MotionDiv>
  );
};

export default Register;
