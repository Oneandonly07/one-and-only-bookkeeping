// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // remove all custom rewrites/redirects that used a complex regex "source"
  // If you later need rewrites, add them with simple, valid globs.
  // Example (keep commented until needed):
  // async rewrites() {
  //   return [
  //     { source: '/healthz', destination: '/api/healthz' },
  //   ];
  // },
};

export default nextConfig;
