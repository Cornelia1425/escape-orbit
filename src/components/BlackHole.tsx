import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BlackHoleProps {
  pulsing?: boolean;
}

// Fresnel-based photon sphere — glows orange on edges, dark in center
const PHOTON_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const PHOTON_FRAG = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float f = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.2);
    vec3 col = mix(vec3(0.55, 0.15, 0.0), vec3(1.0, 0.62, 0.12), f);
    gl_FragColor = vec4(col, f * 0.92);
  }
`;

// Soft outer corona
const CORONA_FRAG = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float f = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.2);
    gl_FragColor = vec4(0.8, 0.35, 0.05, f * 0.18);
  }
`;

function buildDisk() {
  const NUM_ARMS  = 10;
  const PER_ARM   = 700;
  const ROTATIONS = 5.5;
  const total     = NUM_ARMS * PER_ARM;
  const positions = new Float32Array(total * 3);
  const colors    = new Float32Array(total * 3);
  let idx = 0;

  for (let arm = 0; arm < NUM_ARMS; arm++) {
    const armOffset = (arm / NUM_ARMS) * Math.PI * 2;
    for (let i = 0; i < PER_ARM; i++) {
      const t      = Math.random();
      const theta  = armOffset + t * Math.PI * 2 * ROTATIONS;
      const radius = 0.90 + (1 - t) * 2.4;
      const sw     = 0.025 + (1 - t) * 0.14;
      const perpA  = theta + Math.PI / 2;
      const perpO  = (Math.random() - 0.5) * sw;
      const height = (Math.random() - 0.5) * (0.02 + (1 - t) * 0.10);

      positions[idx * 3]     = Math.cos(theta) * radius + Math.cos(perpA) * perpO;
      positions[idx * 3 + 1] = height;
      positions[idx * 3 + 2] = Math.sin(theta) * radius + Math.sin(perpA) * perpO;

      const b = 0.12 + t * t * 0.85;
      colors[idx * 3]     = b * (0.90 + (1 - t) * 0.10);
      colors[idx * 3 + 1] = b * (0.68 + (1 - t) * 0.22);
      colors[idx * 3 + 2] = b * (0.36 + (1 - t) * 0.50);
      idx++;
    }
  }
  return { positions, colors };
}

function buildStars() {
  const STARS = 260, HOT = 80;
  const total = STARS + HOT;
  const positions = new Float32Array(total * 3);
  const colors    = new Float32Array(total * 3);
  let idx = 0;

  for (let i = 0; i < STARS; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.95 + Math.random() * 3.2;
    positions[idx * 3]     = Math.cos(angle) * r;
    positions[idx * 3 + 1] = (Math.random() - 0.5) * 0.28;
    positions[idx * 3 + 2] = Math.sin(angle) * r;
    const b = 0.35 + Math.random() * 0.55;
    colors[idx * 3] = b * 0.92; colors[idx * 3 + 1] = b * 0.92; colors[idx * 3 + 2] = b;
    idx++;
  }
  for (let i = 0; i < HOT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.88 + Math.random() * 2.0;
    positions[idx * 3]     = Math.cos(angle) * r;
    positions[idx * 3 + 1] = (Math.random() - 0.5) * 0.06;
    positions[idx * 3 + 2] = Math.sin(angle) * r;
    const b = 0.7 + Math.random() * 0.3;
    colors[idx * 3] = b; colors[idx * 3 + 1] = b * 0.85; colors[idx * 3 + 2] = b * 0.55;
    idx++;
  }
  return { positions, colors };
}

