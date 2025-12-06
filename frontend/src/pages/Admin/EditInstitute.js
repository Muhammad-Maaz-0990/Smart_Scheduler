import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaBuilding, FaMapMarkerAlt, FaPhone, FaImage, FaCheckCircle, FaSave } from 'react-icons/fa';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';

const MotionCard = motion(Card);
const MotionButton = motion(Button);

const EditInstitute = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    instituteName: '',
    address: '',
    contactNumber: '',
    instituteLogo: '' // data URL or URL string
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user?.instituteID) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await axios.get(`/api/auth/institute/${encodeURIComponent(user.instituteID)}`);
        const inst = res.data;
        setForm({
          instituteName: inst.instituteName || '',
          address: inst.address || '',
          contactNumber: inst.contactNumber || '',
          instituteLogo: inst.instituteLogo || ''
        });
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load institute');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, instituteLogo: reader.result })); // data URL
    };
    reader.readAsDataURL(file);
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

  const getAllowedLengths = (country) => {
    const rules = {
      PK: [10, 11],
      US: [10],
      GB: [10],
      IN: [10],
      AE: [9,10,11,12],
      SA: [9,10]
    };
    return rules[country] || [10];
  };

  const getCountryCodeDigits = (country) => {
    const codes = {
      PK: '92',
      US: '1',
      GB: '44',
      IN: '91',
      AE: '971',
      SA: '966'
    };
    return codes[country] || '92';
  };

  const handleContactNumberChange = (value) => {
    if (!value) {
      setForm((f) => ({ ...f, contactNumber: '' }));
      return;
    }
    // keep only + and digits
    let cleaned = value.replace(/[^\d+]/g, '');
    // ensure leading + exists
    if (!cleaned.startsWith('+')) cleaned = `+${cleaned.replace(/[^\d]/g,'')}`;
    // normalize to digits only after plus
    const digitsOnly = `+${cleaned.replace(/[^\d]/g, '')}`;
    const country = getCountryFromPhone(digitsOnly);
    const allowed = getAllowedLengths(country);
    const codeDigits = getCountryCodeDigits(country);
    // strip exact country code digits after plus
    const nationalDigits = digitsOnly.replace(`+${codeDigits}`, '');
    const maxLen = Math.max(...allowed);
    const trimmedNational = nationalDigits.slice(0, maxLen);
    const finalVal = `+${codeDigits}${trimmedNational}`;
    setForm((f) => ({ ...f, contactNumber: finalVal }));
  };

  const isValidNationalNumber = (phone) => {
    const country = getCountryFromPhone(String(phone || ''));
    const codeDigits = getCountryCodeDigits(country);
    const digits = String(phone || '')
      .replace(/[^\d]/g, '')
      .replace(new RegExp(`^${codeDigits}`), '');
    const allowed = getAllowedLengths(country);
    return allowed.includes(digits.length);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!user?.instituteID) return;
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = { ...form };
      // Validate contact number must include country code and correct local digits length
      if (!payload.contactNumber || !payload.contactNumber.startsWith('+') || !isValidNationalNumber(payload.contactNumber)) {
        const country = getCountryFromPhone(payload.contactNumber || '');
        const allowed = getAllowedLengths(country);
        const codeDigits = getCountryCodeDigits(country);
        const national = String(payload.contactNumber || '')
          .replace(/[^\d]/g, '')
          .replace(new RegExp(`^${codeDigits}`), '');
        const expected = allowed.join(' or ');
        setError(`Please select country and enter a valid local number after the country code. Expected ${expected} digits, got ${national.length}.`);
        setSaving(false);
        return;
      }
      const res = await axios.put(`/api/auth/institute/${encodeURIComponent(user.instituteID)}`, payload);
      if (res.data) {
        setSuccess('Institute updated successfully');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed');
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
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#7c3aed',
              marginBottom: '0.5rem'
            }}>
              Edit Institute
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              Update your institute information
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Spinner animation="border" style={{ color: '#7c3aed', width: '3rem', height: '3rem' }} />
            </div>
          ) : (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                maxWidth: '700px',
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
                  <FaBuilding style={{ fontSize: '1.5rem', color: 'white' }} />
                </div>
                <div>
                  <h5 style={{ color: 'white', margin: 0, fontWeight: '700' }}>Institute Details</h5>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, fontSize: '0.875rem' }}>
                    Manage your organization profile
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

                <Form onSubmit={save}>
                  {/* Logo Upload */}
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <label htmlFor="admin-edit-logo-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid #7c3aed',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        position: 'relative',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {form.instituteLogo ? (
                          <img src={form.instituteLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <FaImage style={{ fontSize: '2rem', color: '#9ca3af' }} />
                        )}
                      </div>
                    </label>
                    <input id="admin-edit-logo-upload" type="file" accept="image/*" onChange={onLogoFile} style={{ display: 'none' }} />
                    <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      Click to upload institute logo
                    </p>
                  </div>

                  <Form.Group className="mb-4">
                    <Form.Label style={{
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <FaBuilding style={{ marginRight: '0.5rem', color: '#7c3aed' }} />
                      Institute Name
                    </Form.Label>
                    <Form.Control
                      name="instituteName"
                      value={form.instituteName}
                      onChange={onChange}
                      required
                      style={{
                        borderRadius: '10px',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        fontSize: '0.875rem'
                      }}
                      className="gradient-border-input"
                      placeholder="Enter institute name"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label style={{
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <FaMapMarkerAlt style={{ marginRight: '0.5rem', color: '#7c3aed' }} />
                      Address
                    </Form.Label>
                    <Form.Control
                      name="address"
                      value={form.address}
                      onChange={onChange}
                      required
                      as="textarea"
                      rows={3}
                      style={{
                        borderRadius: '10px',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        fontSize: '0.875rem'
                      }}
                      className="gradient-border-input"
                      placeholder="Enter complete address"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label style={{
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <FaPhone style={{ marginRight: '0.5rem', color: '#7c3aed' }} />
                      Contact Number
                    </Form.Label>
                    <PhoneInput
                      international
                      defaultCountry="PK"
                      value={form.contactNumber}
                      onChange={handleContactNumberChange}
                      className="phone-input-custom"
                      placeholder="Enter institute contact number"
                      smartCaret={true}
                      countryCallingCodeEditable={false}
                      limitMaxLength={true}
                      style={{
                        borderRadius: '10px',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        fontSize: '0.875rem'
                      }}
                    />
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
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                    </MotionButton>
                  </div>
                </Form>
              </Card.Body>
            </MotionCard>
          )}
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
        
        .phone-input-custom .PhoneInputInput {
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 0.75rem;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }
        
        .phone-input-custom .PhoneInputInput:focus {
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

export default EditInstitute;
