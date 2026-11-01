import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Page content (extracted from the prototypes) is read from ./content at render time, also on revalidation.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  // Boat and staff photos in /public are resized by /_next/image (src/lib/images.ts); nothing else may be.
  images: {
    localPatterns: [
      { pathname: "/fleet/**", search: "" },
      { pathname: "/people/**", search: "" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
