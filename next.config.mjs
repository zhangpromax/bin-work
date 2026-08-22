/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // 纯客户端 SPA：静态导出，交给 Cloudflare Pages 当静态站托管（无需边缘函数）
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
