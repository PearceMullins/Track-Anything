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
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
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

export async function loadTipProducts(): Promise<TipProduct[]> {
  if (!isTipsAvailableOnDevice()) return [];

  const { products } = await NativePurchases.getProducts({
    productIdentifiers: [...TIP_PRODUCT_IDS],
    productType: PURCHASE_TYPE.INAPP,
  });

  const order = new Map(TIP_PRODUCT_IDS.map((id, i) => [id, i]));
  return products
    .map(toTipProduct)
    .sort((a, b) => (order.get(a.id as (typeof TIP_PRODUCT_IDS)[number]) ?? 99) - (order.get(b.id as (typeof TIP_PRODUCT_IDS)[number]) ?? 99));
}

export async function purchaseTip(productId: string): Promise<void> {
  await NativePurchases.purchaseProduct({
    productIdentifier: productId,
    productType: PURCHASE_TYPE.INAPP,
    isConsumable: true,
  });
}
