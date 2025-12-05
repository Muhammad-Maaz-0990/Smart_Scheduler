import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Button } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await axios.put('/api/auth/change-password', { oldPassword, newPassword });
      if (res.data?.ok) setSuccess('Password changed successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Change password failed');
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
          <h1 className="dashboard-title mb-4">Change Password</h1>
          <Form onSubmit={submit} style={{ maxWidth: 480 }}>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <Form.Group className="mb-3">
              <Form.Label>Old Password</Form.Label>
              <Form.Control type="password" value={oldPassword} onChange={(e)=>setOldPassword(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required minLength={6} />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Update Password'}</Button>
          </Form>
        </Container>
      </div>
    </>
  );
};

export default ChangePassword;
