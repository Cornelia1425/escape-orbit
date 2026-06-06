import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BlackHoleProps {
  pulsing?: boolean;
}

export default function BlackHole({ pulsing = false }: BlackHoleProps) {
  const diskRef = useRef<THREE.Mesh>(null);
  const outerDiskRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (diskRef.current) diskRef.current.rotation.z += 0.012;
    if (outerDiskRef.current) outerDiskRef.current.rotation.z -= 0.006;
    if (lightRef.current) {
      const pulse = pulsing ? 1 + Math.sin(t * 8) * 0.5 : 1 + Math.sin(t * 2) * 0.2;
      lightRef.current.intensity = 2.5 * pulse;
    }
    if (glowRef.current) {
      const scale = pulsing ? 1 + Math.sin(t * 6) * 0.15 : 1 + Math.sin(t * 1.5) * 0.05;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={[-6, 0, 0]}>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>

      {/* Black hole core */}
      <mesh>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Inner accretion disk */}
      <mesh ref={diskRef} rotation={[Math.PI / 5, 0, 0]}>
        <torusGeometry args={[1.1, 0.22, 16, 80]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff3300" emissiveIntensity={2} roughness={0.3} />
      </mesh>

      {/* Outer wispy disk */}
      <mesh ref={outerDiskRef} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[1.55, 0.1, 8, 80]} />
        <meshStandardMaterial color="#cc44ff" emissive="#aa22dd" emissiveIntensity={1.5} transparent opacity={0.7} roughness={0.5} />
      </mesh>

      {/* Light source */}
      <pointLight ref={lightRef} color="#ff5500" intensity={2.5} distance={8} />
    </group>
  );
}
