const INSTAGRAM_RULE_ID = 1;
const ESCAPE_ORBIT_RULE_IDS = [1, 2, 3, 99, 100];
const STORAGE_KEY = "focusMode";
const SOURCE_KEY = "focusSource";
const MISSION_LEASE_UNTIL_KEY = "missionFocusLeaseUntil";
const MISSION_LEASE_MS = 45_000;
const BLOCKED_PAGE = "/blocked.html";
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
const ESCAPE_ORBIT_TAB_URLS = [
  "http://localhost:5173/*",
  "http://localhost:5174/*",
  "http://localhost:5175/*",
  "http://127.0.0.1:5173/*",
  "http://127.0.0.1:5174/*",
  "http://127.0.0.1:5175/*",
  "https://escape-orbit.vercel.app/*",
];

const pendingRedirects = new Set();

function isInstagramHost(hostname) {
  return INSTAGRAM_HOSTS.has(hostname);
}

function isInstagramUrl(urlString) {
  try {
    return isInstagramHost(new URL(urlString).hostname);
  } catch {
    return false;
  }
}

function buildInstagramRule() {
  return {
    id: INSTAGRAM_RULE_ID,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        extensionPath: BLOCKED_PAGE,
      },
    },
    condition: {
      requestDomains: ["instagram.com", "www.instagram.com"],
      resourceTypes: ["main_frame"],
    },
  };
}

function logLastError(context) {
  const err = chrome.runtime.lastError;
  if (err) {
    console.error(`[Escape Orbit Focus] ${context} — chrome.runtime.lastError:`, err.message);
  }
  return err?.message ?? null;
}

function hasInstagramRule(rules) {
  return Array.isArray(rules) && rules.some((rule) => rule.id === INSTAGRAM_RULE_ID);
}

function isInstagramRule(rule) {
  const domains = rule?.condition?.requestDomains ?? rule?.condition?.domains ?? [];
  return domains.some((domain) => INSTAGRAM_HOSTS.has(domain));
}

async function getDynamicRulesSafe() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  logLastError("getDynamicRules");
  return Array.isArray(rules) ? rules : [];
}

async function updateDynamicRulesSafe(updateOptions, context) {
  await chrome.declarativeNetRequest.updateDynamicRules(updateOptions);
  const lastError = logLastError(context);
  if (lastError) {
    throw new Error(lastError);
  }
}

async function isEscapeOrbitAppOpen() {
  const tabs = await chrome.tabs.query({ url: ESCAPE_ORBIT_TAB_URLS });
  return tabs.length > 0;
}

async function syncBlockingStorage(hasRule) {
  await chrome.storage.local.set({ [STORAGE_KEY]: hasRule });
}

function updateFocusBadge(enabled) {
  if (enabled) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#5577ff" });
    chrome.action.setTitle("Escape Orbit Focus — Instagram blocked");
    return;
  }

  chrome.action.setBadgeText({ text: "" });
  chrome.action.setTitle("Escape Orbit Focus");
}

async function clearEscapeOrbitRules(context) {
  const rules = await getDynamicRulesSafe();
  const instagramRuleIds = rules
    .filter(isInstagramRule)
    .map((rule) => rule.id);
  const removeRuleIds = [...new Set([...ESCAPE_ORBIT_RULE_IDS, ...instagramRuleIds])];

  await updateDynamicRulesSafe(
    { removeRuleIds },
    context,
  );
}

async function getBlockingState() {
  let rules = await getDynamicRulesSafe();
  let hasRule = hasInstagramRule(rules);
  const storage = await chrome.storage.local.get([
    STORAGE_KEY,
    SOURCE_KEY,
    MISSION_LEASE_UNTIL_KEY,
  ]);

  if (!hasRule && Boolean(storage[STORAGE_KEY])) {
    await chrome.storage.local.set({ [STORAGE_KEY]: false, [SOURCE_KEY]: null });
    storage[STORAGE_KEY] = false;
    storage[SOURCE_KEY] = null;
  }

  if (hasRule && storage[SOURCE_KEY] === "mission" && !(await isEscapeOrbitAppOpen())) {
    console.log("[Escape Orbit Focus] Escape Orbit tab closed — disabling mission focus guard");
    await disableFocusMode();
    hasRule = false;
  }

  if (
    hasRule &&
    storage[SOURCE_KEY] === "mission" &&
    Number(storage[MISSION_LEASE_UNTIL_KEY] ?? 0) < Date.now()
  ) {
    console.log("[Escape Orbit Focus] Mission focus lease expired — disabling focus guard");
    await disableFocusMode();
    hasRule = false;
  }

  if (Boolean(storage[STORAGE_KEY]) !== hasRule) {
    await syncBlockingStorage(hasRule);
  }

  return { blocking: hasRule };
}

