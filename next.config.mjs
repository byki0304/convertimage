/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/auth', destination: '/login', permanent: false }];
  },
};

export default nextConfig;
