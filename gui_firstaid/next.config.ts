import type { NextConfig } from "next";
import { config } from "process";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      
      // CSS Module Hot Reload Fix
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Check alle 1 Sekunde
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};
export default nextConfig;
