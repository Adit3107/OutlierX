/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    VITE_API_URL_AUTH: process.env.VITE_API_URL_AUTH || process.env.NEXT_PUBLIC_API_URL_AUTH || 'http://localhost:3002',
    VITE_API_URL_ANALYTICS: process.env.VITE_API_URL_ANALYTICS || process.env.NEXT_PUBLIC_API_URL_ANALYTICS || 'http://localhost:3003',
    VITE_API_URL_SUBSCRIPTION: process.env.VITE_API_URL_SUBSCRIPTION || process.env.NEXT_PUBLIC_API_URL_SUBSCRIPTION || 'http://localhost:3004',
    VITE_API_URL_INGESTION: process.env.VITE_API_URL_INGESTION || process.env.NEXT_PUBLIC_API_URL_INGESTION || 'http://localhost:3000',
    VITE_API_URL_NOTIFICATION: process.env.VITE_API_URL_NOTIFICATION || process.env.NEXT_PUBLIC_API_URL_NOTIFICATION || 'http://localhost:3001',
    VITE_API_URL_ML: process.env.VITE_API_URL_ML || process.env.NEXT_PUBLIC_API_URL_ML || 'http://localhost:8000',
    VITE_ADMIN_SERVICE_URL: process.env.VITE_ADMIN_SERVICE_URL || process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:3005',
  },
};

export default nextConfig;
