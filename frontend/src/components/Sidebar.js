import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ activeMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [instituteInfo, setInstituteInfo] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const role = user?.designation || 'Owner';

  useEffect(() => {
    const fetchInstituteInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/auth/institute/${user?.instituteID}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setInstituteInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch institute info:', err);
      }
    };

    if (user?.instituteID) {
      fetchInstituteInfo();
    }
  }, [user]);

  // Toggle global class to allow full-width content when sidebar hidden
  useEffect(() => {
    const body = document.body;
    if (!isVisible) {
      body.classList.add('no-sidebar');
    } else {
      body.classList.remove('no-sidebar');
    }
    return () => body.classList.remove('no-sidebar');
  }, [isVisible]);

  const handleMenuClick = (menu) => {
    const basePath = role === 'Admin' ? '/admin' : '/owner';
    if (menu === 'dashboard') {
      navigate(basePath);
    } else {
      navigate(`${basePath}/${menu}`);
    }
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenu = [
    { icon: '🏠', label: 'Dashboard', value: 'dashboard' },
    { icon: '🏢', label: 'Rooms', value: 'rooms' },
    { icon: '👥', label: 'Classes', value: 'classes' },
    { icon: '📚', label: 'Courses', value: 'courses' },
    { icon: '⏰', label: 'TimeSlots', value: 'timeslots' },
    { icon: '💬', label: 'Feedback', value: 'feedback' },
    { icon: '📅', label: 'TimeTables', value: 'timetables' },
    { icon: '👤', label: 'Institute Users', value: 'users' },
    { icon: '🔧', label: 'Profile', value: 'profile' }
  ];

  const ownerMenu = [
    { icon: '🏠', label: 'Dashboard', value: 'dashboard' },
    { icon: '🏢', label: 'Institutes', value: 'institutes' },
    { icon: '👥', label: 'Users', value: 'users' },
    { icon: '📊', label: 'Analytics', value: 'analytics' },
    { icon: '⚙️', label: 'Settings', value: 'settings' },
    { icon: '🔧', label: 'Profile', value: 'profile' }
  ];

  const menuItems = role === 'Admin' ? adminMenu : ownerMenu;

  return (
    <>
      {/* Top Navigation Toggle */}
      <button
        className="mobile-menu-toggle"
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 1100 }}
        onClick={() => {
          // On mobile, open the slide-in; on desktop, toggle visibility
          if (window.innerWidth <= 992) {
            setIsMobileOpen(!isMobileOpen);
            setIsVisible(true);
          } else {
            setIsVisible(!isVisible);
          }
        }}
        title={isVisible ? 'Hide Menu' : 'Show Menu'}
      >
        ☰ Menu
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      {isVisible && (
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Institute Info */}
        <div className="sidebar-header">
          {instituteInfo?.instituteLogo && (
            <img 
              src={instituteInfo.instituteLogo} 
              alt="Institute Logo" 
              className="institute-logo"
            />
          )}
          {!isCollapsed && (
            <div className="institute-info">
              <div className="institute-name">
                {instituteInfo?.instituteName || 'Smart Scheduler'}
              </div>
              <div className="institute-subtitle">{role} Panel</div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.value}
              className={`sidebar-menu-item ${activeMenu === item.value ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.value)}
              title={item.label}
            >
              <span className="menu-icon">{item.icon}</span>
              {!isCollapsed && <span className="menu-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.userName?.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="user-details">
                <div className="user-name">{user?.userName}</div>
                <div className="user-role">{role}</div>
              </div>
            )}
          </div>
          <button 
            className="logout-btn-sidebar" 
            onClick={handleLogout}
            title="Logout"
          >
            🚪 {!isCollapsed && 'Logout'}
          </button>
        </div>

        {/* Collapse Toggle (Desktop only) */}
        <button 
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      )}
    </>
  );
};

export default Sidebar;
