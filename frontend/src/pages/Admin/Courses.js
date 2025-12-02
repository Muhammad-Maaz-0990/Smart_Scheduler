import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Courses = () => {
  const { instituteObjectId } = useAuth();
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentCourse, setCurrentCourse] = useState({
    courseCode: '',
    courseTitle: '',
    courseType: 'Theory',
    creditHours: 3
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (instituteObjectId) {
      fetchCourses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instituteObjectId]);

  const fetchCourses = async () => {
    if (!instituteObjectId) {
      setError('Institute ID not found');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${instituteObjectId}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (err) {
      setError('Failed to fetch courses');
    }
  };

  const handleShowModal = (mode, course = null) => {
    setModalMode(mode);
    if (mode === 'edit' && course) {
      setCurrentCourse(course);
    } else {
      setCurrentCourse({ courseCode: '', courseTitle: '', courseType: 'Theory', creditHours: 3 });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentCourse({ courseCode: '', courseTitle: '', courseType: 'Theory', creditHours: 3 });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = modalMode === 'add' 
        ? 'http://localhost:5000/api/courses'
        : `http://localhost:5000/api/courses/${currentCourse._id}`;
      
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentCourse,
          instituteID: instituteObjectId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Course ${modalMode === 'add' ? 'added' : 'updated'} successfully`);
        fetchCourses();
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

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Course deleted successfully');
        fetchCourses();
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
      <Sidebar activeMenu="courses" />
      <div className="dashboard-page">
        <div className="bg-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

        <Container fluid className="dashboard-content">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
            <div>
              <h2 className="dashboard-title">📚 Courses Management</h2>
              <p className="dashboard-subtitle">Manage all courses in your institute</p>
            </div>
            <Button 
            variant="primary" 
            className="btn-futuristic"
            onClick={() => handleShowModal('add')}
          >
            <span className="btn-icon">➕</span> Add Course
          </Button>
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
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Type</th>
                  <th>Credit Hours</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">No courses found. Add your first course!</td>
                  </tr>
                ) : (
                  courses.map((course, index) => (
                    <tr key={course._id}>
                      <td>{index + 1}</td>
                      <td><strong>{course.courseCode}</strong></td>
                      <td>{course.courseTitle}</td>
                      <td>
                        <span className={`badge ${course.courseType === 'Lab' ? 'bg-info' : 'bg-primary'}`}>
                          {course.courseType}
                        </span>
                      </td>
                      <td>{course.creditHours}</td>
                      <td>
                        <Button 
                          variant="warning" 
                          size="sm" 
                          className="me-2 mb-1"
                          onClick={() => handleShowModal('edit', course)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          className="mb-1"
                          onClick={() => handleDelete(course._id)}
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
          <Modal.Title>{modalMode === 'add' ? 'Add New Course' : 'Edit Course'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass-effect">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Course Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter course code (e.g., CS101, MATH201)"
                value={currentCourse.courseCode}
                onChange={(e) => setCurrentCourse({ ...currentCourse, courseCode: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Course Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter course title"
                value={currentCourse.courseTitle}
                onChange={(e) => setCurrentCourse({ ...currentCourse, courseTitle: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Type</Form.Label>
                  <Form.Select
                    value={currentCourse.courseType}
                    onChange={(e) => setCurrentCourse({ ...currentCourse, courseType: e.target.value })}
                    required
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Credit Hours</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="6"
                    placeholder="Enter credit hours"
                    value={currentCourse.creditHours}
                    onChange={(e) => setCurrentCourse({ ...currentCourse, creditHours: parseInt(e.target.value) })}
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
                {modalMode === 'add' ? 'Add Course' : 'Update Course'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Courses;
