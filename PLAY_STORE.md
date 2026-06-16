# Google Play Release Guide

This guide covers the Android release path for Track Anything.

## Builds

| Build | Runtime | Play Store |
| --- | --- | --- |
| `python main.py` | React UI plus Python API on desktop | No |
| `dist/TrackAnything.exe` | Windows desktop executable | No |
| `npm run mobile:build` | Capacitor Android app with on-device storage | Yes |

The Play Store build stores user-created tracker data on the device. It does
not bundle the Python API server.

## Automated Tests

Run before every release:

```powershell
.\scripts\run_all_tests.ps1
```

Separate commands:

```powershell
python -m pytest tests/ -v
cd frontend
npm test
```

## Manual Test Matrix

Test at least one physical Android phone and representative emulators:

| Device | Purpose |
| --- | --- |
| Current Pixel phone | Main phone layout |
| Small phone | Narrow viewport |
| Foldable or tablet | Large layout |
| Older supported API level | Compatibility |

Verify:

- Add an entry with a name, date, labels, values, and notes
- History rows render correctly
- Edit and delete flows work
- Charts load for tracked names
- Profiles can switch, rename, and delete
- Data remains after force close and reopen
- Portrait and landscape have no clipped controls
- Optional tips dialog opens without locking app features

## Android App Bundle

Prerequisites:

- Android Studio
- JDK 17 or newer
- Node.js 18 or newer

Build:

```powershell
npm install
cd frontend
npm install
cd ..
npm run mobile:build
npx cap open android
```

In Android Studio, use **Build > Generate Signed Bundle / APK** and choose
Android App Bundle.

## Play Console Checklist

- App name: Track Anything
- Package name: `com.trackanything.app`
- Category: Productivity
- Pricing: Free
- Optional in-app products: tips only; no locked features
- Privacy policy URL: GitHub Pages policy URL once public
- Data safety: no collected or shared required data types, if tracker data stays
  on device only
- Target audience: adult or teen/adult audience only unless the app is redesigned
  for children and Families policy compliance
- Financial features: no financial features
- Health features: no health features if the listing presents the app as a
  general-purpose tracker

## Tester Instructions

```text
Track Anything logs custom metrics. Create a profile, add a tracked name,
enter labels and values, save the entry, then check History and Charts. No login
is required. Data stays on the device. Optional tips do not unlock features.
```

## Release Notes

- Increment `android/app/build.gradle` `versionCode` for every upload.
- Update `versionName` for user-visible releases.
- Upload to Internal testing first, then Closed testing, then Production.
