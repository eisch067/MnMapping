import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cesium's ArcGIS adapter normalizes service roots with a trailing slash.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
