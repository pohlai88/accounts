/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  transpilePackages: ["@aibos/ui", "@aibos/contracts"],
};
export default nextConfig;
