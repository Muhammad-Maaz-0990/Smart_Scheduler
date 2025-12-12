import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Modal, Alert, Badge, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import { FaBuilding, FaEye, FaUsers, FaChalkboardTeacher, FaGraduationCap, FaEnvelope } from 'react-icons/fa';
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
                background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
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
                  background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
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
                    <thead style={{
                      background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      color: '#fff'
                    }}>
                      <tr>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>#</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaBuilding className="me-2" />Name
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaEnvelope className="me-2" />Email
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaChalkboardTeacher className="me-2" />Teachers
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none' }}>
                          <FaGraduationCap className="me-2" />Students
                        </th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: 'none', textAlign: 'center' }}>Actions</th>
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{ borderBottom: '1px solid #e5e7eb' }}
                          >
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>{inst.instituteName}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#6b7280' }}>{inst.email || '-'}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <Badge bg="primary" style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                padding: '4px 10px',
                                fontSize: '0.8rem'
                              }}>
                                {inst.totalTeachers ?? 0}
                              </Badge>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <Badge bg="success" style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                padding: '4px 10px',
                                fontSize: '0.8rem'
                              }}>
                                {inst.totalStudents ?? 0}
                              </Badge>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <Button
                                size="sm"
                                onClick={() => handleShowDetail(inst)}
                                style={{
                                  background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                                  border: 'none',
                                  padding: '8px 18px',
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  boxShadow: '0 2px 6px rgba(126, 34, 206, 0.3)',
                                  transition: 'all 0.2s ease',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(126, 34, 206, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(126, 34, 206, 0.3)';
                                }}
                              >
                                <FaEye /> View
                              </Button>
                              {(['Trial','Expired','None',''].includes(String(inst.subscription || '').trim())) && (
                                <Button
                                  size="sm"
                                  className="ms-2"
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
                                  style={{
                                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                    border: 'none',
                                    padding: '8px 18px',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                                    transition: 'all 0.2s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.3)';
                                  }}
                                >
                                  {notifying.has(String(inst.instituteID)) ? 'Notifying…' : 'Notify'}
                                </Button>
                              )}
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
            <AnimatePresence>
              {showDetail && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 40 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  style={{
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(126,34,206,0.18)',
                    border: '4px solid #a855f7',
                    background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                    overflow: 'hidden'
                  }}
                >
                  <Modal.Header closeButton style={{
                    background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                    color: '#fff',
                    borderBottom: 'none',
                    padding: '28px 32px',
                    boxShadow: '0 2px 12px rgba(126,34,206,0.10)'
                  }}>
                    <Modal.Title style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '14px', letterSpacing: '0.02em' }}>
                      <motion.span
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        <FaBuilding style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 8px #a855f7)' }} />
                      </motion.span>
                      Institute Details
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body style={{
                    background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                    padding: '32px',
                    minHeight: '480px',
                    position: 'relative'
                  }}>
                    {selected ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.6 }}
                        >
                          {selected.logoUrl && (
                            <motion.div className="text-center mb-4"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3, duration: 0.5 }}
                            >
                              <img
                                src={selected.logoUrl}
                                alt="Institute Logo"
                                style={{
                                  maxWidth: '140px',
                                  maxHeight: '140px',
                                  borderRadius: '16px',
                                  border: '4px solid #fff',
                                  boxShadow: '0 8px 32px #a855f7',
                                  background: '#fff',
                                  filter: 'drop-shadow(0 0 16px #a855f7)'
                                }}
                              />
                            </motion.div>
                          )}
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.18)',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            marginBottom: '20px',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 2px 12px #a855f7'
                          }}>
                            <motion.h5
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4, duration: 0.5 }}
                              style={{
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '1.15rem',
                                marginBottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                letterSpacing: '0.01em',
                                 padding: '10px 0'
                              }}
                            >
                              <FaBuilding style={{ filter: 'drop-shadow(0 0 6px #a855f7)' }} /> Institute Information
                            </motion.h5>
                            <Row className="g-3 mb-4">
                              <Col md={6}>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Institute Name</p>
                                  <p style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.instituteName}</p>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Institute ID</p>
                                  <p style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.instituteID}</p>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Type</p>
                                  <p style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.instituteType}</p>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Subscription</p>
                                  <Badge style={{ background: '#7e22ce', color: 'white', fontSize: '0.85rem', padding: '6px 12px', fontWeight: 700 }}>
                                    {selected.subscription}
                                  </Badge>
                                </div>
                              </Col>
                              <Col md={12}>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Address</p>
                                  <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.address}</p>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Contact</p>
                                  <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.contactNumber}</p>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Created At</p>
                                  <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>
                                    {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Total Teachers</p>
                                  <p style={{ fontSize: '1.35rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.totalTeachers ?? 0}</p>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Total Students</p>
                                  <p style={{ fontSize: '1.35rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.totalStudents ?? 0}</p>
                                </div>
                              </Col>
                            </Row>
                          </div>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.18)',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            marginTop: '24px',
                            marginBottom: '20px',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 2px 12px #a855f7'
                          }}>
                            <motion.h5
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5, duration: 0.5 }}
                              style={{
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '1.15rem',
                                marginBottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                letterSpacing: '0.01em',
                                padding: '10px 0'
                              }}
                            >
                              <FaUsers style={{ filter: 'drop-shadow(0 0 6px #a855f7)' }} /> Admin Details
                            </motion.h5>
                            {selected.admin ? (
                              <Row className="g-3">
                                <Col md={6}>
                                  <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Admin Name</p>
                                    <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.admin.userName}</p>
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Email</p>
                                    <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.admin.email}</p>
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Phone</p>
                                    <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.admin.phoneNumber}</p>
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>CNIC</p>
                                    <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.admin.cnic}</p>
                                  </div>
                                </Col>
                              </Row>
                            ) : (
                              <div style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '20px', borderRadius: '12px', border: '2px solid #fbbf24', textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                                <p style={{ color: '#78350f', marginBottom: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                                  No admin assigned to this institute
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </>
                    ) : (
                      <motion.p className="text-center text-muted"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontSize: '1.1rem', fontWeight: 600 }}
                      >No details available.</motion.p>
                    )}
                  </Modal.Body>
                </motion.div>
              )}
            </AnimatePresence>
          </Modal>
        </Container>
      </div>
    </>
  );
};

export default Institutes;
