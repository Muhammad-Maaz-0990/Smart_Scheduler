import React, { useEffect, useState } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';

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

  const barData = {
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

  const pieData = {
    labels: ['Teachers', 'Students'],
    datasets: [
      {
        data: [stats.teachers || 0, stats.students || 0],
        backgroundColor: ['#6366f1', '#f59e42'],
      }
    ]
  };

  return (
    <Row className="mt-4 g-4">
      <Col lg={6}>
        <Card className="glass-effect">
          <Card.Header>Institute Growth Over Time</Card.Header>
          <Card.Body>
            <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </Card.Body>
        </Card>
      </Col>
      <Col lg={6}>
        <Card className="glass-effect">
          <Card.Header>Overall Teacher/Student Ratio</Card.Header>
          <Card.Body>
            <Pie data={pieData} />
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default OwnerDashboardGraphs;
