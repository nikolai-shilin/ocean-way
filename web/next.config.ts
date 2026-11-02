import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dictionaries, the icon sprite and the page templates are read from disk at render time, also on revalidation.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*", "./src/templates/**/*"],
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
