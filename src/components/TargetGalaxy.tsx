import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TargetGalaxyProps {
  glowing?: boolean;
}

// ── Shaders ───────────────────────────────────────────────────────────────────
// Each star is a tiny soft point — brightness comes from density, not glow size.

const VERT = /* glsl */`
  attribute float aSize;
  attribute vec3  aColor;
  varying   vec3  vColor;

  void main() {
    vColor = aColor;
    vec4 mv      = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (190.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */`
  varying vec3 vColor;

  void main() {
    vec2  c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float alpha = exp(-d * 16.0) * 0.85 + exp(-d * 5.0) * 0.14;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function gauss() {
  return (Math.random() + Math.random() + Math.random() - 1.5) * 0.75;
}

function onSphere(r: number): [number, number, number] {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ];
}

// ── Galaxy builder ────────────────────────────────────────────────────────────
// High count, very dim — structure emerges from density like 100k Stars.

function buildGalaxy() {
  type Star = { x: number; y: number; z: number; r: number; g: number; b: number; s: number };
  const stars: Star[] = [];

  const add = (x: number, y: number, z: number, r: number, g: number, b: number, s: number) =>
    stars.push({ x, y, z, r, g, b, s });

  // ── Nucleus — bright golden core ──────────────────────────────────────────
  for (let i = 0; i < 1000; i++) {
    const rad = Math.pow(Math.random(), 3.0) * 0.18;
    const [x, y, z] = onSphere(rad);
    const t   = rad / 0.18;
    const b   = 0.30 + Math.random() * 0.20;
    add(x, y, z,
      b,
      b * (0.72 - t * 0.12),
      b * (0.15 - t * 0.08),
      1.1 + Math.random() * 1.5);
  }

  // ── Bulge — warm orange-yellow ────────────────────────────────────────────
  for (let i = 0; i < 2500; i++) {
    const rad = Math.pow(Math.random(), 2.0) * 0.80;
    const [x, y, z] = onSphere(rad);
    const t   = rad / 0.80;
    const b   = (0.12 + Math.random() * 0.11) * (1 - t * 0.55);
    add(x, y * 0.38, z,
      b,
      b * (0.75 - t * 0.15),
      b * (0.18 - t * 0.08),
      0.75 + Math.random() * 1.0);
  }

  // ── Spiral arms — wide, colorful (pink clusters + blue-white diffuse) ─────
  const TIGHTNESS = 3.1;
  for (let arm = 0; arm < 3; arm++) {
    const offset = arm * ((Math.PI * 2) / 3);
    for (let i = 0; i < 5000; i++) {
      const t      = Math.pow(Math.random(), 0.65);
      const radius = 0.28 + t * 3.8;
      const angle  = offset + Math.log(radius) * TIGHTNESS + gauss() * 0.72;
      const thick  = (0.05 + radius * 0.10) * gauss();

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = thick;

      const ct = Math.min(radius / 3.8, 1);
      const b  = 0.10 + Math.random() * 0.12;
      const isPink = Math.random() < 0.25;

      if (isPink) {
        // vivid pink-magenta HII star-forming regions
        add(x, y, z, b * 1.0, b * 0.15, b * 0.75, 0.75 + Math.random() * 1.0);
      } else if (ct < 0.22) {
        add(x, y, z, b, b * 0.82, b * 0.35, 0.70 + Math.random() * 0.85);
      } else if (ct < 0.58) {
        const s = (ct - 0.22) / 0.36;
        add(x, y, z, b * (0.75 - s * 0.25), b * 0.85, b, 0.58 + Math.random() * 0.72);
      } else {
        add(x, y, z, b * 0.45, b * 0.55, b, 0.42 + Math.random() * 0.55);
      }
    }
  }

  // ── Inter-arm diffuse disk ────────────────────────────────────────────────
  for (let i = 0; i < 1800; i++) {
    const radius = 0.4 + Math.pow(Math.random(), 0.8) * 3.4;
    const angle  = Math.random() * Math.PI * 2;
    const thick  = (0.03 + radius * 0.04) * gauss();
    const b = 0.08 + Math.random() * 0.10;
    add(Math.cos(angle) * radius, thick, Math.sin(angle) * radius,
      b * 0.65, b * 0.72, b, 0.42 + Math.random() * 0.52);
  }

  // ── Halo ──────────────────────────────────────────────────────────────────
  for (let i = 0; i < 1000; i++) {
    const rad = 1.4 + Math.pow(Math.random(), 0.5) * 3.0;
    const [x, y, z] = onSphere(rad);
    const b = 0.06 + Math.random() * 0.08;
    add(x, y * 0.48, z, b * 0.5, b * 0.62, b, 0.40 + Math.random() * 0.50);
  }

  // ── Satellite (NGC 205) ───────────────────────────────────────────────────
  for (let i = 0; i < 450; i++) {
    const rad = Math.pow(Math.random(), 2.5) * 0.46;
    const [dx, dy, dz] = onSphere(rad);
    const b = (0.12 + Math.random() * 0.14) * (1 - rad / 0.46);
    add(3.2 + dx, 1.3 + dy * 0.55, dz, b, b * 0.88, b * 0.75, 0.50 + Math.random() * 0.70);
  }

  // ── Pack ──────────────────────────────────────────────────────────────────
  const n   = stars.length;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const sz  = new Float32Array(n);
  stars.forEach(({ x, y, z, r, g, b, s }, i) => {
    pos[i * 3]     = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    col[i * 3]     = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
    sz[i] = s;
  });
  return { pos, col, sz };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TargetGalaxy({ glowing = false }: TargetGalaxyProps) {
  const groupRef   = useRef<THREE.Group>(null);
  const userRot    = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPtr    = useRef({ x: 0, y: 0 });
  const BASE = { x: -1.08, y: 0.14, z: -0.32 } as const;

  const geo = useMemo(() => {
    const { pos, col, sz } = buildGalaxy();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor",   new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize",    new THREE.BufferAttribute(sz, 1));
    return g;
  }, []);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  // ── Drag to rotate ────────────────────────────────────────────────────────
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

  useFrame(() => {
    if (!isDragging.current) userRot.current.y += 0.00035;
    if (groupRef.current) {
      groupRef.current.rotation.x = BASE.x + userRot.current.x;
      groupRef.current.rotation.y = BASE.y + userRot.current.y;
      groupRef.current.rotation.z = BASE.z;
    }
  });

  return (
    <group position={[6, 0, 0]} ref={groupRef}>
      {/* Very faint core warmth */}
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color="#ffdd88" transparent opacity={glowing ? 0.09 : 0.045} depthWrite={false} />
      </mesh>

      {/* Invisible drag hit-sphere */}
      <mesh onPointerDown={handlePointerDown} visible={false}>
        <sphereGeometry args={[4.5, 8, 8]} />
        <meshBasicMaterial />
      </mesh>

      <points geometry={geo} material={mat} />

      <pointLight color="#ffcc88" intensity={glowing ? 0.6 : 0.15} distance={12} />
    </group>
  );
}
