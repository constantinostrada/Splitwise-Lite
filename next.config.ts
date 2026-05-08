import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use strict mode for highlighting potential React issues during development
  reactStrictMode: true,

  // Enforce production-level ESLint checks during `next build`
  eslint: {
    dirs: ['src'],
  },

  // Enforce TypeScript type checks during `next build`
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
