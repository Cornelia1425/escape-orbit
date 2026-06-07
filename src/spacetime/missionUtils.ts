import type { Identity } from "spacetimedb";
import type { Mission as DbMission, Player } from "../module_bindings/types";
import type { Mission, MissionStatus } from "../types";

const LANES = [-2, -1, -1.5, 1, 2];

export function timestampToMs(timestamp: DbMission["startedAt"]): number {
  return Number(timestamp.microsSinceUnixEpoch / 1000n);
}

export function computeMissionProgress(
  startedAtMs: number,
  durationSeconds: number,
  now = Date.now(),
): number {
  if (durationSeconds <= 0) return 0;
  const elapsed = (now - startedAtMs) / 1000;
  return Math.min(1, elapsed / durationSeconds);
}

export function laneForKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return LANES[Math.abs(hash) % LANES.length];
}

export function getLatestLocalDbMission(
  missions: DbMission[],
  identity: Identity,
): DbMission | undefined {
  return missions
    .filter((m) => m.playerIdentity.isEqual(identity))
    .sort((a, b) => Number(b.id - a.id))[0];
}

export function getActiveLocalDbMission(
  missions: DbMission[],
  identity: Identity,
): DbMission | undefined {
  return missions
    .filter((m) => m.playerIdentity.isEqual(identity) && m.status === "flying")
    .sort((a, b) => Number(b.id - a.id))[0];
}

export type RemotePlayerPresence = {
  identityHex: string;
  name: string;
  laneY: number;
  status: "idle" | "flying";
  startedAtMs: number | null;
  durationSeconds: number;
  missionId: string | null;
};

export function idleProgressForIdentity(identityHex: string): number {
  let hash = 0;
  for (let i = 0; i < identityHex.length; i++) {
    hash = (hash * 31 + identityHex.charCodeAt(i)) | 0;
  }
  return 0.05 + (Math.abs(hash) % 15) / 100;
}

export function getRemotePlayerPresences(
  players: Player[],
  missions: DbMission[],
  identity: Identity | null,
): RemotePlayerPresence[] {
  const flyingByIdentity = new Map<string, DbMission>();
  for (const mission of missions) {
    if (mission.status === "flying") {
      flyingByIdentity.set(mission.playerIdentity.toHexString(), mission);
    }
  }

  return players
    .filter((player) => identity === null || !player.identity.isEqual(identity))
    .map((player) => {
      const identityHex = player.identity.toHexString();
      const laneY = laneForKey(identityHex);
      const flying = flyingByIdentity.get(identityHex);

      if (flying) {
        return {
          identityHex,
          name: player.name,
          laneY,
          status: "flying" as const,
          startedAtMs: timestampToMs(flying.startedAt),
          durationSeconds: flying.durationSeconds,
          missionId: flying.id.toString(),
        };
      }

      return {
        identityHex,
        name: player.name,
        laneY,
        status: "idle" as const,
        startedAtMs: null,
        durationSeconds: 0,
        missionId: null,
      };
    });
}

export function getRemoteFlyingMissions(
  missions: DbMission[],
  identity: Identity | null,
): DbMission[] {
  return missions.filter(
    (m) =>
      m.status === "flying" &&
      (identity === null || !m.playerIdentity.isEqual(identity)),
  );
}

export function dbMissionToUiMission(
  mission: DbMission,
  dismissed: boolean,
  now = Date.now(),
): Mission {
  const startedAt = timestampToMs(mission.startedAt);
  const progress = computeMissionProgress(startedAt, mission.durationSeconds, now);

  let status: MissionStatus = "idle";
  if (mission.status === "flying") {
    status = progress >= 1 ? "awaiting_result" : "flying";
  } else if (mission.status === "completed") {
    status = dismissed ? "idle" : "completed";
  } else if (mission.status === "failed") {
    status = dismissed ? "idle" : "failed";
  }

  return {
    id: mission.id,
    playerName: mission.playerName,
    taskText: mission.taskText,
    durationSeconds: mission.durationSeconds,
    startedAt: mission.status === "flying" || mission.status === "failed" ? startedAt : null,
    status,
    progress: mission.status === "completed" ? 1 : progress,
  };
}
