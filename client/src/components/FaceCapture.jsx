import React, { useEffect, useState } from 'react';
import { useWebcam } from '../hooks/useWebcam.js';

const FaceCapture = ({
  onCapture,
  onCancel,
  title      = 'Face Scan',
  subtitle   = 'Position your face in the circle and click Capture.',
  captureLabel = 'Capture Face',
  processing = false,
}) => {
  const { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, captureFrame } =
    useWebcam();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleCapture = () => {
    const frame = captureFrame();
    if (!frame) return;
    setPreview(frame);
    stopCamera();
    onCapture(frame);
  };

  const handleRetake = () => {
    setPreview(null);
    startCamera();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div>
        <div style={{
          fontFamily:    'var(--font-display)',
          fontSize:      18,
          fontWeight:    700,
          letterSpacing: 1,
          textAlign:     'center',
          marginBottom:  6,
        }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          {subtitle}
        </div>
      </div>

      {/* Viewfinder */}
      <div style={{ position: 'relative', width: 280, height: 280 }}>
        {/* Oval overlay guide */}
        <div style={{
          position:     'absolute',
          inset:        0,
          borderRadius: '50%',
          border:       `2px solid ${isStreaming ? 'var(--accent)' : 'var(--border)'}`,
          boxShadow:    isStreaming ? '0 0 0 4px rgba(0,212,255,0.15)' : 'none',
          zIndex:       2,
          pointerEvents:'none',
          transition:   'all 0.3s',
        }} />

        {/* Corner brackets */}
        {['tl', 'tr', 'bl', 'br'].map(pos => (
          <div key={pos} style={{
            position:    'absolute',
            width:       24, height: 24,
            borderColor: 'var(--accent)',
            borderStyle: 'solid',
            borderWidth: 0,
            zIndex: 3,
            ...(pos === 'tl' && { top: 8,  left: 8,  borderTopWidth: 3, borderLeftWidth:  3, borderRadius: '4px 0 0 0' }),
            ...(pos === 'tr' && { top: 8,  right: 8, borderTopWidth: 3, borderRightWidth: 3, borderRadius: '0 4px 0 0' }),
            ...(pos === 'bl' && { bottom: 8, left: 8,  borderBottomWidth: 3, borderLeftWidth:  3, borderRadius: '0 0 0 4px' }),
            ...(pos === 'br' && { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: '0 0 4px 0' }),
          }} />
        ))}

        {/* Live video or captured preview */}
        <div style={{
          width: 280, height: 280, overflow: 'hidden',
          borderRadius: '50%', background: 'var(--bg-primary)',
        }}>
          {preview ? (
            <img
              src={preview}
              alt="Captured frame"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // mirror so it feels natural
              }}
            />
          )}
        </div>

        {/* Scanning animation when streaming */}
        {isStreaming && !preview && (
          <div style={{
            position:   'absolute', top: '50%', left: 0, right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            animation:  'scanLine 2s ease-in-out infinite',
            zIndex:     3,
          }} />
        )}

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Scan-line keyframe (injected once) */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 20%;  opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
      `}</style>

      {/* Status */}
      {error && (
        <div style={{
          padding:    '10px 16px',
          background: 'rgba(255,82,82,0.08)',
          border:     '1px solid rgba(255,82,82,0.3)',
          borderRadius: 8,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color:      'var(--danger)',
          maxWidth:   320, textAlign: 'center',
        }}>
          ⚠ {error}
        </div>
      )}

      {!error && !isStreaming && !preview && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
          INITIALISING CAMERA...
        </div>
      )}

      {isStreaming && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--success)', letterSpacing: 1,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          CAMERA ACTIVE
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
        {preview ? (
          <>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleRetake}
              disabled={processing}
            >
              ↩ Retake
            </button>
            {processing && (
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.7s linear infinite',
                  display: 'inline-block',
                }} />
                Processing...
              </button>
            )}
          </>
        ) : (
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: 14 }}
            onClick={handleCapture}
            disabled={!isStreaming || processing}
          >
            📷 {captureLabel}
          </button>
        )}

        <button
          className="btn btn-secondary"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => { stopCamera(); onCancel?.(); }}
          disabled={processing}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default FaceCapture;
