import React, { useEffect, useState } from 'react';
import { Container, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import Profile from '../../components/shared/Profile';
import '../Dashboard.css';
import { useAuth } from '../../context/AuthContext';

const AdminProfilePage = () => {
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
        <Container 
          fluid 
          style={{ padding: 0, marginLeft: 0 }}
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {expired && (
            <div style={{ padding: '0 1.5rem', marginTop: '1.5rem' }}>
              <Alert variant="warning" style={{ borderRadius: '12px' }}>
                Update Your Subscription
              </Alert>
            </div>
          )}
          <Profile />
        </Container>
        </>
  );
};

export default AdminProfilePage;
