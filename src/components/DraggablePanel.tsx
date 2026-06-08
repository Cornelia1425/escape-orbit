import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from "react";

interface Props {
  children: ReactNode;
  initialStyle: CSSProperties;
  style?: CSSProperties;
}

export default function DraggablePanel({ children, initialStyle, style }: Props) {
  // `started` flips once on first drag to switch from CSS initialStyle → pixel coords.
  // After that, position is tracked in posRef and written directly to the DOM
  // to avoid a React re-render on every pointermove (smoother on mobile).
  const [started, setStarted] = useState(false);
  const dragging = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });
  const posRef   = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a, button, input, textarea, select")) return;
    dragging.current = true;
    // Capture pointer first so moves outside the element still fire here
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = panelRef.current!.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    posRef.current = { x: rect.left, y: rect.top };
    // One-time state flip: switches posStyle from initialStyle to pixel coords
    setStarted(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !panelRef.current) return;
    const x = e.clientX - offset.current.x;
    const y = e.clientY - offset.current.y;
    posRef.current = { x, y };
    // Write directly to DOM — no React re-render, no lag on mobile
    panelRef.current.style.left = `${x}px`;
    panelRef.current.style.top  = `${y}px`;
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const posStyle: CSSProperties = started
    ? { left: posRef.current.x, top: posRef.current.y, transform: "none" }
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
        touchAction: "none",   // prevents iOS scroll/swipe-back from stealing the touch
        WebkitUserSelect: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
