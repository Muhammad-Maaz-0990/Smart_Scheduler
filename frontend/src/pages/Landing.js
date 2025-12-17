import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, scaleIn } from '../components/shared/animation_variants';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaUsers, 
  FaChalkboard, 
  FaCheckCircle, 
  FaArrowRight, 
  FaBars, 
  FaTimes,
  FaRobot,
  FaLightbulb,
  FaShieldAlt,
  FaBolt
} from 'react-icons/fa';
import '../pages/Dashboard.css';

const TopBar = ({ onSignIn, onSignUp }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid rgba(126, 34, 206, 0.1)'
      }}
    >
      <Container>
        <div style={{
          padding: '16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              style={{
                width: 45,
                height: 45,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(126, 34, 206, 0.3)'
              }}
            >
              <FaCalendarAlt style={{ fontSize: 22, color: 'white' }} />
            </motion.div>
            <div>
              <strong style={{ 
                fontSize: '1.3rem', 
                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
              }}>
                Smart Scheduler
              </strong>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <nav style={{ 
              display: window.innerWidth > 768 ? 'flex' : 'none', 
              gap: '24px', 
              fontWeight: 600,
              fontSize: '0.95rem'
            }}>
              {['Home', 'Features', 'How It Works', 'Pricing'].map((item) => (
                <motion.a 
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  whileHover={{ y: -2 }}
                  style={{ 
                    color: '#374151', 
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#7e22ce'}
                  onMouseLeave={(e) => e.target.style.color = '#374151'}
                >
                  {item}
                </motion.a>
              ))}
            </nav>
            
            <div style={{ 
              display: window.innerWidth > 768 ? 'flex' : 'none', 
              gap: '12px' 
            }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline-primary" 
                  style={{ 
                    fontWeight: 600,
                    borderWidth: 2,
                    borderRadius: '10px',
                    padding: '8px 20px',
                    borderColor: '#7e22ce',
                    color: '#7e22ce',
                    transition: 'all 0.3s ease'
                  }} 
                  onClick={onSignIn}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)';
                    e.target.style.color = 'white';
                    e.target.style.borderColor = 'transparent';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#7e22ce';
                    e.target.style.borderColor = '#7e22ce';
                  }}
                >
                  Sign In
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  style={{ 
                    fontWeight: 600, 
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 24px',
                    boxShadow: '0 4px 15px rgba(126, 34, 206, 0.3)'
                  }} 
                  onClick={onSignUp}
                >
                  Get Started
                </Button>
              </motion.div>
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: window.innerWidth <= 768 ? 'flex' : 'none',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                color: '#7e22ce',
                cursor: 'pointer'
              }}
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: window.innerWidth <= 768 ? 'block' : 'none',
                paddingBottom: '16px'
              }}
            >
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {['Home', 'Features', 'How It Works', 'Pricing'].map((item) => (
                  <a 
                    key={item}
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    style={{ 
                      color: '#374151', 
                      textDecoration: 'none',
                      fontWeight: 600,
                      padding: '8px 0'
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
              </nav>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button 
                  variant="outline-primary" 
                  style={{ 
                    flex: 1, 
                    fontWeight: 600,
                    borderColor: '#7e22ce',
                    color: '#7e22ce',
                    transition: 'all 0.3s ease'
                  }} 
                  onClick={() => { onSignIn(); setMobileMenuOpen(false); }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)';
                    e.target.style.color = 'white';
                    e.target.style.borderColor = 'transparent';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#7e22ce';
                    e.target.style.borderColor = '#7e22ce';
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  style={{ 
                    flex: 1,
                    fontWeight: 600, 
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    border: 'none'
                  }} 
                  onClick={() => { onSignUp(); setMobileMenuOpen(false); }}
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </motion.div>
  );
};

const Hero = ({ onSignUp }) => (
  <div id="home" style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    paddingTop: '100px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Animated Background Elements */}
    <div style={{
      position: 'absolute',
      top: '10%',
      left: '5%',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(126, 34, 206, 0.1) 0%, rgba(126, 34, 206, 0) 70%)',
      animation: 'float 20s ease-in-out infinite'
    }} />
    <div style={{
      position: 'absolute',
      bottom: '15%',
      right: '10%',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)',
      animation: 'float 15s ease-in-out infinite reverse'
    }} />

    <Container>
      <Row className="align-items-center">
        <Col lg={6} md={12}>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: 'rgba(126, 34, 206, 0.1)',
                borderRadius: '30px',
                marginBottom: '24px',
                border: '1px solid rgba(126, 34, 206, 0.2)'
              }}
            >
              <span style={{ 
                color: '#7e22ce', 
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                ✨ 7-Day Free Trial Available
              </span>
            </motion.div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 900,
              marginBottom: '24px',
              lineHeight: 1.1,
              color: '#111827'
            }}>
              Intelligent
              <span style={{
                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block'
              }}>
                Timetable Scheduling
              </span>
              Made Simple
            </h1>

            <p style={{
              fontSize: '1.2rem',
              color: '#6b7280',
              marginBottom: '32px',
              lineHeight: 1.6,
              maxWidth: '540px'
            }}>
              Automatically generate conflict-free timetables with advanced constraint solving. Save hours of manual work and eliminate scheduling conflicts.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  onClick={onSignUp}
                  style={{
                    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                    border: 'none',
                    fontWeight: 700,
                    padding: '14px 32px',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    boxShadow: '0 10px 30px rgba(126, 34, 206, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Start Free Trial <FaArrowRight />
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline-primary"
                  href="#how-it-works"
                  style={{
                    fontWeight: 700,
                    padding: '14px 32px',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    borderWidth: 2,
                    borderColor: '#7e22ce',
                    color: '#7e22ce'
                  }}
                >
                  Watch Demo
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                display: 'flex',
                gap: '32px',
                marginTop: '48px',
                flexWrap: 'wrap'
              }}
            >
              {[
                { icon: <FaCheckCircle />, text: 'No credit card required' },
                { icon: <FaCheckCircle />, text: 'Setup in 5 minutes' },
                { icon: <FaCheckCircle />, text: 'Cancel anytime' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '1.2rem' }}>{item.icon}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </Col>

        <Col lg={6} md={12} className="mt-5 mt-lg-0">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ position: 'relative' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(126, 34, 206, 0.1)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <FaClock style={{ fontSize: '2rem' }} />
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 800 }}>Monday Schedule</h4>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>Class: CS-5A</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {['Database Systems', 'Operating Systems', 'Break', 'Web Development'].map((course, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      style={{
                        background: idx === 2 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{course}</span>
                      <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                        {idx === 0 ? '8:00 - 9:30' : idx === 1 ? '9:30 - 11:00' : idx === 2 ? '11:00 - 11:30' : '11:30 - 1:00'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                {[
                  { label: 'Classes', value: '24+', color: '#7e22ce' },
                  { label: 'Rooms', value: '15+', color: '#3b82f6' },
                  { label: 'Courses', value: '50+', color: '#10b981' }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + idx * 0.1 }}
                    style={{
                      background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                      padding: '16px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      border: `1px solid ${stat.color}30`
                    }}
                  >
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </Col>
      </Row>
    </Container>
  </div>
);

const FeatureCard = ({ icon, title, description, color }) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    transition={{ duration: 0.3 }}
  >
    <Card style={{
      height: '100%',
      borderRadius: '20px',
      border: '1px solid rgba(126, 34, 206, 0.1)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      background: 'white'
    }}>
      <Card.Body style={{ padding: '32px' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          border: `2px solid ${color}30`
        }}>
          <div style={{ fontSize: '2rem', color }}>{icon}</div>
        </div>
        <h4 style={{ fontWeight: 800, marginBottom: '12px', color: '#111827' }}>{title}</h4>
        <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 0 }}>{description}</p>
      </Card.Body>
    </Card>
  </motion.div>
);

const Features = () => (
  <section id="features" style={{
    padding: '100px 0',
    background: 'white'
  }}>
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '60px' }}
      >
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          marginBottom: '16px',
          color: '#111827'
        }}>
          Powerful Features for
          <span style={{
            background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'block'
          }}>
            Effortless Scheduling
          </span>
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
          Everything you need to manage timetables efficiently and intelligently
        </p>
      </motion.div>

      <Row className="g-4">
        {[
          {
            icon: <FaRobot />,
            title: 'AI-Powered Constraint Solver',
            description: 'Advanced CSP engine automatically resolves conflicts for teachers, rooms, and classes with intelligent break placement.',
            color: '#7e22ce'
          },
          {
            icon: <FaUsers />,
            title: 'Multi-Role Dashboards',
            description: 'Dedicated views for Admins, Teachers, and Students. Each role sees exactly what they need.',
            color: '#3b82f6'
          },
          {
            icon: <FaChalkboard />,
            title: 'Smart Room Management',
            description: 'Lab room enforcement per class with automatic allocation and conflict detection.',
            color: '#10b981'
          },
          {
            icon: <FaClock />,
            title: 'Flexible Time Slots',
            description: 'Configure custom time slots with break insertion after specific lectures. Resume timing automatically.',
            color: '#f59e0b'
          },
          {
            icon: <FaLightbulb />,
            title: 'Drag & Drop Editing',
            description: 'Intuitive interface to manually adjust generated timetables with real-time validation.',
            color: '#ec4899'
          },
          {
            icon: <FaShieldAlt />,
            title: 'Data Security',
            description: 'Enterprise-grade security with role-based access control and encrypted data storage.',
            color: '#8b5cf6'
          }
        ].map((feature, idx) => (
          <Col key={idx} lg={4} md={6} sm={12}>
            <FeatureCard {...feature} />
          </Col>
        ))}
      </Row>
    </Container>
  </section>
);

