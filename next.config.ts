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
  // In-app browser uyumluluğu için iframe politika gevşetildi
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
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
        // In-app browser uyumluluğu: HTTPS kökenlerden embed'e izin ver
        "frame-src 'self' https: http:",
        "child-src 'self' https: http:",
        "frame-ancestors 'self' https:",
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
  // Standalone modu kapalı: custom server (server.ts) ile uyumlu
  // Dev ortamında standart izleme/derleme davranışı
  reactStrictMode: false,
  trailingSlash: false,
  
  // Görsel optimizasyonu
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 yıl cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Performans optimizasyonu
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
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
