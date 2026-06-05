import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { tenantMiddleware } from './middleware/tenant';
import { requireModule } from './middleware/entitlements';
import { localeMiddleware } from './middleware/locale';
import authRoutes from './routes/auth';
import memberRoutes from './routes/members';
import servicesRoutes from './routes/services';
import cmsRoutes from './routes/cms';
import crmRoutes from './routes/crm';
import commsRoutes from './routes/communication';
import billingRoutes from './routes/billing';
import analyticsRoutes from './routes/analytics';
import pluginRoutes from './routes/plugin';
import pluginEngineRoutes from './routes/pluginExtensionsEngine';
import marketplaceRoutes from './routes/marketplace';
import localizationRoutes from './routes/localization';
import mediaRoutes from './routes/media';
import livestreamRoutes from './routes/livestream';
import publicLivestreamRoutes from './routes/publicLivestream';
import churchServicesRoutes from './routes/churchServices';
import blogRoutes from './routes/blog';
import libraryRoutes from './routes/library';
import podcastRoutes from './routes/podcast';
import aiRoutes from './routes/ai';
import signageRoutes from './routes/signage';
import worshipRoutes from './routes/worship';
import givingRoutes from './routes/giving';
import partnershipsRoutes from './routes/partnerships';
import campaignsRoutes from './routes/campaigns';
import storeRoutes from './routes/store';
import financeRoutes from './routes/finance';
import funnelRoutes from './routes/funnels';
import communityRoutes from './routes/community';
import liveChatRoutes from './routes/liveChat';
import outreachRoutes from './routes/outreach';
import attendanceRoutes from './routes/attendance';
import volunteerRoutes from './routes/volunteer';
import formsRoutes from './routes/forms';
import prayerRoutes from './routes/prayer';
import salvationRoutes from './routes/salvation';
import lmsRoutes from './routes/lms';
import bibleRoutes from './routes/bible';
import cellRoutes from './routes/cells';
import childrenRoutes from './routes/children';
import eventsRoutes from './routes/events';
import liveMeetingsRoutes from './routes/liveMeetings';
import bookingsRoutes from './routes/bookings';
import mobileRoutes from './routes/mobile';
import whiteLabelRoutes from './routes/whiteLabel';
import multiBranchRoutes from './routes/multiBranch';
import aiCopilotRoutes from './routes/aiCopilot';
import settingsRoutes from './routes/settings';
import themeEngineRoutes from './routes/themeEngine';
import tenantRoutes from './routes/tenant';
import centralizedSettingsEngineRoutes from './routes/centralizedSettingsEngine';
import developerMarketplaceRoutes from './routes/developerMarketplace';
import domainTenantManagementRoutes from './routes/domainTenantManagement';
import digitalLibraryResourceCenterRoutes from './routes/digitalLibraryResourceCenter';
import dynamicBlogPublishingEngineRoutes from './routes/dynamicBlogPublishingEngine';


// Load .env before anything else
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const app = express();

function findWorkspaceRoot(startDir: string): string {
  let current = path.resolve(startDir);

  while (true) {
    if (
      fs.existsSync(path.join(current, 'apps')) &&
      fs.existsSync(path.join(current, 'packages')) &&
      fs.existsSync(path.join(current, 'package.json'))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(__dirname, '..');
    }
    current = parent;
  }
}

const workspaceRoot = findWorkspaceRoot(__dirname);
const appsRoot = path.join(workspaceRoot, 'apps');
const tenantDashboardPublic = path.join(appsRoot, 'tenant-dashboard', 'public');
const tenantDashboardBuilder = path.join(appsRoot, 'tenant-dashboard', 'src');
const superAdminPublic = path.join(appsRoot, 'super-admin', 'public');
const churchFrontendPublic = path.join(appsRoot, 'church-frontend', 'public');
const marketplaceFrontend = path.join(appsRoot, 'marketplace', 'frontend');
const marketplaceDeveloper = path.join(appsRoot, 'marketplace', 'developer');

// ── Global middleware ──────────────────────────────────────
app.use(helmet({
  hsts: isProd, // Only enforce HTTPS in production
  contentSecurityPolicy: isProd ? undefined : false, // Disable CSP in local development
}));
app.use(express.json());

