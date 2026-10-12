/** @type {import('next').NextConfig} */
const defaultBackendDestination = process.env.NODE_ENV === 'production'
  ? 'https://deeppink-ibis-194201.hostingersite.com/api/:path*'
  : 'http://localhost:4000/api/:path*';

const backendDestination = process.env.BACKEND_API_URL
  ? (process.env.BACKEND_API_URL.includes(':path*')
      ? process.env.BACKEND_API_URL
      : `${process.env.BACKEND_API_URL.replace(/\/+$/, '')}${process.env.BACKEND_API_URL.endsWith('/api') ? '' : '/api'}/:path*`)
  : defaultBackendDestination;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@washora/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: backendDestination,
      },
    ];
  },
};

export default nextConfig;
