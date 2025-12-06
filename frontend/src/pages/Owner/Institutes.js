import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Modal, Alert } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';

const Institutes = () => {
  const { user } = useAuth();
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchInstitutes = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/auth/institutes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setInstitutes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load institutes');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const handleShowDetail = (inst) => {
    setSelected(inst);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelected(null);
  };

  return (
    <>
      <Sidebar activeMenu="institutes" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content">
          <h1 className="dashboard-title mb-4">All Institutes</h1>
          {error && <Alert variant="danger" onClose={()=>setError('')} dismissible>{error}</Alert>}
          <Card className="glass-effect">
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Teachers</th>
                    <th>Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                  ) : institutes.length === 0 ? (
                    <tr><td colSpan="6" className="text-center">No institutes found</td></tr>
                  ) : (
                    institutes.map((inst, idx) => (
                      <tr key={inst._id || idx}>
                        <td>{idx + 1}</td>
                        <td>{inst.instituteName}</td>
                        <td>{inst.email || '-'}</td>
                        <td>{inst.totalTeachers ?? 0}</td>
                        <td>{inst.totalStudents ?? 0}</td>
                        <td>
                          <Button size="sm" variant="info" onClick={() => handleShowDetail(inst)}>View</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Modal show={showDetail} onHide={handleCloseDetail} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Institute Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selected ? (
                <div>
                  {selected.logoUrl && (
                    <div className="text-center mb-3">
                      <img src={selected.logoUrl} alt="Institute Logo" style={{maxWidth: '150px', maxHeight: '150px'}} />
                    </div>
                  )}
                  <h5 className="mb-3">Institute Information</h5>
                  <p><strong>Name:</strong> {selected.instituteName}</p>
                  <p><strong>Institute ID:</strong> {selected.instituteID}</p>
                  <p><strong>Type:</strong> {selected.instituteType}</p>
                  <p><strong>Address:</strong> {selected.address}</p>
                  <p><strong>Contact Number:</strong> {selected.contactNumber}</p>
                  <p><strong>Subscription:</strong> {selected.subscription}</p>
                  <p><strong>Total Teachers:</strong> {selected.totalTeachers ?? 0}</p>
                  <p><strong>Total Students:</strong> {selected.totalStudents ?? 0}</p>
                  <p><strong>Created At:</strong> {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : 'N/A'}</p>
                  
                  <hr />
                  <h5 className="mb-3">Institute Admin Details</h5>
                  {selected.admin ? (
                    <>
                      <p><strong>Admin Name:</strong> {selected.admin.userName}</p>
                      <p><strong>Admin Email:</strong> {selected.admin.email}</p>
                      <p><strong>Admin Phone:</strong> {selected.admin.phoneNumber}</p>
                      <p><strong>Admin CNIC:</strong> {selected.admin.cnic}</p>
                    </>
                  ) : (
                    <p className="text-muted">No admin assigned to this institute</p>
                  )}
                </div>
              ) : <p>No details available.</p>}
            </Modal.Body>
          </Modal>
        </Container>
      </div>
    </>
  );
};

export default Institutes;
