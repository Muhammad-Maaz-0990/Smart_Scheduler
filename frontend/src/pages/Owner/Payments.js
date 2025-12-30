import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Row, Col, Form } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import { FaMoneyBillWave, FaCalendarDay, FaCalendarAlt } from 'react-icons/fa';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../../pages/Dashboard.css';

const Payments = () => {
  const [items, setItems] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // no-op
      try {
        const res = await axios.get('/api/payments/all');
        setItems(res.data?.items || []);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleString();
  };

  const filteredItems = items.filter(p => {
    const dt = new Date(p.paymentDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    // Date range filter
    if (start && dt < start) return false;
    if (end && dt > end) return false;
    
    // Dropdown filters
    if (year && dt.getFullYear() !== parseInt(year, 10)) return false;
    if (month && (dt.getMonth() + 1) !== parseInt(month, 10)) return false;
    if (day && dt.getDate() !== parseInt(day, 10)) return false;
    
    return true;
  });

  return (
    <>
      <Sidebar activeMenu="payments" />
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
                background: '#6941db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(126, 34, 206, 0.3)'
              }}>
                <FaMoneyBillWave style={{ color: '#fff', fontSize: '24px' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
                  fontWeight: 700,
                  color: '#6941db',
                  marginBottom: '0.25rem',
                  letterSpacing: '-0.5px'
                }}>
                  Payments Management
                </h2>
                <p style={{
                  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                  color: '#6b7280',
                  fontWeight: 500,
                  marginBottom: 0
                }}>
                  View and manage all institute payments
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={scaleIn}>
            <Card style={{
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)'
            }}>
              <Card.Header style={{
                background: 'rgba(79, 70, 229, 0.12)',
                color: '#4338CA',
                fontWeight: 600,
                fontSize: '1.125rem',
                padding: '1.25rem 1.5rem',
                border: '1px solid rgba(79, 70, 229, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FaCalendarDay />
                Payment History
              </Card.Header>
              <Card.Body className="p-0">
                {/* Filters */}
                <div style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(126, 34, 206, 0.2)',
                  background: 'rgba(105, 65, 219, 0.06)'
                }}>
                  <Row className="align-items-center g-3 mb-3">
                    <Col md={4} sm={12}>
                      <Form.Label style={{ fontWeight: 600, color: '#6941db', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaCalendarAlt /> Start Date
                      </Form.Label>
                      <Form.Control 
                        type="datetime-local" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.85rem'
                        }}
                      />
                    </Col>
                    <Col md={4} sm={12}>
                      <Form.Label style={{ fontWeight: 600, color: '#6941db', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaCalendarAlt /> End Date
                      </Form.Label>
                      <Form.Control 
                        type="datetime-local" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.85rem'
                        }}
                      />
                    </Col>
                  </Row>
                  <Row className="align-items-center g-3">
                    <Col md={3} sm={6}>
                      <Form.Label style={{ fontWeight: 600, color: '#6941db', marginBottom: '8px' }}>
                        Year
                      </Form.Label>
                      <Form.Select 
                        value={year} 
                        onChange={(e) => setYear(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="">All Years</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3} sm={6}>
                      <Form.Label style={{ fontWeight: 600, color: '#6941db', marginBottom: '8px' }}>
                        Month
                      </Form.Label>
                      <Form.Select 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="">All Months</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </Form.Select>
                    </Col>
                    <Col md={3} sm={6}>
                      <Form.Label style={{ fontWeight: 600, color: '#6941db', marginBottom: '8px' }}>
                        Day
                      </Form.Label>
                      <Form.Select 
                        value={day} 
                        onChange={(e) => setDay(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="">All Days</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3} sm={6} className="text-md-end" style={{ marginTop: 'auto', paddingTop: '28px' }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => { setStartDate(''); setEndDate(''); setYear(''); setMonth(''); setDay(''); }}
                        style={{ fontWeight: 600 }}
                      >
                        Reset All
                      </button>
                    </Col>
                  </Row>
                </div>
                <div className="table-responsive">
                  <Table hover style={{ marginBottom: 0 }}>
                    <thead style={{ backgroundColor: 'var(--theme-color-dark)' }}>
                      <tr>
                        <th style={{ padding: '14px 16px' }}>#</th>
                        <th style={{ padding: '14px 16px' }}>Payment ID</th>
                        <th style={{ padding: '14px 16px' }}>Institute</th>
                        <th style={{ padding: '14px 16px' }}>Amount</th>
                        <th style={{ padding: '14px 16px' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
                            <LoadingSpinner message="Loading payments..." size="large" />
                          </td>
                        </tr>
                      ) : filteredItems.length > 0 ? (
                        filteredItems.map((p, idx) => (
                          <motion.tr key={p.paymentID || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                            <td style={{ padding: '14px 16px', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <Badge bg="secondary">{p.paymentID}</Badge>
                            </td>
                            <td style={{ padding: '14px 16px' }}>{p.instituteName || p.instituteID}</td>
                            <td style={{ padding: '14px 16px', color: '#6941db', fontWeight: 700 }}>$. {p.amount}</td>
                            <td style={{ padding: '14px 16px' }}>{formatDate(p.paymentDate)}</td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
                            No payments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Container>
      </div>
    </>
  );
};

export default Payments;
