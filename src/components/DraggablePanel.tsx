import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from "react";

interface Props {
  children: ReactNode;
  initialStyle: CSSProperties;  // CSS position used before first drag (supports bottom/transform)
  style?: CSSProperties;
}

export default function DraggablePanel({ children, initialStyle, style }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a, button, input, textarea, select")) return;
    e.preventDefault();
    dragging.current = true;
    const rect = panelRef.current!.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setPos({ x: rect.left, y: rect.top });
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const posStyle: CSSProperties = pos
    ? { left: pos.x, top: pos.y, transform: "none" }
    : initialStyle;

  return (
    <div
      ref={panelRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "fixed",
        ...posStyle,
        zIndex: 60,
        cursor: "grab",
        userSelect: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
