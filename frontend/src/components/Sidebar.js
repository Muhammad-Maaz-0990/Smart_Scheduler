import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ activeMenu }) => {
  const navigate = useNavigate();
  const { user, logout, instituteObjectId, loadSubscriptionOnce } = useAuth();
  const [instituteInfo, setInstituteInfo] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const role = user?.designation || 'Owner';

  useEffect(() => {
    const fetchInstituteInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const instituteRef = user?.instituteID;
        const instituteParam = typeof instituteRef === 'object'
          ? (instituteRef._id || instituteRef.instituteID || instituteRef)
          : instituteRef;
        if (!instituteParam) return;
        const response = await fetch(`http://localhost:5000/api/auth/institute/${encodeURIComponent(instituteParam)}`, {
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

  // Load subscription status and gate menus for Admin/Student/Teacher
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (!instituteObjectId) {
          if (mounted) setIsExpired(false);
          return;
        }
        const sub = await loadSubscriptionOnce(instituteObjectId);
        if (mounted) setIsExpired(!!sub?.isExpired);
      } catch {
        if (mounted) setIsExpired(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [instituteObjectId, loadSubscriptionOnce]);

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

  // Toggle collapsed class to reduce content left margin when sidebar is collapsed
  useEffect(() => {
    const body = document.body;
    // Only apply collapsed margin when sidebar is visible
    if (isVisible && isCollapsed) {
      body.classList.add('sidebar-collapsed');
    } else {
      body.classList.remove('sidebar-collapsed');
    }
    return () => body.classList.remove('sidebar-collapsed');
  }, [isCollapsed, isVisible]);

  const handleMenuClick = (menu) => {
    const basePath = (role === 'Admin') ? '/admin' : (role === 'Student') ? '/student' : (role === 'Teacher') ? '/teacher' : '/owner';
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
    { icon: '🏢', label: 'Rooms', value: 'rooms' },
    { icon: '👥', label: 'Classes', value: 'classes' },
    { icon: '📚', label: 'Courses', value: 'courses' },
    { icon: '⏰', label: 'TimeSlots', value: 'timeslots' },
    { icon: '💬', label: 'FeedBacks', value: 'feedbacks' },
    { icon: '📅', label: 'TimeTables', value: 'timetables' },
    { icon: '👤', label: 'Institute Users', value: 'users' },
    { icon: '🔧', label: 'Profile', value: 'profile' }
  ];

  // Remove dashboard menu for Owner, navigation is via logo/name/Owner Panel
  const ownerMenu = [
    { icon: '🏢', label: 'Institutes', value: 'institutes' },
    { icon: '👥', label: 'Owner Users', value: 'ownerUsers' },
    { icon: '🔧', label: 'Profile', value: 'profile' }
  ];

  const studentMenu = [
    { icon: '📅', label: 'TimeTables', value: 'timetables' },
    { icon: '💬', label: 'Feedbacks', value: 'feedbacks' },
    { icon: '🔧', label: 'Profile', value: 'profile' }
  ];

  const teacherMenu = [
    { icon: '📅', label: 'TimeTables', value: 'timetables' },
    { icon: '💬', label: 'Feedbacks', value: 'feedbacks' },
    { icon: '🔧', label: 'Profile', value: 'profile' }
  ];
  
  // When subscription expired for Admin/Student/Teacher, only allow Profile
  const isGateRole = ['Admin','Student','Teacher'].includes(role);
  const gatedMenu = [{ icon: '🔧', label: 'Profile', value: 'profile' }];
  const baseMenu = role === 'Admin' ? adminMenu : role === 'Student' ? studentMenu : role === 'Teacher' ? teacherMenu : ownerMenu;
  const menuItems = (isGateRole && isExpired) ? gatedMenu : baseMenu;

  return (
    <>
      {/* Top Navigation Toggle */}
      <button
        className="mobile-menu-toggle no-print"
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
      <div className={`sidebar no-print ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Institute Info (click to go to dashboard) */}
        {/* Clicking logo/name/Owner Panel navigates to dashboard */}
        <div className="sidebar-header" onClick={() => {
          handleMenuClick('dashboard');
          setIsMobileOpen(false);
        }} style={{cursor:'pointer'}}>
          {role === 'Owner' ? (
            /* Smart Scheduler Logo and Name for Owner */
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(126, 34, 206, 0.3)'
              }}>
                <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="6"/>
                  <path d="M50 25V50L65 65" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="50" cy="50" r="5" fill="white"/>
                </svg>
              </div>
              {!isCollapsed && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>Smart Scheduler</div>
                  <div style={{ fontWeight: 500, fontSize: 13, color: '#e0e7ff', marginTop: 4 }}>Owner Panel</div>
                </div>
              )}
            </div>
          ) : (
            /* Institute Logo, Name and Designation for Admin/Student/Teacher */
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {instituteInfo?.instituteLogo ? (
                <img 
                  src={`http://localhost:5000${instituteInfo.instituteLogo}`}
                  alt="Institute Logo" 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }} 
                />
              ) : (
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {instituteInfo?.instituteName?.charAt(0) || 'I'}
                </div>
              )}
              {!isCollapsed && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>
                    {instituteInfo?.instituteName || 'Institute'}
                  </div>
                  <div style={{ fontWeight: 500, fontSize: 13, color: '#e0e7ff', marginTop: 4 }}>
                    {role}
                  </div>
                </div>
              )}
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
          <button 
            className="logout-btn-sidebar" 
            onClick={handleLogout}
            title="Logout"
          >
            <span className="btn-icon">🚪</span>
            {!isCollapsed && <span className="menu-label">Logout</span>}
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
