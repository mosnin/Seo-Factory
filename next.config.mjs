/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
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
