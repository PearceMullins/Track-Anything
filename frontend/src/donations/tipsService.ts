import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE, type Product } from "@capgo/native-purchases";
import { TIP_PRODUCT_IDS } from "./config";

export interface TipProduct {
  id: string;
  title: string;
  description: string;
  price: string;
}

function toTipProduct(product: Product): TipProduct {
  return {
    id: product.identifier,
    title: product.title,
    description: product.description,
    price: product.priceString,
  };
}

export function isTipsAvailableOnDevice(): boolean {
  const platform = Capacitor.getPlatform();
  return Capacitor.isNativePlatform() && (platform === "android" || platform === "ios");
}

export async function checkTipsBilling(): Promise<boolean> {
  if (!isTipsAvailableOnDevice()) return false;
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    return isBillingSupported;
  } catch {
    return false;
  }
}

export const TIPS_NOT_LINKED_MESSAGE =
  "Google Play could not find your tip products. Confirm tip_small is Active, Internal testing has a rolled-out signed AAB (1.0.2+), your Gmail is under License testing, then reinstall from the internal test link and wait up to 4 hours.";

export async function loadTipProducts(): Promise<TipProduct[]> {
  if (!isTipsAvailableOnDevice()) return [];

  const found: TipProduct[] = [];
  for (const productId of TIP_PRODUCT_IDS) {
    try {
      const { product } = await NativePurchases.getProduct({
        productIdentifier: productId,
        productType: PURCHASE_TYPE.INAPP,
      });
      found.push(toTipProduct(product));
    } catch {
      // Product may not exist in Play Console yet — skip missing IDs.
    }
  }

  if (!found.length) {
    throw new Error(TIPS_NOT_LINKED_MESSAGE);
  }

  const order = new Map(TIP_PRODUCT_IDS.map((id, i) => [id, i]));
  return found.sort(
    (a, b) =>
      (order.get(a.id as (typeof TIP_PRODUCT_IDS)[number]) ?? 99) -
      (order.get(b.id as (typeof TIP_PRODUCT_IDS)[number]) ?? 99),
  );
}

export async function purchaseTip(productId: string): Promise<void> {
  await NativePurchases.purchaseProduct({
    productIdentifier: productId,
    productType: PURCHASE_TYPE.INAPP,
    isConsumable: true,
  });
}
