import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<Login />} />
            
            <Route 
              path="/owner" 
              element={
                <PrivateRoute allowedRoles={['Owner']}>
                  <OwnerDashboard />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/student" 
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <StudentDashboard />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/teacher" 
              element={
                <PrivateRoute allowedRoles={['Teacher']}>
                  <TeacherDashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
