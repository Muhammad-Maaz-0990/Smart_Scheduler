import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
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
  FaBars,
  FaClock as FaClockIcon
} from 'react-icons/fa';
import { cascadeFade, staggerChildren } from './shared/animation_variants';
import './Sidebar.css';

const Sidebar = ({ activeMenu }) => {
  const navigate = useNavigate();
  const { user, logout, instituteObjectId, loadSubscriptionOnce } = useAuth();
  const [instituteInfo, setInstituteInfo] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const role = user?.designation || 'Owner';

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
        whileHover={{ scale: 1.08, boxShadow: '0 6px 16px rgba(124, 58, 237, 0.25)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsMobileOpen(!isMobileOpen);
          setIsVisible(true);
        }}
        title={isMobileOpen ? 'Close Menu' : 'Open Menu'}
      >
        <FaBars style={{ color: '#7c3aed', fontSize: '1.25rem' }} />
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

      {/* Sidebar */}
      <motion.div 
        className={`sidebar no-print ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{ display: isMobile && !isMobileOpen ? 'none' : 'flex' }}
      >
            {/* Institute Info (click to go to dashboard) */}
            <motion.div 
              className="sidebar-header"
              onClick={() => {
                handleMenuClick('dashboard');
                setIsMobileOpen(false);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ cursor: 'pointer' }}
            >
              {role === 'Owner' ? (
                /* Smart Scheduler Logo and Name for Owner */
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <motion.div
                    style={{
                      width: 55,
                      height: 55,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px rgba(124, 58, 237, 0.4)'
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <FaClockIcon style={{ fontSize: 28, color: 'white' }} />
                  </motion.div>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.5px' }}>
                        Smart Scheduler
                      </div>
                      <div style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#c7d2fe',
                        marginTop: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Owner Panel
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* Institute Logo, Name and Designation for Admin/Student/Teacher */
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {instituteInfo?.instituteLogo ? (
                      <img
                        src={`http://localhost:5000${instituteInfo.instituteLogo}`}
                        alt="Institute Logo"
                        style={{
                          width: 55,
                          height: 55,
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: '2px solid rgba(255,255,255,0.3)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 55,
                        height: 55,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }}>
                        {instituteInfo?.instituteName?.charAt(0) || 'I'}
                      </div>
                    )}
                  </motion.div>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div style={{
                        fontWeight: 800,
                        fontSize: 18,
                        color: '#fff',
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
                        fontSize: 13,
                        color: '#c7d2fe',
                        marginTop: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {role}
                      </div>
                    </motion.div>
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
              {menuItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.value;
                return (
                  <motion.button
                    key={item.value}
                    className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleMenuClick(item.value)}
                    title={item.label}
                    variants={cascadeFade}
                    whileHover={{ scale: 1.05, x: 4 }}
                    whileTap={{ scale: 0.95 }}
                    custom={idx * 0.05}
                    style={{
                      background: isActive
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'transparent',
                      borderLeft: isActive ? '4px solid white' : '4px solid transparent',
                      borderRadius: '8px',
                      padding: '0.875rem 1rem',
                      margin: '0.5rem 0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '0.95rem',
                      transition: 'all 0.2s',
                      border: 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <motion.span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '1.1rem',
                        color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.75)'
                      }}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Icon />
                    </motion.span>
                    {!isCollapsed && (
                      <motion.span
                        className="menu-label"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                    {isActive && (
                      <motion.div
                        style={{
                          position: 'absolute',
                          right: 0,
                          width: 3,
                          height: '100%',
                          background: 'linear-gradient(180deg, #7c3aed 0%, #3b82f6 100%)'
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.nav>

            {/* User Info & Logout */}
            <motion.div
              className="sidebar-footer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                className="logout-btn-sidebar"
                onClick={handleLogout}
                title="Logout"
                whileHover={{ scale: 1.05, x: 4 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderLeft: '4px solid transparent',
                  borderRadius: '8px',
                  padding: '0.875rem 1rem',
                  margin: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: 'none',
                  transition: 'all 0.2s',
                  width: 'calc(100% - 1rem)'
                }}
              >
                <motion.span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1.1rem'
                  }}
                  whileHover={{ rotate: -15, scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <FaDoorOpen />
                </motion.span>
                {!isCollapsed && <span className="menu-label">Logout</span>}
              </motion.button>
            </motion.div>

            {/* Collapse Toggle (Desktop only) */}
            <motion.button
              className="collapse-toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isCollapsed ? '→' : '←'}
            </motion.button>
          </motion.div>
    </>
  );
};

export default Sidebar;
