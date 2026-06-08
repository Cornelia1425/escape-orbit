import { useState, useEffect, useRef, useCallback } from "react";
import { checkExtensionInstalled } from "../extension/focusExtension";

const STORE_URL = import.meta.env.VITE_EXTENSION_STORE_URL ?? "";
const POSITION_KEY = "escape_orbit_guide_position";
const DISMISSED_KEY = "escape_orbit_guide_dismissed";

type ExtState = "checking" | "installed" | "missing";

function loadPosition(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function GalaxyGuide() {
  const [extState, setExtState] = useState<ExtState>("checking");
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "true"
  );

  const [pos, setPos] = useState<{ x: number; y: number } | null>(loadPosition);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Extension detection ──────────────────────────────────────────────
  useEffect(() => {
    if (dismissed) return;
    let cancelled = false;
    async function check() {
      const installed = await checkExtensionInstalled();
      if (!cancelled) setExtState(installed ? "installed" : "missing");
    }
    check();
    return () => { cancelled = true; };
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;
    async function onFocus() {
      const installed = await checkExtensionInstalled();
      setExtState(installed ? "installed" : "missing");
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [dismissed]);

  // ── Drag logic ───────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a, button")) return;
    e.preventDefault();
    dragging.current = true;
    const rect = panelRef.current!.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    setPos({ x, y });
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setPos((current) => {
      if (current) {
        try { localStorage.setItem(POSITION_KEY, JSON.stringify(current)); } catch {}
      }
      return current;
    });
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  const isInstalled = extState === "installed";

  const posStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, transform: "none" }
    : { left: 28, top: "50%", transform: "translateY(-50%)" };

  return (
    <div
      ref={panelRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "fixed",
        ...posStyle,
        width: "220px",
        zIndex: 50,
        background: "rgba(4,8,28,0.88)",
        backdropFilter: "blur(16px)",
        border: isInstalled
          ? "1px solid rgba(80,220,140,0.3)"
          : "1px solid rgba(80,160,255,0.25)",
        padding: "18px 18px 16px",
        boxShadow: isInstalled
          ? "0 0 30px rgba(60,180,100,0.15), inset 0 1px 0 rgba(80,220,140,0.1)"
          : "0 0 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(100,160,255,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "grab",
        userSelect: "none",
        transition: "border-color 0.4s, box-shadow 0.4s",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(80,120,200,0.12)",
        paddingBottom: "10px",
      }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "13px",
          fontWeight: 300,
          color: "rgba(190,215,255,0.85)",
          letterSpacing: "0.1em",
        }}>
          Guide to the Galaxy
        </span>
        <button
          onClick={handleDismiss}
          title="Dismiss"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(120,160,200,0.5)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "14px",
            lineHeight: 1,
            padding: "0 2px",
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "10px",
        color: "rgba(150,185,235,0.7)",
        lineHeight: 1.85,
        margin: 0,
        letterSpacing: "0.02em",
      }}>
        When you launch a mission,
        Instagram is blocked for the full
        duration — so you stay in orbit
        and actually do the work.
      </p>

      {/* Extension status box */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: isInstalled
          ? "1px solid rgba(80,220,140,0.22)"
          : "1px solid rgba(100,140,200,0.15)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "border-color 0.4s",
      }}>
        {/* Status row */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "9px",
            color: isInstalled
              ? "rgba(80,220,140,0.9)"
              : extState === "missing"
                ? "rgba(255,180,80,0.9)"
                : "rgba(120,160,200,0.5)",
            transition: "color 0.4s",
          }}>
            {isInstalled ? "◉" : extState === "missing" ? "○" : "◌"}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: isInstalled
              ? "rgba(80,220,140,0.8)"
              : extState === "missing"
                ? "rgba(255,180,80,0.75)"
                : "rgba(120,160,200,0.5)",
            transition: "color 0.4s",
          }}>
            {isInstalled
              ? "Focus Shield active"
              : extState === "missing"
                ? "Not installed"
                : "Checking..."}
          </span>
        </div>

        {!STORE_URL && (
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            color: "rgba(255,100,80,0.85)",
            margin: 0,
            lineHeight: 1.8,
            letterSpacing: "0.04em",
          }}>
            Chrome extension to be released soon. Stay tuned.
          </p>
        )}

        {STORE_URL && extState === "missing" && (
          <>
            <a
              href={STORE_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "rgba(140,200,255,0.9)",
                background: "rgba(40,100,180,0.12)",
                border: "1px solid rgba(80,160,255,0.35)",
                padding: "9px 10px",
                textDecoration: "none",
                textTransform: "uppercase",
                textAlign: "center",
                display: "block",
                cursor: "pointer",
              }}
            >
              ↗ Install Focus Shield
            </a>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "9px",
              color: "rgba(100,130,180,0.45)",
              margin: 0,
              lineHeight: 1.7,
              letterSpacing: "0.02em",
            }}>
              Install, then return to this tab.
              Blocking activates on launch.
            </p>
          </>
        )}

        {isInstalled && (
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            color: "rgba(80,200,120,0.6)",
            margin: 0,
            lineHeight: 1.7,
            letterSpacing: "0.02em",
          }}>
            Instagram will be blocked when
            your next mission launches.
          </p>
        )}
      </div>
    </div>
  );
}
