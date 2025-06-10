import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverRuntimeConfig: {
    port: 3001,
  },
  env: {
    PORT: '3001',
  },
};

export default nextConfig;
