import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "psddbrpgopucfnmtumxx.supabase.co",
      },
    ],
  },
};

export default nextConfig;
