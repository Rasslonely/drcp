import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental optimizations
  experimental: {
    // Tree-shake heavy libraries (only import what's used)
    // NOTE: Do NOT include @rainbow-me/rainbowkit here - its @reown/appkit 
    // dependency is too complex and causes chunk loading failures (BUG-01 fix)
    optimizePackageImports: [
      "lucide-react",      // Icons: ~200KB → ~5KB
      "framer-motion",     // Animations: ~150KB → ~50KB
      "recharts",          // Charts: ~300KB → ~100KB
    ],
  },

  // Transpile WalletConnect packages to prevent chunk loading issues
  transpilePackages: [
    "@rainbow-me/rainbowkit",
    "@reown/appkit",
    "@reown/appkit-common",
    "@reown/appkit-controllers", 
    "@reown/appkit-ui",
    "@reown/appkit-utils",
    "@walletconnect/sign-client",
    "@walletconnect/core",
  ],

  // Empty turbopack config to use Turbopack (Next.js 16+ default)
  // This silences the webpack/turbopack conflict error
  turbopack: {},

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Production optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Reduce bundle size
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;


