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
import TimeSlots from './pages/Admin/TimeSlots';
import AdminTimeTablesPage from './pages/Admin/TimeTables';
import GenerateTimetable from './pages/Admin/GenerateTimetable';
import Users from './pages/Admin/Users';
import AdminFeedbacksPage from './pages/Admin/Feedbacks';
import AdminProfilePage from './pages/Admin/Profile';
import StudentDashboard from './pages/Student/StudentDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import TeacherFeedbacksPage from './pages/Teacher/Feedbacks';
import TeacherProfilePage from './pages/Teacher/Profile';
import TeacherTimeTablesPage from './pages/Teacher/TimeTables';
import StudentFeedbacksPage from './pages/Student/Feedbacks';
import StudentProfilePage from './pages/Student/Profile';
import StudentTimeTablesPage from './pages/Student/TimeTables';
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
              path="/admin/timeslots" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <TimeSlots />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/admin/timetables" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminTimeTablesPage />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/admin/generate-timetable" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <GenerateTimetable />
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
              path="/admin/feedbacks" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminFeedbacksPage />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin/profile" 
              element={
                <PrivateRoute allowedRoles={['Admin']} allowWhenExpired={true}>
                  <AdminProfilePage />
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
              path="/student/feedbacks" 
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <StudentFeedbacksPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/profile" 
              element={
                <PrivateRoute allowedRoles={['Student']} allowWhenExpired={true}>
                  <StudentProfilePage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/timetables" 
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <StudentTimeTablesPage />
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
            <Route 
              path="/teacher/feedbacks" 
              element={
                <PrivateRoute allowedRoles={['Teacher']}>
                  <TeacherFeedbacksPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/teacher/profile" 
              element={
                <PrivateRoute allowedRoles={['Teacher']} allowWhenExpired={true}>
                  <TeacherProfilePage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/teacher/timetables" 
              element={
                <PrivateRoute allowedRoles={['Teacher']}>
                  <TeacherTimeTablesPage />
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
