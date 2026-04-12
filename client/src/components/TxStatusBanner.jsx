import React from 'react';

export const TxStatusBanner = ({ status, txHash, error }) => {
  if (status === 'idle') return null;

  const STATES = {
    pending: {
      icon: '🦊',
      title: 'Check MetaMask',
      sub: 'Review and confirm the transaction in your MetaMask popup.',
      color: 'rgba(255,171,64,0.12)',
      border: 'rgba(255,171,64,0.4)',
      textColor: 'var(--warning)',
    },
    confirming: {
      icon: '⛓',
      title: 'Waiting for confirmation',
      sub: 'Transaction submitted. Waiting for Sepolia block confirmation (~15s).',
      color: 'rgba(0,212,255,0.06)',
      border: 'var(--border-bright)',
      textColor: 'var(--accent)',
    },
    confirmed: {
      icon: '✅',
      title: 'Registered on blockchain',
      sub: txHash ? `Transaction hash: ${txHash.slice(0, 20)}...` : 'Evidence permanently recorded.',
      color: 'rgba(0,230,118,0.08)',
      border: 'rgba(0,230,118,0.3)',
      textColor: 'var(--success)',
    },
    error: {
      icon: '⚠',
      title: 'Transaction failed',
      sub: error || 'Something went wrong. Try again or skip wallet to use operator.',
      color: 'rgba(255,82,82,0.08)',
      border: 'rgba(255,82,82,0.3)',
      textColor: 'var(--danger)',
    },
  };

  const s = STATES[status];
  if (!s) return null;

  return (
    <div style={{
      padding: '14px 18px',
      background: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 10,
      marginBottom: 20,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      {/* Spinner for in-flight states */}
      {(status === 'confirming') ? (
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
          flexShrink: 0, marginTop: 1,
        }} />
      ) : (
        <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
      )}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.textColor, marginBottom: 3 }}>
          {s.title}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
          {s.sub}
        </div>
        {txHash && status === 'confirmed' && (
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, display: 'inline-block' }}
          >
            View on Etherscan →
          </a>
        )}
      </div>
    </div>
  );
};
