export const DEFAULT_PROFILE = "Default";

export function normalizeProfileName(name: string): string {
  return name.trim().split(/\s+/).join(" ");
}
