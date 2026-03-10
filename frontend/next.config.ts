import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In local dev, use rewrites to proxy API to backend
  ...(process.env.NODE_ENV === "development" && {
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*",
        },
      ];
    },
  }),
};

export default nextConfig;
