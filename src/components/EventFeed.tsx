import { useEffect, useRef } from "react";
import type { EventEntry } from "../types";

interface EventFeedProps {
  events: EventEntry[];
  embedded?: boolean;
}

export default function EventFeed({ events, embedded = false }: EventFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div style={{
      position: embedded ? "relative" : "fixed",
      bottom: embedded ? undefined : "24px",
      left: embedded ? undefined : "24px",
      width: embedded ? "200px" : "260px",
      maxHeight: embedded ? "132px" : "180px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: "0",
      pointerEvents: "none",
      padding: embedded ? "8px 10px" : undefined,
      background: embedded
        ? "linear-gradient(180deg, rgba(8,26,52,0.46), rgba(2,8,20,0.3)), repeating-linear-gradient(0deg, rgba(100,220,255,0.06) 0 1px, transparent 1px 6px)"
        : undefined,
      border: embedded ? "1px solid rgba(100,220,255,0.24)" : undefined,
      borderRadius: embedded ? "2px" : undefined,
      boxShadow: embedded ? "0 0 22px rgba(42,160,255,0.2), inset 0 0 14px rgba(80,180,255,0.1)" : undefined,
    }}>
      <div style={{
        fontSize: embedded ? "8px" : "9px",
        letterSpacing: "0.15em",
        color: embedded ? "rgba(150,230,255,0.72)" : "rgba(100,140,200,0.6)",
        fontFamily: "'DM Mono', monospace",
        marginBottom: embedded ? "6px" : "8px",
        textTransform: "uppercase",
      }}>
        ◦ SIGNAL FEED
      </div>
      <div
        ref={feedRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          overflow: "hidden",
          maxHeight: embedded ? "104px" : "160px",
        }}
      >
        {events.slice(0, 8).map((e) => (
          <div
            key={e.id}
            style={{
              fontSize: embedded ? "9px" : "11px",
              color: embedded ? "rgba(190,235,255,0.68)" : "rgba(180,210,255,0.75)",
              fontFamily: "'DM Mono', monospace",
              lineHeight: 1.4,
              padding: embedded ? "3px 6px" : "4px 8px",
              background: embedded ? "rgba(10,32,58,0.2)" : "rgba(10,20,50,0.4)",
              borderLeft: embedded ? "1px solid rgba(100,220,255,0.28)" : "2px solid rgba(80,120,200,0.3)",
              animation: "fadeInUp 0.4s ease",
            }}
          >
            {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
