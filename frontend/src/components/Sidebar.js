import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';
import { getThemeLogo } from '../utils/theme';
import {
  FaDoorOpen,
  FaBuilding,
  FaUsers,
  FaBook,
  FaClock,
  FaComments,
  FaCalendar,
  FaUserCog,
  FaUserShield,
  FaBars
} from 'react-icons/fa';
import { cascadeFade, staggerChildren } from './shared/animation_variants';
import './Sidebar.css';

const Sidebar = ({ activeMenu }) => {
  const navigate = useNavigate();
  const { user, logout, instituteCache, loadInstituteOnce } = useAuth();
  const [instituteInfo, setInstituteInfo] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpired] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  const role = user?.designation || 'Owner';
  const showLabels = !isCollapsed || (isMobile && isMobileOpen);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
      // Close mobile menu on desktop
      if (window.innerWidth > 992) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  // Update institute info when cache changes
  useEffect(() => {
    if (instituteCache) {
      setInstituteInfo(instituteCache);
    }
  }, [instituteCache]);

  useEffect(() => {
    const fetchInstituteInfo = async () => {
      try {
        const instituteRef = user?.instituteID;
        const instituteParam = typeof instituteRef === 'object'
          ? (instituteRef._id || instituteRef.instituteID || instituteRef)
          : instituteRef;
        if (!instituteParam) return;
        
        // Use context cache loader
        const data = await loadInstituteOnce(instituteParam);
        if (data) {
          setInstituteInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch institute info:', err);
      }
    };

    const instituteRef = user?.instituteID;
    const instituteParam = typeof instituteRef === 'object'
      ? (instituteRef._id || instituteRef.instituteID || instituteRef)
      : instituteRef;
    
    if (instituteParam) {
      fetchInstituteInfo();
    }
  }, [user?.instituteID, loadInstituteOnce]);

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
    // Preserve collapsed state; only close mobile overlay
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    setIsMobileOpen(false);
    logout();
    navigate('/login');
  };

  const adminMenu = [
    { icon: FaBuilding, label: 'Rooms', value: 'rooms' },
    { icon: FaUsers, label: 'Classes', value: 'classes' },
    { icon: FaBook, label: 'Courses', value: 'courses' },
    { icon: FaClock, label: 'TimeSlots', value: 'timeslots' },
    { icon: FaComments, label: 'FeedBacks', value: 'feedbacks' },
    { icon: FaCalendar, label: 'TimeTables', value: 'timetables' },
    { icon: FaUserShield, label: 'Institute Users', value: 'users' },
    { icon: FaUserCog, label: 'Profile', value: 'profile' }
  ];

  // Remove dashboard menu for Owner, navigation is via logo/name/Owner Panel
  const ownerMenu = [
    { icon: FaBuilding, label: 'Institutes', value: 'institutes' },
    { icon: FaUsers, label: 'Owner Users', value: 'ownerUsers' },
    { icon: FaCalendar, label: 'Payments', value: 'payments' },
    { icon: FaUserCog, label: 'Profile', value: 'profile' }
  ];

  const studentMenu = [
    { icon: FaCalendar, label: 'TimeTables', value: 'timetables' },
    { icon: FaComments, label: 'Feedbacks', value: 'feedbacks' },
    { icon: FaUserCog, label: 'Profile', value: 'profile' }
  ];

  const teacherMenu = [
    { icon: FaCalendar, label: 'TimeTables', value: 'timetables' },
    { icon: FaComments, label: 'Feedbacks', value: 'feedbacks' },
    { icon: FaUserCog, label: 'Profile', value: 'profile' }
  ];
  
  // When subscription expired for Admin/Student/Teacher, only allow Profile
  const isGateRole = ['Admin','Student','Teacher'].includes(role);
  const gatedMenu = [{ icon: '🔧', label: 'Profile', value: 'profile' }];
  const baseMenu = role === 'Admin' ? adminMenu : role === 'Student' ? studentMenu : role === 'Teacher' ? teacherMenu : ownerMenu;
  const menuItems = (isGateRole && isExpired) ? gatedMenu : baseMenu;
  const sidebarMenuItems = [...menuItems, { icon: FaDoorOpen, label: 'Logout', value: 'logout' }];

  return (
    <>
      {/* Top Navigation Toggle */}
      <motion.button
        className="mobile-menu-toggle no-print"
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 1100,
          background: 'white',
          border: 'none',
          borderRadius: '10px',
          padding: '0.75rem',
          cursor: 'pointer',
          display: isMobile ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s'
        }}
        onClick={() => {
          setIsMobileOpen(!isMobileOpen);
          setIsVisible(true);
        }}
        title={isMobileOpen ? 'Close Menu' : 'Open Menu'}
      >
        <FaBars style={{ color: 'var(--theme-color)', fontSize: '1.25rem' }} />
      </motion.button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
          ></motion.div>
        )}
      </AnimatePresence>
      <motion.div 
        className={`sidebar no-print ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open force-expanded' : ''}`}
        style={{ display: isMobile && !isMobileOpen ? 'none' : 'flex' }}
      >
            {/* Institute Info (click to go to dashboard) */}
            <motion.div 
              className="sidebar-header"
              onClick={() => {
                handleMenuClick('dashboard');
                setIsMobileOpen(false);
              }}
              style={{
                cursor: 'pointer',
                background: '#ffffff',
                borderBottom: '1px solid rgba(17, 24, 39, 0.08)',
                boxShadow: '0 4px 12px rgba(17, 24, 39, 0.05)',
                padding: '1rem',
                minHeight: '82px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {role === 'Owner' ? (
                /* Schedule Hub Logo and Name for Owner */
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <motion.div
                    style={{
                      width: 50,
                      height: 50,
                      background: 'var(--theme-color)',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowLogoPreview(true)}
                    title="Click to preview logo"
                  >
                    <img 
                      src={getThemeLogo()} 
                      alt="Schedule Hub Logo" 
                      style={{
                        width: 50,
                        height: 50,
                        objectFit: 'cover',
                        display: 'block',
                        borderRadius: '0.75rem'
                      }}
                    />
                  </motion.div>
                  {showLabels && (
                    <div>
                      <div className="brand-font" style={{ 
                        fontWeight: 700, 
                        fontSize: '18px', 
                        color: '#111827', 
                        lineHeight: '1.2',
                        margin: 0,
                        letterSpacing: '-0.5px'
                      }}>
                        SCHEDULE HUB
                      </div>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#4b5563',
                        marginTop: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Owner Panel
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Institute Logo, Name and Designation for Admin/Student/Teacher */
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <motion.div
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    style={{ flexShrink: 0 }}
                  >
                    {instituteInfo?.instituteLogo ? (
                      <img
                                        src={apiUrl(instituteInfo.instituteLogo)}
                        alt="Institute Logo"
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: '2px solid rgba(17, 24, 39, 0.08)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 50,
                        height: 50,
                        borderRadius: '12px',
                        background: 'var(--theme-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(105, 65, 219, 0.3)'
                      }}>
                        {instituteInfo?.instituteName?.charAt(0) || 'I'}
                      </div>
                    )}
                  </motion.div>
                  {showLabels && (
                    <div>
                      <div style={{
                        fontWeight: 800,
                        fontSize: '18px',
                        color: '#111827',
                        lineHeight: '1.2',
                        margin: 0,
                        letterSpacing: '-0.5px',
                        maxWidth: 150,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {instituteInfo?.instituteName || 'Institute'}
                      </div>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#4b5563',
                        marginTop: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {role}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Menu Items */}
            <motion.nav
              className="sidebar-nav"
              initial="hidden"
              animate="visible"
              variants={staggerChildren}
            >
              {sidebarMenuItems.map((item, idx) => {
                const Icon = item.icon;
                const isLogout = item.value === 'logout';
                const isActive = !isLogout && activeMenu === item.value;
                // Use CSS variable for theme color
                const iconColor = isActive ? 'var(--theme-color)' : 'currentColor';
                return (
                  <motion.button
                    key={item.value}
                    className={`sidebar-menu-item${isActive ? ' active' : ''}${isLogout ? ' logout' : ''}`}
                    onClick={() => (isLogout ? handleLogout() : handleMenuClick(item.value))}
                    title={item.label}
                    variants={cascadeFade}
                    custom={idx * 0.05}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '1.1rem',
                        color: iconColor,
                        zIndex: 1
                      }}
                    >
                      <Icon />
                    </span>
                    {showLabels && (
                      <motion.span
                        className="menu-label"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{ zIndex: 1 }}
                      >
                        {item.label}
                      </motion.span>
                    )}

                  </motion.button>
                );
              })}
            </motion.nav>
            {/* Collapse Toggle (Desktop only) */}
            <motion.button
              className="collapse-toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? '→' : '←'}
            </motion.button>
          </motion.div>

      {/* Logo Preview Modal */}
      <AnimatePresence>
        {showLogoPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoPreview(false)}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '3rem',
                width: '500px',
                height: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <button
                onClick={() => setShowLogoPreview(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'var(--theme-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                ×
              </button>
              <div style={{
                width: '400px',
                height: '400px',
                background: 'var(--theme-color)',
                borderRadius: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={getThemeLogo()} 
                  alt="Schedule Hub Logo Preview" 
                  style={{
                    width: '400px',
                    height: '400px',
                    objectFit: 'cover',
                    borderRadius: '2rem'
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(Sidebar);
