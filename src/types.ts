export type MissionStatus = "idle" | "flying" | "awaiting_result" | "completed" | "failed";

export type Mission = {
  id?: bigint;
  playerName: string;
  taskText: string;
  durationSeconds: number;
  startedAt: number | null;
  status: MissionStatus;
  progress: number;
};

export type FakePlayer = {
  name: string;
  progress: number;
  laneY: number;
  speed: number;
  status: "flying" | "completed" | "failed";
};

export type EventEntry = {
  id: number;
  message: string;
  timestamp: number;
};

export type StarReward = {
  id: number;
  label: string;
  positionOffset: [number, number, number];
};
