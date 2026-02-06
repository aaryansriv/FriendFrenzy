/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    after: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
