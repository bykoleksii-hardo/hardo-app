/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;

// OpenNext dev integration (для локальной разработки с bindings)
if (process.env.NODE_ENV === 'development') {
  // ленивый импорт чтобы не падать если пакет ещё не установлен
  try {
    const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');
    initOpenNextCloudflareForDev();
  } catch (e) {
    // ignore
  }
}
