/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the Docker standalone build (copies only what's needed to run)
  output: 'standalone',
  // /tickets was renamed /picks; keep old links, bookmarks and shared URLs working.
  async redirects() {
    return [{ source: '/tickets', destination: '/picks', permanent: true }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.api-sports.io' },
      { protocol: 'https', hostname: 'media-3.api-sports.io' },
      { protocol: 'https', hostname: 'media-2.api-sports.io' },
    ],
  },
};

export default nextConfig;