const HowItWorks = () => (
  <section id="how-it-works" style={{
    padding: '100px 0',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: '20%',
      right: '-100px',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(126, 34, 206, 0.1) 0%, rgba(126, 34, 206, 0) 70%)',
      animation: 'float 15s ease-in-out infinite'
    }} />

    <Container>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '60px' }}
      >
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          marginBottom: '16px',
          color: '#111827'
        }}>
          How It Works
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
          Get started in minutes with our simple 4-step process
        </p>
      </motion.div>

      <Row className="g-4">
        {[
          {
            step: '01',
            title: 'Sign Up & Setup',
            description: 'Create your account and configure your institute details in minutes. No technical knowledge required.',
            icon: <FaUsers />
          },
          {
            step: '02',
            title: 'Add Your Data',
            description: 'Import or manually add rooms, classes, courses, and time slots. Bulk CSV import supported.',
            icon: <FaChalkboard />
          },
          {
            step: '03',
            title: 'Generate Timetable',
            description: 'Let our AI engine create conflict-free schedules automatically. Configure constraints and preferences.',
            icon: <FaRobot />
          },
          {
            step: '04',
            title: 'Review & Share',
            description: 'Fine-tune with drag-and-drop editing, then share with teachers and students instantly.',
            icon: <FaCheckCircle />
          }
        ].map((item, idx) => (
          <Col key={idx} lg={6} md={12}>
            <motion.div
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <Card style={{
                borderRadius: '20px',
                border: '1px solid rgba(126, 34, 206, 0.1)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                background: 'white',
                height: '100%'
              }}>
                <Card.Body style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 8px 20px rgba(126, 34, 206, 0.3)'
                    }}>
                      <div style={{ fontSize: '2rem', color: 'white' }}>{item.icon}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '3rem',
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 0.8,
                        marginBottom: '12px'
                      }}>
                        {item.step}
                      </div>
                      <h4 style={{ fontWeight: 800, marginBottom: '12px', color: '#111827' }}>
                        {item.title}
                      </h4>
                      <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 0 }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </Container>
  </section>
);

