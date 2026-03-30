/** @type {import('next').NextConfig} */
const nextConfig = {
  // API rewrites so frontend can call /api/* without exposing the backend URL in the browser
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