async function redirectInstagramTab(tabId) {
  if (pendingRedirects.has(tabId)) {
    return;
  }

  pendingRedirects.add(tabId);
  try {
    await chrome.tabs.update(tabId, { url: chrome.runtime.getURL(BLOCKED_PAGE) });
  } finally {
    setTimeout(() => pendingRedirects.delete(tabId), 750);
  }
}

async function redirectAllInstagramTabs() {
  const { blocking } = await getBlockingState();
  if (!blocking) {
    return;
  }

  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map(async (tab) => {
      if (!tab.id || !tab.url || !isInstagramUrl(tab.url)) {
        return;
      }
      await redirectInstagramTab(tab.id);
    }),
  );
}

async function handleInstagramTabUpdate(tabId, changeInfo, tab) {
  const url = changeInfo.url ?? tab.url;
  if (!url || !isInstagramUrl(url)) {
    return;
  }

  if (changeInfo.status !== "loading" && !changeInfo.url) {
    return;
  }

  const { blocking } = await getBlockingState();
  if (!blocking) {
    return;
  }

  await redirectInstagramTab(tabId);
}

async function handleInstagramNavigation(details, source) {
  if (details.frameId !== 0 || !isInstagramUrl(details.url)) {
    return;
  }

  const { blocking } = await getBlockingState();
  if (!blocking) {
    return;
  }

  console.log(`[Escape Orbit Focus] navigation guard (${source}):`, details.url);
  await redirectInstagramTab(details.tabId);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  handleInstagramTabUpdate(tabId, changeInfo, tab).catch((error) => {
    console.error("[Escape Orbit Focus] tabs.onUpdated failed:", error);
  });
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  handleInstagramNavigation(details, "onBeforeNavigate").catch((error) => {
    console.error("[Escape Orbit Focus] onBeforeNavigate failed:", error);
  });
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  handleInstagramNavigation(details, "onHistoryStateUpdated").catch((error) => {
    console.error("[Escape Orbit Focus] onHistoryStateUpdated failed:", error);
  });
});

async function buildStatusPayload() {
  const { blocking: hasRule } = await getBlockingState();
  const rules = await getDynamicRulesSafe();
  const activeRule = rules.find((rule) => rule.id === INSTAGRAM_RULE_ID);
  const storage = await chrome.storage.local.get(SOURCE_KEY);

  return {
    ok: true,
    focusMode: hasRule,
    blockingOn: hasRule,
    activeRules: rules.length,
    ruleCount: rules.length,
    storageFocusMode: hasRule,
    focusSource: storage[SOURCE_KEY] ?? null,
    ruleActionType: activeRule?.action?.type ?? null,
  };
}

async function enableFocusMode(source = "manual") {
  const rule = buildInstagramRule();
  console.log("[Escape Orbit Focus] enableFocusMode()", { source, rule });

  await clearEscapeOrbitRules("enableFocusMode.clearEscapeOrbitRules");

  await updateDynamicRulesSafe(
    {
      addRules: [rule],
    },
    "enableFocusMode.updateDynamicRules",
  );

  const rules = await getDynamicRulesSafe();
  console.log("[Escape Orbit Focus] after enable — getDynamicRules():", rules);

  if (!hasInstagramRule(rules)) {
    await chrome.storage.local.set({ [STORAGE_KEY]: false, [SOURCE_KEY]: null });
    throw new Error(`INSTAGRAM_RULE_ID ${INSTAGRAM_RULE_ID} missing after updateDynamicRules`);
  }

  await chrome.storage.local.set({
    [STORAGE_KEY]: true,
    [SOURCE_KEY]: source,
    [MISSION_LEASE_UNTIL_KEY]: source === "mission" ? Date.now() + MISSION_LEASE_MS : null,
  });
  await redirectAllInstagramTabs();
  updateFocusBadge(true);
}

