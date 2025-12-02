import React from 'react';
import TimeTable from '../../components/shared/TimeTable';
import Sidebar from '../../components/Sidebar';
import '../Dashboard.css';

function AdminTimeTables() {
  return (
    <>
      <Sidebar activeMenu="timetables" />
      <div className="dashboard-page">
        <div className="bg-animation">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
        <div className="dashboard-content">
          <TimeTable isAdmin />
        </div>
      </div>
    </>
  );
}

export default AdminTimeTables;
