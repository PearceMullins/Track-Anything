<p align="center">
  <a href="https://patreon.com/TrackAnything?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink">
    <img src="https://img.shields.io/badge/Patreon-FF424D?style=for-the-badge&logo=patreon&logoColor=white" alt="Patreon" />
  </a>
</p>

<p align="center">
  <a href="README.md"><strong>README</strong></a>
  ·
  <a href="CONTRIBUTING.md">Contributing</a>
  ·
  <a href="LICENSE">MIT license</a>
  ·
  <a href="PRIVACY.md">Privacy</a>
  ·
  <a href="SECURITY.md">Security</a>
</p>

<p align="center">
  <img src="assets/app.ico" width="96" height="96" alt="Track Anything icon" />
</p>

<h1 align="center">Track Anything</h1>

<p align="center">
  A local-first app to log custom metrics, review history, and chart progress over time.
</p>

<p align="center">
  <a href="https://github.com/PearceMullins/Track-Anything/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/PearceMullins/Track-Anything/ci.yml?branch=main&label=CI" alt="CI status" /></a>
  <a href="https://github.com/PearceMullins/Track-Anything/releases"><img src="https://img.shields.io/github/v/release/PearceMullins/Track-Anything?label=release" alt="Latest release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="PRIVACY.md"><img src="https://img.shields.io/badge/policy-privacy-2d6a4f?style=flat-square" alt="Privacy Policy" /></a>
</p>

---

## Closed Alpha Testing

Help test the app! Join here:

- [Join on Web](https://play.google.com/apps/testing/com.trackanything.app)
- [Join on Android](https://play.google.com/store/apps/details?id=com.trackanything.app)

Please stay opted in for at least 14 days to help us meet Google's requirements.

Thank you!

Track Anything is a lightweight tracker for anything you want to measure. Create
profiles, name what you are tracking, add labeled values, review history, and
view charts — all without an account.

The app is intentionally general-purpose. The same flow works for cooking,
study, chores, projects, habits, practice sessions, or any repeated activity you
want to measure.

## Downloads

| Platform | How to get it |
| --- | --- |
| **Windows** | Download [`TrackAnything.exe`](https://github.com/PearceMullins/Track-Anything/releases/latest) from GitHub Releases |
| **Android** | Built with Capacitor; see [Play Store guide](PLAY_STORE.md) for packaging and testing |
| **iPhone/iPad** | Built with Capacitor; see [App Store guide](APP_STORE.md) for packaging and testing |

The Windows executable bundles the React UI and a local Python API. Your data is
saved to `track_anything_data.json` next to the app.

## Features

- **Profiles** — separate tracking spaces (work, home, hobbies, and more)
- **Flexible entries** — custom names, notes, and any number of inputs per log
- **History** — edit, delete, and review past entries
- **Charts** — progress over time for any tracked name
- **Custom equations** — the log form *is* the equation. Choose **Build an equation**
  to pick an operator (add, subtract, multiply, divide, power, remainder) and how many
  inputs you want, then type the numbers; or choose **Custom expression** and type the
  whole equation with its numbers, e.g. `(3 + 5) * 2` or `avg(3, 4)`, using parentheses,
  functions (`avg`, `min`, `max`, `round`, `sqrt`, …) and constants (`pi`, `e`). The
  entry is saved as the expression you see and charts the result. Each named thing
  keeps its own equation, so it is pre-filled the next time you log it
- **Local-first** — data stays on your device; no login required
- **Android and iOS builds** — Capacitor apps with on-device storage
- **Optional tips** — Google Play donations only; no locked features

## Screenshots

_Desktop and mobile UI screenshots can be added here before the repository is made public._

## Quick start (development)

**Requirements:** Python 3.11+, Node.js 18+, npm

```powershell
git clone https://github.com/PearceMullins/Track-Anything.git
cd Track-Anything
pip install -r requirements.txt
cd frontend
npm install
```

Run in two terminals:

```powershell
# Terminal 1 — API on :8000
python main.py --dev-frontend

# Terminal 2 — React dev server on :5173
cd frontend
npm run dev
```

Open `http://localhost:5173`.

### Production mode (single server)

```powershell
cd frontend
npm run build
cd ..
python main.py
```

Opens `http://127.0.0.1:8000` with the built UI and API.

### One-click launcher (Windows)

After cloning, just run the launcher — it installs what is missing, rebuilds the UI
whenever the source is newer than the build, starts the server, and opens your browser:

```bat
run.bat            :: run the app at http://127.0.0.1:8000 (rebuilds if needed)
run.bat rebuild    :: force a UI rebuild first
run.bat dev        :: API + hot-reload dev server in two windows
```

You can also double-click `run.bat` in File Explorer. It serves the built UI, so after
a UI change just refresh the browser tab; after a Python/API change, close the window
and start `run.bat` again.

## Build Windows executable

```powershell
.\scripts\build_release.ps1
```

Output: `dist/TrackAnything.exe` (uses `assets/Track Anything Icon.ico`).

## Mobile builds

The Android and iOS apps use Capacitor and store data on the device. They do not
run the Python API on phones.

```powershell
npm install
cd frontend
npm install
cd ..
npm run mobile:build
npx cap open android
npx cap open ios
```

Build a signed Android App Bundle in Android Studio. Build a signed iOS archive
in Xcode on macOS. See **[PLAY_STORE.md](PLAY_STORE.md)** and
**[APP_STORE.md](APP_STORE.md)** for full release checklists.

## Project layout

```text
frontend/              React + TypeScript + Vite UI
android/               Capacitor Android project
ios/                   Capacitor iOS project
docs/privacy-policy/   GitHub Pages privacy policy
tests/                 Python API and model tests
scripts/               Test and release helper scripts
assets/                App icon (used for the Windows .exe)
```

Legacy Tkinter files (`app.py`, `entry_panel.py`, etc.) remain for reference.
The maintained interface is the React app.

## Documentation

| Document | Description |
| --- | --- |
| [PLAY_STORE.md](PLAY_STORE.md) | Google Play testing and release steps |
| [APP_STORE.md](APP_STORE.md) | Apple App Store testing and release steps |
| [DONATIONS.md](DONATIONS.md) | Optional store tip product IDs |
| [Privacy policy](PRIVACY.md) | On-device data and billing disclosure |
| [SECURITY.md](SECURITY.md) | How to report security issues |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development and pull request guidelines |

### Privacy policy URL

Use one of these URLs in Google Play Console, App Store Connect, and other listings:

| When | URL |
| --- | --- |
| **Now (private repo)** | `https://github.com/PearceMullins/Track-Anything/blob/main/PRIVACY.md` |
| **After the repo is public** | `https://pearcemullins.github.io/Track-Anything/privacy-policy/` |

GitHub Pages requires a **public** repository on the free plan. The
[PRIVACY.md](PRIVACY.md) file at the repository root contains the full policy with
the same header style as this README. Use the **Privacy** link in the navigation
row at the top of `README.md` and `PRIVACY.md`, or open `PRIVACY.md` directly
from the file list.

## Tests

```powershell
.\scripts\run_all_tests.ps1
```

Or run separately:

```powershell
python -m pytest tests/ -v
cd frontend
npm test
```

## Data and privacy

- Desktop data is saved to `track_anything_data.json` next to the app.
- Android and iOS data is saved locally on the device.
- No account is required.
- Tracker data is not uploaded to developer servers.
- Optional tips on Android and iOS are handled by native store billing.

## License

This project is licensed under the [MIT License](LICENSE).
