import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// General
const UBlock = lazy(() => import('./components/UBlock'));
const Login = lazy(() => import('./components/Login'));
const Regist = lazy(() => import('./components/Regist'));

// Admin
const AdminPanel = lazy(() => import('./components/admins/Admin'));
const ManageUsers = lazy(() => import('./components/admins/ManageUsers'));
const ReviewEvidence = lazy(() => import('./components/admins/ReviewEvidence'));
const ReviewLogs = lazy(() => import('./components/admins/ReviewLogs'));

// Forensic
const ForensicProfile = lazy(() => import('./components/forensic/ForensicProfile'));
const ManageEvidence = lazy(() => import('./components/forensic/ManageEvidence'));
const ChangePassword = lazy(() => import('./components/forensic/ChangePassword'));
const ChangeProfile = lazy(() => import('./components/forensic/UpdateProfile'));

// Staff
const StaffProfile = lazy(() => import('./components/staff/StaffProfile'));
const SChangePassword = lazy(() => import('./components/staff/ChangePassword'));
const UpdateProfile = lazy(() => import('./components/staff/UpdateProfile'));
const ViewEvidence = lazy(() => import('./components/staff/ViewEvidence'));
const ManageLogs = lazy(() => import('./components/staff/ManageLogs'));

// Police
const PoliceProfile = lazy(() => import('./components/police/PoliceProfile'));
const PoliceViewEvidence = lazy(() => import('./components/police/PoliceViewEvidence'));
const PoliceManageLogs = lazy(() => import('./components/police/PoliceManageLogs'));
const PoliceChangePassword = lazy(() => import('./components/police/PoliceChangePassword'));
const PoliceUpdateProfile = lazy(() => import('./components/police/PoliceUpdateProfile'));

const App = () => {
  return (
    <Router>
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<UBlock />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Regist />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>
          } />
          <Route path="/admin/manage-users" element={
            <ProtectedRoute role="admin"><ManageUsers /></ProtectedRoute>
          } />
          <Route path="/admin/review-evidence" element={
            <ProtectedRoute role="admin"><ReviewEvidence /></ProtectedRoute>
          } />
          <Route path="/admin/review-logs" element={
            <ProtectedRoute role="admin"><ReviewLogs /></ProtectedRoute>
          } />

          {/* Forensic Protected Routes */}
          <Route path="/forensic" element={
            <ProtectedRoute role="forensic"><ForensicProfile /></ProtectedRoute>
          } />
          <Route path="/forensic/manage-evidence" element={
            <ProtectedRoute role="forensic"><ManageEvidence /></ProtectedRoute>
          } />
          <Route path="/forensic/change-password" element={
            <ProtectedRoute role="forensic"><ChangePassword /></ProtectedRoute>
          } />
          <Route path="/forensic/update-profile" element={
            <ProtectedRoute role="forensic"><ChangeProfile /></ProtectedRoute>
          } />

          {/* Staff Protected Routes */}
          <Route path="/staff" element={
            <ProtectedRoute role="staff"><StaffProfile /></ProtectedRoute>
          } />
          <Route path="/staff/change-password" element={
            <ProtectedRoute role="staff"><SChangePassword /></ProtectedRoute>
          } />
          <Route path="/staff/update-profile" element={
            <ProtectedRoute role="staff"><UpdateProfile /></ProtectedRoute>
          } />
          <Route path="/staff/view-evidence" element={
            <ProtectedRoute role="staff"><ViewEvidence /></ProtectedRoute>
          } />
          <Route path="/staff/manage-logs" element={
            <ProtectedRoute role="staff"><ManageLogs /></ProtectedRoute>
          } />

          {/* Police Protected Routes */}
          <Route path="/police" element={
            <ProtectedRoute role="police"><PoliceProfile /></ProtectedRoute>
          } />
          <Route path="/police/view-evidence" element={
            <ProtectedRoute role="police"><PoliceViewEvidence /></ProtectedRoute>
          } />
          <Route path="/police/manage-logs" element={
            <ProtectedRoute role="police"><PoliceManageLogs /></ProtectedRoute>
          } />
          <Route path="/police/change-password" element={
            <ProtectedRoute role="police"><PoliceChangePassword /></ProtectedRoute>
          } />
          <Route path="/police/update-profile" element={
            <ProtectedRoute role="police"><PoliceUpdateProfile /></ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;