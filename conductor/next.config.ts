import type { NextConfig } from 'next';

const isExport = process.env.NEXT_PUBLIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isExport ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: isExport,
  },
  basePath: isExport ? '/m' : '',
  outputFileTracingRoot: require('path').join(__dirname),
  // Soporte para cliente pesado de Firebase.
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

export default nextConfig;
