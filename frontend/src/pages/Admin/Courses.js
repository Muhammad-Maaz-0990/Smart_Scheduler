import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { parseCSV, toCSV, downloadCSV } from '../../utils/csv';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({ type: 'All', creditHours: '', });
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = React.useRef(null);

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
      // If editing a Lab, force creditHours to 1 and lock it
      const next = { ...course };
      if (next.courseType === 'Lab') next.creditHours = 1;
      setCurrentCourse(next);
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
          // Enforce Lab creditHours = 1 on submit
          creditHours: currentCourse.courseType === 'Lab' ? 1 : currentCourse.creditHours,
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

  const onImportClick = () => { setImportError(''); fileInputRef.current?.click(); };
  const onFileSelected = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const { headers, items } = parseCSV(text);
      const required = ['courseCode','courseTitle','courseType','creditHours'];
      if (!required.every(h => headers.includes(h))) { setImportError('CSV must include headers: ' + required.join(', ')); setImportPreview([]); return; }
      setImportPreview(items);
    } catch { setImportError('Failed to parse CSV'); setImportPreview([]); }
    finally { e.target.value = ''; }
  };
  const addImported = async () => {
    if (!instituteObjectId || importPreview.length === 0) return;
    setError(''); setSuccess('');
    try {
      for (const c of importPreview) {
        const body = { courseCode: c.courseCode, courseTitle: c.courseTitle, courseType: c.courseType, creditHours: Number(c.creditHours)|| (c.courseType==='Lab'?1:3), instituteID: instituteObjectId };
        const res = await fetch('http://localhost:5000/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to add some rows'); }
      }
      setSuccess('Imported courses added successfully'); setImportPreview([]); fetchCourses();
    } catch (e) { setError(e.message || 'Import add failed'); }
  };
  const exportCSV = () => {
    const headers = ['courseCode','courseTitle','courseType','creditHours'];
    const rows = courses.map(c => ({ courseCode: c.courseCode, courseTitle: c.courseTitle, courseType: c.courseType, creditHours: c.creditHours }));
    downloadCSV('courses.csv', toCSV(headers, rows));
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
            <div className="d-flex gap-2">
            <Button 
            variant="primary" 
            className="btn-futuristic"
            onClick={() => handleShowModal('add')}
          >
            <span className="btn-icon">➕</span> Add Course
          </Button>
          <Button className="btn-futuristic" onClick={onImportClick}>📥 Import CSV</Button>
          <Button className="btn-futuristic" onClick={exportCSV}>📤 Export CSV</Button>
          <input type="file" accept=".csv,text/csv" ref={fileInputRef} style={{ display:'none' }} onChange={onFileSelected} />
          </div>
        </div>

        {/* Search and Filter */}
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 mb-3">
          <Form.Control
            type="text"
            placeholder="Search by Code or Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 420 }}
          />
          <div className="position-relative" style={{ minWidth: 160 }}>
            <Button variant="light" className="border" onClick={() => setShowFilterMenu(s => !s)}>⋮</Button>
            {showFilterMenu && (
              <div className="card shadow-sm" style={{ position: 'absolute', right: 0, zIndex: 10, minWidth: 280 }}>
                <div className="card-body p-2">
                  <div className="mb-2" style={{ fontWeight: 600, color: '#000' }}>Filter Options</div>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1" style={{ color: '#000' }}>Type</Form.Label>
                    <Form.Select size="sm" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} style={{ color: '#000' }}>
                      <option value="All">All</option>
                      <option value="Theory">Theory</option>
                      <option value="Lab">Lab</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1" style={{ color: '#000' }}>Credit Hours</Form.Label>
                    <Form.Control size="sm" type="number" min="" placeholder="e.g. 3" value={filters.creditHours} onChange={(e) => setFilters({ ...filters, creditHours: e.target.value })} />
                  </Form.Group>
                  <div className="d-flex justify-content-end gap-2 mt-2">
                    <Button size="sm" variant="secondary" onClick={() => { setFilters({ type: 'All', creditHours: '' }); setShowFilterMenu(false); }}>Reset</Button>
                    <Button size="sm" variant="primary" onClick={() => setShowFilterMenu(false)}>Apply</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
        {importError && <Alert variant="warning" dismissible onClose={() => setImportError('')}>{importError}</Alert>}
        {importPreview.length > 0 && (
          <Card className="mb-3">
            <Card.Header>Import Preview</Card.Header>
            <Card.Body>
              <Table size="sm" hover>
                <thead><tr><th>#</th><th>courseCode</th><th>courseTitle</th><th>courseType</th><th>creditHours</th></tr></thead>
                <tbody>
                  {importPreview.map((r, idx) => (
                    <tr key={idx}><td>{idx+1}</td><td>{r.courseCode}</td><td>{r.courseTitle}</td><td>{r.courseType}</td><td>{r.creditHours}</td></tr>
                  ))}
                </tbody>
              </Table>
              <Button variant="primary" onClick={addImported}>Add Imported</Button>
              <Button variant="secondary" className="ms-2" onClick={()=>setImportPreview([])}>Clear</Button>
            </Card.Body>
          </Card>
        )}

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
                  courses
                    .filter(c => (filters.type === 'All' ? true : c.courseType === filters.type))
                    .filter(c => (!filters.creditHours ? true : String(c.creditHours || '').includes(String(filters.creditHours))))
                    .filter(c => (
                      String(c.courseCode || '').toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                      String(c.courseTitle || '').toLowerCase().includes(searchTerm.trim().toLowerCase())
                    ))
                    .map((course, index) => (
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
              <Form.Label style={{ color: '#000' }}>Course Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter course code (e.g., CS101, MATH201)"
                value={currentCourse.courseCode}
                onChange={(e) => setCurrentCourse({ ...currentCourse, courseCode: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#000' }}>Course Title</Form.Label>
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
                  <Form.Label style={{ color: '#000' }}>Course Type</Form.Label>
                  <Form.Select
                    value={currentCourse.courseType}
                    onChange={(e) => {
                      const type = e.target.value;
                      setCurrentCourse({
                        ...currentCourse,
                        courseType: type,
                        creditHours: type === 'Lab' ? 1 : currentCourse.creditHours || 3
                      });
                    }}
                    required
                    style={{ color: '#000' }}
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: '#000' }}>Credit Hours</Form.Label>
                  <Form.Control
                    type="number"
                    min={currentCourse.courseType === 'Lab' ? '1' : '1'}
                    max={currentCourse.courseType === 'Lab' ? '1' : '6'}
                    placeholder="Enter credit hours"
                    value={currentCourse.creditHours}
                    onChange={(e) => setCurrentCourse({ ...currentCourse, creditHours: parseInt(e.target.value) })}
                    required
                    disabled={currentCourse.courseType === 'Lab'}
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
