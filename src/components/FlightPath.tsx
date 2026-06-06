import { useMemo } from "react";
import * as THREE from "three";

interface FlightPathProps {
  progress: number;
  laneY?: number;
}

export default function FlightPath({ progress, laneY = 0 }: FlightPathProps) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const x = -5 + t * 10;
      const y = laneY + Math.sin(t * Math.PI) * 0.15;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    return pts;
  }, [laneY]);

  const progressPoints = useMemo(() => {
    const count = Math.floor(progress * 61);
    return points.slice(0, count);
  }, [points, progress]);

  const fullGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  const progressGeometry = useMemo(() => {
    if (progressPoints.length < 2) return null;
    return new THREE.BufferGeometry().setFromPoints(progressPoints);
  }, [progressPoints]);

  return (
    <group>
      {/* Faint full path */}
      <line>
        <primitive object={fullGeometry} attach="geometry" />
        <lineBasicMaterial color="#334466" transparent opacity={0.3} linewidth={1} />
      </line>
      {/* Bright progress trail */}
      {progressGeometry && (
        <line>
          <primitive object={progressGeometry} attach="geometry" />
          <lineBasicMaterial color="#6699ff" transparent opacity={0.7} linewidth={2} />
        </line>
      )}
    </group>
  );
}
