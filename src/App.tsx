import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import LandingScreen from "./components/LandingScreen";
import UniverseScene from "./components/UniverseScene";
import MissionPanel from "./components/MissionPanel";
import EventFeed from "./components/EventFeed";
import StarNavigationMap from "./components/StarNavigationMap";
import { useEscapeOrbitDb } from "./spacetime/useEscapeOrbitDb";
import {
  dbMissionToUiMission,
  getActiveLocalDbMission,
  getLatestLocalDbMission,
  getRemotePlayerPresences,
  timestampToMs,
} from "./spacetime/missionUtils";
import type { Mission, FakePlayer, EventEntry, StarReward } from "./types";
import {
  disableFocusGuard,
  enableFocusGuard,
} from "./extension/focusExtension";

const FAKE_PLAYERS: FakePlayer[] = [
  { name: "Nova",  progress: 0.22, laneY: -2,  speed: 0.012, status: "flying" },
  { name: "Kai",   progress: 0.55, laneY: -1,  speed: 0.008, status: "flying" },
  { name: "Mira",  progress: 0.38, laneY:  1,  speed: 0.010, status: "flying" },
  { name: "Sol",   progress: 0.71, laneY:  2,  speed: 0.006, status: "flying" },
  { name: "Echo",  progress: 0.09, laneY: -1.5, speed: 0.014, status: "flying" },
];

const INITIAL_MISSION: Mission = {
  playerName: "",
  taskText: "",
  durationSeconds: 30,
  startedAt: null,
  status: "idle",
  progress: 0,
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [missionDismissed, setMissionDismissed] = useState(false);
  const [fakePlayers, setFakePlayers] = useState<FakePlayer[]>(FAKE_PLAYERS);
  const [stars, setStars] = useState<StarReward[]>([]);
  const [tick, setTick] = useState(0);

  const db = useEscapeOrbitDb();
  const rafRef = useRef<number | null>(null);

  const localDbMission = useMemo(() => {
    if (!db.identity) return undefined;
    return getActiveLocalDbMission(db.missions, db.identity)
      ?? getLatestLocalDbMission(db.missions, db.identity);
  }, [db.identity, db.missions]);

  const mission = useMemo(() => {
    const base = { ...INITIAL_MISSION, playerName: db.playerName ?? "" };

    if (!db.connected || !db.identity || !localDbMission) {
      return base;
    }

    if (
      missionDismissed &&
      localDbMission.status !== "flying"
    ) {
      return base;
    }

    return dbMissionToUiMission(localDbMission, missionDismissed, tick);
  }, [db.connected, db.identity, db.playerName, localDbMission, missionDismissed, tick]);

  const remotePlayerPresences = useMemo(() => {
    if (!db.connected) return [];
    return getRemotePlayerPresences(db.players, db.missions, db.identity);
  }, [db.connected, db.players, db.missions, db.identity]);

  const onlinePilotCount = db.connected ? db.players.length : 0;

  const events: EventEntry[] = useMemo(() => {
    if (!db.connected || db.events.length === 0) return [];
    return [...db.events]
      .sort((a, b) => Number(b.id - a.id))
      .slice(0, 8)
      .map((event) => ({
        id: Number(event.id),
        message: event.message,
        timestamp: timestampToMs(event.createdAt),
      }));
  }, [db.connected, db.events]);

  useEffect(() => {
    const loop = () => {
      setTick(Date.now());
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (mission.status !== "flying") {
      disableFocusGuard();
      return;
    }

    enableFocusGuard();
    const heartbeatId = window.setInterval(enableFocusGuard, 15_000);

    return () => {
      window.clearInterval(heartbeatId);
      disableFocusGuard();
    };
  }, [mission.status]);

  useEffect(() => {
    const onPageHide = () => {
      disableFocusGuard();
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  const handleJoin = useCallback(async (name: string) => {
    await db.joinWorld(name);
    setShowLanding(false);
    setMissionDismissed(false);
  }, [db]);

  const handleLaunch = useCallback(async (task: string, duration: number) => {
    if (!db.connected) return;
    setMissionDismissed(false);
    db.startMission(task, duration);
    enableFocusGuard();
  }, [db]);

  const handleComplete = useCallback(async () => {
    if (!mission.id) return;
    db.completeMission(mission.id);
    disableFocusGuard();

    const task = mission.taskText;
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.8 + Math.random() * 1.2;
    setStars((prev) => [
      ...prev,
      {
        id: Date.now(),
        label: task.length > 20 ? task.slice(0, 20) + "…" : task,
        positionOffset: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.6,
          0,
        ],
      },
    ]);
  }, [db, mission.id, mission.taskText]);

  const handleFail = useCallback(() => {
    if (!mission.id) return;
    db.failMission(mission.id);
    disableFocusGuard();
  }, [db, mission.id]);

  const handleReset = useCallback(() => {
    setMissionDismissed(true);
    disableFocusGuard();
  }, []);

  const blockedInstagram = useMemo(() => {
    return new URLSearchParams(window.location.search).get("blocked") === "instagram";
  }, []);

  const shouldShowLanding = showLanding || !db.playerName;

  if (shouldShowLanding) {
    return (
      <LandingScreen
        onJoin={handleJoin}
        takenNames={db.players.map((player) => player.name)}
        connecting={db.connecting}
        connected={db.connected}
        error={db.error}
        blockedInstagram={blockedInstagram}
      />
    );
  }

  const useRemoteShips = db.connected;

  const remainingSeconds = mission.startedAt && mission.status === "flying"
    ? Math.max(0, mission.durationSeconds - (tick - mission.startedAt) / 1000)
    : mission.durationSeconds;

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      background: "radial-gradient(ellipse at 30% 50%, #080e2a 0%, #020408 70%)",
      position: "relative",
    }}>
      <UniverseScene
        mission={mission}
        fakePlayers={fakePlayers}
        remotePlayerPresences={remotePlayerPresences}
        useRemoteShips={useRemoteShips}
        stars={stars}
        onFakePlayersUpdate={setFakePlayers}
        >
        <StarNavigationMap
          progress={mission.progress}
          position={[0, 1.04, -0.32]}
          scale={0.95}
          compact
        />
      </UniverseScene>

      <div style={{
        position: "fixed",
        top: "22px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        pointerEvents: "none",
        minWidth: "220px",
        padding: "8px 10px",
        background: "rgba(3,8,26,0.12)",
        borderLeft: "1px solid rgba(100,220,255,0.16)",
        boxShadow: "0 0 20px rgba(42,160,255,0.12)",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "16px",
          fontWeight: 300,
          color: "rgba(185,235,255,0.62)",
          letterSpacing: "0.2em",
        }}>
          ESCAPE ORBIT
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "8px",
          color: db.connected ? "rgba(100,200,140,0.6)" : "rgba(200,100,100,0.6)",
          letterSpacing: "0.15em",
          marginTop: "4px",
        }}>
          {db.connected
            ? `◦ LIVE · ${onlinePilotCount} PILOT${onlinePilotCount === 1 ? "" : "S"} · ${db.playerName ?? "YOU"} ◦`
            : "◦ OFFLINE · FAKE SHIPS ◦"}
        </div>
      </div>

      <div style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: "16px",
        width: "min(760px, calc(100vw - 32px))",
      }}>
        <EventFeed events={events} embedded />
        <MissionPanel
          mission={mission}
          playerName={db.playerName ?? ""}
          connected={db.connected}
          remainingSeconds={remainingSeconds}
          onLaunch={handleLaunch}
          onComplete={handleComplete}
          onFail={handleFail}
          onReset={handleReset}
          embedded
        />
      </div>
    </div>
  );
}
