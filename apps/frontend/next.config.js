/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ["@neurovault/shared"],
  async rewrites() {
    return [
      {
        // Exclude /api/auth from being rewritten as it stays in Next.js
        source: '/api/((?!auth).*)',
        destination: `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}/api/:1`,
      },
    ];
  },
};

module.exports = nextConfig;