async function disableFocusMode() {
  console.log("[Escape Orbit Focus] disableFocusMode()");

  await clearEscapeOrbitRules("disableFocusMode.clearEscapeOrbitRules");
  await chrome.storage.local.set({
    [STORAGE_KEY]: false,
    [SOURCE_KEY]: null,
    [MISSION_LEASE_UNTIL_KEY]: null,
  });
  updateFocusBadge(false);

  const rules = await getDynamicRulesSafe();
  console.log("[Escape Orbit Focus] after disable — getDynamicRules():", rules);

  const activeInstagramRules = rules.filter(isInstagramRule);
  if (activeInstagramRules.length > 0) {
    throw new Error(`Expected 0 active Instagram rules, found ${activeInstagramRules.length}`);
  }
}

async function handleMessage(message) {
  const type = message?.type;

  if (type === "SHOULD_BLOCK") {
    const { blocking } = await getBlockingState();
    return {
      ok: true,
      blocking,
    };
  }

  if (type === "GET_STATUS") {
    const status = await buildStatusPayload();
    if (status.focusMode) {
      await redirectAllInstagramTabs();
    }
    return status;
  }

  if (type === "SET_FOCUS_MODE") {
    if (message.enabled) {
      await enableFocusMode("manual");
    } else {
      await disableFocusMode();
    }

    const rules = await getDynamicRulesSafe();
    const hasRule = hasInstagramRule(rules);

    if (message.enabled && !hasRule) {
      return {
        ok: false,
        focusMode: false,
        blockingOn: false,
        activeRules: rules.length,
        ruleCount: rules.length,
        error: "Rule was not added",
      };
    }

    const status = await buildStatusPayload();
    return { ...status, error: null };
  }

  if (type === "ENABLE_FOCUS_MODE") {
    await enableFocusMode("mission");

    const rules = await getDynamicRulesSafe();
    const hasRule = hasInstagramRule(rules);

    return {
      ...(await buildStatusPayload()),
      ok: hasRule,
      focusMode: hasRule,
      blockingOn: hasRule,
      error: hasRule ? null : "Rule was not added",
    };
  }

  if (type === "DISABLE_FOCUS_MODE") {
    await disableFocusMode();
    return buildStatusPayload();
  }

  if (type === "RESET_RULES") {
    await disableFocusMode();
    return buildStatusPayload();
  }

  return {
    ok: false,
    error: `Unknown message type: ${type}`,
  };
}

function installMessageListener(listener, label) {
  listener.addListener((message, sender, sendResponse) => {
    if (label === "external") {
      console.log("[Escape Orbit Focus] external message:", message?.type, "from:", sender?.url);
    }

    (async () => {
      try {
        const response = await handleMessage(message);
        sendResponse(response);
      } catch (error) {
        console.error(`[Escape Orbit Focus] ${label} handler error:`, error);
        sendResponse({
          ok: false,
          focusMode: false,
          blockingOn: false,
          activeRules: 0,
          ruleCount: 0,
          error: String(error?.message || error),
        });
      }
    })();

    return true;
  });
}

installMessageListener(chrome.runtime.onMessage, "internal");
installMessageListener(chrome.runtime.onMessageExternal, "external");

async function syncFocusModeFromStorage() {
  await disableFocusMode();
}

async function resetFocusModeOnLifecycleEvent() {
  await disableFocusMode();
}

async function disableMissionFocusIfAppClosed() {
  const storage = await chrome.storage.local.get(SOURCE_KEY);
  if (storage[SOURCE_KEY] !== "mission") {
    return;
  }

  if (await isEscapeOrbitAppOpen()) {
    return;
  }

  console.log("[Escape Orbit Focus] Escape Orbit tab closed — disabling mission focus guard");
  await disableFocusMode();
}

chrome.runtime.onInstalled.addListener(() => {
  resetFocusModeOnLifecycleEvent().catch((error) => {
    console.error("[Escape Orbit Focus] onInstalled init failed:", error);
  });
});

chrome.runtime.onStartup.addListener(() => {
  resetFocusModeOnLifecycleEvent().catch((error) => {
    console.error("[Escape Orbit Focus] onStartup init failed:", error);
  });
});

chrome.tabs.onRemoved.addListener(() => {
  disableMissionFocusIfAppClosed().catch((error) => {
    console.error("[Escape Orbit Focus] tabs.onRemoved cleanup failed:", error);
  });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.status !== "complete") {
    return;
  }

  disableMissionFocusIfAppClosed().catch((error) => {
    console.error("[Escape Orbit Focus] tabs.onUpdated cleanup failed:", error);
  });
});

syncFocusModeFromStorage().catch((error) => {
  console.error("[Escape Orbit Focus] service worker init failed:", error);
});
