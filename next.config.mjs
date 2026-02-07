import path from 'node:path';

/** @type {import('next').NextConfig} */
const disableStandalone =
  process.env.NEXT_DISABLE_STANDALONE === '1' ||
  process.env.NEXT_DISABLE_STANDALONE === 'true';

const nextConfig = {
  ...(disableStandalone ? {} : { output: 'standalone' }),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Resolve DB path at config load (cwd = project root). Same idea as debug_logs: data in a folder in the codebase.
  env: {
    DATABASE_URL: process.env.DATABASE_URL || (() => {
      const p = path.resolve(process.cwd(), 'prisma/local.db').replace(/\\/g, '/');
      return p.startsWith('/') ? `file://${p}` : `file:///${p}`;
    })(),
  },
}

export default nextConfig
