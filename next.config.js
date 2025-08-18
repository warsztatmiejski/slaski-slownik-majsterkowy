/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
	// Allow production builds to complete even with ESLint errors
	ignoreDuringBuilds: true,
  },
  typescript: {
	// Allow production builds to complete even with TypeScript errors
	ignoreBuildErrors: true,
  },
  // External packages are handled automatically in Next.js 15
  serverExternalPackages: ['@prisma/client'],

  // Vercel-specific optimizations
  experimental: {
	// Enable PPR for better performance (optional)
	ppr: false,
  },
}

module.exports = nextConfig