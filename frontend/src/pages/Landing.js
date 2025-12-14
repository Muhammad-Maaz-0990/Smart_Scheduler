import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '../components/shared/animation_variants';
import '../pages/Dashboard.css';

const TopBar = ({ onSignIn, onSignUp }) => (
  <div style={{
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
    color: '#fff',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
      }}>📅</div>
      <strong style={{ fontSize: '1rem' }}>Smart Scheduler</strong>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' , gap: '18px' }}>
      <nav style={{ display: 'flex', gap: '14px', fontWeight: 600 }}>
        <a href="#home" style={{ color: '#fff', textDecoration: 'none' }}>Home</a>
        <a href="#about" style={{ color: '#fff', textDecoration: 'none' }}>About</a>
        <a href="#features" style={{ color: '#fff', textDecoration: 'none' }}>Features</a>
        <a href="#services" style={{ color: '#fff', textDecoration: 'none' }}>Services</a>
        <a href="#tutorial" style={{ color: '#fff', textDecoration: 'none' }}>Tutorial</a>
      </nav>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="light" style={{ fontWeight: 700 }} onClick={onSignIn}>Sign In</Button>
        <Button style={{ fontWeight: 700, background: '#f59e0b', border: 'none', boxShadow: '0 4px 10px rgba(245,158,11,0.35)' }} onClick={onSignUp}>Sign Up</Button>
      </div>
    </div>
  </div>
);

const Hero = ({ onSignUp }) => (
  <div style={{
    background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 40%, #3b82f6 100%)',
    borderRadius: '16px',
    padding: '3rem',
    textAlign: 'center',
    color: '#fff',
    boxShadow: '0 10px 24px rgba(126,34,206,0.25)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      bottom: -40,
      left: 0,
      right: 0,
      height: 120,
      background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)'
    }} />
    <motion.h1 initial="hidden" animate="visible" variants={fadeInUp} style={{
      fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
      fontWeight: 800,
      marginBottom: '0.5rem'
    }}>
      Plan, Assign, and Optimize Your Institute Timetables
    </motion.h1>
    <motion.p initial="hidden" animate="visible" variants={fadeInUp} style={{
      color: 'rgba(255,255,255,0.85)', fontSize: '1rem', maxWidth: 800, margin: '0 auto 1rem'
    }}>
      Smart Scheduler brings together classes, rooms, teachers, and courses with intelligent constraints to generate conflict-free timetables fast.
    </motion.p>
    <motion.div initial="hidden" animate="visible" variants={scaleIn}>
      <Button size="lg" style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        border: 'none', fontWeight: 700, boxShadow: '0 6px 16px rgba(245,158,11,0.35)', marginRight: 12
      }} onClick={onSignUp}>
        Get Started — It’s 7-Day Free Trial!
      </Button>
    </motion.div>
  </div>
);

const Feature = ({ icon, title, text }) => (
  <Card style={{ borderRadius: '18px', boxShadow: '0 10px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(126,34,206,0.12)' }}>
    <Card.Body>
      <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{icon}</div>
      <h5 style={{ fontWeight: 700 }}>{title}</h5>
      <p style={{ color: '#6b7280', marginBottom: 0 }}>{text}</p>
    </Card.Body>
  </Card>
);

const CTA = ({ onSignIn }) => (
  <div style={{
    borderRadius: '16px',
    padding: '2rem',
    background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.08) 100%)',
    textAlign: 'center'
  }}>
    <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Ready to schedule smarter?</h3>
    <p style={{ color: '#6b7280' }}>Sign in to your dashboard and generate or edit timetables instantly.</p>
    <Button variant="success" style={{ fontWeight: 700 }} onClick={onSignIn}>Sign In</Button>
  </div>
);

const Section = ({ id, title, children, bg }) => (
  <section id={id} style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    padding: '3rem 0',
    background: bg || 'transparent'
  }}>
    <Container>
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <h2 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>{title}</h2>
        <div style={{ color: '#6b7280' }}>
          {children}
        </div>
      </motion.div>
    </Container>
  </section>
);

