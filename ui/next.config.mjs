/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 's2.googleusercontent.com',
      },
      {
        hostname: 'fonts.gstatic.com',
      },
    ],
  },
  experimental: {
    optimizeFonts: false,
  },
};

export default nextConfig;
