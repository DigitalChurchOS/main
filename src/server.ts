import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);



// Check if running inside Cloudflare Workers/Pages V8 isolate context
const isCloudflare =
  process.env.VERCEL !== '1' &&
  typeof (globalThis as any).WebSocket !== 'undefined' &&
  typeof (globalThis as any).caches !== 'undefined';

// Check if running in Vercel Serverless environment
const isVercel = process.env.VERCEL === '1';

// Only start Express listening on port when NOT running in Serverless/V8 isolate contexts
if (!isCloudflare && !isVercel) {
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║   ⛪  ChurchOS Kernel — Phase 1           ║
  ║   🚀  Running on http://localhost:${PORT}    ║
  ║   📦  Database: SQLite (dev.db)           ║
  ╚═══════════════════════════════════════════╝
    `);
  });
}

let cloudflareHandler: any;

if (isCloudflare) {
  try {
    const { httpServerHandler } = require('cloudflare:node');
    cloudflareHandler = httpServerHandler({ port: PORT });
  } catch (err) {
    console.error('Failed to load Cloudflare server handler:', err);
  }
}

// Export the server handler: cloudflareHandler for Cloudflare, Express app for Vercel/Node
export default isCloudflare ? cloudflareHandler : app;
