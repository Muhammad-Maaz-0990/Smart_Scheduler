import React from 'react';
import { Container } from 'react-bootstrap';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = () => {
  const location = useLocation();
  
  // Determine active menu based on current path
  const getActiveMenu = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'dashboard';
    if (path.includes('/rooms')) return 'rooms';
    if (path.includes('/classes')) return 'classes';
    if (path.includes('/courses')) return 'courses';
    if (path.includes('/timeslots')) return 'timeslots';
    if (path.includes('/timetables')) return 'timetables';
    if (path.includes('/generate-timetable')) return 'timetables';
    if (path.includes('/users')) return 'users';
    if (path.includes('/feedbacks')) return 'feedbacks';
    if (path.includes('/profile')) return 'profile';
    return 'dashboard';
  };

  return (
    <>
      <Sidebar activeMenu={getActiveMenu()} />
      <div className="dashboard-page" style={{ transform: 'translateZ(0)', willChange: 'margin-left, transform' }}>
        <Container fluid className="dashboard-content" style={{ transform: 'translateZ(0)' }}>
          <Outlet />
        </Container>
      </div>
    </>
  );
};

export default AdminLayout;
