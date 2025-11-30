import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Image, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [institute, setInstitute] = useState(null);
  const [loadingInstitute, setLoadingInstitute] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInstitute = async () => {
      if (!user) return;
      const idVal = typeof user.instituteID === 'object' ? user.instituteID?._id : user.instituteID;
      if (!idVal) return;
      setLoadingInstitute(true);
      setError('');
      try {
        const res = await fetch(`/api/auth/institute/${encodeURIComponent(idVal)}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        if (!res.ok) throw new Error('Failed to load institute');
        const data = await res.json();
        setInstitute(data);
      } catch (e) {
        setError(e.message || 'Error loading institute');
      } finally {
        setLoadingInstitute(false);
      }
    };
    fetchInstitute();
  }, [user, token]);

  return (
    <>
      <Sidebar activeMenu="dashboard" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>

        <Container fluid className="dashboard-content">
          <div className="welcome-section mb-5">
            <h1 className="dashboard-title">Admin Dashboard 🛡️</h1>
            <p className="dashboard-subtitle">Manage {user?.instituteName || 'your institute'}</p>
          </div>

          <Row className="g-4">
            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">👨‍🏫</div>
                  <h3 className="stat-value">0</h3>
                  <p className="stat-label">Teachers</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">🎓</div>
                  <h3 className="stat-value">0</h3>
                  <p className="stat-label">Students</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">📚</div>
                  <h3 className="stat-value">0</h3>
                  <p className="stat-label">Courses</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className="stat-card glass-effect">
                <Card.Body>
                  <div className="stat-icon">📅</div>
                  <h3 className="stat-value">0</h3>
                  <p className="stat-label">Schedules</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Institute Details Card */}
          <Row className="mt-4">
            <Col xs={12}>
              <Card className="glass-effect institute-card">
                <Card.Body>
                  <div className="institute-card-header">
                    <div className="institute-logo-wrap">
                      {institute?.instituteLogo ? (
                        <Image src={institute.instituteLogo} rounded className="institute-logo" alt="Institute Logo" />
                      ) : (
                        <div className="institute-logo placeholder">🏫</div>
                      )}
                    </div>
                    <div className="institute-meta">
                      <h3 className="institute-name mb-1">
                        {institute?.instituteName || user?.instituteName || 'Institute'}
                        {institute?.instituteType && (
                          <Badge bg="info" className="ms-2">{institute.instituteType}</Badge>
                        )}
                      </h3>
                      <div className="institute-id">ID: {institute?.instituteID || (typeof user?.instituteID === 'string' ? user.instituteID : user?.instituteID?._id) }</div>
                    </div>
                  </div>

                  <div className="institute-details-grid mt-3">
                    <div>
                      <div className="detail-label">Address</div>
                      <div className="detail-value">{institute?.address || '—'}</div>
                    </div>
                    <div>
                      <div className="detail-label">Contact</div>
                      <div className="detail-value">{institute?.contactNumber || '—'}</div>
                    </div>
                    <div>
                      <div className="detail-label">Subscription</div>
                      <div className="detail-value">{institute?.subscription || '—'}</div>
                    </div>
                    <div>
                      <div className="detail-label">Created</div>
                      <div className="detail-value">{institute?.created_at ? new Date(institute.created_at).toLocaleString() : '—'}</div>
                    </div>
                  </div>

                  {loadingInstitute && <div className="detail-hint mt-2">Loading institute details…</div>}
                  {error && <div className="detail-error mt-2">{error}</div>}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AdminDashboard;
