/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/ai',
        destination: '/campguide',
        permanent: true,
      },
    ];
  },

  // Ensure external workspace packages are bundled correctly
  transpilePackages: ["@campreserv/shared"],
};

module.exports = nextConfig;
