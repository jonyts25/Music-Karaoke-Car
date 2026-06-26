import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const tunnelOrigins = [
  "*.ngrok-free.dev",
  "*.ngrok-free.app",
  "*.ngrok.io",
  "*.ngrok.app",
  "*.trycloudflare.com",
  "*.loca.lt",
  "*.cfargotunnel.com",
];

const extraOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },
  // Required for iPhone / Automotive when using ngrok or other tunnels in dev mode.
  // Without this, Next.js 16 returns 403 on /_next/* and React never hydrates.
  allowedDevOrigins: [...tunnelOrigins, ...extraOrigins],
};

export default nextConfig;
