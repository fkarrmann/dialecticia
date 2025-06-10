import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverRuntimeConfig: {
    port: 3001,
  },
  env: {
    PORT: '3001',
  },
  experimental: {
    turbo: {}
  },
  
  // Desactivar ESLint y TypeScript checking en el build de producción
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
