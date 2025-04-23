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

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            <Route index element={<AdminPanel />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="review-evidence" element={<ReviewEvidence />} />
            <Route path="review-logs" element={<ReviewLogs />} />
          </Route>

          {/* Protected Forensic Routes */}
          <Route path="/forensic" element={<ProtectedRoute role="forensic" />}>
            <Route index element={<ForensicProfile />} />
            <Route path="manage-evidence" element={<ManageEvidence />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="update-profile" element={<ChangeProfile />} />
          </Route>

          {/* Protected Staff Routes */}
          <Route path="/staff" element={<ProtectedRoute role="staff" />}>
            <Route index element={<StaffProfile />} />
            <Route path="change-password" element={<SChangePassword />} />
            <Route path="update-profile" element={<UpdateProfile />} />
            <Route path="view-evidence" element={<ViewEvidence />} />
            <Route path="manage-logs" element={<ManageLogs />} />
          </Route>

          {/* Protected Police Routes */}
          <Route path="/police" element={<ProtectedRoute role="police" />}>
            <Route index element={<PoliceProfile />} />
            <Route path="view-evidence" element={<PoliceViewEvidence />} />
            <Route path="manage-logs" element={<PoliceManageLogs />} />
            <Route path="change-password" element={<PoliceChangePassword />} />
            <Route path="update-profile" element={<PoliceUpdateProfile />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;