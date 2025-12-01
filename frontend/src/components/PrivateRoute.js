import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';
import axios from 'axios';

const PrivateRoute = ({ children, allowedRoles, allowWhenExpired = false }) => {
  const { user, loading } = useAuth();
  const [subLoading, setSubLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  // Prepare gating flags (always compute and call hooks before any return)
  const role = (user?.designation || '').toLowerCase();
  const hasInstitute = !!user?.instituteID;
  const shouldGate = hasInstitute && ['admin','student','teacher'].includes(role);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!shouldGate || !user?.instituteID) {
        if (mounted) {
          setExpired(false);
          setSubLoading(false);
        }
        return;
      }
      try {
        setSubLoading(true);
        const res = await axios.get(`/api/subscription/status/${encodeURIComponent(user.instituteID)}`);
        if (mounted) setExpired(!!res.data?.isExpired);
      } catch (e) {
        if (mounted) setExpired(false);
      } finally {
        if (mounted) setSubLoading(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [shouldGate, user?.instituteID]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="light" />
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.designation)) {
    return <Navigate to="/login" replace />;
  }

  if (subLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="light" />
      </Container>
    );
  }

  if (shouldGate && expired && !allowWhenExpired) {
    const base = role === 'admin' ? '/admin' : role === 'student' ? '/student' : '/teacher';
    return <Navigate to={`${base}/profile`} replace />;
  }

  return children;
};

export default PrivateRoute;
