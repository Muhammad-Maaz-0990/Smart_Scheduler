import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Button, ListGroup, Modal, Form, Row, Col, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Feedback = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null); // feedbackID
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newIssue, setNewIssue] = useState('');
  const [targetUserID, setTargetUserID] = useState('');
  const isAdmin = (user?.designation === 'Admin');

  const canStartThread = isAdmin || true; // non-admin can start own thread

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
    <div className="d-flex gap-3" style={{ minHeight: 520 }}>
      {/* Threads list */}
      <div style={{ width: 380, maxWidth: '100%' }}>
        <Card className="glass-effect mb-3">
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
              <div className="dashboard-title mb-0" style={{ fontSize: 20 }}>Feedback</div>
              <div className="dashboard-subtitle">Conversations</div>
            </div>
            {canStartThread && (
              <Button size="sm" variant="primary" className="btn-futuristic" onClick={() => setShowNew(true)}>New</Button>
            )}
          </Card.Body>
        </Card>

        <Card className="glass-effect">
          <ListGroup variant="flush">
            {error ? (
              <ListGroup.Item className="text-danger">{error}</ListGroup.Item>
            ) : loading ? (
              <ListGroup.Item>Loading…</ListGroup.Item>
            ) : threads.length === 0 ? (
              <ListGroup.Item>No conversations</ListGroup.Item>
            ) : (
              threads.map(t => (
                <ListGroup.Item
                  key={t.feedbackID}
                  action
                  active={t.feedbackID === active}
                  onClick={() => setActive(t.feedbackID)}
                >
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {t.user?.userName || 'User'} • {t.user?.designation || ''} • {new Date(t.issueDate).toLocaleString()}
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Card>
      </div>

      {/* Active chat */}
      <div className="flex-grow-1">
        <Card className="glass-effect mb-3">
          <Card.Body>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{activeThread?.title || 'Select a conversation'}</div>
            {activeThread && (
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {activeThread.user?.userName || 'User'} • {activeThread.user?.designation || ''} • {new Date(activeThread.issueDate).toLocaleString()}
              </div>
            )}
          </Card.Body>
        </Card>

        <Card className="glass-effect" style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
          <Card.Body style={{ overflowY: 'auto' }}>
            {(!messages || messages.length === 0) ? (
              <div style={{ opacity: 0.7 }}>No messages yet</div>
            ) : (
              messages.map(m => {
                const mine = (isAdmin && m.sender === 'Admin') || (!isAdmin && m.sender !== 'Admin');
                return (
                  <div key={m.messageID} className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'}`} style={{ marginBottom: 8 }}>
                    <div style={{
                      background: mine ? '#667eea' : 'rgba(255,255,255,0.15)',
                      color: mine ? 'white' : 'white',
                      borderRadius: 12,
                      padding: '8px 12px',
                      maxWidth: '70%'
                    }}>
                      <div style={{ fontSize: 14 }}>{m.message}</div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>{new Date(m.date || m.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </Card.Body>
          <Card.Footer>
            <InputGroup>
              <Form.Control
                placeholder="Type a message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                disabled={!active}
              />
              <Button onClick={handleSend} disabled={!active || sending || !text.trim()}>
                Send
              </Button>
            </InputGroup>
          </Card.Footer>
        </Card>
      </div>

      {/* New conversation modal */}
      <Modal show={showNew} onHide={() => setShowNew(false)} centered>
        <Form onSubmit={handleCreate}>
          <Modal.Header closeButton>
            <Modal.Title>New Conversation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {isAdmin && (
              <Row className="mb-3">
                <Col>
                  <Form.Label>Recipient</Form.Label>
                  <Form.Select value={targetUserID} onChange={(e) => setTargetUserID(e.target.value)} required>
                    <option value="">Select a user</option>
                    {usersList.map(u => (
                      <option key={u.userID} value={u.userID}>{u.userName} • {u.designation}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            )}
            <Form.Group>
              <Form.Label>Title / First message</Form.Label>
              <Form.Control as="textarea" rows={3} value={newIssue} onChange={(e) => setNewIssue(e.target.value)} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Feedback;
