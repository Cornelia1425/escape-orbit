import { Html } from "@react-three/drei";

interface StarNavigationMapProps {
  progress?: number;
  position?: [number, number, number];
  scale?: number;
  compact?: boolean;
}

function GlowDot({
  x,
  y = 0,
  size = 0.08,
}: {
  x: number;
  y?: number;
  size?: number;
}) {
  return (
    <group position={[x, y, 0.04]}>
      <mesh>
        <circleGeometry args={[size * 3.6, 32]} />
        <meshBasicMaterial color="#64f2ff" transparent opacity={0.08} />
      </mesh>
      <mesh>
        <circleGeometry args={[size * 1.7, 32]} />
        <meshBasicMaterial color="#9fffff" transparent opacity={0.26} />
      </mesh>
      <mesh>
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial color="#f3ffff" />
      </mesh>
    </group>
  );
}

function MapLabel({
  position,
  children,
  align = "left",
  compact = false,
}: {
  position: [number, number, number];
  children: string;
  align?: "left" | "right";
  compact?: boolean;
}) {
  return (
    <Html
      transform
      position={position}
      distanceFactor={compact ? 8.2 : 7.2}
      style={{ pointerEvents: "none" }}
    >
      <div style={{
        minWidth: compact ? "112px" : "150px",
        textAlign: align,
        fontFamily: "'DM Mono', monospace",
        fontSize: compact ? "8px" : "10px",
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: "0.13em",
        color: compact ? "rgba(230,255,252,0.94)" : "rgba(230,255,252,0.07)",
        textShadow: compact ? "0 0 10px rgba(120,255,245,0.75), 0 0 24px rgba(60,210,255,0.38)" : "none",
        textTransform: "uppercase",
        whiteSpace: "pre-line",
      }}>
        {children}
      </div>
    </Html>
  );
}

export default function StarNavigationMap({
  progress = 0,
  position = [0, 0, 0],
  scale = 1,
  compact = false,
}: StarNavigationMapProps) {
  const markerX = -5.4 + Math.min(Math.max(progress, 0), 1) * 10.8;

  return (
    <group position={position} scale={scale}>
      <mesh position={[1.6, -0.95, -0.18]} scale={[2.9, 1.35, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color="#0a4a68" transparent opacity={0.07} />
      </mesh>
      <mesh position={[4.15, 0.45, -0.19]} scale={[2.25, 1.4, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color="#0a5f72" transparent opacity={0.06} />
      </mesh>
      <mesh position={[-2.5, 0.2, -0.2]} scale={[2.4, 1.15, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color="#0a355c" transparent opacity={0.055} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[10.8, 0.035]} />
        <meshBasicMaterial color="#caffff" transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[10.9, 0.12]} />
        <meshBasicMaterial color="#5eefff" transparent opacity={0.18} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[11.1, 0.32]} />
        <meshBasicMaterial color="#00c8ff" transparent opacity={0.045} />
      </mesh>

      <GlowDot x={-5.4} size={0.08} />
      <GlowDot x={-4.25} size={0.065} />
      <GlowDot x={5.4} size={0.075} />

      <mesh position={[markerX, 0.34, 0.05]}>
        <planeGeometry args={[0.5, 0.025]} />
        <meshBasicMaterial color="#ffd98a" transparent opacity={0.9} />
      </mesh>

      <MapLabel position={[-5.5, 0.72, 0.05]} compact={compact}>
        Black Hole
      </MapLabel>
      <MapLabel position={[-4.3, 0.82, 0.05]} compact={compact}>
        {"Proxima Centauri B\n4.2 LY"}
      </MapLabel>
      <MapLabel position={[4.25, 0.82, 0.05]} align="right" compact={compact}>
        {"Trappist-1E\n40.7 LY"}
      </MapLabel>
      <MapLabel position={[4.35, -0.86, 0.05]} align="right" compact={compact}>
        {"Kepler-442B\n1,206 LY  >"}
      </MapLabel>
    </group>
  );
}
