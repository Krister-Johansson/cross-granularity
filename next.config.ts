import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow eval in development for hot reloading and turbopack
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              process.env.NODE_ENV === 'development'
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline';"
                : "script-src 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
