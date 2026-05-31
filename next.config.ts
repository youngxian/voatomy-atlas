import type { NextConfig } from "next";

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3001";


const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/invite/:token",
        destination: `${LANDING_URL}/invite/:token`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
