import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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

  // Resolve active user's email for header
  const activeUserEmail = useMemo(() => {
    if (!activeThread) return '';
    if (isAdmin) {
      const u = usersList.find(u => u.userID === activeThread.userID);
      return u?.email || '';
    }
    return user?.email || '';
  }, [isAdmin, usersList, activeThread, user]);

  // ===== Simple chat helpers =====
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    // Disabled to prevent initial scroll jump
    // try {
    //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // } catch {}
  };

  // Disabled auto-scroll to prevent page jump on load
  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages, active]);

  const formatDateLabel = (d) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const groupByDate = (list) => {
    const groups = {};
    list.forEach(m => {
      const key = new Date(m.date || m.createdAt).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.entries(groups)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]));
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ 
          marginBottom: isMobile ? '0.5rem' : '1rem', 
          padding: '1rem 0',
          minHeight: '82px',
          borderBottom: '1px solid rgba(17, 24, 39, 0.08)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{
            width: isMobile ? '40px' : '50px',
            height: isMobile ? '40px' : '50px',
            borderRadius: '12px',
            background: 'var(--theme-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(105, 65, 219, 0.3)',
            flexShrink: 0
          }}>
            <FaComments style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', color: 'white' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--theme-color)',
              lineHeight: '1.2',
              margin: 0
            }}>Feedback & Messages</h1>
            <p style={{ color: 'var(--theme-color)', fontSize: isMobile ? '0.75rem' : 'clamp(0.85rem, 1.8vw, 0.95rem)', margin: 0, fontWeight: '600' }}>
              Manage conversations with your team
            </p>
          </div>
        </div>
      </motion.div>

      <div className="d-flex flex-column flex-lg-row gap-3" style={{ minHeight: 'auto', flex: 1, overflow: 'hidden' }}>
        {/* Threads list */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{ width: isMobile ? '100%' : 450, maxWidth: '100%' }}
        >
          {/* Search and New Button */}
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', alignItems: 'stretch' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <FaSearch style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--theme-color)',
                fontSize: '0.875rem'
              }} />
              <Form.Control
                type="text"
                placeholder={isMobile ? "Search..." : "Search conversations..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  height: '44px',
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
                  background: 'var(--theme-color)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '10px',
                  height: '44px',
                  padding: '0 1rem',
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
                      color: 'var(--theme-color)',
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
                            background: 'var(--theme-color)',
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card style={{
              borderRadius: '16px',
              border: '2px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              background: '#ffffff',
              height: 'calc(100vh - 200px)',
              maxHeight: '650px',
              minHeight: '350px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <ListGroup variant="flush" style={{ 
                background: 'transparent',
                overflowY: 'auto',
                flex: 1
              }}>
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
                    color: 'var(--theme-color)',
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ListGroup.Item
                          action
                          onClick={() => setActive(t.feedbackID)}
                          style={{
                            background: t.feedbackID === active ? 'var(--theme-color-light)' : 'white',
                            border: t.feedbackID === active ? '2px solid var(--theme-color)' : '1px solid #e9ecef',
                            borderRadius: t.feedbackID === active ? '12px' : 0,
                            padding: '1rem',
                            margin: 0,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            boxShadow: t.feedbackID === active ? '0 2px 8px rgba(105, 65, 219, 0.15)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (t.feedbackID !== active) {
                              e.currentTarget.style.background = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (t.feedbackID !== active) {
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          {/* WhatsApp-style layout: avatar left, content middle, time right */}
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            {/* Avatar */}
                            <div style={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--theme-color) 0%, var(--theme-color) 100%)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              flexShrink: 0
                            }}>
                              {(t.user?.userName || 'U').slice(0, 1).toUpperCase()}
                            </div>

                            {/* Middle: name and message preview */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontWeight: 600,
                                color: '#111827',
                                fontSize: '0.95rem',
                                marginBottom: '0.25rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {t.user?.userName || 'User'}
                              </div>
                              <div style={{
                                fontSize: '0.85rem',
                                color: '#9ca3af',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {t.title}
                              </div>
                            </div>

                            {/* Right: date and designation stacked */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: '0.25rem',
                              flexShrink: 0,
                              minWidth: '70px'
                            }}>
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                whiteSpace: 'nowrap'
                              }}>
                                {new Date(t.issueDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                              </div>
                              <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--theme-color)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}>
                                {t.user?.designation || ''}
                              </div>
                            </div>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-grow-1"
        >
          {/* Chat Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              marginBottom: '0.75rem',
              padding: isMobile ? '0.75rem' : '1rem',
              borderRadius: '16px',
              background: 'white',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Top row removed to reduce header height */}

            {/* Second row: whose conversation */}
            {activeThread && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {/* Left: circular profile + name/email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'white',
                    color: 'var(--theme-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    border: '2px solid var(--theme-color)'
                  }}>
                    {(activeThread.user?.userName || 'U').slice(0,1).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{
                      fontWeight: 800,
                      color: '#111827',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {activeThread.user?.userName || 'User'}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: '#6b7280',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {activeUserEmail || '—'}
                    </div>
                    {/* Title below profile and email */}
                    <div style={{
                      marginTop: '2px',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      <span style={{ fontWeight: 800 }}>Title: </span>
                      <span style={{ fontWeight: 400 }}>{activeThread.title || ''}</span>
                    </div>
                  </div>
                </div>

                {/* Center title removed per request; title shown on left */}

                {/* Right: identifier (role) top-right and first interaction time bottom-right */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <span style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    color: 'var(--theme-color)',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 8,
                    fontSize: isMobile ? '0.7rem' : '0.8rem'
                  }}>
                    {activeThread.user?.designation || ''}
                  </span>
                  <span style={{
                    color: '#6b7280',
                    fontSize: isMobile ? '0.7rem' : '0.8rem'
                  }}>
                    First interacted {new Date(activeThread.issueDate).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}

            {/* Removed quick stats row per request */}
          </motion.div>

          {/* Messages Area */}
          <Card style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 200px)',
            maxHeight: '650px',
            minHeight: '350px',
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden',
            background: 'white'
          }}>
            <Card.Body style={{
              overflowY: 'auto',
              padding: isMobile ? '1rem' : '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: '#ffffff',
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
                    <FaComments style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.9rem' }}>No messages yet. Start the conversation.</div>
                  </div>
                </div>
              ) : (
                groupByDate(messages).map(([dateKey, items]) => (
                  <div key={dateKey}>
                    {/* Date separator */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      margin: '0.25rem 0 0.5rem'
                    }}>
                      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        fontWeight: 600
                      }}>{formatDateLabel(dateKey)}</div>
                      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    </div>

                    {items.map((m) => {
                      const mine = (isAdmin && m.sender === 'Admin') || (!isAdmin && m.sender !== 'Admin');
                      const senderLabel = m.sender === 'Admin' ? 'Admin' : (activeThread?.user?.userName || 'User');
                      const timeLabel = new Date(m.date || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <motion.div
                          key={m.messageID}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.12 }}
                          className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'}`}
                          style={{ margin: '0.15rem 0' }}
                        >
                          <div style={{
                            maxWidth: '72%',
                            background: mine ? 'var(--theme-color)' : '#f9fafb',
                            color: mine ? 'white' : '#111827',
                            borderRadius: 12,
                            padding: '0.6rem 0.75rem',
                            border: mine ? 'none' : '1px solid #e5e7eb'
                          }}>
                            <div style={{
                              fontSize: '0.75rem',
                              color: mine ? '#e5e7eb' : '#6b7280',
                              fontWeight: 700,
                              marginBottom: '0.25rem'
                            }}>
                              {senderLabel}
                            </div>
                            <div style={{
                              fontSize: '0.95rem',
                              lineHeight: 1.5,
                              wordWrap: 'break-word'
                            }}>
                              {m.message}
                            </div>
                            <div style={{
                              fontSize: '0.7rem',
                              color: mine ? '#e5e7eb' : '#6b7280',
                              marginTop: '0.4rem',
                              fontWeight: 500
                            }}>
                              {timeLabel}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
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
                        ? 'var(--theme-color)'
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
            background: 'var(--theme-color)',
            borderBottom: 'none',
            padding: '1.5rem'
          }} closeButton closeVariant="white">
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
                background: 'var(--theme-color)',
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
          border: 2px solid var(--theme-color) !important;
          background: white !important;
        }
      `}</style>
    </div>
  );
};

export default Feedback;
