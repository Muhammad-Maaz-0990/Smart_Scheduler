import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Form, Button } from 'react-bootstrap';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';

const EditInstitute = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    instituteName: '',
    address: '',
    contactNumber: '',
    instituteLogo: '' // data URL or URL string
  });
  const [country, setCountry] = useState('PK');
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
        // derive country from phone prefix (simple heuristic)
        const pn = String(inst.contactNumber || '');
        if (pn.startsWith('+1')) setCountry('US');
        else if (pn.startsWith('+92')) setCountry('PK');
        else if (pn.startsWith('+44')) setCountry('GB');
        else if (pn.startsWith('+91')) setCountry('IN');
        else if (pn.startsWith('+971')) setCountry('AE');
        else if (pn.startsWith('+966')) setCountry('SA');
        else setCountry('PK');
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
          <h1 className="dashboard-title mb-4">Edit Institute</h1>
          {loading ? (
            <div>Loading…</div>
          ) : (
            <Form onSubmit={save} style={{ maxWidth: 640 }}>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              {/* Top circle logo selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <label htmlFor="admin-edit-logo-upload" style={{ cursor: 'pointer', width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: '2px solid #e0e0e0', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {form.instituteLogo ? (
                    <img src={form.instituteLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#999' }}>Click to add logo</span>
                  )}
                </label>
                <input id="admin-edit-logo-upload" type="file" accept="image/*" onChange={onLogoFile} style={{ display: 'none' }} />
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Institute Name</Form.Label>
                <Form.Control name="instituteName" value={form.instituteName} onChange={onChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control name="address" value={form.address} onChange={onChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Institute Contact Number</Form.Label>
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
                />
              </Form.Group>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            </Form>
          )}
        </Container>
      </div>
    </>
  );
};

export default EditInstitute;
