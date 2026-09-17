import type { NextConfig } from 'next';
import { resolve } from 'node:path';
import { config as loadEnvironment } from 'dotenv';

loadEnvironment({ path: resolve(process.cwd(), '../../.env'), quiet: true });

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@weekeasy/ui'],
};

export default nextConfig;
