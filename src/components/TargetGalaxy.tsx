import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TargetGalaxyProps {
  glowing?: boolean;
}

export default function TargetGalaxy({ glowing = false }: TargetGalaxyProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const [particlePositions] = useState(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 1.6;
      const spread = (Math.random() - 0.5) * 0.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.5 + spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    return positions;
  });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.005;
      ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.15 + 0.2;
    }
    if (coreRef.current) {
      const scale = glowing ? 1 + Math.sin(t * 5) * 0.2 : 1 + Math.sin(t * 1.2) * 0.06;
      coreRef.current.scale.setScalar(scale);
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.003;
    }
    if (lightRef.current) {
      const base = glowing ? 4 : 1.8;
      lightRef.current.intensity = base + Math.sin(t * 2) * 0.4;
    }
  });

  return (
    <group position={[6, 0, 0]}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>

      {/* Core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial
          color="#aaccff"
          emissive="#6699ff"
          emissiveIntensity={glowing ? 4 : 2}
          roughness={0.2}
        />
      </mesh>

      {/* Main ring */}
      <mesh ref={ringRef} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[1.0, 0.12, 16, 80]} />
        <meshStandardMaterial
          color="#7755ff"
          emissive="#5533ee"
          emissiveIntensity={2}
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Particle cloud */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#99bbff"
          size={0.05}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      <pointLight ref={lightRef} color="#5577ff" intensity={1.8} distance={10} />
    </group>
  );
}
