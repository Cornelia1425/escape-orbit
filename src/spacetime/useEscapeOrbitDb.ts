import { useCallback, useEffect, useRef, useState } from "react";
import type { Identity } from "spacetimedb";
import {
  DbConnection,
  tables,
} from "../module_bindings";
import type { EventLog, Mission, Player } from "../module_bindings/types";
import {
  formatSpacetimeConnectionError,
  logSpacetimeConfig,
  logSpacetimeConnectionError,
  resolveSpacetimeConfig,
  type SpacetimeConfig,
} from "./spacetimeConfig";

const TOKEN_KEY = "escape_orbit_token";

/** Per-tab storage so each browser tab gets its own SpacetimeDB identity. */
function readAuthToken(): string | undefined {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeAuthToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // sessionStorage unavailable
  }
}

export type EscapeOrbitDbState = {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  identity: Identity | null;
  playerName: string | null;
  players: Player[];
  missions: Mission[];
  events: EventLog[];
  joinWorld: (name: string) => Promise<void>;
  startMission: (taskText: string, durationSeconds: number) => void;
  completeMission: (missionId: bigint) => void;
  failMission: (missionId: bigint) => void;
};

function syncTables(
  conn: DbConnection,
  localIdentity: Identity | null,
  setPlayers: (rows: Player[]) => void,
  setMissions: (rows: Mission[]) => void,
  setEvents: (rows: EventLog[]) => void,
  setPlayerName: (name: string | null) => void,
) {
  const playerRows = [...conn.db.player.iter()];
  const missionRows = [...conn.db.mission.iter()];
  const eventRows = [...conn.db.event_log.iter()];

  setPlayers(playerRows);
  setMissions(missionRows);
  setEvents(eventRows);

  if (localIdentity) {
    const localPlayer = playerRows.find((p) => p.identity.isEqual(localIdentity));
    setPlayerName(localPlayer?.name ?? null);
  }
}

export function useEscapeOrbitDb(): EscapeOrbitDbState {
  const connRef = useRef<DbConnection | null>(null);
  const identityRef = useRef<Identity | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [events, setEvents] = useState<EventLog[]>([]);

  const refresh = useCallback((conn: DbConnection) => {
    syncTables(
      conn,
      identityRef.current,
      setPlayers,
      setMissions,
      setEvents,
      setPlayerName,
    );
  }, []);

  useEffect(() => {
    const resolved = resolveSpacetimeConfig();
    if (!resolved.ok) {
      console.error("[Escape Orbit] SpacetimeDB config error:", resolved.error);
      queueMicrotask(() => {
        setConnecting(false);
        setConnected(false);
        setError(resolved.error);
      });
      return;
    }

    const config: SpacetimeConfig = resolved.config;
    logSpacetimeConfig(config);

    const token = readAuthToken();
    const conn = DbConnection.builder()
      .withUri(config.uri)
      .withDatabaseName(config.database)
      .withToken(token)
      .onConnect((connection, id, newToken) => {
        writeAuthToken(newToken);
        identityRef.current = id;
        setIdentity(id);
        setConnected(true);
        setConnecting(false);
        setError(null);
        console.info("[Escape Orbit] SpacetimeDB connected", {
          host: config.host,
          database: config.database,
          identity: id.toHexString(),
        });

        connection.subscriptionBuilder()
          .onApplied(() => refresh(connection))
          .subscribe([tables.player, tables.mission, tables.event_log]);

        const sync = () => refresh(connection);
        connection.db.player.onInsert(sync);
        connection.db.player.onUpdate(sync);
        connection.db.player.onDelete(sync);
        connection.db.mission.onInsert(sync);
        connection.db.mission.onUpdate(sync);
        connection.db.mission.onDelete(sync);
        connection.db.event_log.onInsert(sync);
        connection.db.event_log.onUpdate(sync);
        connection.db.event_log.onDelete(sync);
      })
      .onConnectError((_ctx, err) => {
        const message = err.message ?? "Failed to connect to SpacetimeDB";
        logSpacetimeConnectionError(config, message, err);
        setConnecting(false);
        setConnected(false);
        setError(formatSpacetimeConnectionError(config, message));
      })
      .onDisconnect(() => {
        setConnected(false);
        setConnecting(false);
      })
      .build();

    connRef.current = conn;

    return () => {
      conn.disconnect();
      connRef.current = null;
      identityRef.current = null;
    };
  }, [refresh]);

  useEffect(() => {
    if (!connected || !connRef.current) return;

    const interval = window.setInterval(() => {
      connRef.current?.reducers.heartbeat({});
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [connected]);

  const joinWorld = useCallback(async (name: string) => {
    setError(null);
    const conn = connRef.current;
    if (!conn) {
      throw new Error("Not connected to SpacetimeDB");
    }

    try {
      await conn.reducers.joinWorld({ name });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not enter the universe";
      setError(message);
      throw err;
    }
  }, []);

  const startMission = useCallback((taskText: string, durationSeconds: number) => {
    connRef.current?.reducers.startMission({ taskText, durationSeconds });
  }, []);

  const completeMission = useCallback((missionId: bigint) => {
    connRef.current?.reducers.completeMission({ missionId });
  }, []);

  const failMission = useCallback((missionId: bigint) => {
    connRef.current?.reducers.failMission({ missionId });
  }, []);

  return {
    connected,
    connecting,
    error,
    identity,
    playerName,
    players,
    missions,
    events,
    joinWorld,
    startMission,
    completeMission,
    failMission,
  };
}
