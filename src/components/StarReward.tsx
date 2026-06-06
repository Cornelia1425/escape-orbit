import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { StarReward as StarRewardType } from "../types";

interface StarRewardProps {
  stars: StarRewardType[];
}

function Star({ star }: { star: StarRewardType }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.scale.setScalar(0.9 + Math.sin(t * 2 + star.id) * 0.1);
    }
  });

  const [ox, oy, oz] = star.positionOffset;
  const pos: [number, number, number] = [6 + ox, oy, oz];

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial
          color="#ffffaa"
          emissive="#ffee44"
          emissiveIntensity={3}
          roughness={0.2}
        />
      </mesh>
      <pointLight color="#ffee44" intensity={0.8} distance={2} />
      <Html position={[0, 0.25, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{
          color: "rgba(255,240,150,0.9)",
          fontSize: "8px",
          fontFamily: "'DM Mono', monospace",
          maxWidth: "80px",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textShadow: "0 0 6px rgba(255,220,50,0.8)",
        }}>
          {star.label}
        </div>
      </Html>
    </group>
  );
}

export default function StarReward({ stars }: StarRewardProps) {
  return (
    <>
      {stars.map((star) => (
        <Star key={star.id} star={star} />
      ))}
    </>
  );
}
