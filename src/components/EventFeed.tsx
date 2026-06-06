import { useEffect, useRef } from "react";
import type { EventEntry } from "../types";

interface EventFeedProps {
  events: EventEntry[];
}

export default function EventFeed({ events }: EventFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      left: "24px",
      width: "260px",
      maxHeight: "180px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: "0",
      pointerEvents: "none",
    }}>
      <div style={{
        fontSize: "9px",
        letterSpacing: "0.15em",
        color: "rgba(100,140,200,0.6)",
        fontFamily: "'DM Mono', monospace",
        marginBottom: "8px",
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
          maxHeight: "160px",
        }}
      >
        {events.slice(0, 8).map((e) => (
          <div
            key={e.id}
            style={{
              fontSize: "11px",
              color: "rgba(180,210,255,0.75)",
              fontFamily: "'DM Mono', monospace",
              lineHeight: 1.4,
              padding: "4px 8px",
              background: "rgba(10,20,50,0.4)",
              borderLeft: "2px solid rgba(80,120,200,0.3)",
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
