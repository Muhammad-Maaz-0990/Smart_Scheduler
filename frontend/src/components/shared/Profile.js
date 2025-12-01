import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [institute, setInstitute] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]);

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
          // Fetch subscription/payment status for all roles
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

  // If redirected back from Stripe Checkout success, confirm and record payment
  useEffect(() => {
    const url = new URL(window.location.href);
    const checkout = url.searchParams.get('checkout');
    const sessionId = url.searchParams.get('session_id');
    if (checkout === 'success' && sessionId) {
      const confirm = async () => {
        try {
          setPaying(true);
          setNotice('Finalizing payment...');
          const res = await axios.get(`/api/payments/confirm`, { params: { session_id: sessionId } });
          if (res.data?.ok) {
            setNotice('Payment recorded successfully. Refreshing status...');
            // Refresh status
            if (user?.instituteID) {
              const statusRes = await axios.get(`/api/subscription/status/${encodeURIComponent(user.instituteID)}`);
              setStatus(statusRes.data);
              // Refresh payment history too
              try {
                const hRes = await axios.get(`/api/payments/history/${encodeURIComponent(user.instituteID)}`);
                setHistory(hRes.data?.items || []);
              } catch {}
            }
          }
        } catch (err) {
          setError(err?.response?.data?.message || 'Failed to confirm payment');
        } finally {
          setPaying(false);
          // Clean URL params
          url.searchParams.delete('checkout');
          url.searchParams.delete('session_id');
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      };
      confirm();
    }
  }, [user]);

  const startPayment = async (plan) => {
    try {
      setPaying(true);
      setNotice('Redirecting to Stripe Checkout...');
      const res = await axios.post('/api/payments/checkout', { plan });
      const url = res.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        setError('Failed to start checkout');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to begin payment');
    } finally {
      // don't clear paying here because we redirect on success
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (user?.instituteID && (user?.designation || '').toLowerCase() === 'admin') {
          const hRes = await axios.get(`/api/payments/history/${encodeURIComponent(user.instituteID)}`);
          setHistory(hRes.data?.items || []);
        }
      } catch (e) {
        // silently ignore history errors
      }
    };
    loadHistory();
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
    // Only Admins can view Billing section
    if ((user?.designation || '').toLowerCase() !== 'admin') return null;
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
          {notice && (
            <div className="alert alert-info" style={{ marginBottom: 8 }}>{notice}</div>
          )}
          {history && history.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Recent Payments</div>
              <ul style={{ margin: 0 }}>
                {history.slice(0, 5).map((p) => (
                  <li key={p.paymentID} style={{ color: '#555' }}>
                    {new Date(p.paymentDate).toLocaleDateString()} • PaymentID: {p.paymentID} • Amount: {p.amount}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showBtn && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={paying}
                onClick={() => startPayment('Monthly')}
              >
                Pay Monthly (PKR 100)
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={paying}
                onClick={() => startPayment('Yearly')}
              >
                Pay Yearly (PKR 1200)
              </button>
            </div>
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
      {/* Non-admin expired notice */}
      {status && status.isExpired && (user?.designation || '').toLowerCase() !== 'admin' && (
        <div className="alert alert-warning" role="alert" style={{ marginBottom: 16 }}>
          Your institute subscription has expired. Please contact your Admin to renew.
        </div>
      )}
      {renderPayment()}
    </div>
  );
};

export default Profile;
