# Apple App Store Release Guide

This guide covers the iOS release path for Track Anything.

## Build Target

| Build | Runtime | App Store |
| --- | --- | --- |
| `npm run mobile:build:ios` | Capacitor iOS app with on-device storage | Yes |

The iOS app stores user-created tracker data on the device. It does not bundle
the Python API server.

## Current Requirements

- Bundle ID: `com.trackanything.app`
- iOS deployment target: 15.0
- App Store uploads since April 28, 2026 require Xcode 26 or later with the iOS
  26 SDK or later.
- `ios/App/App/PrivacyInfo.xcprivacy` is included for the Capacitor Filesystem
  plugin required-reason API declaration.
- iOS native builds require macOS, Xcode, CocoaPods, and an Apple Developer
  Program account.

References:

- Apple SDK minimum requirements: <https://developer.apple.com/news/upcoming-requirements/>
- App Store submission guidance: <https://developer.apple.com/app-store/submitting/>
- Capacitor iOS setup: <https://capacitorjs.com/docs/ios>
- Capacitor privacy manifest guidance: <https://capacitorjs.com/docs/ios/privacy-manifest>

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
npm run build:mobile
```

## Manual Test Matrix

Test at least one physical iPhone and representative simulators:

| Device | Purpose |
| --- | --- |
| Current iPhone | Main phone layout |
| Small iPhone | Narrow viewport |
| iPad | Large layout |
| Oldest supported iOS 15 device or simulator | Deployment target compatibility |

Verify:

- Add an entry with a name, date, value, and notes
- History rows render correctly
- Values and notes can be shown/hidden
- Edit and delete flows work
- Charts load for tracked names
- Profiles can switch, rename, and delete
- Import, export, and share work from the Data modal
- Data remains after force close and reopen
- Portrait and landscape have no clipped controls
- Optional tips load only when App Store Connect products are active

## App Store Archive

Prerequisites on macOS:

- Xcode 26 or later
- CocoaPods
- Node.js 18 or newer
- Apple Developer Program team access

Build:

```bash
npm install
cd frontend
npm install
cd ..
npm run mobile:build:ios
cd ios/App
pod install
open App.xcworkspace
```

In Xcode:

1. Select the `App` scheme.
2. Set **Signing & Capabilities** team.
3. Confirm bundle ID `com.trackanything.app`.
4. Confirm version `1.0.2` and build `3`.
5. Choose **Any iOS Device (arm64)**.
6. Use **Product > Archive**.
7. Upload from Organizer to App Store Connect/TestFlight.

## App Store Connect Checklist

- App name: Track Anything
- Bundle ID: `com.trackanything.app`
- Category: Productivity
- Pricing: Free
- Optional in-app products: tips only; no locked features
- Privacy policy URL: `https://pearcemullins.github.io/Track-Anything/privacy-policy/`
- Data collection: tracker data is local unless the user exports or shares it
- Age rating: answer the latest questionnaire; app is not directed to children
- Health/medical: no, unless listing copy changes to health-specific claims
- App Review notes: no account required; data stays on device; tips are optional

## Tester Instructions

```text
Track Anything logs custom metrics. Create a profile, add a tracked name,
enter a value and notes, save the entry, then check History and Charts. Open
Data to export or share a backup. No login is required. Data stays on the
device. Optional tips do not unlock features.
```

## Release Notes

- Increment iOS `CURRENT_PROJECT_VERSION` for every upload.
- Update iOS `MARKETING_VERSION` for user-visible releases.
- Upload to TestFlight first, then submit for App Review.
