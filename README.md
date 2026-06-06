# Escape Orbit

Multiplayer focus game: launch a mission, escape the black hole, and see other pilots flying in real time via [SpacetimeDB](https://spacetimedb.com/).

## Prerequisites

- **Node.js** 18+ (22+ recommended)
- **Rust** stable (1.93+ for SpacetimeDB 2.4 module builds)
- **SpacetimeDB CLI** 2.4+ — install: `curl -sSf https://install.spacetimedb.com | bash`
- Add CLI to PATH: `export PATH="$HOME/.local/bin:$PATH"`

## Project layout

```
escape-orbit/
├── spacetimedb/           # Rust SpacetimeDB module (tables + reducers)
├── extension/             # Chrome MV3 extension (Instagram focus block)
├── src/module_bindings/   # Generated TypeScript client bindings
├── src/spacetime/         # DB hook + mission helpers
└── src/components/        # React + Three.js UI
```

## First-time setup

```bash
cd escape-orbit
npm install
```

Ensure Rust stable is active when building the module:

```bash
rustup default stable
rustup target add wasm32-unknown-unknown
```

## Run locally (two-terminal workflow)

### Terminal 1 — SpacetimeDB server

```bash
export PATH="$HOME/.local/bin:$PATH"
npm run spacetime:start
```

Leave this running. The server listens on **http://127.0.0.1:3000**.

### Terminal 2 — publish module + frontend

```bash
export PATH="$HOME/.local/bin:$PATH"
export RUSTUP_TOOLCHAIN=stable

# Build and publish the module to local dev database
npm run spacetime:publish

# Regenerate TS bindings after module changes
npm run spacetime:generate

# Start the Vite dev server
npm run dev
```

Open **http://localhost:5173** (or the port Vite prints).

Optional env overrides (copy `.env.example` → `.env`):

```
VITE_SPACETIMEDB_URI=ws://127.0.0.1:3000
VITE_SPACETIMEDB_DATABASE=escapeorbitdev
```

## Demo: two-browser multiplayer

1. Open the app in **two browser windows** (or one normal + one incognito).
2. Enter **different pilot names** on the landing screen and click **Enter Universe**.
3. In each window, launch a **30 sec** demo mission with a different task.
4. Each window should show **both ships** moving in the scene.
5. When a timer ends, click **Completed** or **Failed** in that window only.
6. The other window should update instantly (ship disappears / event feed updates).

## SpacetimeDB backend

### Tables

| Table | Purpose |
|-------|---------|
| `player` | Identity + display name + `last_seen` |
| `mission` | Active/completed missions |
| `event_log` | Shared signal feed |

### Reducers

| Reducer | Purpose |
|---------|---------|
| `join_world(name)` | Register/update pilot name |
| `start_mission(task_text, duration_seconds)` | Launch a flying mission |
| `complete_mission(mission_id)` | Owner marks mission complete |
| `fail_mission(mission_id)` | Owner marks mission failed |
| `heartbeat()` | Refresh `last_seen` (called every 30s from client) |

Ship positions are **not** stored in the database. Clients derive progress from `started_at` and `duration_seconds`.

## Useful commands

```bash
# Rebuild module only
npm run spacetime:build

# Inspect tables via CLI (--no-config avoids the root spacetime.json database name)
spacetime sql --no-config -s local escapeorbitdev "SELECT * FROM player"
spacetime sql --no-config -s local escapeorbitdev "SELECT * FROM mission"
spacetime sql --no-config -s local escapeorbitdev "SELECT * FROM event_log ORDER BY id DESC LIMIT 10"

# Call a reducer manually
spacetime call --no-config -s local escapeorbitdev join_world '"Alice"'

# Module logs
spacetime logs escapeorbitdev
```

## After changing the Rust module

```bash
export RUSTUP_TOOLCHAIN=stable
npm run spacetime:publish
npm run spacetime:generate
```

Then restart or refresh the frontend.

## Chrome extension (Instagram focus block)

Load the MV3 extension from `extension/` via **Load unpacked** in `chrome://extensions`. See [extension/README.md](extension/README.md) for setup, manual toggle, and optional auto-link via `VITE_EXTENSION_ID`.

## Offline fallback

If SpacetimeDB is not running, the landing screen shows a connection error. The 3D scene falls back to **fake ships** when not connected to the database.
