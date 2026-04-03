import React from 'react';
import { useWallet } from '../context/WalletProvider.jsx';
import { useEffect } from 'react';

/**
 * WalletConnectModal
 *
 * Shown before the upload form when MetaMask is not yet connected.
 * Gives the user the choice to connect (they pay gas) or skip
 * (the backend operator wallet pays gas on their behalf).
 *
 * Props:
 *   onConnected  — called after wallet is connected AND on Sepolia
 *   onSkip       — called if user chooses operator-pays mode
 */
export const WalletConnectModal = ({ onConnected, onSkip }) => {
  const { isConnected, isCorrectNetwork, connecting, connect, switchToSepolia } = useWallet();

  const handleConnect = async () => {
    const addr = await connect();
    if (addr) onConnected?.();
  };

  const handleSwitch = async () => {
    await switchToSepolia();
    // switchToSepolia triggers a chainChanged event → WalletProvider updates
    // isCorrectNetwork reactively — onConnected will fire on next render
    //   onConnected?.();
  };

  // // Already connected and on correct network — auto-dismiss
  // if (isConnected && isCorrectNetwork) {
  //   onConnected?.();
  //   return null;
  // }

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      onConnected?.();
    }
  }, [isConnected, isCorrectNetwork]);


  return (
    <div className="modal-overlay" onClick={onSkip}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🦊</span>
            Connect MetaMask
          </div>
          <button className="close-btn" onClick={onSkip}>✕</button>
        </div>

        <div className="modal-body">
          {/* Explanation */}
          <div style={{
            padding: '14px 16px',
            background: 'rgba(0,212,255,0.05)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            marginBottom: 24,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
              Why connect your wallet?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              When you connect MetaMask, <strong style={{ color: 'var(--text-primary)' }}>you pay the gas fee</strong> (~$0.002 on Sepolia) and your wallet address is permanently recorded as the uploader on Ethereum.
              <br /><br />
              Choosing <em>Skip</em> lets the system operator wallet pay gas on your behalf. Your officer name is still recorded in the chain of custody.
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Gas cost',      value: '~$0.002',  note: 'on Sepolia testnet',   color: 'var(--success)' },
              { label: 'Your address',  value: 'On-chain', note: 'permanently recorded', color: 'var(--accent)' },
              { label: 'Network',       value: 'Sepolia',  note: 'Ethereum testnet',     color: 'var(--text-muted)' },
            ].map(({ label, value, note, color }) => (
              <div key={label} style={{
                flex: 1, padding: '12px 14px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8, textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{note}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {!window.ethereum ? (
            <div>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', display: 'flex', marginBottom: 12 }}
              >
                🦊 Install MetaMask
              </a>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onSkip}>
                Skip — operator wallet pays gas
              </button>
            </div>
          ) : !isConnected ? (
            <div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                onClick={handleConnect}
                disabled={connecting}
              >
                🦊 {connecting ? 'Opening MetaMask...' : 'Connect MetaMask'}
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onSkip}>
                Skip — operator wallet pays gas
              </button>
            </div>
          ) : (
            // Connected but wrong network
            <div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                onClick={handleSwitch}
              >
                Switch to Sepolia Network
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onSkip}>
                Skip — operator wallet pays gas
              </button>
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 28px',
          borderTop: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: 1,
          textAlign: 'center',
        }}>
          UBlock never stores or accesses your private key — all signing happens in MetaMask.
        </div>
      </div>
    </div>
  );
};
