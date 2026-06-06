export type SpacetimeConfig = {
  uri: string;
  database: string;
  host: string;
  wsUrl: string;
};

export type SpacetimeConfigResult =
  | { ok: true; config: SpacetimeConfig }
  | { ok: false; error: string };

const LOCAL_URI = "ws://127.0.0.1:3000";
const LOCAL_DATABASE = "escapeorbitdev";
const PRODUCTION_URI = "wss://maincloud.spacetimedb.com";
const PRODUCTION_DATABASE = "escape-orbit";

function readEnv(name: "VITE_SPACETIMEDB_URI" | "VITE_SPACETIMEDB_DATABASE") {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toWebSocketUrl(uri: string): string {
  const url = new URL(uri);
  if (!/^wss?:/.test(url.protocol)) {
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  }
  return url.toString().replace(/\/$/, "");
}

function buildConfig(uri: string, database: string): SpacetimeConfig {
  const parsed = new URL(uri);
  const wsUrl = toWebSocketUrl(uri);

  return {
    uri,
    database,
    host: parsed.host,
    wsUrl,
  };
}

export function resolveSpacetimeConfig(): SpacetimeConfigResult {
  const envUri = readEnv("VITE_SPACETIMEDB_URI");
  const envDatabase = readEnv("VITE_SPACETIMEDB_DATABASE");

  if (import.meta.env.DEV) {
    return {
      ok: true,
      config: buildConfig(envUri ?? LOCAL_URI, envDatabase ?? LOCAL_DATABASE),
    };
  }

  const missing = [
    !envUri && "VITE_SPACETIMEDB_URI",
    !envDatabase && "VITE_SPACETIMEDB_DATABASE",
  ].filter(Boolean);

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required Vercel environment variables: ${missing.join(", ")}. Set them in Vercel → Settings → Environment Variables, then redeploy.`,
    };
  }

  return {
    ok: true,
    config: buildConfig(envUri!, envDatabase!),
  };
}

export function logSpacetimeConfig(config: SpacetimeConfig) {
  console.info("[Escape Orbit] SpacetimeDB config", {
    host: config.host,
    database: config.database,
    uri: config.uri,
    wsUrl: config.wsUrl,
    mode: import.meta.env.MODE,
  });
}

export function formatSpacetimeConnectionError(
  config: SpacetimeConfig,
  message: string,
): string {
  const subscribePath = `v1/database/${config.database}/subscribe`;

  return [
    message,
    `Host: ${config.host}`,
    `Database: ${config.database}`,
    `URI: ${config.uri}`,
    `WebSocket: ${config.wsUrl}/${subscribePath}`,
  ].join("\n");
}

export function logSpacetimeConnectionError(
  config: SpacetimeConfig,
  message: string,
  cause?: unknown,
) {
  console.error("[Escape Orbit] SpacetimeDB connection failed", {
    host: config.host,
    database: config.database,
    uri: config.uri,
    wsUrl: config.wsUrl,
    message,
    cause,
  });
}

/** Documented defaults for README / Vercel setup (not used at runtime in production). */
export const SPACETIME_ENV_DOCS = {
  production: {
    VITE_SPACETIMEDB_URI: PRODUCTION_URI,
    VITE_SPACETIMEDB_DATABASE: PRODUCTION_DATABASE,
  },
  local: {
    VITE_SPACETIMEDB_URI: LOCAL_URI,
    VITE_SPACETIMEDB_DATABASE: LOCAL_DATABASE,
  },
} as const;
