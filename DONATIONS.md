# Optional Tips

Track Anything includes optional one-time tips through the native store billing
system on Android and iOS. Tips are consumable in-app products. They do not
unlock features, content, or access.

## Product IDs

Create these in Play Console under **Monetize with Play > Products > In-app
products** and in App Store Connect under **Features > In-App Purchases**.

| Product ID | Suggested price | Type |
| --- | --- | --- |
| `tip_small` | $0.99 | Consumable |
| `tip_medium` | $2.99 | Consumable |
| `tip_large` | $4.99 | Consumable |

Product IDs must match `frontend/src/donations/config.ts`.

## Google Play Testing Order

1. Create the Play Console app with package `com.trackanything.app`.
2. Create and activate the three in-app products.
3. Upload a signed Android App Bundle to Internal testing.
4. Add license testers in Play Console.
5. Install from the internal test link.
6. Open **Donations** in the app and complete a test tip.

License tester purchases should not create real charges.

## App Store Testing Order

1. Create the App Store Connect app with bundle ID `com.trackanything.app`.
2. Create the three consumable in-app purchases with matching product IDs.
3. Upload a signed iOS archive to TestFlight.
4. Add sandbox testers or TestFlight testers.
5. Install from TestFlight.
6. Open **Donations** in the app and complete a test tip.

Sandbox purchases should not create real charges.

## Desktop And Web Behavior

Tips are only available in native store builds. Desktop and web builds show a
message explaining that store billing is unavailable there.

## Pricing

Change prices in Play Console and App Store Connect. The app loads product
titles and prices from the active store.
