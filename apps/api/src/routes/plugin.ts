import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  installPlugin,
  uninstallPlugin,
  updatePluginSettings,
  grantPluginPermissions,
} from '../services/plugins';

const router = Router();

// All plugin routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// POST /api/plugins/install
// ─────────────────────────────────────────────────────────────
// Install a plugin in the tenant workspace
// Body: { pluginId }
// ─────────────────────────────────────────────────────────────
router.post('/install', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { pluginId } = req.body;
    const tenantId = req.tenantId!;

    if (!pluginId) {
      res.status(400).json({ error: 'pluginId is required' });
      return;
    }

    const installed = await installPlugin(tenantId, pluginId);
    res.status(201).json({ data: installed });
  } catch (err: any) {
    console.error('Install plugin error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/plugins/uninstall
// ─────────────────────────────────────────────────────────────
// Uninstall a plugin from the tenant workspace
// Body: { pluginId }
// ─────────────────────────────────────────────────────────────
router.post('/uninstall', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { pluginId } = req.body;
    const tenantId = req.tenantId!;

    if (!pluginId) {
      res.status(400).json({ error: 'pluginId is required' });
      return;
    }

    await uninstallPlugin(tenantId, pluginId);
    res.json({ success: true, message: 'Plugin uninstalled successfully' });
  } catch (err: any) {
    console.error('Uninstall plugin error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/plugins/:pluginId/settings
// ─────────────────────────────────────────────────────────────
// Configure custom settings injected by the plugin
// Body: { settings }
// ─────────────────────────────────────────────────────────────
router.put('/:pluginId/settings', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const pluginId = req.params.pluginId as string;
    const { settings } = req.body;
    const tenantId = req.tenantId!;

    if (!settings) {
      res.status(400).json({ error: 'settings is required' });
      return;
    }

    const updated = await updatePluginSettings(tenantId, pluginId, settings);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Update settings error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/plugins/:pluginId/permissions
// ─────────────────────────────────────────────────────────────
// Grant sandbox permission scopes to the plugin
// Body: { permissions }
// ─────────────────────────────────────────────────────────────
router.put('/:pluginId/permissions', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const pluginId = req.params.pluginId as string;
    const { permissions } = req.body;
    const tenantId = req.tenantId!;

    if (!permissions || !Array.isArray(permissions)) {
      res.status(400).json({ error: 'permissions array is required' });
      return;
    }

    const updated = await grantPluginPermissions(tenantId, pluginId, permissions);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Grant permissions error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/plugins/:pluginId/status
// ─────────────────────────────────────────────────────────────
// Toggle plugin status between active and inactive
// Body: { status }
// ─────────────────────────────────────────────────────────────
router.patch('/:pluginId/status', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const pluginId = req.params.pluginId as string;
    const { status } = req.body;
    const tenantId = req.tenantId!;

    if (status !== 'active' && status !== 'inactive') {
      res.status(400).json({ error: 'status must be active or inactive' });
      return;
    }

    const installed = await prisma.tenantPlugin.findUnique({
      where: {
        tenantId_pluginId: { tenantId, pluginId },
      },
    });

    if (!installed) {
      res.status(404).json({ error: 'Plugin is not installed' });
      return;
    }

    const updated = await prisma.tenantPlugin.update({
      where: { id: installed.id },
      data: { status },
    });

    res.json({ data: updated });
  } catch (err: any) {
    console.error('Toggle status error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/plugins/:pluginId/webhooks
// ─────────────────────────────────────────────────────────────
// Register a webhook listener on core triggers (e.g. member.created)
// Body: { eventTrigger, targetUrl }
// ─────────────────────────────────────────────────────────────
router.post('/:pluginId/webhooks', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const pluginId = req.params.pluginId as string;
    const { eventTrigger, targetUrl } = req.body;
    const tenantId = req.tenantId!;

    if (!eventTrigger || !targetUrl) {
      res.status(400).json({ error: 'eventTrigger and targetUrl are required' });
      return;
    }

    const installed = await prisma.tenantPlugin.findUnique({
      where: {
        tenantId_pluginId: { tenantId, pluginId },
      },
    });

    if (!installed) {
      res.status(404).json({ error: 'Plugin is not installed' });
      return;
    }

    const webhook = await prisma.pluginWebhook.create({
      data: {
        tenantId,
        tenantPluginId: installed.id,
        eventTrigger,
        targetUrl,
      },
    });

    res.status(201).json({ data: webhook });
  } catch (err) {
    console.error('Register webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/plugins/definitions
// ─────────────────────────────────────────────────────────────
// Get all platform-approved plugin definitions
// ─────────────────────────────────────────────────────────────
router.get('/definitions', async (req: Request, res: Response) => {
  try {
    const definitions = await prisma.pluginDefinition.findMany();
    res.json({ data: definitions });
  } catch (err: any) {
    console.error('List definitions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/plugins/installed
// ─────────────────────────────────────────────────────────────
// Get all installed plugins in the tenant workspace
// ─────────────────────────────────────────────────────────────
router.get('/installed', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const installed = await prisma.tenantPlugin.findMany({
      where: { tenantId },
      include: {
        plugin: true,
        webhooks: true,
      },
    });
    res.json({ data: installed });
  } catch (err: any) {
    console.error('List installed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/plugins/webhooks
// ─────────────────────────────────────────────────────────────
// Get all registered webhooks for the tenant workspace
// ─────────────────────────────────────────────────────────────
router.get('/webhooks', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const webhooks = await prisma.pluginWebhook.findMany({
      where: { tenantId },
      include: {
        plugin: {
          include: {
            plugin: true,
          },
        },
      },
    });
    res.json({ data: webhooks });
  } catch (err: any) {
    console.error('List webhooks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/plugins/webhooks/:webhookId
// ─────────────────────────────────────────────────────────────
// Unregister/delete a webhook subscription
// ─────────────────────────────────────────────────────────────
router.delete('/webhooks/:webhookId', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const webhookId = req.params.webhookId as string;
    const tenantId = req.tenantId!;

    const webhook = await prisma.pluginWebhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || webhook.tenantId !== tenantId) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }

    await prisma.pluginWebhook.delete({
      where: { id: webhookId },
    });

    res.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (err: any) {
    console.error('Delete webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/plugins/webhooks/:webhookId
// ─────────────────────────────────────────────────────────────
// Toggle webhook active/inactive status
// ─────────────────────────────────────────────────────────────
router.patch('/webhooks/:webhookId', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const webhookId = req.params.webhookId as string;
    const { isActive } = req.body;
    const tenantId = req.tenantId!;

    const webhook = await prisma.pluginWebhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || webhook.tenantId !== tenantId) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }

    const updated = await prisma.pluginWebhook.update({
      where: { id: webhookId },
      data: { isActive: !!isActive },
    });

    res.json({ data: updated });
  } catch (err: any) {
    console.error('Toggle webhook status error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
