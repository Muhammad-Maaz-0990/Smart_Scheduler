import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Badge, Form, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, fadeIn, scaleIn } from './animation_variants';
import { FaPrint, FaPlus, FaTrash, FaCalendarAlt, FaEye, FaEyeSlash, FaStar, FaClock, FaGraduationCap, FaChalkboardTeacher, FaDoorOpen } from 'react-icons/fa';

function TimeTable({ isAdmin = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]); // headers list
  const [selected, setSelected] = useState(null); // selected header
  const [details, setDetails] = useState([]); // details for selected
  const [instituteInfo, setInstituteInfo] = useState(null);

  useEffect(() => {
    const fetchInstituteInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const instituteRef = user?.instituteID;
        const instituteParam = typeof instituteRef === 'object'
          ? (instituteRef._id || instituteRef.instituteID || instituteRef)
          : instituteRef;
        if (!instituteParam) return;
        const response = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(instituteParam)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          // If instituteLogo is a path (not data URL), prepend base URL
          if (data.instituteLogo && !data.instituteLogo.startsWith('data:') && !data.instituteLogo.startsWith('http')) {
            data.instituteLogo = `http://localhost:5000${data.instituteLogo}`;
          }
          console.log('Institute info loaded:', data);
          setInstituteInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch institute info:', err);
      }
    };
    fetchInstituteInfo();
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/timetables-gen/list', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      let list = Array.isArray(data?.items) ? data.items : [];
      // Show all timetables returned by backend
      // Sort: current first, then latest year
      list = list.sort((a, b) => {
        if (a.currentStatus && !b.currentStatus) return -1;
        if (!a.currentStatus && b.currentStatus) return 1;
        return (b.year || 0) - (a.year || 0);
      });
      setItems(list);
      // Auto-select: current if present, else first
      const current = list.find(h => h.currentStatus);
      if (current) setSelected(current);
      else if (list.length) setSelected(list[0]);
      else { setSelected(null); setDetails([]); }
    } catch (e) {
      setError('Failed to load timetables');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetails = useCallback(async (header) => {
    if (!header) return;
    setLoading(true);
    setError('');
    setDetails([]); // Clear immediately to prevent stale data mixing
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/timetables-gen/details/${encodeURIComponent(header.instituteTimeTableID)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDetails(Array.isArray(data?.details) ? data.details : []);
    } catch (e) {
      setError('Failed to load timetable details');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateHeader = useCallback(async (id, updates) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/timetables-gen/header/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // refresh list and selected
      await fetchList();
      if (data?.header) setSelected(data.header);
    } catch (e) {
      setError('Failed to update timetable');
    }
  }, [fetchList]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selected) fetchDetails(selected);
  }, [selected, fetchDetails]);

  // Fallback: if instituteInfo is missing, try fetching via selected header's instituteID
  useEffect(() => {
    const fetchByHeader = async () => {
      if (instituteInfo || !selected?.instituteID) return;
      try {
        const token = localStorage.getItem('token');
        const instId = selected.instituteID;
        const response = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(instId)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          if (data.instituteLogo && !String(data.instituteLogo).startsWith('http') && !String(data.instituteLogo).startsWith('data:')) {
            data.instituteLogo = `http://localhost:5000${data.instituteLogo}`;
          }
          setInstituteInfo(data);
        }
      } catch {}
    };
    fetchByHeader();
  }, [selected, instituteInfo]);

  const generateTimetable = useCallback(() => {
    navigate('/admin/generate-timetable');
  }, [navigate]);

  const handlePrint = useCallback(async () => {
    try {
      // Ensure institute info is loaded
      if (!instituteInfo) {
        // Try refetch quickly if missing
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const instituteRef = user?.instituteID;
          const instituteParam = typeof instituteRef === 'object'
            ? (instituteRef._id || instituteRef.instituteID || instituteRef)
            : instituteRef;
          if (instituteParam) {
            const response = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(instituteParam)}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
              const data = await response.json();
              if (data.instituteLogo && !String(data.instituteLogo).startsWith('http') && !String(data.instituteLogo).startsWith('data:')) {
                data.instituteLogo = `http://localhost:5000${data.instituteLogo}`;
              }
              setInstituteInfo(data);
            }
          }
        }
      }

      // If there's a logo, wait for it to load before printing
      if (instituteInfo?.instituteLogo) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = instituteInfo.instituteLogo;
        });
      }

      // Give the browser a tick to apply print-only styles
      await new Promise(r => setTimeout(r, 50));
      window.print();
    } catch {
      window.print();
    }
  }, [instituteInfo]);

  return (
    <Container fluid className="p-3 p-md-4" style={{ minHeight: '100vh' }}>
      {/* Header Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="mb-4"
      >
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-4">
          <div>
            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem',
              letterSpacing: '-0.5px'
            }}>
              Time Tables Management
            </h2>
            <p style={{ 
              fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
              color: '#6b7280',
              fontWeight: 500,
              marginBottom: 0
            }}>
              Explore all timetables of your institute
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2 no-print">
            {selected && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="success"
                  onClick={handlePrint}
                  className="d-flex align-items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <FaPrint style={{ fontSize: '0.875rem' }} /> Print
                </Button>
              </motion.div>
            )}
            {isAdmin && (
              <>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={generateTimetable}
                    disabled={loading}
                    className="d-flex align-items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      boxShadow: '0 2px 8px rgba(126, 34, 206, 0.25)',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    <FaPlus style={{ fontSize: '0.875rem' }} /> Generate New
                  </Button>
                </motion.div>
                {selected && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={async () => {
                        try {
                          const confirmDel = window.confirm(`Delete timetable ${selected.instituteTimeTableID}? This cannot be undone.`);
                          if (!confirmDel) return;
                          const token = localStorage.getItem('token');
                          const res = await fetch(`http://localhost:5000/api/timetables-gen/${encodeURIComponent(selected.instituteTimeTableID)}`, {
                            method: 'DELETE',
                            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                          });
                          if (!res.ok) throw new Error(await res.text());
                          await fetchList();
                        } catch (e) {
                          setError('Failed to delete timetable');
                        }
                      }}
                      disabled={loading}
                      variant="danger"
                      className="d-flex align-items-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      <FaTrash style={{ fontSize: '0.875rem' }} /> Delete
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-4" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
            }}>
              <Card.Body className="p-3">
                <p className="mb-0" style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {error}</p>
              </Card.Body>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timetable Selector */}
      {items.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-4 no-print"
        >
          <Card className="glass-effect" style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}>
            <Card.Body className="p-3 p-md-4">
              <Form.Group>
                <Form.Label className="mb-2 d-flex align-items-center gap-2" style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                  <FaCalendarAlt style={{ color: '#7e22ce', fontSize: '0.875rem' }} />
                  Select Timetable
                </Form.Label>
                <Form.Select
                  value={selected?.instituteTimeTableID || ''}
                  onChange={(e) => {
                    const selectedId = parseInt(e.target.value);
                    const timetable = items.find(h => h.instituteTimeTableID === selectedId);
                    if (timetable) setSelected(timetable);
                  }}
                  style={{
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                    color: '#111827',
                    fontWeight: 500,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7e22ce';
                    e.target.style.boxShadow = '0 0 0 3px rgba(126, 34, 206, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  {items.map(h => (
                    <option key={h.instituteTimeTableID} value={h.instituteTimeTableID}>
                      Timetable {h.instituteTimeTableID} - {h.session} • {h.year}
                      {h.currentStatus ? ' ⭐ (Current)' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          className="no-print"
        >
          <Card className="text-center glass-effect" style={{
            border: '2px dashed rgba(126, 34, 206, 0.3)',
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)'
          }}>
            <Card.Body>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.3 }}>📅</div>
              <h3 style={{ color: '#6b7280', fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Timetables Found</h3>
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {isAdmin ? 'Click Generate to create your first timetable' : 'No timetables available yet'}
              </p>
              {isAdmin && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={generateTimetable}
                    style={{
                      background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 8px rgba(126, 34, 206, 0.25)'
                    }}
                  >
                    <FaPlus className="me-2" style={{ fontSize: '0.875rem' }} />
                    Generate Timetable
                  </Button>
                </motion.div>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* Timetable Details */}
      {selected && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          id="timetable-print-content"
        >
          <Card className="glass-effect" style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(15px)'
          }}>
            {/* Print Header with Institute Info */}
            {(
              () => {
                let displayName = instituteInfo?.instituteName || selected?.instituteName;
                if (!displayName) {
                  try {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                      const u = JSON.parse(userStr);
                      displayName = u?.instituteName || displayName;
                    }
                  } catch {}
                }
                if (!displayName) displayName = 'Institute';
                const logoUrl = instituteInfo?.instituteLogo || '';
                return (
                  <div className="print-only" style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Institute Logo" style={{ height: '80px', width: '80px', borderRadius: '50%', objectFit: 'cover', marginRight: '18px' }} />
                      ) : null}
                      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0 }}>{displayName}</h1>
                    </div>
                    <div style={{ fontSize: '16px', color: '#6b7280', margin: '18px 0 0 0', textAlign: 'center', width: '100%' }}>
                      Academic Year: {selected.session}
                    </div>
                    <div style={{ position: 'absolute', right: 24, bottom: 8, fontSize: '14px', color: '#9ca3af', textAlign: 'right' }}>
                      Generated on: {new Date(selected.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                );
              }
            )()}

            {/* Card Header */}
            <Card.Header className="no-print" style={{
              background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
              border: 'none',
              padding: '1.25rem 1.5rem'
            }}>
              <Row className="align-items-center">
                <Col xs={12} lg={6}>
                  <div className="d-flex align-items-center gap-3 mb-3 mb-lg-0">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      📚
                    </div>
                    <div>
                      <h4 className="mb-1" style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                        Timetable #{selected.instituteTimeTableID}
                      </h4>
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <Badge bg="light" text="dark" style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px' }}>
                          <FaCalendarAlt className="me-1" style={{ fontSize: '0.75rem' }} />
                          {selected.session} • {selected.year}
                        </Badge>
                        {selected.currentStatus && (
                          <Badge style={{
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            fontSize: '0.8rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: 'none'
                          }}>
                            <FaStar className="me-1" style={{ fontSize: '0.75rem' }} />
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
                
                {isAdmin && (
                  <Col xs={12} lg={6}>
                    <div className="d-flex flex-wrap gap-3 justify-content-lg-end">
                      <Form.Check
                        type="switch"
                        id="visibility-switch"
                        label={
                          <span className="d-flex align-items-center gap-2" style={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>
                            {selected.visibility ? <FaEye style={{ fontSize: '0.875rem' }} /> : <FaEyeSlash style={{ fontSize: '0.875rem' }} />}
                            {selected.visibility ? 'Visible' : 'Hidden'}
                          </span>
                        }
                        checked={!!selected.visibility}
                        onChange={(e) => updateHeader(selected.instituteTimeTableID, { visibility: e.target.checked })}
                      />
                      <Form.Check
                        type="switch"
                        id="current-switch"
                        label={
                          <span className="d-flex align-items-center gap-2" style={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>
                            <FaStar style={{ fontSize: '0.875rem' }} />
                            Current
                          </span>
                        }
                        checked={!!selected.currentStatus}
                        onChange={(e) => updateHeader(selected.instituteTimeTableID, { currentStatus: e.target.checked })}
                      />
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Header>

            <Card.Body className="p-3 p-md-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: '#7e22ce', width: '2.5rem', height: '2.5rem' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3" style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.9rem' }}>Loading timetable details...</p>
                </div>
              ) : (
                <TimetableTables details={details} header={selected} />
              )}
            </Card.Body>
          </Card>
        </motion.div>
      )}
    </Container>
  );
}

