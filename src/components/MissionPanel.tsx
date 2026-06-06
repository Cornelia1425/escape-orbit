import { useState } from "react";
import type { Mission, MissionStatus } from "../types";

interface MissionPanelProps {
  mission: Mission;
  playerName: string;
  connected: boolean;
  remainingSeconds: number;
  onLaunch: (task: string, duration: number) => void;
  onComplete: () => void;
  onFail: () => void;
  onReset: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getStatusMessage(status: MissionStatus, connected: boolean): string {
  switch (status) {
    case "idle":
      return connected ? "Ready to launch." : "Offline — connect SpacetimeDB to launch.";
    case "flying": return "Escaping the black hole...";
    case "awaiting_result": return "Did you complete your mission?";
    case "completed": return "You reached a new galaxy. Your mission became a star.";
    case "failed": return "Your signal drifted back into orbit. Launch again.";
    default: return "";
  }
}

function getStatusColor(status: MissionStatus): string {
  switch (status) {
    case "flying": return "#88aaff";
    case "awaiting_result": return "#ffcc66";
    case "completed": return "#88ffcc";
    case "failed": return "#ff6655";
    default: return "rgba(180,200,255,0.6)";
  }
}

export default function MissionPanel({
  mission,
  playerName,
  connected,
  remainingSeconds,
  onLaunch,
  onComplete,
  onFail,
  onReset,
}: MissionPanelProps) {
  const [task, setTask] = useState("");
  const [duration, setDuration] = useState<"full" | "demo">("demo");

  const isIdle = mission.status === "idle";
  const isFlying = mission.status === "flying";
  const isAwaiting = mission.status === "awaiting_result";
  const isEnded = mission.status === "completed" || mission.status === "failed";
  const isOwnActiveMission = connected && (isFlying || isAwaiting || isEnded);

  const handleLaunch = () => {
    if (!task.trim() || !connected) return;
    onLaunch(task.trim(), duration === "full" ? 2400 : 30);
    setTask("");
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(100,140,200,0.2)",
    color: "rgba(200,220,255,0.9)",
    fontFamily: "'DM Mono', monospace",
    fontSize: "12px",
    padding: "10px 12px",
    outline: "none",
    letterSpacing: "0.04em",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontFamily: "'DM Mono', monospace",
    fontSize: "9px",
    letterSpacing: "0.15em",
    color: "rgba(100,140,200,0.6)",
    textTransform: "uppercase" as const,
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div style={{
      position: "fixed",
      top: "50%",
      right: "28px",
      transform: "translateY(-50%)",
      width: "280px",
      background: "rgba(4,8,28,0.85)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(80,120,200,0.18)",
      padding: "28px 24px",
      zIndex: 50,
      boxShadow: "0 0 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(100,140,255,0.08)",
    }}>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "18px",
        fontWeight: 300,
        color: "rgba(200,220,255,0.9)",
        letterSpacing: "0.1em",
        marginBottom: "24px",
        borderBottom: "1px solid rgba(80,120,200,0.15)",
        paddingBottom: "16px",
      }}>
        Mission Control
      </div>

      {playerName && (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          color: "rgba(140,170,220,0.7)",
          letterSpacing: "0.08em",
          marginBottom: "16px",
        }}>
          PILOT · {playerName}
        </div>
      )}

      {isIdle && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Mission</label>
            <textarea
              style={{
                ...inputStyle,
                resize: "none",
                height: "72px",
                lineHeight: 1.6,
              }}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Write first draft of the script..."
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(100,140,255,0.5)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(100,140,200,0.2)"}
            />
          </div>

          <div>
            <label style={labelStyle}>Duration</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["demo", "full"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  style={{
                    flex: 1,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    color: duration === d ? "#fff" : "rgba(140,170,220,0.6)",
                    background: duration === d ? "rgba(80,120,255,0.2)" : "transparent",
                    border: `1px solid ${duration === d ? "rgba(100,140,255,0.6)" : "rgba(100,140,200,0.2)"}`,
                    padding: "8px 4px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textTransform: "uppercase",
                  }}
                >
                  {d === "demo" ? "30 sec" : "40 min"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLaunch}
            disabled={!task.trim() || !connected}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              color: task && connected ? "#fff" : "rgba(120,150,200,0.4)",
              background: task && connected ? "rgba(80,120,255,0.15)" : "transparent",
              border: `1px solid ${task && connected ? "rgba(100,140,255,0.5)" : "rgba(80,100,160,0.2)"}`,
              padding: "13px",
              cursor: task && connected ? "pointer" : "not-allowed",
              textTransform: "uppercase",
              marginTop: "8px",
              transition: "all 0.3s",
              width: "100%",
            }}
          >
            ◦ Launch Mission
          </button>
        </div>
      )}

      {(isFlying || isAwaiting) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <div style={labelStyle}>Mission</div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "rgba(180,210,255,0.8)",
              lineHeight: 1.6,
              letterSpacing: "0.04em",
            }}>
              {mission.taskText}
            </div>
          </div>

          {isFlying && (
            <>
              <div>
                <div style={labelStyle}>Time Remaining</div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "36px",
                  fontWeight: 300,
                  color: "#aabbff",
                  letterSpacing: "0.08em",
                  lineHeight: 1,
                }}>
                  {formatTime(remainingSeconds)}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={labelStyle}>Progress</span>
                  <span style={{ ...labelStyle, marginBottom: 0 }}>
                    {Math.round(mission.progress * 100)}%
                  </span>
                </div>
                <div style={{
                  height: "2px",
                  background: "rgba(80,120,200,0.2)",
                  width: "100%",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${mission.progress * 100}%`,
                    background: "linear-gradient(90deg, #5577ff, #88aaff)",
                    boxShadow: "0 0 8px rgba(100,140,255,0.5)",
                    transition: "width 0.3s linear",
                  }} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {isAwaiting && isOwnActiveMission && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
          <div style={labelStyle}>Mission complete?</div>
          <button
            onClick={onComplete}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.15em",
              color: "#88ffcc",
              background: "rgba(50,200,120,0.1)",
              border: "1px solid rgba(80,220,140,0.4)",
              padding: "12px",
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "all 0.2s",
            }}
          >
            ✓ Completed
          </button>
          <button
            onClick={onFail}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.15em",
              color: "rgba(255,100,80,0.8)",
              background: "rgba(180,50,40,0.08)",
              border: "1px solid rgba(200,80,60,0.3)",
              padding: "12px",
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "all 0.2s",
            }}
          >
            ✗ Failed
          </button>
        </div>
      )}

      {isEnded && isOwnActiveMission && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "rgba(180,200,255,0.7)",
            lineHeight: 1.8,
          }}>
            {mission.taskText}
          </div>
          <button
            onClick={onReset}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.18em",
              color: "rgba(160,190,255,0.8)",
              background: "transparent",
              border: "1px solid rgba(100,140,200,0.3)",
              padding: "12px",
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "all 0.2s",
              marginTop: "8px",
            }}
          >
            ↺ Launch Again
          </button>
        </div>
      )}

      <div style={{
        marginTop: "20px",
        paddingTop: "16px",
        borderTop: "1px solid rgba(80,120,200,0.1)",
        fontFamily: "'DM Mono', monospace",
        fontSize: "10px",
        color: getStatusColor(mission.status),
        letterSpacing: "0.04em",
        lineHeight: 1.7,
        minHeight: "36px",
      }}>
        {getStatusMessage(mission.status, connected)}
      </div>
    </div>
  );
}
