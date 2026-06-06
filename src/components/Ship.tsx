import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface ShipProps {
  position: [number, number, number];
  color?: string;
  label?: string;
  showLabel?: boolean;
  isPlayer?: boolean;
  failed?: boolean;
}

export default function Ship({
  position,
  color = "#ffffff",
  label,
  showLabel = false,
  isPlayer = false,
  failed = false,
}: ShipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      if (isPlayer) {
        groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.08;
      } else {
        groupRef.current.rotation.z = Math.sin(t * 0.8 + position[1]) * 0.05;
      }
    }
    if (thrusterRef.current) {
      const scale = 0.8 + Math.sin(t * 12) * 0.2;
      thrusterRef.current.scale.set(1, scale, 1);
      (thrusterRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(t * 10) * 0.3;
    }
  });

  const emissiveColor = failed ? "#ff3300" : color;

  return (
    <group ref={groupRef} position={position}>
      {/* Body: cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.12, 0.35, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Nose: cone */}
      <mesh position={[0.22, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.18, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Left wing */}
      <mesh position={[-0.04, 0.14, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.18, 0.06, 0.04]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.3} roughness={0.4} />
      </mesh>

      {/* Right wing */}
      <mesh position={[-0.04, -0.14, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.18, 0.06, 0.04]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.3} roughness={0.4} />
      </mesh>

      {/* Thruster flame */}
      <mesh ref={thrusterRef} position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.06, 0.18, 8]} />
        <meshBasicMaterial color={failed ? "#ff4400" : "#ff8833"} transparent opacity={0.7} />
      </mesh>

      {/* Player ship extra glow */}
      {isPlayer && (
        <pointLight color={color} intensity={0.6} distance={2} />
      )}

      {/* Label */}
      {showLabel && label && (
        <Html position={[0, 0.28, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{
            color: "rgba(200,220,255,0.85)",
            fontSize: "9px",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
            textShadow: "0 0 6px rgba(100,150,255,0.8)",
          }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}
