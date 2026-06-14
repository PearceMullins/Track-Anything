/** Google Play in-app product IDs — must match Play Console → Monetize → Products. */

export const TIP_PRODUCT_IDS = ["tip_small", "tip_medium", "tip_large"] as const;

export type TipProductId = (typeof TIP_PRODUCT_IDS)[number];
