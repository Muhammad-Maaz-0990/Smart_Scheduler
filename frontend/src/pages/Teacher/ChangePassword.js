import React from 'react';
import Sidebar from '../../components/Sidebar';
import ChangePassword from '../../components/shared/ChangePassword';

const ChangePasswordPage = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar activeMenu="profile" />
      <div
        className="dashboard-background"
        style={{
          flex: 1,
          padding: 'clamp(1rem, 3vw, 2rem)',
          minHeight: '100vh'
        }}
      >
        <ChangePassword embedded />
      </div>
    </div>
  );
};

export default ChangePasswordPage;
