import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';
import { useToast } from '../context/ToastProvider.jsx';
import { WalletButton } from './WalletButton.jsx';
import { NAV } from '../utils/mockData.js';

function Layout({ page, setPage, children }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageLabels = {
    dashboard: 'Command Dashboard',
    upload:    'Upload Evidence',
    evidence:  'Evidence Vault',
    reports:   'Generate Reports',
  };

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🛡</div>
          <div>
            <div className="logo-text">UBlock</div>
            <span className="logo-sub">Evidence Protection</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(item => (
            <div
              key={item.path}
              className={`nav-item${page === item.path ? ' active' : ''}`}
              onClick={() => { setPage(item.path); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>{item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card" onClick={() => { logout(); toast('Logged out securely'); }}>
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Officer'}</div>
              <div className="user-role">{user?.role || 'user'} · Logout</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>↪</span>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <h1 className="page-title">{pageLabels[page] || 'UBlock'}</h1>
          <div className="topbar-actions">
            {/* MetaMask wallet button — always visible in topbar */}
            <WalletButton />
            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: 1 }}>● SECURE</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;