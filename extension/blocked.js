const ESCAPE_ORBIT_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? `http://${window.location.hostname}:5175/`
  : "https://escape-orbit.vercel.app/";

const url = new URL(ESCAPE_ORBIT_URL);
url.searchParams.set("blocked", "instagram");
url.searchParams.set("extensionId", chrome.runtime.id);

window.location.replace(url.toString());
