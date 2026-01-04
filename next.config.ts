import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval/inline needed for Next.js dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self'",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/borrow',
        destination: '/assignments',
        permanent: true,
      },
      {
        source: '/borrow/:path*',
        destination: '/assignments/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/borrowing',
        destination: '/assignments',
        permanent: true,
      },
      {
        source: '/dashboard/borrowing/:path*',
        destination: '/assignments/:path*',
        permanent: true,
      },
      {
        source: '/settings/departments',
        destination: '/settings/organization',
        permanent: true,
      },
      {
        source: '/settings/roles',
        destination: '/settings/organization',
        permanent: true,
      },
    ]
  }
};

export default nextConfig;
