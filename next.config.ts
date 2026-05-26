import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: __dirname,
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    return [
      // In dev mode, proxy finanzas to local server (in prod, vercel.json handles this at the edge)
      ...(isDev ? [
        {
          source: '/finanzas',
          destination: 'http://localhost:9003/finanzas',
        },
        {
          source: '/finanzas/:path*',
          destination: 'http://localhost:9003/finanzas/:path*',
        },
      ] : []),
      {
        source: '/__/auth/:path*',
        destination: `https://studio-4796645076-6f375.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
