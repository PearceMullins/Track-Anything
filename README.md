# Track Anything

A modern React app to log anything you want to track and view progress over time with charts.

## Stack

- **Frontend:** React + TypeScript + Vite + Recharts
- **Backend:** Python FastAPI (reuses your existing `workout_data.json` storage)

## Setup

```bash
pip install -r requirements.txt
cd frontend
npm install
```

## Development

Run in two terminals:

```bash
# Terminal 1 — API on :8000
python main.py --dev-frontend

# Terminal 2 — React dev server on :5173 (proxies /api to backend)
cd frontend && npm run dev
```

Open http://localhost:5173

## Production (single app)

```bash
cd frontend && npm run build
cd ..
python main.py
```

Opens http://127.0.0.1:8000 with the built React UI and API.

## Data

Entries are saved to `workout_data.json` next to the app (same format as before — your existing data still works).

## Legacy desktop UI

The original Tkinter UI files (`app.py`, `entry_panel.py`, etc.) remain in the repo but are no longer the default. Use the React app above.

## Build desktop executable

After `npm run build` in `frontend/`:

```bash
pip install pyinstaller
python build_exe.py
```

Produces `dist/TrackAnything.exe` (packages the API; build the frontend first).

## Android / Google Play

The mobile build uses **Capacitor** with on-device storage (no Python on the phone).

```bash
npm install          # root — Capacitor CLI
cd frontend && npm install && cd ..
npx cap add android  # first time only
npm run mobile:build
npx cap open android # build signed AAB in Android Studio
```

See **[PLAY_STORE.md](PLAY_STORE.md)** for the full testing matrix, beta tracks, and Play Console checklist.

## Privacy Policy

GitHub Pages-ready policy: `docs/privacy-policy/index.html`

After this repo is public and Pages is enabled from `main` / `docs`, use:

```text
https://pearcemullins.github.io/Track-Anything/privacy-policy/
```

### Run all automated tests

```powershell
.\scripts\run_all_tests.ps1
```
