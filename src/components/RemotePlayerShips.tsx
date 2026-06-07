import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Ship from "./Ship";
import FlightPath from "./FlightPath";
import {
  computeMissionProgress,
  idleProgressForIdentity,
  type RemotePlayerPresence,
} from "../spacetime/missionUtils";

const REMOTE_COLORS = ["#66ffcc", "#ffcc66", "#ff88cc", "#88ccff", "#aaff88"];

function RemotePlayerShip({
  presence,
  color,
}: {
  presence: RemotePlayerPresence;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(
    presence.status === "flying" && presence.startedAtMs !== null
      ? computeMissionProgress(presence.startedAtMs, presence.durationSeconds)
      : idleProgressForIdentity(presence.identityHex),
  );

  useFrame((state) => {
    if (!groupRef.current) return;

    if (presence.status === "flying" && presence.startedAtMs !== null) {
      const nextProgress = computeMissionProgress(
        presence.startedAtMs,
        presence.durationSeconds,
      );
      groupRef.current.position.x = -5 + nextProgress * 10;
      groupRef.current.position.y = presence.laneY;
      if (Math.abs(nextProgress - progress) > 0.001) {
        setProgress(nextProgress);
      }
      return;
    }

    const idleProgress = idleProgressForIdentity(presence.identityHex);
    const bob = Math.sin(state.clock.elapsedTime * 1.4 + presence.laneY) * 0.06;
    groupRef.current.position.x = -5 + idleProgress * 10;
    groupRef.current.position.y = presence.laneY + bob;
  });

  const showPath = presence.status === "flying";

  return (
    <group ref={groupRef} position={[-5, presence.laneY, 0]}>
      {showPath && <FlightPath progress={progress} laneY={0} />}
      <Ship
        position={[0, 0, 0]}
        color={color}
        label={presence.name}
        showLabel
      />
    </group>
  );
}

interface RemotePlayerShipsProps {
  presences: RemotePlayerPresence[];
}

export default function RemotePlayerShips({ presences }: RemotePlayerShipsProps) {
  return (
    <>
      {presences.map((presence, index) => (
        <RemotePlayerShip
          key={presence.identityHex}
          presence={presence}
          color={REMOTE_COLORS[index % REMOTE_COLORS.length]}
        />
      ))}
    </>
  );
}
