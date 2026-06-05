import { Request } from 'express';

/**
 * Augment Express Request with ChurchOS-specific properties
 * injected by tenant and auth middleware.
 */
declare global {
  namespace Express {
    interface Request {
      /** The resolved tenant ID — set by tenant middleware */
      tenantId?: string;
      /** The resolved locale — set by locale middleware */
      locale?: string;
      /** The authenticated user payload — set by auth middleware */
      user?: {
        userId: string;
        tenantId: string;
        email: string;
        permissions: string[];
        preferredLanguage?: string;
      };
      /** The authenticated platform user payload — set by platformAuth middleware */
      platformUser?: {
        userId: string;
        email: string;
        roleName: string;
        permissions: string[];
      };
    }
  }
}

export {};