const Pricing = ({ onSignUp }) => (
  <section id="pricing" style={{
    padding: '100px 0',
    background: 'white'
  }}>
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '60px' }}
      >
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          marginBottom: '16px',
          color: '#111827'
        }}>
          Simple, Transparent Pricing
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
          Start with a 7-day free trial. No credit card required.
        </p>
      </motion.div>

      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card style={{
              borderRadius: '24px',
              border: '2px solid #7e22ce',
              boxShadow: '0 20px 60px rgba(126, 34, 206, 0.2)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(224, 231, 255, 0.3) 100%)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                padding: '24px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>
                  MOST POPULAR
                </div>
                <h3 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>Pro Plan</h3>
              </div>
              
              <Card.Body style={{ padding: '48px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#111827' }}>$49 </span>
                    <span style={{ fontSize: '1.2rem', color: '#6b7280' }}>/month</span>
                    <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#111827' }}> / $300 </span>
                    <span style={{ fontSize: '1.2rem', color: '#6b7280' }}>/year</span>
                  </div>
                  <p style={{ color: '#6b7280', marginTop: '8px' }}>Billed monthly or yearly, cancel anytime</p>
                </div>

                <div style={{ marginBottom: '40px' }}>
                  {[
                    'Unlimited timetables generation',
                    'Up to 100 classes and rooms',
                    'Advanced constraint solver',
                    'Multi-role dashboards',
                    'CSV import/export',
                    'Priority support',
                    '7-day free trial'
                  ].map((feature, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: idx < 6 ? '1px solid #e5e7eb' : 'none'
                    }}>
                      <FaCheckCircle style={{ color: '#10b981', fontSize: '1.2rem', flexShrink: 0 }} />
                      <span style={{ color: '#374151', fontSize: '1rem', fontWeight: 500 }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    onClick={onSignUp}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
                      border: 'none',
                      fontWeight: 700,
                      padding: '16px',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      boxShadow: '0 10px 30px rgba(126, 34, 206, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaBolt /> Start Your Free Trial
                  </Button>
                </motion.div>

                <p style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                  marginTop: '16px',
                  marginBottom: 0
                }}>
                  No credit card required • Cancel anytime
                </p>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          textAlign: 'center',
          marginTop: '48px',
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: '16px'
        }}
      >
        <h4 style={{ fontWeight: 800, marginBottom: '12px' }}>Need a Custom Plan?</h4>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Contact us for enterprise pricing and custom features tailored to your institution.
        </p>
        <Button
          variant="outline-primary"
          style={{
            fontWeight: 600,
            padding: '12px 32px',
            borderRadius: '10px',
            borderWidth: 2,
            borderColor: '#7e22ce',
            color: '#7e22ce'
          }}
          href="mailto:mbsofficalgroup@gmail.com"
        >
          Contact Sales
        </Button>
      </motion.div>
    </Container>
  </section>
);

