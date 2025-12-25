/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "cdn.campeveryday.com",
      },
    ],
    // Optimize image formats
    formats: ["image/avif", "image/webp"],
    // Configure device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize layout shift
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Ensure external workspace packages are bundled correctly
  transpilePackages: ["@campreserv/shared"],

  // Enable strict mode for better debugging
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Power by header (disable for security)
  poweredByHeader: false,

  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|webp|avif|svg|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache JS/CSS with revalidation
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      // Redirect old park URL format to new
      {
        source: "/campground/:slug",
        destination: "/park/:slug",
        permanent: true,
      },
      // Redirect with trailing slash
      {
        source: "/park/:slug/",
        destination: "/park/:slug",
        permanent: true,
      },
    ];
  },

  // Experimental features for performance
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
    // Optimize package imports
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "recharts",
      "@tanstack/react-query",
    ],
  },

  // Webpack configuration for performance
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Enable tree shaking for icons
      config.resolve.alias = {
        ...config.resolve.alias,
        "lucide-react": "lucide-react/dist/esm/icons",
      };
    }

    return config;
  },
};

module.exports = nextConfig;
