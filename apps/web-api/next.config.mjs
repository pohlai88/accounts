/** @type {import('next').NextConfig} */
const nextConfig = { 
  transpilePackages: ['@aibos/contracts', '@aibos/accounting', '@aibos/db', '@aibos/auth', '@aibos/utils'],
};
export default nextConfig;
