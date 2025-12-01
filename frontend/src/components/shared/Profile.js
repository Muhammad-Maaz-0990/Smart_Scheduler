import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [institute, setInstitute] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        // Fetch institute details
        if (user.instituteID) {
          const instRes = await axios.get(`/api/auth/institute/${encodeURIComponent(user.instituteID)}`);
          setInstitute(instRes.data);
          // Fetch subscription/payment status
          const statusRes = await axios.get(`/api/subscription/status/${encodeURIComponent(user.instituteID)}`);
          setStatus(statusRes.data);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const renderPersonal = () => {
    if (!user) return null;
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Personal Details</div>
        <div className="card-body">
          <div><strong>Name:</strong> {user.userName}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Phone:</strong> {user.phoneNumber || '—'}</div>
          <div><strong>Role:</strong> {user.designation}</div>
          {user.instituteName && (
            <div><strong>Institute:</strong> {user.instituteName}</div>
          )}
        </div>
      </div>
    );
  };

  const renderInstitute = () => {
    if (!institute) return null;
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Institute Details</div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
            {institute.instituteLogo && (
              <img src={institute.instituteLogo} alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
            )}
            <div>
              <div><strong>Name:</strong> {institute.instituteName}</div>
              <div><strong>ID:</strong> {institute.instituteID}</div>
            </div>
          </div>
          <div><strong>Type:</strong> {institute.instituteType}</div>
          <div><strong>Address:</strong> {institute.address}</div>
          <div><strong>Contact:</strong> {institute.contactNumber}</div>
          <div><strong>Subscription:</strong> {institute.subscription}</div>
          {institute.created_at && (
            <div><strong>Created:</strong> {new Date(institute.created_at).toLocaleDateString()}</div>
          )}
        </div>
      </div>
    );
  };

  const renderPayment = () => {
    if (!status) return null;
    const showBtn = !!status.showPaymentButton;
    const note = status.subscriptionType === 'Trial'
      ? 'You are currently on a Trial subscription.'
      : status.hasPaymentThisPeriod
        ? `Current ${status.currentPeriod?.type?.toLowerCase()} payment is recorded. ${status.daysLeft != null ? `${status.daysLeft} day(s) left in period.` : ''}`
        : `No payment found for this ${status.currentPeriod?.type?.toLowerCase()} period.`;

    return (
      <div className="card">
        <div className="card-header">Billing</div>
        <div className="card-body">
          <div style={{ marginBottom: 8 }}>{note}</div>
          {status.currentPeriod && (
            <div style={{ marginBottom: 8, color: '#555' }}>
              Period: {status.currentPeriod.label} ({new Date(status.currentPeriod.start).toLocaleDateString()} - {new Date(status.currentPeriod.end).toLocaleDateString()})
            </div>
          )}
          {status.lastPayment && (
            <div style={{ marginBottom: 8, color: '#555' }}>
              Last Payment: {new Date(status.lastPayment.paymentDate).toLocaleDateString()} • Amount: {status.lastPayment.amount}
            </div>
          )}
          {showBtn && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // Placeholder: hook your payment flow here
                alert('Redirecting to payment...');
              }}
            >
              Pay Now
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading profile…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 840, margin: '24px auto', padding: '0 16px' }}>
      {renderPersonal()}
      {renderInstitute()}
      {renderPayment()}
    </div>
  );
};

export default Profile;
