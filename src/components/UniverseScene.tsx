import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import BlackHole from "./BlackHole";
import TargetGalaxy from "./TargetGalaxy";
import Ship from "./Ship";
import FakePlayerShips from "./FakePlayerShips";
import RemoteMissionShips from "./RemoteMissionShips";
import StarReward from "./StarReward";
import FlightPath from "./FlightPath";
import type { Mission, FakePlayer, StarReward as StarRewardType } from "../types";
import type { Mission as DbMission } from "../module_bindings/types";

interface UniverseSceneProps {
  mission: Mission;
  fakePlayers: FakePlayer[];
  remoteFlyingMissions: DbMission[];
  useRemoteShips: boolean;
  stars: StarRewardType[];
  onFakePlayersUpdate: (players: FakePlayer[]) => void;
}

export default function UniverseScene({
  mission,
  fakePlayers,
  remoteFlyingMissions,
  useRemoteShips,
  stars,
  onFakePlayersUpdate,
}: UniverseSceneProps) {
  const isCompleted = mission.status === "completed";
  const isFailed = mission.status === "failed";

  const shipX = -5 + mission.progress * 10;
  const playerPos: [number, number, number] = [shipX, 0, 0];

  const showPlayerShip = mission.status !== "idle";

  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[0, 5, 5]} intensity={0.3} />

        <Stars radius={100} depth={60} count={3000} factor={4} saturation={0.3} fade speed={0.3} />

        <BlackHole pulsing={isFailed} />
        <TargetGalaxy glowing={isCompleted} />

        {showPlayerShip && (
          <FlightPath progress={mission.progress} laneY={0} />
        )}

        {!useRemoteShips && fakePlayers.map((p) => (
          <FlightPath key={p.name} progress={p.progress} laneY={p.laneY} />
        ))}

        {showPlayerShip && (
          <Ship
            position={playerPos}
            color="#ffffff"
            label={mission.playerName || "You"}
            showLabel={!!mission.playerName}
            isPlayer
            failed={isFailed}
          />
        )}

        {useRemoteShips ? (
          <RemoteMissionShips missions={remoteFlyingMissions} />
        ) : (
          <FakePlayerShips players={fakePlayers} onUpdate={onFakePlayersUpdate} />
        )}

        <StarReward stars={stars} />
      </Canvas>
    </div>
  );
}
