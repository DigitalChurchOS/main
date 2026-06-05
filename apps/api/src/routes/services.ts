import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { encryptCredentials, decryptCredentials } from '../lib/vault';

const router = Router();

// All services routes require authentication and tenant.settings permission
router.use(authMiddleware);
router.use(requirePermission('tenant.settings'));

// ─────────────────────────────────────────────────────────────
// GET /api/services
// ─────────────────────────────────────────────────────────────
// Lists all connected services with masked credentials for safety.
// ─────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    const services = await prisma.tenantConnectedService.findMany({
      where: { tenantId },
      include: { provider: true },
    });

    // Mask credentials before sending response
    const data = services.map((s) => {
      let keys: string[] = [];
      try {
        const decrypted = decryptCredentials(s.encryptedCredentials, tenantId);
        const parsed = JSON.parse(decrypted);
        keys = Object.keys(parsed);
      } catch (err) {
        // Safe fallback in case of decryption failure
      }

      return {
        id: s.id,
        providerId: s.providerId,
        providerName: s.provider.name,
        categoryId: s.provider.categoryId,
        providerMode: s.providerMode,
        isActive: s.isActive,
        configuredKeys: keys,
      };
    });

    res.json({ data });
  } catch (err) {
    console.error('List services error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/services
// ─────────────────────────────────────────────────────────────
// Body: { providerId, credentials, providerMode, isActive }
// Creates or updates a connected service credentials set.
// ─────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const { providerId, credentials, providerMode, isActive } = req.body;
    const tenantId = req.tenantId!;

    if (!providerId || !credentials) {
      res.status(400).json({ error: 'providerId and credentials object are required' });
      return;
    }

    // Verify provider exists in the system
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!provider) {
      res.status(404).json({ error: 'Provider not supported' });
      return;
    }

    // Encrypt credentials JSON string
    const credentialsString = JSON.stringify(credentials);
    const encrypted = encryptCredentials(credentialsString, tenantId);

    // Upsert tenant connected service
    const service = await prisma.tenantConnectedService.upsert({
      where: {
        tenantId_providerId: { tenantId, providerId },
      },
      update: {
        encryptedCredentials: encrypted,
        ...(providerMode !== undefined && { providerMode }),
        ...(isActive !== undefined && { isActive }),
      },
      create: {
        tenantId,
        providerId,
        encryptedCredentials: encrypted,
        providerMode: providerMode || 'bring_your_own',
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: service.id,
        providerId: service.providerId,
        isActive: service.isActive,
      },
    });
  } catch (err) {
    console.error('Save service error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/services/overrides
// ─────────────────────────────────────────────────────────────
// Body: { moduleKey, categoryId, connectedServiceId }
// Sets a module provider override.
// ─────────────────────────────────────────────────────────────
router.post('/overrides', async (req: Request, res: Response) => {
  try {
    const { moduleKey, categoryId, connectedServiceId } = req.body;
    const tenantId = req.tenantId!;

    if (!moduleKey || !categoryId || !connectedServiceId) {
      res.status(400).json({ error: 'moduleKey, categoryId, and connectedServiceId are required' });
      return;
    }

    // Verify service belongs to this tenant and category matches
    const service = await prisma.tenantConnectedService.findFirst({
      where: { id: connectedServiceId as string, tenantId },
      include: { provider: true },
    });

    if (!service) {
      res.status(404).json({ error: 'Connected service not found for this tenant' });
      return;
    }

    if (service.provider.categoryId !== categoryId) {
      res.status(400).json({ error: 'Connected service does not match the requested category' });
      return;
    }

    // Upsert override
    const override = await prisma.moduleProviderOverride.upsert({
      where: {
        tenantId_moduleKey_categoryId: { tenantId, moduleKey, categoryId },
      },
      update: {
        connectedServiceId,
      },
      create: {
        tenantId,
        moduleKey,
        categoryId,
        connectedServiceId,
      },
    });

    res.status(200).json({ success: true, data: override });
  } catch (err) {
    console.error('Create override error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/services/:id
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const id = req.params.id as string;

    const existing = await prisma.tenantConnectedService.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Connected service not found' });
      return;
    }

    await prisma.tenantConnectedService.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
