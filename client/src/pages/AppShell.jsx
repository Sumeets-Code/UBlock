import React, { useState } from 'react'
import { useAuth } from '../context/AuthProvider';
import LoadingScreen from './LoadingScreen';
import Layout from '../components/Layout';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import DashboardPage from './Dashboard';
import UploadPage from './UploadPage';
import EvidencePage from './EvidencePage';
import EvidenceDetailPage from './EvidenceDetailPage';
import ReportsPage from './ReportsPage';

function AppShell() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [authPage, setAuthPage] = useState("login");
  const [detailId, setDetailId] = useState(null);

  if (loading) return <LoadingScreen />;

  if (!user) {
    return authPage === "login"
      ? <LoginPage goRegister={() => setAuthPage("register")} />
      : <RegisterPage goLogin={() => setAuthPage("login")} />;
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage setPage={setPage} />;
      case "upload": return <UploadPage setPage={setPage} />;
      case "evidence": return <EvidencePage setPage={setPage} setDetailId={setDetailId} />;
      case "detail": return <EvidenceDetailPage id={detailId} setPage={setPage} />;
      case "reports": return <ReportsPage />;
      default: return <DashboardPage setPage={setPage} />;
    }
  };

  return (
    <Layout page={page === "detail" ? "evidence" : page} setPage={(p) => { setPage(p); setDetailId(null); }}>
      {renderPage()}
    </Layout>
  );
}

export default AppShell