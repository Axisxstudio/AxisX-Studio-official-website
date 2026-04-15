import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.axisxstudio.com" }],
        destination: "https://axisxstudio.com/:path*",
        permanent: true,
      },
    ];
  },
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
