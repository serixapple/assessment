import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow local uploaded images
    remotePatterns: [],
    unoptimized: true,
  },
  // Allow large file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
