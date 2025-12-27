import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Modal, Alert, Badge, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import { FaBuilding, FaEye, FaUsers, FaChalkboardTeacher, FaGraduationCap, FaEnvelope, FaBell } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../Dashboard.css';

const Institutes = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notifying, setNotifying] = useState(new Set());

  const fetchInstitutes = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/auth/institutes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setInstitutes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load institutes');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const handleShowDetail = (inst) => {
    setSelected(inst);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelected(null);
  };

  return (
    <>
      <Sidebar activeMenu="institutes" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content p-3 p-md-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-4"
          >
            <div className="d-flex align-items-center gap-3 mb-4">
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'var(--theme-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(126, 34, 206, 0.3)'
              }}>
                <FaBuilding style={{ color: '#fff', fontSize: '24px' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
                  fontWeight: 700,
                  color: 'var(--theme-color)',
                  marginBottom: '0.25rem',
                  letterSpacing: '-0.5px'
                }}>
                  Institutes Management
                </h2>
                <p style={{
                  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                  color: '#6b7280',
                  fontWeight: 500,
                  marginBottom: 0
                }}>
                  View and manage all institutes in your system
                </p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-3">
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
          >
            <Card style={{
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>#</th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>
                          <FaBuilding className="me-2" />Name
                        </th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>
                          <FaEnvelope className="me-2" />Email
                        </th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>
                          <FaChalkboardTeacher className="me-2" />Teachers
                        </th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>
                          <FaGraduationCap className="me-2" />Students
                        </th>
                        <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--theme-color)', textAlign: 'center', borderBottom: 'none', backgroundColor: 'var(--theme-color-light)', border: '1px solid var(--theme-color)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
                            <LoadingSpinner message="Loading institutes..." size="large" />
                          </td>
                        </tr>
                      ) : institutes.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <FaBuilding style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }} />
                            <p style={{ color: '#6b7280', fontWeight: 500, fontSize: '1rem' }}>No institutes found</p>
                          </td>
                        </tr>
                      ) : (
                        institutes.map((inst, idx) => (
                          <motion.tr
                            key={inst._id || idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ backgroundColor: 'rgba(79, 70, 229, 0.12)', transition: { duration: 0.2 } }}
                            style={{ borderBottom: '1px solid rgba(105, 65, 219, 0.1)' }}
                          >
                            <td style={{ padding: '1rem', fontWeight: 400 }}>{idx + 1}</td>
                            <td style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 400, color: '#374151' }}>{inst.instituteName}</td>
                            <td style={{ padding: '1rem', color: '#6b7280' }}>{inst.email || '-'}</td>
                            <td style={{ padding: '1rem', color: '#111827', fontWeight: 500 }}>
                              {inst.totalTeachers ?? 0}
                            </td>
                            <td style={{ padding: '1rem', color: '#111827', fontWeight: 500 }}>
                              {inst.totalStudents ?? 0}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  onClick={() => handleShowDetail(inst)}
                                  className="table-action-btn table-action-edit"
                                >
                                  <FaEye /> View
                                </Button>
                                {(['Trial','Expired','None',''].includes(String(inst.subscription || '').trim())) && (
                                  <Button
                                    disabled={notifying.has(String(inst.instituteID))}
                                    onClick={async () => {
                                      const id = String(inst.instituteID);
                                      setNotifying(prev => new Set([...prev, id]));
                                      try {
                                        const reason = String(inst.subscription || '').trim() === 'Trial' ? 'trial-ended' : 'payment-ended';
                                        await fetch(`http://localhost:5000/api/payments/notify/${encodeURIComponent(inst.instituteID)}`, {
                                          method: 'POST',
                                          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ reason })
                                        });
                                        alert('Reminder sent to institute admin');
                                      } catch (err) {
                                        alert('Failed to send reminder');
                                      } finally {
                                        setNotifying(prev => {
                                          const next = new Set(prev);
                                          next.delete(id);
                                          return next;
                                        });
                                      }
                                    }}
                                    className="table-action-btn table-action-delete"
                                    style={{ opacity: notifying.has(String(inst.instituteID)) ? 0.6 : 1 }}
                                  >
                                  <FaBell /> {notifying.has(String(inst.instituteID)) ? 'Notifying…' : 'Notify'}
                                </Button>
                              )}
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          <Modal show={showDetail} onHide={handleCloseDetail} centered size="lg" style={{ zIndex: 1050 }}>
            <style>{`
              .modal-header .btn-close {
                filter: brightness(0) invert(1);
                opacity: 1;
              }
              .modal-header .btn-close:hover {
                filter: brightness(0) invert(1);
                opacity: 0.8;
              }
            `}</style>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Modal.Header 
                closeButton
                style={{
                  background: 'var(--theme-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px 12px 0 0',
                  padding: '0.75rem 1rem'
                }}
                closeVariant="white"
              >
                <Modal.Title style={{ fontWeight: 600, fontSize: '1.25rem' }}>
                  Institute Details
                </Modal.Title>
              </Modal.Header>
              <Modal.Body style={{
                background: '#ffffff',
                padding: '2rem',
                border: 'none',
                borderRadius: '0 0 12px 12px',
                overflow: 'visible'
              }}>
                {selected ? (
                  <>
                    {selected.logoUrl && (
                      <div className="text-center mb-4">
                        <img
                          src={selected.logoUrl}
                          alt="Institute Logo"
                          style={{
                            maxWidth: '120px',
                            maxHeight: '120px',
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            background: '#fff'
                          }}
                        />
                      </div>
                    )}
                        
                        <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
                          <Col md={6}>
                            <Card style={{
                              border: '2px solid rgba(105, 65, 219, 0.12)',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              height: '100%'
                            }}>
                              <Card.Header style={{
                                background: 'rgba(79, 70, 229, 0.12)',
                                color: 'var(--theme-color)',
                                fontWeight: 600,
                                fontSize: '1.125rem',
                                padding: '1.25rem 1.5rem',
                                border: '1px solid rgba(79, 70, 229, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <FaBuilding /> Institute Information
                              </Card.Header>
                              <Card.Body style={{ padding: '1.5rem' }}>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Institute Name:</p>
                                  <p style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.instituteName}</p>
                                </div>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Institute ID:</p>
                                  <p style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.instituteID}</p>
                                </div>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Type:</p>
                                  <p style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.instituteType}</p>
                                </div>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Subscription:</p>
                                  <Badge style={{ background: 'var(--theme-color)', color: 'white', fontSize: '0.85rem', padding: '6px 12px', fontWeight: 600 }}>
                                    {selected.subscription}
                                  </Badge>
                                </div>
                                <div style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Created At:</p>
                                  <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 500, marginBottom: 0 }}>
                                    {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>

                          <Col md={6}>
                            <Card style={{
                              border: '2px solid rgba(105, 65, 219, 0.12)',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              height: '100%'
                            }}>
                              <Card.Header style={{
                                background: 'rgba(79, 70, 229, 0.12)',
                                color: 'var(--theme-color)',
                                fontWeight: 600,
                                fontSize: '1.125rem',
                                padding: '1.25rem 1.5rem',
                                border: '1px solid rgba(79, 70, 229, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <FaBuilding /> Contact & Statistics
                              </Card.Header>
                              <Card.Body style={{ padding: '1.5rem' }}>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Address:</p>
                                  <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 500, marginBottom: 0 }}>{selected.address}</p>
                                </div>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Contact:</p>
                                  <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 500, marginBottom: 0 }}>{selected.contactNumber}</p>
                                </div>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Total Teachers:</p>
                                  <p style={{ fontSize: '1.25rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.totalTeachers ?? 0}</p>
                                </div>
                                <div style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Total Students:</p>
                                  <p style={{ fontSize: '1.25rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.totalStudents ?? 0}</p>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>

                        <Card style={{
                          border: '2px solid rgba(105, 65, 219, 0.12)',
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}>
                          <Card.Header style={{
                            background: 'rgba(79, 70, 229, 0.12)',
                            color: 'var(--theme-color)',
                            fontWeight: 600,
                            fontSize: '1.125rem',
                            padding: '1.25rem 1.5rem',
                            border: '1px solid rgba(79, 70, 229, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <FaUsers /> Admin Details
                          </Card.Header>
                          <Card.Body style={{ padding: '1.5rem' }}>
                            {selected.admin ? (
                              <Row className="g-3">
                                <Col md={12}>
                                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Admin Name:</p>
                                    <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.admin.userName}</p>
                                  </div>
                                </Col>
                                <Col md={12}>
                                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Email:</p>
                                    <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 500, marginBottom: 0 }}>{selected.admin.email}</p>
                                  </div>
                                </Col>
                                <Col md={12}>
                                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>Phone:</p>
                                    <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 500, marginBottom: 0 }}>{selected.admin.phoneNumber}</p>
                                  </div>
                                </Col>
                                <Col md={12}>
                                  <div style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 0, fontWeight: 600, minWidth: '140px' }}>CNIC:</p>
                                    <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 500, marginBottom: 0 }}>{selected.admin.cnic}</p>
                                  </div>
                                </Col>
                              </Row>
                            ) : (
                              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
                                <p style={{ color: '#d97706', marginBottom: 0, fontWeight: 500, fontSize: '0.9rem' }}>
                                  No admin assigned to this institute
                                </p>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </>
                    ) : (
                      <p className="text-center text-muted" style={{ fontSize: '1rem', fontWeight: 500 }}>
                        No details available.
                      </p>
                    )}
                  </Modal.Body>
            </motion.div>
          </Modal>
        </Container>
      </div>
    </>
  );
};

export default Institutes;
