import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import LandingScreen from "./components/LandingScreen";
import UniverseScene from "./components/UniverseScene";
import MissionPanel from "./components/MissionPanel";
import EventFeed from "./components/EventFeed";
import { useEscapeOrbitDb } from "./spacetime/useEscapeOrbitDb";
import {
  dbMissionToUiMission,
  getActiveLocalDbMission,
  getLatestLocalDbMission,
  getRemoteFlyingMissions,
  timestampToMs,
} from "./spacetime/missionUtils";
import type { Mission, FakePlayer, EventEntry, StarReward } from "./types";
import {
  disableFocusGuard,
  enableFocusGuard,
  getFocusGuardNotice,
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
  const [focusGuardNotice, setFocusGuardNotice] = useState<string | null>(null);

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

  const remoteFlyingMissions = useMemo(() => {
    if (!db.connected || !db.identity) return [];
    return getRemoteFlyingMissions(db.missions, db.identity);
  }, [db.connected, db.identity, db.missions]);

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
    if (mission.status === "flying" || mission.status === "awaiting_result") {
      enableFocusGuard().then((result) => {
        setFocusGuardNotice(getFocusGuardNotice(result));
      });
      return;
    }

    disableFocusGuard();
  }, [mission.status]);

  useEffect(() => {
    const onPageHide = () => {
      disableFocusGuard();
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  const handleJoin = useCallback((name: string) => {
    db.joinWorld(name);
    setShowLanding(false);
    setMissionDismissed(false);
  }, [db]);

  const handleLaunch = useCallback(async (task: string, duration: number) => {
    if (!db.connected) return;
    setMissionDismissed(false);
    db.startMission(task, duration);

    const result = await enableFocusGuard();
    setFocusGuardNotice(getFocusGuardNotice(result));
  }, [db]);

  const handleComplete = useCallback(async () => {
    if (!mission.id) return;
    db.completeMission(mission.id);

    const result = await disableFocusGuard();
    setFocusGuardNotice(getFocusGuardNotice(result));

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

  const handleFail = useCallback(async () => {
    if (!mission.id) return;
    db.failMission(mission.id);

    const result = await disableFocusGuard();
    setFocusGuardNotice(getFocusGuardNotice(result));
  }, [db, mission.id]);

  const handleReset = useCallback(async () => {
    setMissionDismissed(true);
    const result = await disableFocusGuard();
    setFocusGuardNotice(getFocusGuardNotice(result));
  }, []);

  const blockedInstagram = useMemo(() => {
    return new URLSearchParams(window.location.search).get("blocked") === "instagram";
  }, []);

  if (showLanding) {
    return (
      <LandingScreen
        onJoin={handleJoin}
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
        remoteFlyingMissions={remoteFlyingMissions}
        useRemoteShips={useRemoteShips}
        stars={stars}
        onFakePlayersUpdate={setFakePlayers}
      />

      <div style={{
        position: "fixed",
        top: "24px",
        left: "28px",
        zIndex: 50,
        pointerEvents: "none",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "20px",
          fontWeight: 300,
          color: "rgba(180,200,255,0.6)",
          letterSpacing: "0.2em",
        }}>
          ESCAPE ORBIT
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "9px",
          color: db.connected ? "rgba(100,200,140,0.55)" : "rgba(200,100,100,0.55)",
          letterSpacing: "0.15em",
          marginTop: "4px",
        }}>
          {db.connected
            ? `◦ LIVE · ${db.playerName ?? "PILOT"} ◦`
            : "◦ OFFLINE · FAKE SHIPS ◦"}
        </div>
        {focusGuardNotice && (
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            color: "rgba(255,180,100,0.75)",
            letterSpacing: "0.08em",
            marginTop: "8px",
            maxWidth: "220px",
            lineHeight: 1.5,
          }}>
            {focusGuardNotice}
          </div>
        )}
      </div>

      <MissionPanel
        mission={mission}
        playerName={db.playerName ?? ""}
        connected={db.connected}
        remainingSeconds={remainingSeconds}
        onLaunch={handleLaunch}
        onComplete={handleComplete}
        onFail={handleFail}
        onReset={handleReset}
      />

      <EventFeed events={events} />
    </div>
  );
}
