/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },

  // Experimental features
  experimental: {
    // Instrument for better error tracking
    instrumentationHook: true,
  },
};

export default nextConfig;
