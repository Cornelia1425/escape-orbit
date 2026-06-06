/** Paste your extension ID from chrome://extensions after Load unpacked. */
export const ESCAPE_ORBIT_EXTENSION_ID = "PASTE_EXTENSION_ID_HERE";

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

function isExtensionConfigured(): boolean {
  return (
    ESCAPE_ORBIT_EXTENSION_ID.length > 0 &&
    ESCAPE_ORBIT_EXTENSION_ID !== "PASTE_EXTENSION_ID_HERE"
  );
}

function sendExtensionMessage(type: ExtensionMessageType): Promise<FocusGuardResult> {
  return new Promise((resolve) => {
    const runtime = window.chrome?.runtime;

    if (!isExtensionConfigured()) {
      console.warn("[Escape Orbit] Focus Guard: extension ID is not configured");
      resolve({
        connected: false,
        ok: false,
        error: "Extension ID not configured",
      });
      return;
    }

    if (!runtime?.sendMessage) {
      console.warn("[Escape Orbit] Focus Guard: chrome.runtime.sendMessage unavailable");
      resolve({
        connected: false,
        ok: false,
        error: "chrome.runtime unavailable",
      });
      return;
    }

    console.log(`Sending ${type} to extension`);

    try {
      runtime.sendMessage(ESCAPE_ORBIT_EXTENSION_ID, { type }, (response) => {
        const lastError = runtime.lastError;

        if (lastError?.message) {
          console.error("[Escape Orbit] chrome.runtime.lastError:", lastError.message);
          resolve({
            connected: false,
            ok: false,
            error: lastError.message,
            response,
          });
          return;
        }

        console.log("[Escape Orbit] extension response:", response);
        resolve({
          connected: true,
          ok: Boolean(response?.ok ?? response?.focusMode ?? response?.blockingOn),
          response,
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[Escape Orbit] Focus Guard send failed:", message);
      resolve({
        connected: false,
        ok: false,
        error: message,
      });
    }
  });
}

export async function enableFocusGuard(): Promise<FocusGuardResult> {
  console.log("Sending ENABLE_FOCUS_MODE to extension");
  return sendExtensionMessage("ENABLE_FOCUS_MODE");
}

export async function disableFocusGuard(): Promise<FocusGuardResult> {
  console.log("Sending DISABLE_FOCUS_MODE to extension");
  return sendExtensionMessage("DISABLE_FOCUS_MODE");
}

export function getFocusGuardNotice(result: FocusGuardResult): string | null {
  if (result.connected && result.ok) {
    return null;
  }
  return "Focus Guard extension not connected.";
}
