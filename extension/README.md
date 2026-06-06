# Escape Orbit Focus — Chrome Extension

Manifest V3 extension that blocks **only** `instagram.com` and `www.instagram.com` during focus mode using **declarativeNetRequest** dynamic rules.

Blocked Instagram tabs redirect to Escape Orbit at:

`http://localhost:5174/?blocked=instagram`

Chrome blocks many direct HTTPS→HTTP redirects, so the extension first opens `blocked.html` (inside the extension), which immediately forwards to localhost.

## Permissions (minimal)

| Permission | Why |
|------------|-----|
| `storage` | Mirror the current DNR rule state for UI/content-script updates |
| `declarativeNetRequest` | Add/remove dynamic redirect rules |
| `*://instagram.com/*` | Required host access for Instagram rules |
| `*://www.instagram.com/*` | Required host access for Instagram rules |

No `<all_urls>` and no broad page access.

## Load unpacked (local install)

1. Start Escape Orbit locally (redirect target):
   ```bash
   npm run dev
   ```
   Note the Vite port (often **5173** or **5174**). If your app is not on **5174**, edit `ESCAPE_ORBIT_URL` in `blocked.js` to match.

2. Open Chrome and go to `chrome://extensions`

3. Enable **Developer mode** (top right)

4. Click **Load unpacked**

5. Select this folder:
   ```
   escape-orbit/extension
   ```

6. Pin the extension (puzzle icon → pin **Escape Orbit Focus**)

## Manual toggle (v1)

1. Click the extension icon
2. Toggle **Block Instagram** ON — popup should show **ON (1 active rule)**
3. Open a **new tab** (not a tab that already had Instagram open) → `https://www.instagram.com/`
4. You should briefly see “Redirecting…” then Escape Orbit with `?blocked=instagram`
5. Toggle OFF to unblock immediately

The popup reads `chrome.declarativeNetRequest.getDynamicRules()` as the source of truth. Install/startup default to OFF and clear old Escape Orbit rule IDs.

## Optional auto-link with Escape Orbit web app

The extension accepts external messages from:

- `http://localhost:5174/*`

Message types:

| Message | Effect |
|---------|--------|
| `{ type: "ENABLE_FOCUS_MODE" }` | Same as turning the popup toggle ON |
| `{ type: "DISABLE_FOCUS_MODE" }` | Same as turning the popup toggle OFF |

The web app sends these when a mission **launches** / **completes** / **fails**. If the extension is not installed or the extension ID is not configured, the app **continues normally**.

### Configure extension ID in the web app

1. After loading unpacked, copy the extension ID from `chrome://extensions`
2. Add to your `.env`:
   ```
   VITE_EXTENSION_ID=your_extension_id_here
   ```
3. Restart `npm run dev`

Or set it once in the browser console on the Escape Orbit tab:
```js
localStorage.setItem('escape_orbit_extension_id', 'your_extension_id_here')
```

### Manual toggle still works

The popup toggle and auto-link call the same enable/disable functions. Auto-link failures never break the game or the manual toggle.

## Files

```
extension/
├── manifest.json      # MV3 manifest
├── background.js      # DNR rules + external messages
├── popup.html/js/css  # Manual ON/OFF toggle
├── icons/             # Extension icons
└── README.md
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Redirect goes to wrong port | Edit `REDIRECT_URL` in `background.js`, reload extension |
| Auto-link does nothing | Confirm `VITE_EXTENSION_ID`, app origin is `localhost:5174`, reload extension after manifest changes |
| Rule not applied | Toggle off/on; open service worker console for rule logs; confirm `declarativeNetRequestWithHostAccess` permission |
| Instagram stays blocked | Click **Reset Focus Guard**, then reload the extension if needed |
| Instagram still loads | Confirm Focus Mode is ON; use a **fresh tab** at `https://www.instagram.com/` |

## Verify rules in Chrome

1. `chrome://extensions` → Escape Orbit Focus → **Details**
2. Open **Inspect views: service worker**
3. In console:
   ```js
   chrome.declarativeNetRequest.getDynamicRules(console.log)
   chrome.storage.local.get('focusMode', console.log)
   ```
