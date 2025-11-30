import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/Owner/OwnerDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Rooms from './pages/Admin/Rooms';
import Classes from './pages/Admin/Classes';
import Courses from './pages/Admin/Courses';
import Users from './pages/Admin/Users';
import StudentDashboard from './pages/Student/StudentDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
              path="/admin/rooms" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <Rooms />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin/classes" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <Classes />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin/courses" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <Courses />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/admin/users" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <Users />
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
