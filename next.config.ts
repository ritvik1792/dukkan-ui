import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/console", destination: "/console/dashboard", permanent: false },
      { source: "/seller", destination: "/console/dashboard", permanent: false },
      { source: "/seller/:path*", destination: "/console/seller/:path*", permanent: false },
      { source: "/admin", destination: "/console/dashboard", permanent: false },
      { source: "/admin/:path*", destination: "/console/admin/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
