/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@aibos/contracts",
    "@aibos/accounting",
    "@aibos/db",
    "@aibos/auth",
    "@aibos/utils",
  ],
  webpack: config => {
    // Exclude Supabase Edge Functions from Next.js build
    config.module.rules.push({
      test: /supabase\/functions\/.*\.ts$/,
      use: "ignore-loader",
    });
    return config;
  },
};
export default nextConfig;
