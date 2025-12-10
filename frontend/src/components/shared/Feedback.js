import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, ListGroup, Modal, Form, Overlay } from 'react-bootstrap';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaComments, FaPlus, FaSearch, FaFilter, FaCheck, FaTimes, FaPaperPlane } from 'react-icons/fa';

const Feedback = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterTarget, setFilterTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null); // feedbackID
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newIssue, setNewIssue] = useState('');
  const [targetUserID, setTargetUserID] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const isAdmin = (user?.designation === 'Admin');

  const canStartThread = isAdmin || true; // non-admin can start own thread

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/feedback/threads');
      setThreads(Array.isArray(res.data) ? res.data : []);
      // auto-select first if none active
      if (!active && res.data && res.data.length) {
        setActive(res.data[0].feedbackID);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load feedback list');
    } finally {
      setLoading(false);
    }
  }, [active]);

  const loadMessages = async (feedbackID) => {
    if (!feedbackID) return;
    try {
      const res = await axios.get(`/api/feedback/threads/${feedbackID}/messages`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setMessages([]);
    }
  };

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { if (active) loadMessages(active); }, [active]);

  const activeThread = useMemo(() => threads.find(t => t.feedbackID === active) || null, [threads, active]);

  const handleSend = async () => {
    if (!text.trim() || !active) return;
    setSending(true);
    try {
      const res = await axios.post(`/api/feedback/threads/${active}/messages`, { message: text.trim() });
      setMessages(prev => [...prev, res.data]);
      setText('');
    } catch (e) {
      // noop UI
    } finally {
      setSending(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newIssue.trim()) return;
    try {
      const payload = isAdmin ? { issue: newIssue.trim(), userID: Number(targetUserID) } : { issue: newIssue.trim() };
      const res = await axios.post('/api/feedback/threads', payload);
      setShowNew(false);
      setNewIssue('');
      setTargetUserID('');
      await loadThreads();
      setActive(res.data.feedbackID);
    } catch (e) {
      // keep modal open for correction
    }
  };

  // Admin: load institute users for targeting new thread
  const [usersList, setUsersList] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;
      try {
        const res = await axios.get('/api/users/institute');
        setUsersList(Array.isArray(res.data) ? res.data : []);
      } catch {}
    };
    fetchUsers();
  }, [isAdmin]);

  return (
    <div style={{ minHeight: '100vh', padding: isMobile ? '1rem 0' : '2rem 0' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            width: isMobile ? '40px' : '50px',
            height: isMobile ? '40px' : '50px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaComments style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', color: 'white' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '1.875rem',
              fontWeight: '700',
              color: '#7c3aed',
              margin: 0
            }}>Feedback & Messages</h1>
            <p style={{ color: '#6b7280', fontSize: isMobile ? '0.75rem' : '0.875rem', margin: 0 }}>
              Manage conversations with your team
            </p>
          </div>
        </div>
      </div>

      <div className="d-flex flex-column flex-lg-row gap-3" style={{ minHeight: isMobile ? 'auto' : 600 }}>
        {/* Threads list */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: isMobile ? '100%' : 380, maxWidth: '100%' }}
        >
          {/* Search and New Button */}
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <FaSearch style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#7c3aed',
                fontSize: '0.875rem'
              }} />
              <Form.Control
                type="text"
                placeholder={isMobile ? "Search..." : "Search conversations..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '2.5rem',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
                className="gradient-border-input"
              />
            </div>
            {canStartThread && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNew(true)}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '0.6rem 0.9rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                <FaPlus /> New
              </motion.button>
            )}
          </div>

          {/* Filter Button */}
          <div style={{ marginBottom: '1rem' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              ref={setFilterTarget}
              onClick={() => setShowFilterMenu(s => !s)}
              style={{
                background: 'white',
                border: '2px solid #e5e7eb',
                color: '#374151',
                borderRadius: '10px',
                padding: '0.6rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <span><FaFilter style={{ marginRight: '0.5rem' }} />Filter by Month</span>
              <span style={{ fontSize: '1.1rem' }}>⋮</span>
            </motion.button>
            <Overlay target={filterTarget} show={showFilterMenu} placement="bottom-start" rootClose onHide={() => setShowFilterMenu(false)}>
              {(props) => (
                <div {...props} style={{ ...props.style, zIndex: 2000 }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    minWidth: 280,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '1rem',
                      borderBottom: '1px solid #e5e7eb',
                      fontWeight: 600,
                      color: '#7c3aed',
                      fontSize: '0.875rem'
                    }}>Filter by Month</div>
                    <div style={{ padding: '1rem' }}>
                      <Form.Select
                        size="sm"
                        value={monthFilter}
                        onChange={e => { setMonthFilter(e.target.value); e.target.blur(); }}
                        style={{
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          fontSize: '0.875rem',
                          marginBottom: '1rem'
                        }}
                      >
                        <option value="All">All Months</option>
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
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setMonthFilter('All'); setShowFilterMenu(false); }}
                          style={{
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            color: '#374151',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            flex: 1
                          }}
                        >
                          <FaTimes style={{ marginRight: '0.25rem' }} />Reset
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowFilterMenu(false)}
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            flex: 1
                          }}
                        >
                          <FaCheck style={{ marginRight: '0.25rem' }} />Apply
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Overlay>
          </div>

          {/* Threads List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card style={{
              borderRadius: '16px',
              border: '2px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
              background: '#ffffff'
            }}>
              <ListGroup variant="flush" style={{ background: 'transparent' }}>
                {error ? (
                  <ListGroup.Item style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#dc2626',
                    background: '#fee2e2',
                    borderRadius: '12px',
                    margin: '1rem',
                    border: 'none'
                  }}>
                    <FaTimes style={{ marginRight: '0.5rem' }} />
                    {error}
                  </ListGroup.Item>
                ) : loading ? (
                  <ListGroup.Item style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#7c3aed',
                    fontWeight: '600',
                    background: 'transparent',
                    border: 'none'
                  }}>
                    Loading conversations…
                  </ListGroup.Item>
                ) : threads.length === 0 ? (
                  <ListGroup.Item style={{
                    padding: isMobile ? '1.5rem' : '2rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    background: 'transparent',
                    border: 'none'
                  }}>
                    <FaComments style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                    <div>No conversations yet</div>
                  </ListGroup.Item>
                ) : (
                  threads
                    .filter(t => {
                      if (monthFilter === 'All') return true;
                      const d = new Date(t.issueDate);
                      const mm = (d.getMonth() + 1).toString();
                      return mm === monthFilter;
                    })
                    .filter(t => {
                      const q = searchTerm.trim().toLowerCase();
                      if (!q) return true;
                      const name = String(t.user?.userName || '').toLowerCase();
                      const title = String(t.title || '').toLowerCase();
                      return name.includes(q) || title.includes(q);
                    })
                    .map((t, idx) => (
                      <motion.div
                        key={t.feedbackID}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        style={{ padding: isMobile ? '0.5rem' : '0.5rem 0.75rem' }}
                      >
                        <ListGroup.Item
                          action
                          onClick={() => setActive(t.feedbackID)}
                          style={{
                            background: t.feedbackID === active 
                              ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)'
                              : 'white',
                            border: t.feedbackID === active
                              ? '2px solid #7c3aed'
                              : '2px solid #e5e7eb',
                            borderRadius: '14px',
                            padding: isMobile ? '0.875rem' : '1rem',
                            margin: 0,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: t.feedbackID === active
                              ? '0 6px 16px rgba(124, 58, 237, 0.25)'
                              : '0 2px 4px rgba(0, 0, 0, 0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            if (t.feedbackID !== active) {
                              e.currentTarget.style.background = '#f9fafb';
                              e.currentTarget.style.borderColor = '#d1d5db';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (t.feedbackID !== active) {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                            }
                          }}
                        >
                          <div style={{
                            fontWeight: 700,
                            color: t.feedbackID === active ? '#7c3aed' : '#111827',
                            marginBottom: '0.5rem',
                            fontSize: isMobile ? '0.875rem' : '0.95rem',
                            lineHeight: 1.4
                          }}>
                            {t.title}
                          </div>
                          <div style={{
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: '#6b7280',
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                          }}>
                            <span style={{ 
                              fontWeight: 600,
                              color: t.feedbackID === active ? '#7c3aed' : '#374151'
                            }}>
                              {t.user?.userName || 'User'}
                            </span>
                            <span style={{ opacity: 0.4 }}>•</span>
                            <span>{t.user?.designation || ''}</span>
                            <span style={{ opacity: 0.4 }}>•</span>
                            <span>{new Date(t.issueDate).toLocaleDateString()}</span>
                          </div>
                        </ListGroup.Item>
                      </motion.div>
                    ))
                )}
              </ListGroup>
            </Card>
          </motion.div>
        </motion.div>

        {/* Chat Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-grow-1"
        >
          {/* Chat Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              marginBottom: '1.5rem',
              padding: isMobile ? '1rem' : '1.5rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '2px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08)'
            }}
          >
            <div style={{
              fontWeight: 800,
              fontSize: isMobile ? '1.125rem' : '1.375rem',
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.75rem'
            }}>
              {activeThread?.title || 'Select a conversation'}
            </div>
            {activeThread && (
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: '#6b7280',
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <span style={{
                  fontWeight: 700,
                  color: '#7c3aed',
                  background: 'rgba(124, 58, 237, 0.1)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {activeThread.user?.userName || 'User'}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{
                  background: '#f3f4f6',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.7rem' : '0.8rem'
                }}>
                  {activeThread.user?.designation || ''}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{
                  color: '#9ca3af',
                  fontSize: isMobile ? '0.7rem' : '0.8rem'
                }}>
                  {new Date(activeThread.issueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </motion.div>

          {/* Messages Area */}
          <Card style={{
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 400 : 520,
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 8px 16px rgba(124, 58, 237, 0.08)',
            overflow: 'hidden',
            background: 'white'
          }}>
            <Card.Body style={{
              overflowY: 'auto',
              padding: isMobile ? '1rem' : '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'linear-gradient(180deg, #fafbfc 0%, #ffffff 100%)',
              flex: 1
            }}>
              {(!messages || messages.length === 0) ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#9ca3af',
                  textAlign: 'center'
                }}>
                  <div>
                    <FaComments style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.875rem' }}>No messages yet. Start the conversation!</div>
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const mine = (isAdmin && m.sender === 'Admin') || (!isAdmin && m.sender !== 'Admin');
                  return (
                    <motion.div
                      key={m.messageID}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div style={{
                        background: mine
                          ? 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)'
                          : '#ffffff',
                        color: mine ? 'white' : '#111827',
                        borderRadius: mine ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                        padding: '0.875rem 1.25rem',
                        maxWidth: '70%',
                        boxShadow: mine
                          ? '0 6px 20px rgba(124, 58, 237, 0.35)'
                          : '0 2px 8px rgba(0, 0, 0, 0.08)',
                        border: !mine ? '1.5px solid #e5e7eb' : 'none'
                      }}>
                        <div style={{
                          fontSize: '0.95rem',
                          lineHeight: 1.5,
                          wordWrap: 'break-word'
                        }}>
                          {m.message}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          opacity: mine ? 0.8 : 0.6,
                          marginTop: '0.5rem',
                          fontWeight: 500
                        }}>
                          {new Date(m.date || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </Card.Body>
            <Card.Footer className={`${isMobile ? 'p-3' : 'p-md-4'}`} style={{
              background: 'white',
              borderTop: '2px solid #e5e7eb'
            }}>
              <Form.Group className="mb-0">
                <div className={`d-flex ${isMobile ? 'flex-column gap-2' : 'flex-md-row gap-md-3'}`}>
                  <Form.Control
                    as="textarea"
                    rows={1}
                    placeholder={active ? "Type your message..." : "Select a conversation"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    disabled={!active}
                    className="gradient-border-input flex-grow-1"
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      fontSize: '0.875rem',
                      padding: '0.875rem 1rem',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      resize: 'none',
                      minHeight: '48px'
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: active && !sending && text.trim() ? 1.05 : 1 }}
                    whileTap={{ scale: active && !sending && text.trim() ? 0.95 : 1 }}
                    onClick={handleSend}
                    disabled={!active || sending || !text.trim()}
                    className={`btn ${isMobile ? 'w-100' : 'w-md-auto'}`}
                    style={{
                      background: (active && !sending && text.trim())
                        ? 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)'
                        : '#d1d5db',
                      border: 'none',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '0.875rem 2rem',
                      cursor: (active && !sending && text.trim()) ? 'pointer' : 'not-allowed',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s',
                      boxShadow: (active && !sending && text.trim())
                        ? '0 6px 20px rgba(124, 58, 237, 0.4)'
                        : 'none',
                      minHeight: '48px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <FaPaperPlane /> {sending ? 'Sending…' : 'Send'}
                  </motion.button>
                </div>
              </Form.Group>
            </Card.Footer>
          </Card>
        </motion.div>
      </div>

      {/* New Conversation Modal */}
      <Modal show={showNew} onHide={() => setShowNew(false)} centered>
        <Form onSubmit={handleCreate}>
          <Modal.Header style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
            borderBottom: 'none',
            padding: '1.5rem'
          }} closeButton>
            <Modal.Title style={{ color: 'white', fontWeight: '700' }}>
              <FaComments style={{ marginRight: '0.5rem' }} />
              Start New Conversation
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '2rem', background: 'white' }}>
            {isAdmin && (
              <Form.Group style={{ marginBottom: '1.5rem' }}>
                <Form.Label style={{
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>Recipient</Form.Label>
                <Form.Select
                  value={targetUserID}
                  onChange={e => { setTargetUserID(e.target.value); e.target.blur(); }}
                  required
                  style={{
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '0.875rem',
                    padding: '0.75rem'
                  }}
                  className="gradient-border-input"
                >
                  <option value="">Select a user</option>
                  {usersList.map(u => (
                    <option key={u.userID} value={u.userID}>{u.userName} • {u.designation}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group>
              <Form.Label style={{
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>Title / First Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newIssue}
                onChange={(e) => setNewIssue(e.target.value)}
                required
                placeholder="Describe your issue or concern..."
                style={{
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.875rem',
                  padding: '0.75rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                className="gradient-border-input"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{
            borderTop: '1px solid #e5e7eb',
            padding: '1.5rem',
            gap: '0.75rem',
            background: 'white'
          }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNew(false)}
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#374151',
                borderRadius: '10px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '10px',
                padding: '0.75rem 2rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <FaPlus style={{ marginRight: '0.5rem' }} />
              Create Conversation
            </motion.button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .gradient-border-input:focus {
          outline: none !important;
          box-shadow: none !important;
          border: 2px solid transparent !important;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%) border-box !important;
        }
      `}</style>
    </div>
  );
};

export default Feedback;