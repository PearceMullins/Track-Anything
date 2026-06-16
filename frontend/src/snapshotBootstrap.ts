import type { Bootstrap } from "./types";

/** Deep copy so chart panels never react to live data updates. */
export function snapshotBootstrap(data: Bootstrap): Bootstrap {
  return JSON.parse(JSON.stringify(data)) as Bootstrap;
}
