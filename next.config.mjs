/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Sharp native bindings for server-side
    if (isServer) {
      config.externals.push("sharp");
    }
    return config;
  },
};

export default nextConfig;
