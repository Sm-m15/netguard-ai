/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // GitHub Pages serves this project from /netguard-ai rather than the domain root.
  ...(isGitHubPages
    ? {
        output: 'export',
        basePath: '/netguard-ai',
        trailingSlash: true,
      }
    : {}),
};

module.exports = nextConfig;