const CTA = ({ onSignUp }) => (
  <section style={{
    padding: '100px 0',
    background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: '-50px',
      right: '-50px',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
    }} />
    <div style={{
      position: 'absolute',
      bottom: '-100px',
      left: '-100px',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
    }} />

    <Container style={{ position: 'relative', zIndex: 1 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', color: 'white' }}
      >
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          marginBottom: '24px'
        }}>
          Ready to Transform Your Scheduling?
        </h2>
        <p style={{
          fontSize: '1.2rem',
          marginBottom: '40px',
          maxWidth: '700px',
          margin: '0 auto 40px',
          opacity: 0.95
        }}>
          Join hundreds of institutions saving time and eliminating conflicts with Smart Scheduler
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            onClick={onSignUp}
            style={{
              background: 'white',
              color: '#7e22ce',
              border: 'none',
              fontWeight: 700,
              padding: '16px 48px',
              borderRadius: '12px',
              fontSize: '1.2rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            Start Your 7-Day Free Trial <FaArrowRight />
          </Button>
        </motion.div>

        <p style={{
          marginTop: '24px',
          opacity: 0.9,
          fontSize: '0.95rem'
        }}>
          No credit card required • Full access during trial
        </p>
      </motion.div>
    </Container>
  </section>
);

const Footer = () => (
  <footer style={{
    background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
    color: '#e5e7eb',
    padding: '60px 0 24px'
  }}>
    <Container>
      <Row className="g-4">
        <Col lg={4} md={6} sm={12}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: 45,
              height: 45,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7e22ce 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaCalendarAlt style={{ fontSize: 22, color: 'white' }} />
            </div>
            <strong style={{ fontSize: '1.3rem', fontWeight: 800 }}>Smart Scheduler</strong>
          </div>
          <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>
            Intelligent timetable scheduling for modern educational institutions. Save time, eliminate conflicts, and focus on what matters.
          </p>
        </Col>
        
        <Col lg={2} md={6} sm={12}>
          <h5 style={{ fontWeight: 700, marginBottom: '16px' }}>Product</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Features', 'Pricing', 'Demo', 'Updates'].map((item) => (
              <a key={item} href="#" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>
                {item}
              </a>
            ))}
          </div>
        </Col>
        
        <Col lg={2} md={6} sm={12}>
          <h5 style={{ fontWeight: 700, marginBottom: '16px' }}>Company</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
              <a key={item} href="#" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>
                {item}
              </a>
            ))}
          </div>
        </Col>
        
        <Col lg={4} md={6} sm={12}>
          <h5 style={{ fontWeight: 700, marginBottom: '16px' }}>Contact Us</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontWeight: 600 }}>Email:</span>{' '}
              <a href="mailto:mbsofficalgroup@gmail.com" style={{ color: '#9ca3af', textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.color = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>
                mbsofficalgroup@gmail.com
              </a>
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>Phone:</span>{' '}
              <a href="tel:+923168563151" style={{ color: '#9ca3af', textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.color = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>
                +92 316-8563151
              </a>
            </div>
          </div>
        </Col>
      </Row>
      
      <div style={{
        borderTop: '1px solid #374151',
        marginTop: '48px',
        paddingTop: '24px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>
          © 2025 Smart Scheduler. All rights reserved.
        </p>
      </div>
    </Container>
  </footer>
);

const Landing = () => {
  const navigate = useNavigate();
  const goSignIn = () => navigate('/login');
  const goSignUp = () => navigate('/register');

  return (
    <div style={{
      scrollBehavior: 'smooth',
      width: '100%',
      minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      <TopBar onSignIn={goSignIn} onSignUp={goSignUp} />
      <Hero onSignUp={goSignUp} />
      <Features />
      <HowItWorks />
      <Pricing onSignUp={goSignUp} />
      <CTA onSignUp={goSignUp} />
      <Footer />
    </div>
  );
};

export default Landing;
