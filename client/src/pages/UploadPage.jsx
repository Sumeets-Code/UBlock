import React, { useState } from 'react';
import { formatFileSize } from '../utils/api.js';
import { useAuth } from '../context/AuthProvider.jsx';
import { useWallet } from '../context/WalletProvider.jsx';
import { useToast } from '../context/ToastProvider.jsx';
import { useBlockchain } from '../hooks/useBlockchain.js';
import { WalletConnectModal } from '../components/WalletConnectModal.jsx';
import { TxStatusBanner } from '../components/TxStatusBanner.jsx';
import API from '../utils/api.js';

/**
 * UploadPage — MetaMask user-pays-gas edition
 *
 * Supports two upload modes:
 *   A. User-pays: MetaMask connected → IPFS then MetaMask signs blockchain tx
 *   B. Operator-pays: no wallet → old flow, backend operator pays gas
 *
 * Step machine:
 *   'form'        Initial form + file picker
 *   'wallet'      WalletConnectModal shown (if user clicked connect)
 *   'uploading'   File uploading to IPFS (shows spinner)
 *   'signing'     Waiting for MetaMask signature
 *   'done'        Success screen
 */
function UploadPage({ setPage }) {
  const { user }                                            = useAuth();
  const { account, isConnected, isCorrectNetwork }          = useWallet();
  const toast                                               = useToast();
  const { registerEvidenceOnChain, txHash, txStatus, txError, reset } = useBlockchain();

  const [file,     setFile]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uiStep,   setUiStep]   = useState('form');   // form | wallet | uploading | signing | done
  const [ipfsData, setIpfsData] = useState(null);     // returned by /prepare-upload
  const [result,   setResult]   = useState(null);     // { evidenceId, txHash, evidence }
  const [useWalletMode, setUseWalletMode] = useState(false);
  const [form, setForm] = useState({
    caseNumber:     '',
    title:          '',
    description:    '',
    collectedBy:    user?.name || '',
    collectionDate: new Date().toISOString().split('T')[0],
    location:       '',
    tags:           '',
  });

  const getFileIcon = (f) => {
    if (!f) return '📁';
    if (f.type.startsWith('image/')) return '🖼️';
    if (f.type.startsWith('audio/')) return '🎵';
    if (f.type.startsWith('video/')) return '🎬';
    if (f.type.includes('pdf'))      return '📑';
    return '📄';
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.size <= 100 * 1024 * 1024) setFile(f);
    else toast('File too large (max 100MB)', 'error');
  };

  const validateForm = () => {
    if (!file) { toast('Please select a file', 'error'); return false; }
    if (!form.caseNumber || !form.title || !form.collectedBy || !form.collectionDate) {
      toast('Please fill all required fields', 'error'); return false;
    }
    return true;
  };

  // ── Mode A: user-pays — show wallet modal first ───────────────────────────
  const handleConnectAndUpload = () => {
    if (!validateForm()) return;
    setUseWalletMode(true);
    setUiStep('wallet');
  };

  // ── After wallet is connected, proceed to IPFS upload ─────────────────────
  const handleWalletConnected = async () => {
    if (uiStep !== 'wallet') return; // prevent double trigger
    setUiStep('uploading');
    await doIpfsUpload(true);
  };

  // ── Mode B: operator-pays — skip MetaMask entirely ────────────────────────
  const handleOperatorUpload = async () => {
    if (!validateForm()) return;
    setUseWalletMode(false);

    // Original flow: POST /evidence/upload, backend does IPFS + blockchain
    setUiStep('uploading');
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));

      const { data } = await API.post('/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult({ evidence: data.evidence });
      setUiStep('done');
      toast('Evidence uploaded and secured successfully');
    } catch (err) {
      toast(err.response?.data?.message || 'Upload failed', 'error');
      setUiStep('form');
    }
  };

  // ── IPFS upload (Step 1 of wallet mode) ──────────────────────────────────
  const doIpfsUpload = async (withWallet) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (withWallet && account) formData.append('walletAddress', account);

      const { data } = await API.post('/evidence/prepare-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIpfsData(data);  // { mongoId, ipfsHash32, cid, mimeType, ipfsUrl }
      setUiStep('signing');
    } catch (err) {
      toast(err.response?.data?.message || 'IPFS upload failed', 'error');
      setUiStep('form');
    }
  };

  // ── MetaMask sign (Step 2 of wallet mode) ────────────────────────────────
  const handleSign = async () => {
    if (!ipfsData) return;
    try {
      const { evidenceId, txHash: hash } = await registerEvidenceOnChain(
        ipfsData.ipfsHash32,
        ipfsData.mongoId,
        ipfsData.mimeType
      );

      // Tell backend to finalise the MongoDB record
      const { data } = await API.post('/evidence/confirm-upload', {
        mongoId:       ipfsData.mongoId,
        evidenceId,
        txHash:        hash,
        walletAddress: account,
      });

      setResult({ evidenceId, txHash: hash, evidence: data.evidence });
      setUiStep('done');
      toast('Evidence secured on blockchain!');
    } catch (err) {
      // txError is already set by the hook — don't double-toast user rejections
      if (!err.message?.includes('rejected')) {
        toast(err.message || 'Transaction failed', 'error');
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setUiStep('form');
    setIpfsData(null);
    setResult(null);
    setUseWalletMode(false);
    reset();
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 6 }}>SECURE UPLOAD</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Upload evidence to IPFS and register it immutably on Ethereum. Choose who pays the gas fee.
        </p>
      </div>

      {/* ── Wallet connect modal ──────────────────────────────────────────── */}
      {uiStep === 'wallet' && (
        <WalletConnectModal
          onConnected={handleWalletConnected}
          onSkip={() => { setUiStep('form'); setUseWalletMode(false); }}
        />
      )}

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      {uiStep === 'form' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
          {/* Left: file + wallet status */}
          <div>
            {/* Wallet status strip */}
            {isConnected && isCorrectNetwork ? (
              <div style={{
                marginBottom: 16, padding: '10px 16px',
                background: 'rgba(0,230,118,0.06)',
                border: '1px solid rgba(0,230,118,0.2)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--success)', letterSpacing: 1 }}>
                  {account.slice(0, 6)}...{account.slice(-4)} · SEPOLIA
                </span>
              </div>
            ) : (
              <div style={{
                marginBottom: 16, padding: '10px 16px',
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
                  🦊 WALLET NOT CONNECTED
                </span>
              </div>
            )}

            {/* Dropzone */}
            <div
              className={`dropzone${dragging ? ' active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input id="file-input" type="file" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
              <span className="dropzone-icon">{file ? getFileIcon(file) : '📁'}</span>
              {file ? (
                <>
                  <div className="dropzone-title" style={{ color: 'var(--accent)' }}>{file.name}</div>
                  <div className="dropzone-sub">{formatFileSize(file.size)} · Click to replace</div>
                </>
              ) : (
                <>
                  <div className="dropzone-title">Drop Evidence File Here</div>
                  <div className="dropzone-sub">or click to browse</div>
                  <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, lineHeight: 1.8 }}>
                    IMAGES · DOCUMENTS · AUDIO · VIDEO<br />MAX SIZE: 100MB
                  </div>
                </>
              )}
            </div>

            {/* File info */}
            {file && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>File Details</div>
                {[['Name', file.name], ['Size', formatFileSize(file.size)], ['Type', file.type || 'unknown']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', maxWidth: 200, textAlign: 'right', wordBreak: 'break-all' }}>{val}</span>
                  </div>
                ))}
                <button type="button" className="btn btn-danger btn-sm"
                  style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                  onClick={() => setFile(null)}>✕ Remove File</button>
              </div>
            )}
          </div>

          {/* Right: metadata + action buttons */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase' }}>Evidence Metadata</div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Case Number *</label>
                <input className="form-control" placeholder="CASE-2024-001"
                  value={form.caseNumber} onChange={e => setForm({ ...form, caseNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Evidence Title *</label>
                <input className="form-control" placeholder="Descriptive title"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3}
                placeholder="Describe the evidence, how it was found, its relevance..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Collected By *</label>
                <input className="form-control" placeholder="Officer name"
                  value={form.collectedBy} onChange={e => setForm({ ...form, collectedBy: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Collection Date *</label>
                <input className="form-control" type="date"
                  value={form.collectionDate} onChange={e => setForm({ ...form, collectionDate: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Collection Location</label>
              <input className="form-control" placeholder="e.g., 123 Main St, Scene B, Room 4"
                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-control" placeholder="weapon, fingerprint, digital"
                value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>

            {/* Upload mode choice */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
                Who pays the gas?
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {/* Option A: user pays */}
                <div
                  onClick={() => {}}
                  style={{
                    flex: 1, padding: '14px 16px',
                    background: 'rgba(0,212,255,0.04)',
                    border: '1px solid var(--border-bright)',
                    borderRadius: 10, cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>🦊</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>Your Wallet</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    You pay ~$0.002 gas. Your wallet address is permanently recorded as uploader.
                  </div>
                </div>

                {/* Option B: operator pays */}
                <div
                  onClick={() => {}}
                  style={{
                    flex: 1, padding: '14px 16px',
                    background: 'rgba(0,212,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 10, cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>⚙️</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>System Operator</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Operator wallet pays gas. Your officer name is recorded. No MetaMask needed.
                  </div>
                </div>
              </div>
            </div>

            {/* Two action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: 14 }}
                disabled={!file}
                onClick={handleConnectAndUpload}
              >
                🦊 I'll Pay Gas
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center', padding: 14 }}
                disabled={!file}
                onClick={handleOperatorUpload}
              >
                ⚙ Operator Pays
              </button>
            </div>

            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,212,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              ⚡ All uploads are pinned to IPFS and the SHA-256 hash is registered immutably on Ethereum regardless of who pays gas.
            </div>
          </div>
        </div>
      )}

      {/* ── IPFS uploading spinner ────────────────────────────────────────── */}
      {uiStep === 'uploading' && (
        <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div className="spinner" style={{ margin: '0 auto 24px' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
            Uploading to IPFS
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Pinning your file to the decentralised network...
          </div>
        </div>
      )}

      {/* ── MetaMask signing screen ───────────────────────────────────────── */}
      {uiStep === 'signing' && ipfsData && (
        <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🦊</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
              Confirm in MetaMask
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Your file is pinned on IPFS. Approve the transaction to register it permanently on Ethereum.
            </div>
          </div>

          {/* IPFS receipt */}
          <div style={{ padding: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>IPFS Receipt</div>
            {[
              ['CID',     ipfsData.cid],
              ['MIME',    ipfsData.mimeType],
              ['Mongo ID', ipfsData.mongoId],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, gap: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, wordBreak: 'break-all', textAlign: 'right' }}>{val}</span>
              </div>
            ))}
            <a
              href={ipfsData.ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: 'var(--accent)' }}
            >
              Preview on IPFS Gateway →
            </a>
          </div>

          {/* Live transaction status banner */}
          <TxStatusBanner status={txStatus} txHash={txHash} error={txError} />

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setUiStep('form'); reset(); }}
              disabled={txStatus === 'pending' || txStatus === 'confirming'}>
              ← Back
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, justifyContent: 'center', padding: 14 }}
              onClick={handleSign}
              disabled={txStatus === 'pending' || txStatus === 'confirming' || txStatus === 'confirmed'}
            >
              {txStatus === 'pending'     ? '⏳ Check MetaMask popup...'    :
               txStatus === 'confirming'  ? '⏳ Waiting for confirmation...' :
               txStatus === 'confirmed'   ? '✅ Confirmed!'                  :
               '🦊  Sign & Pay Gas'}
            </button>
          </div>
        </div>
      )}

      {/* ── Success screen ────────────────────────────────────────────────── */}
      {uiStep === 'done' && (
        <div className="card" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🛡️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: 1, marginBottom: 8, color: 'var(--success)' }}>
            Evidence Secured
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            {useWalletMode
              ? 'Your file is pinned on IPFS and permanently registered on Ethereum with your wallet address as the uploader.'
              : 'Your file is pinned on IPFS and registered on Ethereum via the system operator wallet.'}
          </div>

          <div style={{ padding: 20, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 28, textAlign: 'left' }}>
            {useWalletMode && result?.evidenceId != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>On-chain ID</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>#{result.evidenceId}</span>
              </div>
            )}
            {result?.txHash && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, gap: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, whiteSpace: 'nowrap' }}>Transaction</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, wordBreak: 'break-all', textAlign: 'right' }}>{result.txHash}</span>
              </div>
            )}
            {ipfsData?.cid && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, whiteSpace: 'nowrap' }}>IPFS CID</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, wordBreak: 'break-all', textAlign: 'right' }}>{ipfsData.cid}</span>
              </div>
            )}
            {result?.txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', marginTop: 14, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}
              >
                View on Etherscan ↗
              </a>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleReset}>
              Upload Another
            </button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setPage('evidence')}>
              View Evidence Vault
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
