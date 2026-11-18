/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@chatechat/shared-types'],
  output: 'export',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
