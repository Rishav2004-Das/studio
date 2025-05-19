
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
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allows all origins. For production, you might restrict this.
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
      {
        // Apply to all other paths if needed, though less likely to affect static font loading by the page itself.
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
