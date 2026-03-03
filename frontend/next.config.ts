import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for the Docker standalone build (copies only what's needed to run)
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-3.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-2.api-sports.io',
      },
    ],
  },
};

export default nextConfig;
