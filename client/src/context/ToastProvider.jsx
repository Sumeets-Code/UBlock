import React, { createContext, useCallback, useState, useContext } from "react";

const ToastCtx = createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: t.type === "error" ? "#1a0f0f" : "#0f1e35",
              border: `1px solid ${t.type === "error" ? "rgba(255,82,82,0.4)" : "rgba(0,212,255,0.3)"}`,
              color: t.type === "error" ? "#ff5252" : "#e8f4fd",
              padding: "12px 18px",
              borderRadius: 10,
              fontSize: 13,
              fontFamily: "Share Tech Mono, monospace",
              letterSpacing: 0.5,
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              animation: "slideIn 0.2s ease",
            }}
          >
            {t.type === "error" ? "⚠ " : "✓ "}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

export const useToast = () => useContext(ToastCtx);

export default ToastProvider;
