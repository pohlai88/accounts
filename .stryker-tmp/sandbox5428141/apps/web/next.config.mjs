/** @type {import('next').NextConfig} */
// @ts-nocheck

const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  transpilePackages: ["@aibos/ui", "@aibos/contracts"],
  webpack: (config) => {
    // Handle .js extensions in TypeScript files
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };

    // Handle Node.js modules that shouldn't be bundled for browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      dns: false,
      net: false,
      tls: false,
      crypto: false,
      perf_hooks: false,
      "node:crypto": false,
      "node:events": false,
      "node:net": false,
      "node:fs": false,
      "node:dns": false,
      "node:perf_hooks": false,
    };

    // Exclude server-side modules from client bundle
    config.externals = config.externals || [];
    config.externals.push({
      "redis": "redis",
      "pg": "pg",
      "@redis/client": "@redis/client",
    });

    return config;
  },
};
export default nextConfig;
