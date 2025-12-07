import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Modal, Alert, Badge, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import { FaBuilding, FaEye, FaUsers, FaChalkboardTeacher, FaGraduationCap, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard, FaCrown, FaCalendarAlt } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';

const Institutes = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);

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
                          <td colSpan="6" className="text-center py-5">
                            <div className="spinner-border" style={{ color: '#7e22ce', width: '2.5rem', height: '2.5rem' }} role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3 mb-0" style={{ color: '#6b7280', fontWeight: 500 }}>Loading institutes...</p>
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
            <Modal.Header closeButton style={{
              background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
              color: '#fff',
              borderBottom: 'none',
              padding: '20px 24px'
            }}>
              <Modal.Title style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaBuilding style={{ fontSize: '1.1rem' }} />
                Institute Details
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{
              background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
              padding: '24px'
            }}>
              {selected ? (
                <div>
                  {selected.logoUrl && (
                    <div className="text-center mb-4">
                      <img
                        src={selected.logoUrl}
                        alt="Institute Logo"
                        style={{
                          maxWidth: '140px',
                          maxHeight: '140px',
                          borderRadius: '16px',
                          border: '4px solid rgba(255, 255, 255, 0.9)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                          background: '#fff'
                        }}
                      />
                    </div>
                  )}

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <h5 style={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      marginBottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FaBuilding /> Institute Information
                    </h5>
                  </div>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <div style={{
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Institute Name</p>
                        <p style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.instituteName}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={{
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaIdCard />Institute ID
                        </p>
                        <p style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.instituteID}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={{
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Type</p>
                        <p style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.instituteType}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={{
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaCrown />Subscription
                        </p>
                        <Badge style={{ background: '#fbbf24', color: '#78350f', fontSize: '0.85rem', padding: '6px 12px', fontWeight: 700 }}>
                          {selected.subscription}
                        </Badge>
                      </div>
                    </Col>
                    <Col md={12}>
                      <div style={{
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaMapMarkerAlt />Address
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.address}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={{
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaPhone />Contact
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.contactNumber}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={{
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaCalendarAlt />Created At
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>
                          {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={{
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaChalkboardTeacher />Total Teachers
                        </p>
                        <p style={{ fontSize: '1.35rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.totalTeachers ?? 0}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={{
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaGraduationCap />Total Students
                        </p>
                        <p style={{ fontSize: '1.35rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.totalStudents ?? 0}</p>
                      </div>
                    </Col>
                  </Row>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginTop: '20px',
                    marginBottom: '16px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <h5 style={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      marginBottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FaUsers /> Admin Details
                    </h5>
                  </div>
                  {selected.admin ? (
                    <Row className="g-3">
                      <Col md={6}>
                        <div style={{
                          background: '#fff',
                          padding: '14px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600 }}>Admin Name</p>
                          <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 700, marginBottom: 0 }}>{selected.admin.userName}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div style={{
                          background: '#fff',
                          padding: '14px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaEnvelope />Email
                          </p>
                          <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.admin.email}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div style={{
                          background: '#fff',
                          padding: '14px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaPhone />Phone
                          </p>
                          <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.admin.phoneNumber}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div style={{
                          background: '#fff',
                          padding: '14px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaIdCard />CNIC
                          </p>
                          <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: 0 }}>{selected.admin.cnic}</p>
                        </div>
                      </Col>
                    </Row>
                  ) : (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '2px solid #fbbf24',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                      <p style={{ color: '#78350f', marginBottom: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                        ⚠️ No admin assigned to this institute
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted">No details available.</p>
              )}
            </Modal.Body>
          </Modal>
        </Container>
      </div>
    </>
  );
};

export default Institutes;
