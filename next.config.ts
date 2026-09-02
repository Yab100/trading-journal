import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'okiewwvfhwdyopyqqayx.supabase.co',
      },
    ],
  },
}

export default nextConfig