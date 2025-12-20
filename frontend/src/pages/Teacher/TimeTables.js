import React from 'react';
import { Container } from 'react-bootstrap';
import TimeTable from '../../components/shared/TimeTable';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

const TeacherTimeTablesPage = () => {

  return (
    <>
      <Sidebar activeMenu="timetables" />
      <div className="dashboard-page">
        <Container fluid className="pb-4" style={{ maxWidth: '1600px' }}>
          <TimeTable />
        </Container>
      </div>
    </>
  );
};

export default TeacherTimeTablesPage;