export default TimeTable;

// Print styles injected via style tag
if (typeof document !== 'undefined') {
  const styleId = 'timetable-print-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media screen {
        .print-only {
          display: none !important;
        }
      }
      @media print {
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
        #timetable-print-content {
          visibility: visible !important;
          display: block !important;
        }
        @page {
          size: landscape;
          margin: 0.5cm;
        }
      }
    `;
    document.head.appendChild(style);
  }
}


// ============== Helpers & Table Renderer ==============

function normalizeDay(day) {
  if (!day) return '';
  const d = String(day).toLowerCase();
  if (d.startsWith('mon')) return 'Mon';
  if (d.startsWith('tue')) return 'Tue';
  if (d.startsWith('wed')) return 'Wed';
  if (d.startsWith('thu')) return 'Thu';
  if (d.startsWith('fri')) return 'Fri';
  if (d.startsWith('sat')) return 'Sat';
  if (d.startsWith('sun')) return 'Sun';
  return day;
}

function parseStartMinutes(timeRange) {
  // expects HH:MM-HH:MM; returns minutes from 00:00
  if (!timeRange || typeof timeRange !== 'string') return 0;
  const part = timeRange.split('-')[0] || '';
  const [hh, mm] = part.split(':').map(n => parseInt(n, 10));
  if (Number.isFinite(hh) && Number.isFinite(mm)) return hh * 60 + mm;
  return 0;
}

function TimetableTables({ details, header }) {
  if (!Array.isArray(details) || details.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
          borderRadius: '14px',
          border: '2px dashed rgba(126, 34, 206, 0.2)'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }}>📋</div>
        <p style={{ color: '#6b7280', fontWeight: 500, fontSize: '0.95rem' }}>No schedule data available</p>
      </motion.div>
    );
  }

  // Build unique sets
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const baseTimes = Array.from(
    new Set(details.map(d => String(d.time || '')).filter(Boolean))
  ).sort((a, b) => parseStartMinutes(a) - parseStartMinutes(b));

  // Derive a common break window from details if present
  const breakPairs = {};
  for (const d of details) {
    const bs = d.breakStart ? String(d.breakStart) : null;
    const be = d.breakEnd ? String(d.breakEnd) : null;
    if (bs && be) {
      const k = `${bs}-${be}`;
      breakPairs[k] = (breakPairs[k] || 0) + 1;
    }
  }
  let breakStart = null, breakEnd = null;
  if (header?.breakStart && header?.breakEnd) {
    breakStart = String(header.breakStart);
    breakEnd = String(header.breakEnd);
  } else if (Object.keys(breakPairs).length) {
    const top = Object.entries(breakPairs).sort((a, b) => b[1] - a[1])[0][0];
    [breakStart, breakEnd] = top.split('-');
  }

  // Build final column set with an inserted Break column (if detected)
  let allTimes = [...baseTimes];
  if (breakStart && breakEnd) {
    const insertIdx = allTimes.findIndex(t => parseStartMinutes(t) >= parseStartMinutes(`${breakStart}-${breakEnd}`));
    const idx = insertIdx >= 0 ? insertIdx : allTimes.length;
    allTimes = [
      ...allTimes.slice(0, idx),
      { __break: true, label: 'Break', range: `${breakStart}-${breakEnd}` },
      ...allTimes.slice(idx)
    ];
  }

  // Deduplicate by unique key: class+day+time+course+room+instructor
  const seen = new Set();
  const dedupedDetails = [];
  for (const d of details) {
    const key = `${d.class}|${d.day}|${d.time}|${d.course}|${d.roomNumber}|${d.instructorName}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedupedDetails.push(d);
    }
  }

  // Group rows by class
  const classMap = new Map();
  for (const d of dedupedDetails) {
    const klass = String(d.class || 'Unknown');
    const day = normalizeDay(d.day);
    const time = String(d.time || '');
    if (!classMap.has(klass)) classMap.set(klass, []);
    classMap.get(klass).push({ ...d, day, time });
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {Array.from(classMap.entries()).map(([klass, rows], classIndex) => {
        // Index rows for O(1) cell lookup: key = day|time
        const byKey = new Map();
        for (const r of rows) byKey.set(`${r.day}|${r.time}`, r);

        return (
          <motion.div
            key={klass}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: classIndex * 0.1 }}
            style={{
              border: '1px solid rgba(126, 34, 206, 0.15)',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Class Title Header */}
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
              borderBottom: '1px solid rgba(126, 34, 206, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                <FaGraduationCap style={{ color: '#fff' }} />
              </div>
              <h5 style={{
                margin: 0,
                color: '#fff',
                fontWeight: 700,
                fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                letterSpacing: '0.3px'
              }}>
                Class: {klass}
              </h5>
            </div>

            {/* Responsive Table Wrapper */}
            <div className="table-responsive">
              <div style={{
                display: 'grid',
                gridTemplateColumns: `minmax(100px, 160px) repeat(${allTimes.length}, minmax(140px, 1fr))`,
                minWidth: 'fit-content'
              }}>
                {/* Header Row */}
                <div style={{
                  padding: '12px 10px',
                  background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  fontWeight: 700,
                  color: '#374151',
                  fontSize: '0.8rem',
                  borderRight: '1px solid #e5e7eb',
                  borderBottom: '2px solid #7e22ce',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)'
                }}>
                  <FaClock className="me-2" style={{ color: '#7e22ce', fontSize: '0.75rem' }} />
                  Day / Time
                </div>

                {allTimes.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 10px',
                      background: typeof t !== 'string' && t.__break
                        ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
                        : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                      fontWeight: 600,
                      color: typeof t !== 'string' && t.__break ? '#9a3412' : '#374151',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: '2px solid #7e22ce',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    {typeof t !== 'string' && t.__break && <FaClock style={{ fontSize: '0.7rem' }} />}
                    {typeof t === 'string' ? t : (t.__break ? t.range : '')}
                  </div>
                ))}

                {/* Data Rows */}
                {days.map((day, di) => (
                  <React.Fragment key={day}>
                    <div style={{
                      padding: '14px 10px',
                      background: di % 2 === 0
                        ? 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                      fontWeight: 700,
                      color: '#374151',
                      fontSize: '0.85rem',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: di === days.length - 1 ? 'none' : '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      boxShadow: '2px 0 4px rgba(0, 0, 0, 0.03)'
                    }}>
                      <FaCalendarAlt style={{ color: '#7e22ce', fontSize: '0.75rem' }} />
                      {day}
                    </div>

                    {allTimes.map((t, i) => {
                      if (typeof t !== 'string' && t.__break) {
                        if (di === 0) {
                          return (
                            <div
                              key={`break-col-${i}`}
                              style={{
                                padding: '14px 10px',
                                background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                                textAlign: 'center',
                                color: '#9a3412',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                gridRow: `span ${days.length}`,
                                borderRight: '1px solid #fdba74',
                                borderLeft: '2px solid #fb923c',
                                boxShadow: 'inset 0 2px 4px rgba(154, 52, 18, 0.1)'
                              }}
                            >
                              <FaClock style={{ fontSize: '0.75rem' }} />
                              Break Time
                            </div>
                          );
                        }
                        return null;
                      }

                      const row = byKey.get(`${day}|${t}`);
                      return (
                        <div
                          key={`${day}-${i}`}
                          style={{
                            padding: row ? '12px' : '16px',
                            background: di % 2 === 0 ? '#ffffff' : '#fafafa',
                            borderRight: '1px solid #e5e7eb',
                            borderBottom: di === days.length - 1 ? 'none' : '1px solid #e5e7eb',
                            minHeight: row ? '100px' : '80px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (row) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(126, 34, 206, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)';
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(126, 34, 206, 0.15)';
                              e.currentTarget.style.zIndex = '3';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (row) {
                              e.currentTarget.style.background = di % 2 === 0 ? '#ffffff' : '#fafafa';
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.zIndex = '0';
                            }
                          }}
                        >
                          {row ? (
                            <div style={{
                              position: 'relative',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}>
                              {/* Room Number */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: '#7e22ce',
                                background: 'rgba(126, 34, 206, 0.1)',
                                padding: '3px 6px',
                                borderRadius: '5px',
                                width: 'fit-content'
                              }}>
                                <FaDoorOpen style={{ fontSize: '0.65rem' }} />
                                {row.roomNumber}
                              </div>

                              {/* Course Name */}
                              <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#111827',
                                textAlign: 'center',
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: '1.2',
                                padding: '2px 0'
                              }}>
                                {row.course}
                              </div>

                              {/* Instructor Name */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: '#6b7280',
                                background: 'rgba(107, 114, 128, 0.08)',
                                padding: '3px 6px',
                                borderRadius: '5px'
                              }}>
                                <FaChalkboardTeacher style={{ fontSize: '0.65rem' }} />
                                {row.instructorName}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
