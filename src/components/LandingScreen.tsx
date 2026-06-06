import { useState } from "react";

interface LandingScreenProps {
  onJoin: (name: string) => void;
  connecting: boolean;
  connected: boolean;
  error: string | null;
  blockedInstagram?: boolean;
}

export default function LandingScreen({
  onJoin,
  connecting,
  connected,
  error,
  blockedInstagram = false,
}: LandingScreenProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || !connected) return;
    onJoin(trimmed);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      background: "radial-gradient(ellipse at center, rgba(5,8,25,0.95) 0%, rgba(2,4,15,0.98) 100%)",
      animation: "fadeIn 1s ease",
    }}>
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        border: "1px solid rgba(80,120,255,0.08)",
        animation: "spinSlow 30s linear infinite",
      }} />
      <div style={{
        position: "absolute",
        width: "280px",
        height: "280px",
        borderRadius: "50%",
        border: "1px solid rgba(255,100,50,0.06)",
        animation: "spinSlow 20s linear infinite reverse",
      }} />

      <div style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "#6688ff",
        boxShadow: "0 0 20px 8px rgba(80,120,255,0.3), 0 0 60px 20px rgba(80,120,255,0.1)",
        marginBottom: "40px",
        animation: "pulse 3s ease-in-out infinite",
      }} />

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "clamp(52px, 8vw, 80px)",
        fontWeight: 300,
        color: "#e8eeff",
        letterSpacing: "0.12em",
        margin: 0,
        textShadow: "0 0 60px rgba(100,140,255,0.3)",
        lineHeight: 1,
      }}>
        ESCAPE ORBIT
      </h1>

      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "13px",
        color: "rgba(160,190,255,0.55)",
        letterSpacing: "0.08em",
        maxWidth: "360px",
        textAlign: "center",
        lineHeight: 1.8,
        marginTop: "24px",
        marginBottom: "32px",
        fontWeight: 300,
      }}>
        Focus for 40 minutes. Escape the black hole.<br />
        Reach a new galaxy together.
      </p>

      {blockedInstagram && (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          color: "rgba(255,200,120,0.85)",
          background: "rgba(120,80,20,0.15)",
          border: "1px solid rgba(200,140,60,0.35)",
          padding: "12px 16px",
          marginBottom: "24px",
          maxWidth: "360px",
          textAlign: "center",
          lineHeight: 1.6,
        }}>
          Instagram is blocked for focus mode.<br />
          Launch a mission to stay in orbit.
        </div>
      )}

      <div style={{ width: "min(320px, 80vw)", marginBottom: "20px" }}>
        <label style={{
          display: "block",
          fontFamily: "'DM Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.15em",
          color: "rgba(100,140,200,0.6)",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}>
          Pilot Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="your name"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(100,140,200,0.25)",
            color: "rgba(200,220,255,0.9)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            padding: "12px 14px",
            outline: "none",
            letterSpacing: "0.06em",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!name.trim() || !connected || connecting}
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "12px",
          letterSpacing: "0.2em",
          color: name.trim() && connected ? "rgba(200,220,255,0.9)" : "rgba(120,150,200,0.4)",
          background: "transparent",
          border: `1px solid ${name.trim() && connected ? "rgba(100,140,255,0.4)" : "rgba(80,100,160,0.2)"}`,
          padding: "14px 36px",
          cursor: name.trim() && connected ? "pointer" : "not-allowed",
          textTransform: "uppercase",
          transition: "all 0.3s ease",
        }}
      >
        {connecting ? "Connecting..." : "Enter Universe"}
      </button>

      {error && (
        <div style={{
          marginTop: "20px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          color: "rgba(255,120,100,0.8)",
          maxWidth: "360px",
          textAlign: "center",
          lineHeight: 1.6,
        }}>
          {error}
        </div>
      )}

      <div style={{
        position: "absolute",
        bottom: "32px",
        fontFamily: "'DM Mono', monospace",
        fontSize: "9px",
        color: "rgba(100,130,200,0.35)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}>
        ◦◦◦ multiplayer focus · beta ◦◦◦
      </div>
    </div>
  );
}
