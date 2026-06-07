const EXTENSION_ID_STORAGE_KEY = "escape_orbit_extension_id";

type ExtensionMessageType = "ENABLE_FOCUS_MODE" | "DISABLE_FOCUS_MODE" | "GET_STATUS";

type ExtensionResponse = {
  ok?: boolean;
  focusMode?: boolean;
  blockingOn?: boolean;
  activeRules?: number;
  error?: string | null;
  [key: string]: unknown;
};

export type FocusGuardResult = {
  connected: boolean;
  ok: boolean;
  response?: ExtensionResponse;
  error?: string;
};

type ChromeRuntime = {
  sendMessage: (
    extensionId: string,
    message: { type: ExtensionMessageType },
    callback: (response?: ExtensionResponse) => void,
  ) => void;
  lastError?: { message?: string };
};

declare global {
  interface Window {
    chrome?: { runtime?: ChromeRuntime };
  }
}

const debugOnceFlags = {
  notConfigured: false,
  runtimeUnavailable: false,
};

function logFocusGuardDebugOnce(
  flag: keyof typeof debugOnceFlags,
  message: string,
) {
  if (!import.meta.env.DEV || debugOnceFlags[flag]) return;
  debugOnceFlags[flag] = true;
  console.debug(`[Escape Orbit] Focus Guard: ${message}`);
}

function resolveExtensionId(): string | undefined {
  const fromEnv = import.meta.env.VITE_EXTENSION_ID?.trim();
  if (fromEnv) return fromEnv;

  try {
    const fromUrl = new URLSearchParams(window.location.search).get("extensionId")?.trim();
    if (fromUrl) {
      localStorage.setItem(EXTENSION_ID_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
  } catch {
    // URL/localStorage may be unavailable in some contexts
  }

  try {
    const fromStorage = localStorage.getItem(EXTENSION_ID_STORAGE_KEY)?.trim();
    if (fromStorage) return fromStorage;
  } catch {
    // localStorage may be unavailable in some contexts
  }

  return undefined;
}

function sendExtensionMessage(type: ExtensionMessageType): Promise<FocusGuardResult> {
  return new Promise((resolve) => {
    const extensionId = resolveExtensionId();
    const runtime = window.chrome?.runtime;

    if (!extensionId) {
      logFocusGuardDebugOnce(
        "notConfigured",
        "extension ID is not configured (set VITE_EXTENSION_ID in .env or localStorage escape_orbit_extension_id)",
      );
      resolve({
        connected: false,
        ok: false,
        error: "Extension ID not configured",
      });
      return;
    }

    if (!runtime?.sendMessage) {
      logFocusGuardDebugOnce(
        "runtimeUnavailable",
        "chrome.runtime.sendMessage unavailable (Chrome extension API not present on this page)",
      );
      resolve({
        connected: false,
        ok: false,
        error: "chrome.runtime unavailable",
      });
      return;
    }

    try {
      runtime.sendMessage(extensionId, { type }, (response) => {
        const lastError = runtime.lastError;

        if (lastError?.message) {
          if (import.meta.env.DEV) {
            console.debug("[Escape Orbit] Focus Guard:", lastError.message);
          }
          resolve({
            connected: false,
            ok: false,
            error: lastError.message,
            response,
          });
          return;
        }

        resolve({
          connected: true,
          ok: Boolean(response?.ok ?? response?.focusMode ?? response?.blockingOn),
          response,
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (import.meta.env.DEV) {
        console.debug("[Escape Orbit] Focus Guard send failed:", message);
      }
      resolve({
        connected: false,
        ok: false,
        error: message,
      });
    }
  });
}

export async function enableFocusGuard(): Promise<FocusGuardResult> {
  return sendExtensionMessage("ENABLE_FOCUS_MODE");
}

export async function disableFocusGuard(): Promise<FocusGuardResult> {
  return sendExtensionMessage("DISABLE_FOCUS_MODE");
}

export function getFocusGuardNotice(result: FocusGuardResult): string | null {
  if (result.connected && result.ok) {
    return null;
  }
  return "Focus Guard extension not connected.";
}
