import { useState, useEffect } from "react";

function isMobile() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

function isPortrait() {
  return typeof window !== "undefined" && window.matchMedia("(orientation: portrait)").matches;
}

export default function MobileOrientationPrompt() {
  const [visible, setVisible] = useState(() => isMobile() && isPortrait());

  useEffect(() => {
    if (!isMobile()) return;
    const mq = window.matchMedia("(orientation: portrait)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!e.matches) setVisible(false); // rotated to landscape — auto dismiss
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 200,
      background: "rgba(2,6,18,0.92)",
      backdropFilter: "blur(12px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "28px",
    }}>
      {/* Rotating phone icon */}
      <div style={{ animation: "rotatePhone 2.2s ease-in-out infinite" }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="16" y="8" width="32" height="48" rx="5" stroke="rgba(140,200,255,0.7)" strokeWidth="2.5" />
          <circle cx="32" cy="50" r="2.5" fill="rgba(140,200,255,0.5)" />
          <line x1="24" y1="14" x2="40" y2="14" stroke="rgba(140,200,255,0.3)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "22px",
          fontWeight: 300,
          color: "rgba(185,235,255,0.9)",
          letterSpacing: "0.15em",
        }}>
          Rotate Your Phone
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          color: "rgba(120,170,220,0.6)",
          letterSpacing: "0.08em",
          lineHeight: 1.8,
        }}>
          Best experienced in landscape mode
        </div>
      </div>

      <button
        onClick={() => setVisible(false)}
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.15em",
          color: "rgba(100,140,200,0.5)",
          background: "none",
          border: "1px solid rgba(100,140,200,0.2)",
          padding: "8px 20px",
          cursor: "pointer",
          textTransform: "uppercase",
        }}
      >
        Continue anyway
      </button>

      <style>{`
        @keyframes rotatePhone {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(90deg); }
          70%  { transform: rotate(90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
