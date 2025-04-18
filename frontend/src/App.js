import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

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
          {/* General Routes */}
          <Route path="/" element={<UBlock />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Regist />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/review-evidence" element={<ReviewEvidence />} />
          <Route path="/admin/review-logs" element={<ReviewLogs />} />

          {/* Forensic Routes */}
          <Route path="/forensic" element={<ForensicProfile />} />
          <Route path="/forensic/manage-evidence" element={<ManageEvidence />} />
          <Route path="/forensic/change-password" element={<ChangePassword />} />
          <Route path="/forensic/update-profile" element={<ChangeProfile />} />

          {/* Staff Routes */}
          <Route path="/staff" element={<StaffProfile />} />
          <Route path="/staff/change-password" element={<SChangePassword />} />
          <Route path="/staff/update-profile" element={<UpdateProfile />} />
          <Route path="/staff/view-evidence" element={<ViewEvidence />} />
          <Route path="/staff/manage-logs" element={<ManageLogs />} />

          {/* Police Routes */}
          <Route path="/police" element={<PoliceProfile />} />
          <Route path="/police/view-evidence" element={<PoliceViewEvidence />} />
          <Route path="/police/manage-logs" element={<PoliceManageLogs />} />
          <Route path="/police/change-password" element={<PoliceChangePassword />} />
          <Route path="/police/update-profile" element={<PoliceUpdateProfile />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;