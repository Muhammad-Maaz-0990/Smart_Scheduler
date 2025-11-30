import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Alert } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const Users = () => {
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Placeholder fetch; implement backend endpoint later
    const fetchUsers = async () => {
      setLoading(true);
      try {
        setUsers([]);
      } catch (e) {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <>
      <Sidebar activeMenu="users" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <Container fluid className="dashboard-content">
          <div className="welcome-section mb-4">
            <h1 className="dashboard-title">Institute Users</h1>
            <p className="dashboard-subtitle">Manage all users in your institute</p>
          </div>

          {error && (
            <Alert variant="danger" className="error-alert" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          <Card className="glass-effect">
            <Card.Header>
              <h4 className="card-title">Users</h4>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table bordered hover className="table-custom">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Designation</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center">{loading ? 'Loading...' : 'No users found'}</td>
                      </tr>
                    ) : users.map((u, idx) => (
                      <tr key={u.id || idx}>
                        <td>{idx + 1}</td>
                        <td>{u.userName}</td>
                        <td>{u.email}</td>
                        <td>{u.designation}</td>
                        <td>{u.phoneNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default Users;
