import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Page content (extracted from the prototypes) is read from ./content at render time, also on revalidation.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
};

export default nextConfig;
