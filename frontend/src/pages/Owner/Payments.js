import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Row, Col, Form } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '../../components/shared/animation_variants';
import { FaMoneyBillWave, FaCalendarDay } from 'react-icons/fa';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import '../../pages/Dashboard.css';

const Payments = () => {
  const [items, setItems] = useState([]);
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
    const yOk = year ? dt.getFullYear() === Number(year) : true;
    const mOk = month ? (dt.getMonth() + 1) === Number(month) : true;
    const dOk = day ? dt.getDate() === Number(day) : true;
    return yOk && mOk && dOk;
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

        <Container fluid className="dashboard-content" style={{ padding: '2rem' }}>
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-4">
            <div style={{
              background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 6px rgba(126, 34, 206, 0.2)',
              color: '#fff'
            }}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaMoneyBillWave style={{ fontSize: '2.5rem' }} />
                Payments
              </h1>
              <p style={{ fontSize: '1.1rem', marginBottom: 0, opacity: 0.9 }}>
                View all institute payments.
              </p>
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
                background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FaCalendarDay />
                Payment History
              </Card.Header>
              <Card.Body className="p-0">
                {/* Filters */}
                <div style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(126, 34, 206, 0.2)',
                  background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.06) 0%, rgba(107, 33, 168, 0.06) 100%)'
                }}>
                  <Row className="align-items-center g-3">
                    <Col md={3} sm={12}>
                      <Form.Label style={{ fontWeight: 600, color: '#6b21a8' }}>Year</Form.Label>
                      <Form.Select size="sm" value={year} onChange={(e)=>setYear(e.target.value)}>
                        <option value="">All</option>
                        {[...new Set(items.map(i => new Date(i.paymentDate).getFullYear()))].sort((a,b)=>b-a).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3} sm={12}>
                      <Form.Label style={{ fontWeight: 600, color: '#6b21a8' }}>Month</Form.Label>
                      <Form.Select size="sm" value={month} onChange={(e)=>setMonth(e.target.value)}>
                        <option value="">All</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3} sm={12}>
                      <Form.Label style={{ fontWeight: 600, color: '#6b21a8' }}>Day</Form.Label>
                      <Form.Select size="sm" value={day} onChange={(e)=>setDay(e.target.value)}>
                        <option value="">All</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3} sm={12} className="text-md-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => { setYear(''); setMonth(''); setDay(''); }}
                        style={{ fontWeight: 600 }}
                      >
                        Reset
                      </button>
                    </Col>
                  </Row>
                </div>
                <div className="table-responsive">
                  <Table hover style={{ marginBottom: 0 }}>
                    <thead style={{
                      background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      color: '#fff'
                    }}>
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
                            <td style={{ padding: '14px 16px', color: '#7e22ce', fontWeight: 700 }}>Rs. {p.amount}</td>
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