const Footer = () => (
  <footer style={{
    background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
    color: '#e5e7eb',
    padding: '24px'
  }}>
    <Container>
      <Row>
        <Col md={6} sm={12}>
          <h5 style={{ fontWeight: 700 }}>Smart Scheduler</h5>
          <p style={{ marginBottom: 8 }}>Efficient timetables for modern institutes.</p>
        </Col>
        <Col md={6} sm={12} className="text-md-end">
          <div>Email: <a href="mailto:mbsofficalgroup@gmail.com" style={{ color: '#e5e7eb' }}>mbsofficalgroup@gmail.com</a></div>
          <div>Phone: <a href="tel:+923168563151" style={{ color: '#e5e7eb' }}>+92 316-8563151</a></div>
        </Col>
      </Row>
    </Container>
  </footer>
);

const Landing = () => {
  const navigate = useNavigate();
  const goSignIn = () => navigate('/login');
  const goSignUp = () => navigate('/register');

  return (
    <div style={{ scrollBehavior: 'smooth', width: '100vw', minHeight: '100vh', overflowX: 'hidden', background: '#f8fafc' }}>
      <TopBar onSignIn={goSignIn} onSignUp={goSignUp} />
      <div id="home">
        <Container fluid style={{ padding: '2rem' }}>
          <Hero onSignUp={goSignUp} />
        </Container>
      </div>

      <Section id="about" title="About" bg="linear-gradient(135deg, rgba(126,34,206,0.05) 0%, rgba(107,33,168,0.05) 100%)">
        Smart Scheduler streamlines institute scheduling. It integrates with your data to create conflict-free timetables and offers admin, teacher, and student views.
      </Section>

      <Section id="features" title="Features">
        <Row className="g-3">
          <Col md={4} sm={12}><Feature icon="⚙️" title="CSP Engine" text="Constraints cover teacher, room, and class conflicts with break windows and lab rules." /></Col>
          <Col md={4} sm={12}><Feature icon="🏫" title="Admin Tools" text="Manage rooms, classes, courses, timeslots; generate and edit timetables." /></Col>
          <Col md={4} sm={12}><Feature icon="👩‍🏫" title="Role Views" text="Dedicated dashboards for Admin, Owner, Teacher, and Student." /></Col>
        </Row>
        <div style={{ height: 20 }} />
        <Card style={{ borderRadius: '16px' }}>
          <Card.Body>
            <h5 style={{ fontWeight: 700, marginBottom: 8 }}>Highlights</h5>
            <ul style={{ marginBottom: 0 }}>
              <li>Per-class lab room selection and enforcement</li>
              <li>Break insertion after chosen lecture; resume exactly at break end</li>
              <li>Solver timeout protection and clear error messages</li>
              <li>Edit time settings with validations; regenerate grids consistently</li>
              <li>Sidebar state persistence across navigation</li>
            </ul>
          </Card.Body>
        </Card>
      </Section>

      <Section id="services" title="Services" bg="linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(5,150,105,0.10) 100%)">
        <Row className="g-3">
          <Col md={6} sm={12}><Feature icon="🛠️" title="Setup & Integration" text="We help connect your institute data and configure scheduling settings." /></Col>
          <Col md={6} sm={12}><Feature icon="📈" title="Optimization & Support" text="Fine-tune constraints, lab allocations, and break policies with ongoing support." /></Col>
        </Row>
      </Section>

      <Section id="tutorial" title="Tutorial">
        <ol>
          <li>Sign up and log in.</li>
          <li>As Admin, add rooms, classes, courses, and timeslots.</li>
          <li>Select lab rooms per class; configure break time in generation.</li>
          <li>Generate timetables; edit cells with drag-and-drop as needed.</li>
          <li>Teachers and students view schedules by day and print as needed.</li>
        </ol>
        <div style={{ height: 10 }} />
        <CTA onSignIn={goSignIn} />
      </Section>

      <Footer />
    </div>
  );
};

export default Landing;
