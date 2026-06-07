import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import StarNavigationMap from "./StarNavigationMap";

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
      zIndex: 100,
      background: "radial-gradient(ellipse at 68% 45%, rgba(4,33,52,0.72) 0%, rgba(2,12,28,0.92) 42%, rgba(0,2,8,0.98) 100%)",
      animation: "fadeIn 1s ease",
    }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.16} />
        <directionalLight position={[0, 5, 5]} intensity={0.28} />
        <Stars radius={100} depth={60} count={2200} factor={3.4} saturation={0.2} fade speed={0.18} />
        <StarNavigationMap
          progress={blockedInstagram ? 0.18 : 0.08}
          position={[0, 1.08, 0.08]}
          scale={0.98}
        />
      </Canvas>

      <div style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(430px, 88vw)",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "18px 22px 20px",
        background: "linear-gradient(180deg, rgba(3,18,42,0.68), rgba(1,7,20,0.48)), repeating-linear-gradient(0deg, rgba(120,220,255,0.045) 0 1px, transparent 1px 7px)",
        border: "1px solid rgba(120,220,255,0.22)",
        boxShadow: "0 0 55px rgba(0,0,0,0.58), inset 0 0 22px rgba(80,190,255,0.08)",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#6688ff",
          boxShadow: "0 0 20px 8px rgba(80,120,255,0.3), 0 0 60px 20px rgba(80,120,255,0.1)",
          marginBottom: "22px",
          animation: "pulse 3s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(31px, 7vw, 52px)",
          fontWeight: 300,
          color: "#f4f7ff",
          letterSpacing: "0.07em",
          margin: 0,
          textShadow: "0 0 60px rgba(120,155,255,0.48)",
          lineHeight: 1,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}>
          ESCAPE ORBIT
        </h1>

        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "13px",
          color: "rgba(180,205,255,0.78)",
          letterSpacing: "0.08em",
          maxWidth: "360px",
          textAlign: "center",
          lineHeight: 1.8,
          marginTop: "16px",
          marginBottom: "20px",
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

        <div style={{ width: "min(300px, 78vw)", marginBottom: "16px" }}>
          <label style={{
            display: "block",
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "rgba(100,140,200,0.65)",
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
            autoComplete="nickname"
            autoCapitalize="words"
            enterKeyHint="go"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(100,140,200,0.25)",
              color: "rgba(200,220,255,0.9)",
              fontFamily: "'DM Mono', monospace",
              fontSize: "16px",
              padding: "12px 14px",
              outline: "none",
              letterSpacing: "0.06em",
              boxSizing: "border-box",
              WebkitAppearance: "none",
              touchAction: "manipulation",
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !connected || connecting}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: name.trim() && connected ? "rgba(200,220,255,0.9)" : "rgba(120,150,200,0.4)",
            background: "transparent",
            border: `1px solid ${name.trim() && connected ? "rgba(100,140,255,0.4)" : "rgba(80,100,160,0.2)"}`,
            padding: "12px 30px",
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
            whiteSpace: "pre-wrap",
          }}>
            {error}
          </div>
        )}
      </div>

      <div style={{
        position: "fixed",
        left: "50%",
        bottom: "14px",
        transform: "translateX(-50%)",
        zIndex: 2,
        fontFamily: "'DM Mono', monospace",
        fontSize: "9px",
        color: "rgba(100,130,200,0.4)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}>
        ◦◦◦ multiplayer focus · beta ◦◦◦
      </div>
    </div>
  );
}
