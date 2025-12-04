import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Classes = () => {
  const { instituteObjectId } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentClass, setCurrentClass] = useState({
    degree: '',
    session: 'Fall',
    section: 'A',
    year: '',
    rank: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({ session: 'All', section: 'All', year: '', rank: '' });

  useEffect(() => {
    if (instituteObjectId) {
      fetchClasses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instituteObjectId]);

  const fetchClasses = async () => {
    if (!instituteObjectId) {
      setError('Institute ID not found');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/classes/${instituteObjectId}`);
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (err) {
      setError('Failed to fetch classes');
    }
  };

  const handleShowModal = (mode, classData = null) => {
    setModalMode(mode);
    if (mode === 'edit' && classData) {
      setCurrentClass(classData);
    } else {
      setCurrentClass({ degree: '', session: 'Fall', section: 'A', year: '', rank: 1 });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentClass({ degree: '', session: 'Fall', section: 'A', year: '', rank: 1 });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = modalMode === 'add' 
        ? 'http://localhost:5000/api/classes'
        : `http://localhost:5000/api/classes/${currentClass._id}`;
      
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentClass,
          instituteID: instituteObjectId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Class ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
        fetchClasses();
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

  const handleDelete = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Class deleted successfully');
        fetchClasses();
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
      <Sidebar activeMenu="classes" />
      <div className="dashboard-page">
        <div className="bg-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

        <Container fluid className="dashboard-content">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h2 className="dashboard-title">👥 Classes Management</h2>
              <p className="dashboard-subtitle">Manage all classes in your institute</p>
            </div>
            <Button 
            variant="primary" 
            className="btn-futuristic"
            onClick={() => handleShowModal('add')}
          >
            <span className="btn-icon">➕</span> Add Class
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 mb-3">
          <Form.Control
            type="text"
            placeholder="Search by Class Name (Degree)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 420 }}
          />
          <div className="position-relative" style={{ minWidth: 160 }}>
            <Button variant="light" className="border" onClick={() => setShowFilterMenu(s => !s)}>⋮</Button>
            {showFilterMenu && (
              <div className="card shadow-sm" style={{ position: 'absolute', right: 0, zIndex: 10, minWidth: 280 }}>
                <div className="card-body p-2">
                  <div className="mb-2" style={{ fontWeight: 600 }}>Filter Options</div>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1">Session</Form.Label>
                    <Form.Select size="sm" value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })} style={{ color: '#000' }}>
                      <option value="All">All</option>
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1">Section</Form.Label>
                    <Form.Select size="sm" value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })} style={{ color: '#000' }}>
                      <option value="All">All</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1">Year</Form.Label>
                    <Form.Control size="sm" type="text" placeholder="e.g. 2025" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1">Rank</Form.Label>
                    <Form.Control size="sm" type="number" min="" placeholder="1-8" value={filters.rank} onChange={(e) => setFilters({ ...filters, rank: e.target.value })} />
                  </Form.Group>
                  <div className="d-flex justify-content-end gap-2 mt-2">
                    <Button size="sm" variant="secondary" onClick={() => { setFilters({ session: 'All', section: 'All', year: '', rank: '' }); setShowFilterMenu(false); }}>Reset</Button>
                    <Button size="sm" variant="primary" onClick={() => setShowFilterMenu(false)}>Apply</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

        <Card className="glass-effect">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="table-custom mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Degree</th>
                  <th>Session</th>
                  <th>Section</th>
                  <th>Year</th>
                  <th>Rank</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">No classes found. Add your first class!</td>
                  </tr>
                ) : (
                  classes
                    .filter(c => (filters.session === 'All' ? true : c.session === filters.session))
                    .filter(c => (filters.section === 'All' ? true : c.section === filters.section))
                    .filter(c => (!filters.year ? true : String(c.year || '').includes(filters.year)))
                    .filter(c => (!filters.rank ? true : String(c.rank || '').includes(String(filters.rank))))
                    .filter(c => String(c.degree || '').toLowerCase().includes(searchTerm.trim().toLowerCase()))
                    .map((classItem, index) => (
                    <tr key={classItem._id}>
                      <td>{index + 1}</td>
                      <td>{classItem.degree}</td>
                      <td>
                        <span className={`badge ${classItem.session === 'Fall' ? 'bg-warning' : 'bg-info'}`}>
                          {classItem.session}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{classItem.section}</span>
                      </td>
                      <td>{classItem.year}</td>
                      <td>{classItem.rank}</td>
                      <td>
                        <Button 
                          variant="warning" 
                          size="sm" 
                          className="me-2 mb-1"
                          onClick={() => handleShowModal('edit', classItem)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          className="mb-1"
                          onClick={() => handleDelete(classItem._id)}
                        >
                          🗑️ Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
            </div>
          </Card.Body>
        </Card>
        </Container>
      </div>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="glass-effect">
          <Modal.Title>{modalMode === 'add' ? 'Add New Class' : 'Edit Class'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass-effect">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Degree/Program</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter degree (e.g., BS Computer Science, Bachelors/Intermediate/Matric)"
                value={currentClass.degree}
                onChange={(e) => setCurrentClass({ ...currentClass, degree: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Session</Form.Label>
                  <Form.Select
                    value={currentClass.session}
                    onChange={(e) => setCurrentClass({ ...currentClass, session: e.target.value })}
                    required
                    style={{ color: '#000' }}
                  >
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section</Form.Label>
                  <Form.Select
                    value={currentClass.section}
                    onChange={(e) => setCurrentClass({ ...currentClass, section: e.target.value })}
                    required
                    style={{ color: '#000' }}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Year</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter year (e.g., 2024)"
                    value={currentClass.year}
                    onChange={(e) => setCurrentClass({ ...currentClass, year: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester/Rank</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="8"
                    placeholder="Enter semester"
                    value={currentClass.rank}
                    onChange={(e) => setCurrentClass({ ...currentClass, rank: parseInt(e.target.value) })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="btn-futuristic">
                {modalMode === 'add' ? 'Add Class' : 'Update Class'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Classes;
