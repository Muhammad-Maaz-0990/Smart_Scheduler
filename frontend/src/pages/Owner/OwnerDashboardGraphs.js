import React, { useEffect, useState } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { scaleIn } from '../../components/shared/animation_variants';
import { FaChartLine, FaChartPie, FaChartBar } from 'react-icons/fa';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const OwnerDashboardGraphs = () => {
  const [stats, setStats] = useState({ institutes: 0, teachers: 0, students: 0 });
  const [institutes, setInstitutes] = useState([]);
  const [growth, setGrowth] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/owner-stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setStats(data));
    fetch('http://localhost:5000/api/auth/institutes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setInstitutes(Array.isArray(data) ? data : []));
    fetch('http://localhost:5000/api/auth/institute-growth', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setGrowth(Array.isArray(data) ? data : []));
  }, []);
  // Line chart data for institute growth
  const lineData = {
    labels: growth.map(g => g.date),
    datasets: [
      {
        label: 'Institutes (Cumulative)',
        data: growth.map(g => g.count),
        fill: false,
        borderColor: '#6366f1',
        backgroundColor: '#6366f1',
        tension: 0.1
      }
    ]
  };

  const pieData = {
    labels: ['Teachers', 'Students'],
    datasets: [
      {
        data: [stats.teachers || 0, stats.students || 0],
        backgroundColor: ['#6366f1', '#f59e42'],
      }
    ]
  };

  const barData2 = {
    labels: institutes.map(i => i.instituteName),
    datasets: [
      {
        label: 'Teachers',
        data: institutes.map(i => i.totalTeachers || 0),
        backgroundColor: '#6366f1',
      },
      {
        label: 'Students',
        data: institutes.map(i => i.totalStudents || 0),
        backgroundColor: '#f59e42',
      }
    ]
  };

  return (
    <Row className="mt-4 g-4">
      <Col lg={6}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
        >
          <Card style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}>
            <Card.Header style={{
              background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaChartLine />Institute Growth Over Time
            </Card.Header>
            <Card.Body className="p-3">
              <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </Card.Body>
          </Card>
        </motion.div>
      </Col>
      <Col lg={6}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          transition={{ delay: 0.1 }}
        >
          <Card style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}>
            <Card.Header style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaChartPie />Overall Teacher/Student Ratio
            </Card.Header>
            <Card.Body className="p-3">
              <Pie data={pieData} />
            </Card.Body>
          </Card>
        </motion.div>
      </Col>
      <Col lg={12}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          transition={{ delay: 0.2 }}
        >
          <Card style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}>
            <Card.Header style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaChartBar />Teachers & Students by Institute
            </Card.Header>
            <Card.Body className="p-3">
              <Bar data={barData2} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </Card.Body>
          </Card>
        </motion.div>
      </Col>
    </Row>
  );
};

export default OwnerDashboardGraphs;