export default function BlackHole({ pulsing = false }: BlackHoleProps) {
  const groupRef   = useRef<THREE.Group>(null);
  const diskRef    = useRef<THREE.Points>(null);
  const starsRef   = useRef<THREE.Points>(null);
  const lightRef   = useRef<THREE.PointLight>(null);
  const userRot    = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPtr    = useRef({ x: 0, y: 0 });
  const BASE = { x: 0, y: 0, z: 0 } as const;

  const disk  = useMemo(buildDisk, []);
  const stars = useMemo(buildStars, []);

  const photonMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   PHOTON_VERT,
    fragmentShader: PHOTON_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const coronaMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   PHOTON_VERT,
    fragmentShader: CORONA_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  useEffect(() => () => { document.body.style.cursor = ""; }, []);

  const handlePointerDown = (e: { clientX: number; clientY: number; stopPropagation: () => void }) => {
    e.stopPropagation();
    isDragging.current = true;
    lastPtr.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = "grabbing";

    const onMove = (ev: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = ev.clientX - lastPtr.current.x;
      const dy = ev.clientY - lastPtr.current.y;
      lastPtr.current = { x: ev.clientX, y: ev.clientY };
      userRot.current.y += dx * 0.009;
      userRot.current.x += dy * 0.009;
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!isDragging.current) userRot.current.y += 0.00035;
    if (groupRef.current) {
      groupRef.current.rotation.x = BASE.x + userRot.current.x;
      groupRef.current.rotation.y = BASE.y + userRot.current.y;
      groupRef.current.rotation.z = BASE.z;
    }
    if (diskRef.current)  diskRef.current.rotation.y  += 0.000015;
    if (starsRef.current) starsRef.current.rotation.y += 0.000007;
    if (lightRef.current) {
      const pulse = pulsing
        ? 1 + Math.sin(t * 8) * 0.5
        : 1 + Math.sin(t * 1.5) * 0.07;
      lightRef.current.intensity = 0.8 * pulse;
    }
  });

  // Disk tilt: PI/2 - 0.52 ≈ 58° from upright → disk visible at ~32° angle (clearly 3D)
  const DISK_TILT: [number, number, number] = [Math.PI / 2 - 0.52, 0.10, 0.15];

  return (
    <group position={[-6, 0, 0]} ref={groupRef}>
      {/* Invisible drag hit sphere */}
      <mesh onPointerDown={handlePointerDown} visible={false}>
        <sphereGeometry args={[2.2, 8, 8]} />
        <meshBasicMaterial />
      </mesh>

      {/* ── Accretion disk (tilted so it reads as a 3D disk) ── */}
      <group rotation={DISK_TILT} scale={0.5}>
        <points ref={diskRef} renderOrder={0}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[disk.positions, 3]} />
            <bufferAttribute attach="attributes-color"    args={[disk.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.018} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} />
        </points>

        <points ref={starsRef} renderOrder={0}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
            <bufferAttribute attach="attributes-color"    args={[stars.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.030} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} />
        </points>

        {/* Bright inner accretion ring */}
        <mesh renderOrder={2}>
          <torusGeometry args={[0.84, 0.055, 8, 90]} />
          <meshBasicMaterial color="#ff8822" transparent opacity={0.70} depthWrite={false} />
        </mesh>

        {/* Relativistic jets — shoot out along disk rotation axis (local Y) */}
        <mesh renderOrder={1} position={[0, 2.2, 0]}>
          <coneGeometry args={[0.22, 2.8, 16, 1, true]} />
          <meshBasicMaterial color="#99bbff" transparent opacity={0.13} side={THREE.BackSide} depthWrite={false} />
        </mesh>
        <mesh renderOrder={1} position={[0, -2.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.22, 2.8, 16, 1, true]} />
          <meshBasicMaterial color="#99bbff" transparent opacity={0.13} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      </group>

      {/* ── Event horizon — pure black sphere ── */}
      <mesh renderOrder={6} scale={0.5}>
        <sphereGeometry args={[0.72, 64, 64]} />
        <meshBasicMaterial color="#000000" depthWrite />
      </mesh>

      {/* ── Photon sphere — Fresnel orange-edge glow ── */}
      <mesh renderOrder={5} scale={0.5}>
        <sphereGeometry args={[0.80, 48, 48]} />
        <primitive object={photonMat} attach="material" />
      </mesh>

      {/* ── Outer corona glow ── */}
      <mesh renderOrder={3} scale={0.5}>
        <sphereGeometry args={[1.15, 24, 24]} />
        <primitive object={coronaMat} attach="material" />
      </mesh>

      {/* ── Soft ambient haze ── */}
      <mesh renderOrder={2} scale={0.5}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial color="#aa4410" transparent opacity={0.035} depthWrite={false} />
      </mesh>

      <pointLight ref={lightRef} color="#d0a060" intensity={0.8} distance={10} />
    </group>
  );
}
