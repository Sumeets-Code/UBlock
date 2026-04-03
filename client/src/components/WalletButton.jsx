import React from 'react';
import { useWallet } from '../context/WalletProvider.jsx';

/**
 * WalletButton
 * Shows in the topbar. Cycles through:
 *   - "Connect Wallet"   (not connected)
 *   - "Wrong Network"    (connected but not Sepolia)
 *   - "0x1234...abcd"   (connected and correct network)
 */
export const WalletButton = () => {
  const {
    account, isConnected, isCorrectNetwork,
    isConnecting, connect, disconnect, switchToSepolia, error,
  } = useWallet();

  const shortAddr = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : null;

  if (!isConnected) {
    return (
      <button
        className="btn btn-secondary btn-sm"
        onClick={connect}
        disabled={isConnecting}
        title={error || 'Connect your MetaMask wallet'}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span style={{ fontSize: 14 }}>🦊</span>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <button
        className="btn btn-sm"
        onClick={switchToSepolia}
        style={{
          background: 'rgba(255,171,64,0.12)',
          color: 'var(--warning)',
          border: '1px solid rgba(255,171,64,0.4)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ fontSize: 13 }}>⚠</span>
        Switch to Sepolia
      </button>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        className="btn btn-sm"
        onClick={disconnect}
        title="Click to disconnect"
        style={{
          background: 'rgba(0,230,118,0.08)',
          color: 'var(--success)',
          border: '1px solid rgba(0,230,118,0.3)',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 0.5,
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 6px var(--success)',
          flexShrink: 0,
        }} />
        {shortAddr}
      </button>
    </div>
  );
};
