
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all static assets served from _next/static
        // This includes fonts, CSS, JS chunks, etc.
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allows all origins. For production, restrict to your domain.
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS', // Methods Next.js uses for static assets
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type', // A common safe header
          },
        ],
      },
      {
        // More general rule for other paths if needed, though less likely
        // to affect static asset loading by the page itself.
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allows all origins.
          },
        ],
      }
    ];
  },
};

export default nextConfig;
