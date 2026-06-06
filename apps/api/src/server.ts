import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
});

// Heartbeat to prevent sandbox inactivity timeouts
setInterval(() => {
  console.log('Heartbeat: Server is running healthy...', new Date().toISOString());
}, 30000);



// Check if running inside Cloudflare Workers/Pages V8 isolate context
const isCloudflare =
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
