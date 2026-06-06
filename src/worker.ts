type Env = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  API?: {
    fetch(request: Request): Promise<Response>;
  };
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Health check route
    if (pathname === '/health') {
      return Response.json({
        status: 'ok',
        runtime: 'cloudflare-worker',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. API requests proxy to service binding
    if (pathname.startsWith('/api/')) {
      if (env.API) {
        return env.API.fetch(request);
      }
      return Response.json(
        { error: 'API service binding not configured in wrangler.toml' },
        { status: 502 }
      );
    }

    // 3. Static assets: serve directly if it looks like a physical file (has extension)
    // We check for '.' to identify file extensions like .js, .css, .png, .ico, etc.
    const isStaticFile = pathname.includes('.') && !pathname.endsWith('/');
    if (isStaticFile) {
      return env.ASSETS.fetch(request);
    }

    // 4. SPA path-based routing (rewrites client-side routes to their respective index.html entries)
    let targetPath = '/index.html'; // Default to landing page

    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      targetPath = '/admin/index.html';
    } else if (pathname === '/central' || pathname.startsWith('/central/')) {
      targetPath = '/central/index.html';
    } else if (pathname === '/marketplace' || pathname.startsWith('/marketplace/')) {
      targetPath = '/marketplace/index.html';
    } else if (pathname === '/developer' || pathname.startsWith('/developer/')) {
      targetPath = '/developer/index.html';
    } else if (pathname === '/onboarding') {
      targetPath = '/onboarding.html';
    } else if (pathname === '/live.html' || pathname.startsWith('/live/')) {
      targetPath = '/live.html';
    } else if (pathname === '/church' || pathname.startsWith('/church/')) {
      targetPath = '/church/index.html';
    } else if (pathname === '/page-builder' || pathname.startsWith('/page-builder/')) {
      targetPath = '/page-builder/index.html';
    }

    // Rewrite request URL and fetch from assets
    const rewrittenUrl = new URL(request.url);
    rewrittenUrl.pathname = targetPath;
    const rewrittenRequest = new Request(rewrittenUrl.toString(), request);
    return env.ASSETS.fetch(rewrittenRequest);
  },
};

