// src/routes/pluginExtensionsEngine.ts
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { pluginEngineService } from '../services/pluginExtensionsEngine/moduleService';
import prisma from '../lib/prisma';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Install a plugin
router.post('/install', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { pluginId } = req.body;
    const tenantId = req.tenantId!;
    if (!pluginId) {
      return res.status(400).json({ error: 'pluginId is required' });
    }
    const installed = await pluginEngineService.install(tenantId, pluginId);
    res.status(201).json({ data: installed });
  } catch (err: any) {
    console.error('Install plugin error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Uninstall a plugin
router.post('/uninstall', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { pluginId } = req.body;
    const tenantId = req.tenantId!;
    if (!pluginId) {
      return res.status(400).json({ error: 'pluginId is required' });
    }
    await pluginEngineService.uninstall(tenantId, pluginId);
    res.json({ success: true, message: 'Plugin uninstalled successfully' });
  } catch (err: any) {
    console.error('Uninstall plugin error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update plugin settings
router.put('/:pluginId/settings', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const pluginId = req.params.pluginId as string;
    const { settings } = req.body;
    const tenantId = req.tenantId!;
    if (!settings) {
      return res.status(400).json({ error: 'settings is required' });
    }
    const updated = await pluginEngineService.updateSettings(tenantId, pluginId, settings);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Update settings error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Grant permissions to plugin
router.put('/:pluginId/permissions', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const pluginId = req.params.pluginId as string;
    const { permissions } = req.body;
    const tenantId = req.tenantId!;
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions array is required' });
    }
    const updated = await pluginEngineService.grantPermissions(tenantId, pluginId, permissions);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Grant permissions error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Toggle plugin status (active/inactive) – delegate to core plugins service for brevity
router.patch('/:pluginId/status', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const pluginId = req.params.pluginId as string;
    const { status } = req.body;
    const tenantId = req.tenantId!;
    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({ error: 'status must be active or inactive' });
    }
    const installed = await prisma.tenantPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (!installed) {
      return res.status(404).json({ error: 'Plugin is not installed' });
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

// Register a webhook for a plugin
router.post('/:pluginId/webhooks', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const pluginId = req.params.pluginId as string;
    const { eventTrigger, targetUrl } = req.body;
    const tenantId = req.tenantId!;
    if (!eventTrigger || !targetUrl) {
      return res.status(400).json({ error: 'eventTrigger and targetUrl are required' });
    }
    const installed = await prisma.tenantPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (!installed) {
      return res.status(404).json({ error: 'Plugin is not installed' });
    }
    const webhook = await prisma.pluginWebhook.create({
      data: { tenantId, tenantPluginId: installed.id, eventTrigger, targetUrl },
    });
    res.status(201).json({ data: webhook });
  } catch (err: any) {
    console.error('Register webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List plugin definitions (public)
router.get('/definitions', async (req: Request, res: Response) => {
  try {
    const definitions = await prisma.pluginDefinition.findMany();
    res.json({ data: definitions });
  } catch (err: any) {
    console.error('List definitions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List installed plugins for tenant
router.get('/installed', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const installed = await prisma.tenantPlugin.findMany({
      where: { tenantId },
      include: { plugin: true, webhooks: true },
    });
    res.json({ data: installed });
  } catch (err: any) {
    console.error('List installed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List all webhooks for tenant
router.get('/webhooks', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const webhooks = await prisma.pluginWebhook.findMany({
      where: { tenantId },
      include: { plugin: { include: { plugin: true } } },
    });
    res.json({ data: webhooks });
  } catch (err: any) {
    console.error('List webhooks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a webhook
router.delete('/webhooks/:webhookId', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const webhookId = req.params.webhookId as string;
    const tenantId = req.tenantId!;
    const webhook = await prisma.pluginWebhook.findUnique({ where: { id: webhookId } });
    if (!webhook || webhook.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    await prisma.pluginWebhook.delete({ where: { id: webhookId } });
    res.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (err: any) {
    console.error('Delete webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle webhook active status
router.patch('/webhooks/:webhookId', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const webhookId = req.params.webhookId as string;
    const { isActive } = req.body;
    const tenantId = req.tenantId!;
    const webhook = await prisma.pluginWebhook.findUnique({ where: { id: webhookId } });
    if (!webhook || webhook.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Webhook not found' });
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
