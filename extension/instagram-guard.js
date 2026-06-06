const BLOCKED_PAGE = "/blocked.html";

const blockedUrl = chrome.runtime.getURL(BLOCKED_PAGE);
const root = document.documentElement;

function redirectNow() {
  if (window.location.href.startsWith(blockedUrl)) {
    return;
  }
  window.location.replace(blockedUrl);
}

function applyBlocking(blocking) {
  if (!blocking) {
    root.style.visibility = "";
    return;
  }
  redirectNow();
}

function queryBlockingState() {
  root.style.visibility = "hidden";

  chrome.runtime.sendMessage({ type: "SHOULD_BLOCK" }, (response) => {
    if (chrome.runtime.lastError) {
      root.style.visibility = "";
      return;
    }
    applyBlocking(Boolean(response?.blocking));
  });
}

queryBlockingState();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") {
    return;
  }

  if (changes.focusMode !== undefined) {
    queryBlockingState();
  }
});
