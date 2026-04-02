import React from 'react'

const LoadingScreen = () => {
  return (
    <div className="loading" style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div className="spinner" />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-muted)", letterSpacing: 2 }}>INITIALIZING UBLOCK...</span>
    </div>
  );
}

export default LoadingScreen