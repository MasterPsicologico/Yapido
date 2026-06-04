import type { NextConfig } from 'next';

const isExport = process.env.NEXT_PUBLIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Para Capacitor Android: el output es estático.
  output: isExport ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: isExport,
  },
  // El root del monorepo sirve /m como zona de Yapido.
  basePath: isExport ? '/m' : '',
  experimental: {
    typedRoutes: false,
  },
  // Soporte para cliente pesado de Firebase.
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

export default nextConfig;
