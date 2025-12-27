import React from 'react';
import { Container } from 'react-bootstrap';
import TimeTable from '../../components/shared/TimeTable';
import '../Dashboard.css';

function AdminTimeTables() {
  return (
        <Container fluid className="pb-4" style={{ maxWidth: '1600px' }}>
          <TimeTable isAdmin />
        </Container>
  );
}

export default AdminTimeTables;
