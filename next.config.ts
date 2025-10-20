import type { NextConfig } from "next";

const buildCsp = (isProd: boolean) => [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data:",
  "connect-src 'self' https: http: ws:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join('; ')

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: buildCsp(process.env.NODE_ENV === 'production'),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Dev ortamında standart izleme/derleme davranışı
  reactStrictMode: false,
  // Coolify deployment için standalone output
  output: 'standalone',
  webpack: (config) => {
    return config;
  },
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
