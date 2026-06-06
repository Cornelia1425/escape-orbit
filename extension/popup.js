const toggle = document.getElementById("focusToggle");
const status = document.getElementById("status");
const resetButton = document.getElementById("resetRules");

function renderStatus(focusMode, activeRules, ruleActionType) {
  const ruleCount = activeRules ?? 0;
  const blockingOn = Boolean(focusMode) && ruleCount > 0;

  toggle.checked = blockingOn;

  const actionHint = ruleActionType ? ` · ${ruleActionType}` : "";

  if (!blockingOn) {
    status.textContent = `Instagram blocking is OFF (${ruleCount} active rules)${actionHint}`;
    status.className = "status off";
    return;
  }

  status.textContent = `Instagram blocking is ON (${ruleCount} active rules)${actionHint}`;
  status.className = "status on";
}

function showError(message) {
  status.textContent = message;
  status.className = "status error";
}

function sendBackgroundMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        console.error("[Escape Orbit Focus popup] chrome.runtime.lastError:", lastError.message);
        reject(new Error(lastError.message));
        return;
      }
      if (!response) {
        reject(new Error("No response from background"));
        return;
      }
      if (response.ok === false) {
        reject(new Error(response.error ?? "Background returned ok:false"));
        return;
      }
      resolve(response);
    });
  });
}

function applyStatusResponse(response) {
  renderStatus(
    response.focusMode,
    response.activeRules,
    response.ruleActionType,
  );
}

async function refreshStatus() {
  try {
    const response = await sendBackgroundMessage({ type: "GET_STATUS" });
    applyStatusResponse(response);
  } catch (error) {
    showError(`Failed to load status: ${error.message}`);
    toggle.checked = false;
  }
}

toggle.addEventListener("change", async () => {
  const enabled = toggle.checked;
  status.textContent = enabled ? "Enabling…" : "Disabling…";
  status.className = "status";

  try {
    const response = await sendBackgroundMessage({
      type: "SET_FOCUS_MODE",
      enabled,
    });
    applyStatusResponse(response);
  } catch (error) {
    showError(`Toggle failed: ${error.message}`);
    await refreshStatus();
  }
});

resetButton.addEventListener("click", async () => {
  status.textContent = "Resetting rules…";
  status.className = "status";

  try {
    const response = await sendBackgroundMessage({ type: "RESET_RULES" });
    applyStatusResponse(response);
  } catch (error) {
    showError(`Reset failed: ${error.message}`);
    await refreshStatus();
  }
});

refreshStatus();
