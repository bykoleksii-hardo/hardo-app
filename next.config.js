/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), payment=(self), microphone=(self)' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Report-Only first (enforces nothing) so we can collect violations before turning CSP on. Tracked in audit-2026-05 (#21).
  { key: 'Content-Security-Policy-Report-Only', value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self' https://*.lemonsqueezy.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.lemonsqueezy.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lemonsqueezy.com https://accounts.google.com; frame-src 'self' https://*.lemonsqueezy.com https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https:; worker-src 'self' blob:" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint runs as a dedicated step in CI (see .github/workflows/ci.yml).
  // Don't fail the production build on lint findings.
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;

// OpenNext dev integration
if (process.env.NODE_ENV === 'development') {
  try {
    const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');
    initOpenNextCloudflareForDev();
  } catch (e) {
    // ignore
  }
}
