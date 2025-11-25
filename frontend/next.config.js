/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ominous-barnacle-qv6vvxq9gvwc4pw5-8000.app.github.dev',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://ominous-barnacle-qv6vvxq9gvwc4pw5-8000.app.github.dev'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig