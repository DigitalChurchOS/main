Marketplace app
================

This directory contains a minimal Marketplace frontend and backend for themes and plugins.

Frontend:
- `apps/marketplace/frontend/index.html` — browse themes & plugins for tenant owners.
- `apps/marketplace/frontend/publish.html` — simple developer publish form.

Backend:
- `apps/marketplace/backend/server.js` — Express server that serves simple JSON endpoints:
  - `GET /api/themes`
  - `GET /api/plugins`
  - `POST /api/publish` (developer publishes a theme or plugin)

Run backend (Node.js required):

```
cd apps/marketplace/backend
npm init -y
npm install express cors body-parser
node server.js
```

Then open the frontend in a browser (served from workspace root or any static server):

http://localhost:3000/marketplace

Note: Backend runs on port 9000 by default.

Developer backend (dashboard):

- Developer API endpoints (require `X-API-KEY` header):
  - `GET /api/dev/packages` - list your packages
  - `POST /api/dev/packages` - create a package (body: `{ type, name, description }`)
  - `DELETE /api/dev/packages/:id` - delete a package you own

- There's a simple developer dashboard at: `/marketplace/developer` that lets a developer manage packages using an API key.

Developer sample API key (in-memory):

- `devkey-CHANGE_ME` (owner id `dev1`, name: Acme Dev)

Security: the sample server uses in-memory dev users and API keys for quick testing. Replace with proper authentication and persistence for production.
