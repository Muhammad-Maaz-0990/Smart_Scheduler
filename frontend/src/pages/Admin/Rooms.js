import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Rooms = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [instituteObjectId, setInstituteObjectId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentRoom, setCurrentRoom] = useState({
    roomNumber: '',
    roomStatus: 'Class'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const instituteRef = user?.instituteID;
      const rawParam = typeof instituteRef === 'object' && instituteRef !== null ? instituteRef._id : instituteRef;

      if (!rawParam) {
        setError('Institute ID not found');
        return;
      }
      
      // Resolve to ObjectId if a business key was provided
      let resolvedInstituteId = rawParam;
      const looksLikeObjectId = /^[a-fA-F0-9]{24}$/.test(String(rawParam));
      if (!looksLikeObjectId) {
        const instResp = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(rawParam)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!instResp.ok) {
          const errData = await instResp.json().catch(() => ({}));
          setError(errData.message || 'Failed to resolve institute');
          return;
        }
        const inst = await instResp.json();
        resolvedInstituteId = inst?._id;
        if (!resolvedInstituteId) {
          setError('Institute not found');
          return;
        }
        setInstituteObjectId(resolvedInstituteId);
      } else {
        setInstituteObjectId(resolvedInstituteId);
      }

      const response = await fetch(`http://localhost:5000/api/rooms?instituteID=${encodeURIComponent(resolvedInstituteId)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to fetch rooms');
      }
    } catch (err) {
      setError('Failed to fetch rooms');
    }
  };

  const handleShowModal = (mode, room = null) => {
    setModalMode(mode);
    if (mode === 'edit' && room) {
      setCurrentRoom(room);
    } else {
      setCurrentRoom({ roomNumber: '', roomStatus: 'Class' });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentRoom({ roomNumber: '', roomStatus: 'Class' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = modalMode === 'add' 
        ? 'http://localhost:5000/api/rooms'
        : `http://localhost:5000/api/rooms/${currentRoom._id}`;
      
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      
      const token = localStorage.getItem('token');
      const resolvedInstituteId = instituteObjectId || (() => {
        const ref = user?.instituteID;
        return (typeof ref === 'object' && ref !== null) ? ref._id : ref;
      })();

      if (!resolvedInstituteId) {
        setError('Institute ID not resolved');
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...currentRoom,
          instituteID: resolvedInstituteId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Room ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
        fetchRooms();
        setTimeout(() => {
          handleCloseModal();
          setSuccess('');
        }, 1500);
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Room deleted successfully');
        fetchRooms();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Delete failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <>
      <Sidebar activeMenu="rooms" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>

        <Container fluid className="dashboard-content">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
            <div>
              <h2 className="dashboard-title mb-2">🏢 Rooms Management</h2>
              <p className="dashboard-subtitle mb-0">Manage all rooms in your institute</p>
            </div>
            <Button 
            variant="primary" 
            className="btn-futuristic"
            onClick={() => handleShowModal('add')}
          >
            <span className="btn-icon">➕</span> Add Room
          </Button>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

        <Card className="glass-effect">
          <Card.Body>
            <Table responsive hover className="table-custom">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Room Number</th>
                  <th>Room Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">No rooms found. Add your first room!</td>
                  </tr>
                ) : (
                  rooms.map((room, index) => (
                    <tr key={room._id}>
                      <td>{index + 1}</td>
                      <td>{room.roomNumber}</td>
                      <td>
                        <span className={`badge ${room.roomStatus === 'Lab' ? 'bg-info' : 'bg-success'}`}>
                          {room.roomStatus}
                        </span>
                      </td>
                      <td>
                        <Button 
                          variant="warning" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleShowModal('edit', room)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDelete(room._id)}
                        >
                          🗑️ Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </div>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="glass-effect">
          <Modal.Title>{modalMode === 'add' ? 'Add New Room' : 'Edit Room'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass-effect">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Room Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter room number (e.g., R101, Lab-01)"
                value={currentRoom.roomNumber}
                onChange={(e) => setCurrentRoom({ ...currentRoom, roomNumber: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Room Status</Form.Label>
              <Form.Select
                value={currentRoom.roomStatus}
                onChange={(e) => setCurrentRoom({ ...currentRoom, roomStatus: e.target.value })}
                required
              >
                <option value="Class">Class</option>
                <option value="Lab">Lab</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="btn-futuristic">
                {modalMode === 'add' ? 'Add Room' : 'Update Room'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Rooms;
