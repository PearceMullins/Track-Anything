# Google Play Store — Testing & Release Guide

This guide covers everything needed to test **Track Anything** and publish it on Google Play.

## Important: Desktop vs Android

| Build | How it runs | Play Store? |
|-------|-------------|-------------|
| `python main.py` | React UI + Python API on your PC | No |
| `TrackAnything.exe` | Windows desktop only | No |
| **Capacitor Android** (`npm run mobile:build`) | React UI + **local storage on device** | **Yes** |

The Play Store build stores data **on the phone** (same JSON shape as `workout_data.json`). It does not bundle the Python server.

---

## 1. Automated tests (run before every release)

### Backend (Python)

```powershell
cd "c:\Fitness Tracker"
pip install -r requirements.txt
python -m pytest tests/ -v
```

### Frontend (TypeScript)

```powershell
cd frontend
npm install
npm test
```

### One-shot script

```powershell
.\scripts\run_all_tests.ps1
```

---

## 2. Manual test matrix (devices & orientations)

Use **Android Studio emulators** and at least one **physical phone** before beta upload.

### Emulator profiles

| Profile | Purpose |
|---------|---------|
| Pixel 8 (API 35) | Current flagship phone |
| Pixel Fold (API 35) | Large / foldable layout |
| Small phone (API 24) | Older OS floor |
| 10" tablet API 34 | Tablet layout |

### What to verify

**Log Entry:** add entry, MM/DD/YYYY dates, dropdowns, save to history.

**History:** one row per entry, stacked labels/values, scroll, edit, delete, totals.

**Charts:** loads per name, tooltips, empty state.

**Orientation:** portrait and landscape — no clipped controls.

**Persistence:** force-close and reopen — data remains.

---

## 3. Build the Android app (AAB)

### Prerequisites

1. [Android Studio](https://developer.android.com/studio)
2. JDK 17+
3. Node.js 18+

### First-time setup

```powershell
cd "c:\Fitness Tracker"
npm install
cd frontend && npm install && cd ..
npx cap add android
```

### Release build

```powershell
npm run mobile:build
npx cap open android
```

In Android Studio: **Build → Generate Signed Bundle / APK** → **AAB** → release.

---

## 4. Google Play Console beta tracks

1. Create [Play Console](https://play.google.com/console) account ($25 one-time).
2. **Create app** → Track Anything.
3. Complete store listing: icon 512×512, feature graphic 1024×500, screenshots, descriptions.
4. **Privacy policy URL** (required): state data stays on device only.
5. Content rating + Data safety (no collection / on-device only).
6. Upload AAB to **Internal testing** first, then **Closed testing**, then **Production** with staged rollout.

### Tester instructions

```
Track Anything logs custom metrics. Open Log Entry, enter name, label, and value.
Save and check History and Charts. No login. Data stays on your device.
```

---

## 5. Pre-submission checklist

- [ ] Automated tests pass
- [ ] Manual matrix on phone + emulator
- [ ] No crashes on cold start
- [ ] Privacy policy URL live
- [ ] Screenshots match UI
- [ ] Signed release AAB
- [ ] Increment `versionCode` each upload

---

## Quick commands

```powershell
.\scripts\run_all_tests.ps1
npm run mobile:build
npx cap open android
```
