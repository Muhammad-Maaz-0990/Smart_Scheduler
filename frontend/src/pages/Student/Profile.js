import React, { useEffect, useState } from 'react';
import { Container, Alert } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Profile from '../../components/shared/Profile';
import '../Dashboard.css';
import { useAuth } from '../../context/AuthContext';

const StudentProfilePage = () => {
  const { instituteObjectId, loadSubscriptionOnce } = useAuth();
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (!instituteObjectId) { if (mounted) setExpired(false); return; }
        const sub = await loadSubscriptionOnce(instituteObjectId);
        if (mounted) setExpired(!!sub?.isExpired);
      } catch { if (mounted) setExpired(false); }
    };
    run();
    return () => { mounted = false; };
  }, [instituteObjectId, loadSubscriptionOnce]);
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
          <h1 className="dashboard-title mb-4">Profile</h1>
          {expired && (
            <Alert variant="warning" className="mb-3">
              Say Your Head to Buy Subscription
            </Alert>
          )}
          <Profile />
        </Container>
      </div>
    </>
  );
};

export default StudentProfilePage;
