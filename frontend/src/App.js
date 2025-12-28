import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import OwnerDashboard from './pages/Owner/OwnerDashboard';
import Institutes from './pages/Owner/Institutes';
import OwnerUsers from './pages/Owner/OwnerUsers';
import OwnerProfile from './pages/Owner/OwnerProfile';
import Payments from './pages/Owner/Payments';
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

import ChangePassword from './pages/Admin/ChangePassword';
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
            <Route path="/" element={<Landing />} />
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
              path="/owner/institutes" 
              element={
                <PrivateRoute allowedRoles={['Owner']}>
                  <Institutes />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/owner/ownerUsers" 
              element={
                <PrivateRoute allowedRoles={['Owner']}>
                  <OwnerUsers />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/owner/profile" 
              element={
                <PrivateRoute allowedRoles={['Owner']}>
                  <OwnerProfile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/owner/payments" 
              element={
                <PrivateRoute allowedRoles={['Owner']}>
                  <Payments />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="classes" element={<Classes />} />
              <Route path="courses" element={<Courses />} />
              <Route path="timeslots" element={<TimeSlots />} />
              <Route path="timetables" element={<AdminTimeTablesPage />} />
              <Route path="generate-timetable" element={<GenerateTimetable />} />
              <Route path="users" element={<Users />} />
              <Route path="feedbacks" element={<AdminFeedbacksPage />} />
              <Route 
                path="profile" 
                element={
                  <PrivateRoute allowedRoles={['Admin']} allowWhenExpired={true}>
                    <AdminProfilePage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="profile/password" 
                element={
                  <PrivateRoute allowedRoles={['Admin']} allowWhenExpired={true}>
                    <ChangePassword />
                  </PrivateRoute>
                } 
              />
            </Route>
            
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
