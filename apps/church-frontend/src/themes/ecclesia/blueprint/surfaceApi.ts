import { httpRequest } from '../../../http';
import type { BlueprintSurface } from './surfaceCatalog';

export type SurfacePayload = Record<string, unknown>;

export async function submitSurfacePayload(surface: BlueprintSurface, payload: SurfacePayload) {
  const isAuthEndpoint = surface.endpoint === '/api/auth/login' || surface.endpoint === '/api/auth/member-register';
  const response = await httpRequest(surface.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(isAuthEndpoint ? payload : {
      surfaceKey: surface.key,
      surfaceTitle: surface.title,
      moduleKey: surface.moduleKey,
      answers: payload,
      metadata: {
        slug: surface.slug,
        phase: surface.phase,
        submittedAt: new Date().toISOString(),
      },
    }),
  });

  const responseBody = await response.text();
  const data = responseBody ? JSON.parse(responseBody) : {};
  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export function surfaceDraftKey(tenantId: string, surfaceKey: string): string {
  return `churchos.ecclesia.surfaceDraft.${tenantId}.${surfaceKey}`;
}

export function saveSurfaceDraft(tenantId: string, surfaceKey: string, payload: SurfacePayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(surfaceDraftKey(tenantId, surfaceKey), JSON.stringify(payload));
  } catch {
    // Draft cache is best-effort only.
  }
}

export function loadSurfaceDraft(tenantId: string, surfaceKey: string): SurfacePayload {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(surfaceDraftKey(tenantId, surfaceKey));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function clearSurfaceDraft(tenantId: string, surfaceKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(surfaceDraftKey(tenantId, surfaceKey));
  } catch {
    // Ignore storage failures.
  }
}
