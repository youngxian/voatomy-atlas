import type { NextConfig } from "next";

// const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3001";
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "https://voatomy-landing-29uj.vercel.app";


const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/invite/:token",
        destination: `${LANDING_URL}/invite/:token`,
        permanent: false,
      },
      {
        source: "/auth/:path*",
        destination: `${LANDING_URL}/auth/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
