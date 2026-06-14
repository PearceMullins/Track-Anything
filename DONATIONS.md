# In-app tips (Google Play Billing)

Track Anything includes optional **tips** via Google Play. Tips are consumable in-app products — they do not unlock features.

## Product IDs (must match Play Console exactly)

| Product ID   | Suggested price | Type        |
|--------------|-----------------|-------------|
| `tip_small`  | $0.99           | Consumable  |
| `tip_medium` | $2.99           | Consumable  |
| `tip_large`  | $4.99           | Consumable  |

In Play Console: **Monetize → Products → In-app products → Create product**

- Product ID: use the IDs above (lowercase, underscores)
- Name / description: shown in the tip dialog (e.g. "Small tip", "Thanks for your support")
- Status: **Active**

## Can we build before Play Console?

| Step | Before Play Console? |
|------|----------------------|
| Tip button + UI in the app | Yes — done |
| Google Play Billing code | Yes — done |
| Real purchases working | **No** — needs app created + products + internal test upload |
| Testing with license testers | **No** — needs Play Console |

**Recommended order:**

1. Create app in Play Console (`com.trackanything.app`)
2. Create the three in-app products above
3. Upload signed AAB to **Internal testing**
4. Add your Gmail under **Setup → License testing**
5. Install from the Play internal test link (not Android Studio sideload)
6. Open app → **Support the developer** → complete a test tip (no real charge for license testers)

## App UI

Footer link: **Donations** (tab bar, next to Progress Charts)

On desktop/web builds, the dialog explains tips are only available in the Play Store Android app.

## Updating prices

Change prices in Play Console only. The app loads titles and prices from Google Play automatically.
