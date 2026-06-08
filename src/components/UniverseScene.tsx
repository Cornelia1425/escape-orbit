import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import type { ReactNode } from "react";
import BlackHole from "./BlackHole";
import TargetGalaxy from "./TargetGalaxy";
import Ship from "./Ship";
import FakePlayerShips from "./FakePlayerShips";
import RemotePlayerShips from "./RemotePlayerShips";
import StarReward from "./StarReward";
import FlightPath from "./FlightPath";
import MissionPhotoCards from "./MissionPhotoCards";
import type { Mission, FakePlayer, StarReward as StarRewardType } from "../types";
import type { RemotePlayerPresence } from "../spacetime/missionUtils";
import type { MissionPhoto, PhotoTransform } from "../module_bindings/types";
import type { Identity } from "spacetimedb";

interface UniverseSceneProps {
  mission: Mission;
  fakePlayers: FakePlayer[];
  remotePlayerPresences: RemotePlayerPresence[];
  useRemoteShips: boolean;
  stars: StarRewardType[];
  missionPhotos: MissionPhoto[];
  photoTransforms: PhotoTransform[];
  currentIdentity: Identity | null;
  onUpdatePhotoTransform: (photoId: bigint, posX: number, posY: number, size: number) => void;
  onFakePlayersUpdate: (players: FakePlayer[]) => void;
  children?: ReactNode;
}

export default function UniverseScene({
  mission,
  fakePlayers,
  remotePlayerPresences,
  useRemoteShips,
  stars,
  missionPhotos,
  photoTransforms,
  currentIdentity,
  onUpdatePhotoTransform,
  onFakePlayersUpdate,
  children,
}: UniverseSceneProps) {
  const isCompleted = mission.status === "completed";
  const isFailed = mission.status === "failed";

  const shipX = -5 + mission.progress * 10;
  const playerPos: [number, number, number] = [shipX, 0, 0];

  const showPlayerMissionShip = mission.status !== "idle";
  const showLocalIdleShip = useRemoteShips && mission.status === "idle" && !!mission.playerName;

  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "transparent", touchAction: "none" }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[0, 5, 5]} intensity={0.3} />

        <Stars radius={100} depth={60} count={3000} factor={4} saturation={0.3} fade speed={0.3} />

        <BlackHole pulsing={isFailed} />
        <TargetGalaxy glowing={isCompleted} />

        {showPlayerMissionShip && (
          <FlightPath progress={mission.progress} laneY={0} />
        )}

        {!useRemoteShips && fakePlayers.map((p) => (
          <FlightPath key={p.name} progress={p.progress} laneY={p.laneY} />
        ))}

        {showPlayerMissionShip && (
          <Ship
            position={playerPos}
            color="#ffffff"
            label={mission.playerName || "You"}
            showLabel={!!mission.playerName}
            isPlayer
            failed={isFailed}
          />
        )}

        {showLocalIdleShip && (
          <Ship
            position={[-4.7, 0, 0]}
            color="#ffffff"
            label={mission.playerName}
            showLabel
            isPlayer
          />
        )}

        {useRemoteShips ? (
          <RemotePlayerShips presences={remotePlayerPresences} />
        ) : (
          <FakePlayerShips players={fakePlayers} onUpdate={onFakePlayersUpdate} />
        )}

        <StarReward stars={stars} />
        <MissionPhotoCards photos={missionPhotos} transforms={photoTransforms} currentIdentity={currentIdentity} onUpdateTransform={onUpdatePhotoTransform} />
        {children}
      </Canvas>
    </div>
  );
}
