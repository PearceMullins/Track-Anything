# Optional Tips

Track Anything includes optional one-time tips through Google Play Billing.
Tips are consumable in-app products. They do not unlock features, content, or
access.

## Product IDs

Create these in Play Console under **Monetize with Play > Products > In-app
products**.

| Product ID | Suggested price | Type |
| --- | --- | --- |
| `tip_small` | $0.99 | Consumable |
| `tip_medium` | $2.99 | Consumable |
| `tip_large` | $4.99 | Consumable |

Product IDs must match `frontend/src/donations/config.ts`.

## Testing Order

1. Create the Play Console app with package `com.trackanything.app`.
2. Create and activate the three in-app products.
3. Upload a signed Android App Bundle to Internal testing.
4. Add license testers in Play Console.
5. Install from the internal test link.
6. Open **Donations** in the app and complete a test tip.

License tester purchases should not create real charges.

## Desktop And Web Behavior

Tips are only available in the Google Play Android build. Desktop and web builds
show a message explaining that Google Play Billing is unavailable there.

## Pricing

Change prices in Play Console. The app loads product titles and prices from
Google Play.
