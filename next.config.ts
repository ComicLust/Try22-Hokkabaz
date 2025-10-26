import type { NextConfig } from "next";

const buildCsp = (isProd: boolean) => [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru https://yastatic.net https://static.cloudflareinsights.com https://cloudflareinsights.com https://analytics.tiktok.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms https://connect.facebook.net https://static.hotjar.com https://script.hotjar.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data:",
  "connect-src 'self' https: http: ws: wss:",
  // Allow generic embeds from HTTPS origins
  "frame-src 'self' https: http:",
  // Backward compatibility for some browsers
  "child-src 'self' https: http:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join('; ')

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: (() => {
      const isProd = process.env.NODE_ENV === 'production'
      const allowUpgrade = isProd && process.env.ENABLE_UPGRADE_INSECURE_REQUESTS === 'true'
      const base = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru https://yastatic.net https://static.cloudflareinsights.com https://cloudflareinsights.com https://analytics.tiktok.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms https://connect.facebook.net https://static.hotjar.com https://script.hotjar.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https: http:",
        "font-src 'self' data:",
        "connect-src 'self' https: http: ws: wss:",
        "frame-src 'self' https: http:",
        "child-src 'self' https: http:",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
      ]
      if (allowUpgrade) base.push("upgrade-insecure-requests")
      return base.join('; ')
    })(),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Docker dağıtımları için daha küçük runtime paketi
  output: 'standalone',
  // Dev ortamında standart izleme/derleme davranışı
  reactStrictMode: false,
  trailingSlash: false,
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
  async redirects() {
    return [
      {
        source: "/anlasmali-siteler",
        destination: "/guvenilir-bahis-siteleri-listesi",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