// Rate limiting: 100 requests per 15 minutes in production; high limits/bypass locally
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 999999,
  message: { error: 'Too many requests, please try again later' },
  skip: () => !isProd,
});

// ── Serve static files ──────────────────────────────────────
app.use('/apps', express.static(appsRoot));
app.use('/page-builder', express.static(tenantDashboardBuilder));
app.use('/tenant-dashboard', express.static(tenantDashboardPublic));
app.use('/super-admin', express.static(superAdminPublic));
app.use('/church', express.static(churchFrontendPublic));
app.use('/marketplace', express.static(marketplaceFrontend));
app.use('/marketplace/developer', express.static(marketplaceDeveloper));

app.get(['/', '/index.html', '/super-admin'], (_req, res) => {
  res.sendFile(path.join(superAdminPublic, 'index.html'));
});

app.get('/cms', (_req, res) => {
  res.redirect('/admin?module=cms');
});

app.get(['/admin', '/admin.html'], (_req, res) => {
  res.sendFile(path.join(tenantDashboardPublic, 'index.html'));
});

app.get(['/dashboard', '/dashboard.html'], (req, res) => {
  res.redirect(302, '/admin' + (req.url.indexOf('?') >= 0 ? req.url.slice(req.url.indexOf('?')) : ''));
});

app.get(['/marketplace', '/marketplace.html'], (_req, res) => {
  res.sendFile(path.join(marketplaceFrontend, 'index.html'));
});

app.get(['/marketplace/developer', '/marketplace/developer/'], (_req, res) => {
  res.sendFile(path.join(marketplaceDeveloper, 'index.html'));
});

app.get(['/page-builder', '/page-builder/'], (_req, res) => {
  res.sendFile(path.join(tenantDashboardBuilder, 'index.html'));
});

app.get(['/church', '/church/', '/churchos', '/churchos.html'], (_req, res) => {
  res.sendFile(path.join(churchFrontendPublic, 'index.html'));
});

app.get(['/live.html', '/live/:id'], (_req, res) => {
  res.sendFile(path.join(churchFrontendPublic, 'live.html'));
});

app.use(express.static(workspaceRoot));

// ── Health check (no tenant required) ──────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Tenant gate — everything below requires x-tenant-id ───
app.use('/api', apiLimiter, tenantMiddleware, localeMiddleware);

// ── Route mounts ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/core-website-cms', cmsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/communication', commsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/billing-subscription-management', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/plugins', pluginRoutes);
app.use('/api/plugin-engine', pluginEngineRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/localization', localizationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/livestream', livestreamRoutes);
app.use('/api/public/livestream', publicLivestreamRoutes);
app.use('/api/church-services', churchServicesRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/podcast', podcastRoutes);
app.use('/api/podcast-audio-broadcasting', podcastRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-copilot', requireModule('ai-assistant-ministry-copilot'), aiCopilotRoutes);
app.use('/api/signage', signageRoutes);
app.use('/api/worship', worshipRoutes);
app.use('/api/giving', givingRoutes);
app.use('/api/partnerships', partnershipsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/funnels', funnelRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/chat', liveChatRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/prayer', prayerRoutes);
app.use('/api/salvation', salvationRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/bible', bibleRoutes);
app.use('/api/bible-scripture-engagement', bibleRoutes);
app.use('/api/cells', cellRoutes);
app.use('/api/cell-fellowship', cellRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/live-meetings', liveMeetingsRoutes);
app.use('/api/meetings', liveMeetingsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/whitelabel', whiteLabelRoutes);
app.use('/api/branches', multiBranchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/theme-engine', themeEngineRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/centralized-settings-engine', centralizedSettingsEngineRoutes);
app.use('/api/developer-marketplace', developerMarketplaceRoutes);
app.use('/api/domain-tenant-management', domainTenantManagementRoutes);
app.use('/api/digital-library-resource-center', digitalLibraryResourceCenterRoutes);
app.use('/api/dynamic-blog-publishing-engine', dynamicBlogPublishingEngineRoutes);
// ── Global error handler ──────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
