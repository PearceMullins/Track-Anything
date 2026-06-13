/** True when the app runs as a packaged Android build (no Python API). */

export function isLocalMode(): boolean {
  if (import.meta.env.VITE_USE_LOCAL_STORAGE === "true") return true;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}
