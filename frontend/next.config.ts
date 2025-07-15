import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@influxdata/influxdb-client'],
};

export default nextConfig;