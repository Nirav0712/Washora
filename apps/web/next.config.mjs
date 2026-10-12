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
  async redirects() {
    const adminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL
      || (process.env.NODE_ENV === 'production' ? 'https://washora-myo9.vercel.app' : 'http://localhost:3002')).replace(/\/+$/, '');
    return [
      {
        source: '/admin',
        destination: `${adminUrl}/login`,
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: `${adminUrl}/:path*`,
        permanent: false,
      },
    ];
  },
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
