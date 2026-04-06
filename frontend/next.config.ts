import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const backendUrl = process.env.API_URL || 'http://localhost:8000';

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // Add empty turbopack config to silence the error
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
