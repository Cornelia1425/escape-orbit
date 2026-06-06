import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Ship from "./Ship";
import FlightPath from "./FlightPath";
import type { Mission as DbMission } from "../module_bindings/types";
import { computeMissionProgress, laneForKey, timestampToMs } from "../spacetime/missionUtils";

const REMOTE_COLORS = ["#66ffcc", "#ffcc66", "#ff88cc", "#88ccff", "#aaff88"];

interface RemoteMissionShipsProps {
  missions: DbMission[];
}

function RemoteMissionShip({
  mission,
  color,
  laneY,
}: {
  mission: DbMission;
  color: string;
  laneY: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startedAtMs = timestampToMs(mission.startedAt);
  const [progress, setProgress] = useState(0);

  useFrame(() => {
    const nextProgress = computeMissionProgress(startedAtMs, mission.durationSeconds);
    if (groupRef.current) {
      groupRef.current.position.x = -5 + nextProgress * 10;
    }
    if (Math.abs(nextProgress - progress) > 0.001) {
      setProgress(nextProgress);
    }
  });

  return (
    <group ref={groupRef} position={[-5, laneY, 0]}>
      <FlightPath progress={progress} laneY={0} />
      <Ship
        position={[0, 0, 0]}
        color={color}
        label={mission.playerName}
        showLabel
      />
    </group>
  );
}

export default function RemoteMissionShips({ missions }: RemoteMissionShipsProps) {
  return (
    <>
      {missions.map((mission, index) => {
        const laneY = laneForKey(mission.playerIdentity.toHexString());
        const color = REMOTE_COLORS[index % REMOTE_COLORS.length];

        return (
          <RemoteMissionShip
            key={mission.id.toString()}
            mission={mission}
            color={color}
            laneY={laneY}
          />
        );
      })}
    </>
  );
}
