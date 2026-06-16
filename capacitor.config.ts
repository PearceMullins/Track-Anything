import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.trackanything.app",
  appName: "Track Anything",
  webDir: "frontend/dist",
  android: {
    allowMixedContent: false,
  },
};

export default config;
