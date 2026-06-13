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
  async headers() {
    return [];
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      afterFiles: [
        // In dev mode, proxy finanzas and nimbus to local servers
        ...(isDev ? [
          {
            source: '/finanzas',
            destination: 'http://localhost:9003/',
          },
          {
            source: '/finanzas/:path*',
            destination: 'http://localhost:9003/:path*',
          },
          {
            source: '/nimbus',
            destination: 'http://localhost:9004/nimbus',
          },
          {
            source: '/nimbus/:path*',
            destination: 'http://localhost:9004/nimbus/:path*',
          },
        ] : []),
        {
          source: '/__/auth/:path*',
          destination: `https://auth.yapido.click/__/auth/:path*`,
        },
      ],
    };
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
