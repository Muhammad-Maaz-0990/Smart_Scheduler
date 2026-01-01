import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import ChangePassword from '../../components/shared/ChangePassword';
import '../Dashboard.css';
import { useAuth } from '../../context/AuthContext';

const StudentChangePasswordPage = () => {
  const { instituteObjectId, loadSubscriptionOnce } = useAuth();

  const [expired, setExpired] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (!instituteObjectId) {
          if (mounted) setExpired(false);
          return;
        }
        const sub = await loadSubscriptionOnce(instituteObjectId);
        if (mounted) setExpired(!!sub?.isExpired);
      } catch {
        if (mounted) setExpired(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
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
        <Container fluid className="dashboard-content" style={{ padding: 0 }}>
          {expired && (
            <div style={{ padding: '0 1.5rem', marginTop: '1.5rem' }}>
              <Alert variant="warning" style={{ borderRadius: '12px' }}>
                Say Your Head to Buy Subscription
              </Alert>
            </div>
          )}
          <ChangePassword embedded />
        </Container>
      </div>
    </>
  );
};

export default StudentChangePasswordPage;
