import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';

describe('Public Tenant Self-Registration API', () => {
  beforeAll(async () => {
    // Cleanup any existing test tenants
    await prisma.tenant.deleteMany({
      where: { subdomain: { in: ['public-test-church', 'public-test-church-normalized'] } }
    });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({
      where: { subdomain: { in: ['public-test-church', 'public-test-church-normalized'] } }
    });
    await prisma.$disconnect();
  });

  it('should successfully register a new tenant workspace publicly', async () => {
    const res = await request(app)
      .post('/api/auth/register-tenant')
      .send({
        name: 'Public Test Church',
        subdomain: 'public-test-church',
        ownerName: 'Pastor Timothy',
        ownerEmail: 'timothy@public-test.com',
        ownerPassword: 'Password123!'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBe('Public Test Church');
    expect(res.body.data.subdomain).toBe('public-test-church');

    // Verify tenant exists in database
    const dbTenant = await prisma.tenant.findUnique({
      where: { subdomain: 'public-test-church' }
    });
    expect(dbTenant).toBeDefined();
    expect(dbTenant?.status).toBe('active');

    // Verify owner user exists
    const dbUser = await prisma.user.findFirst({
      where: { tenantId: dbTenant?.id, email: 'timothy@public-test.com' }
    });
    expect(dbUser).toBeDefined();
    expect(dbUser?.status).toBe('active');

    // Verify default core modules are enabled
    const modules = await prisma.tenantModule.findMany({
      where: { tenantId: dbTenant?.id }
    });
    expect(modules.length).toBe(3);
    const keys = modules.map((m) => m.moduleKey);
    expect(keys).toContain('website-cms');
    expect(keys).toContain('theme-engine');
    expect(keys).toContain('domain-tenant-management');
  });

  it('should fail registration with duplicate subdomain', async () => {
    const res = await request(app)
      .post('/api/auth/register-tenant')
      .send({
        name: 'Another Public Test Church',
        subdomain: 'public-test-church', // duplicate subdomain
        ownerName: 'Pastor Timothy 2',
        ownerEmail: 'timothy2@public-test.com',
        ownerPassword: 'Password123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('is already taken');
  });

  it('should fail registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register-tenant')
      .send({
        name: 'Incomplete Church',
        subdomain: 'incomplete'
        // missing owner details
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('should normalize subdomain on registration and resolve config robustly with domain suffix', async () => {
    // 1. Register with a subdomain containing uppercase and domain suffix
    const registerRes = await request(app)
      .post('/api/auth/register-tenant')
      .send({
        name: 'Normalized Test Church',
        subdomain: 'Public-Test-Church-Normalized.churchos.online',
        ownerName: 'Pastor Tim',
        ownerEmail: 'tim@normalized.com',
        ownerPassword: 'Password123!'
      });

    expect(registerRes.status).toBe(201);
    // Subdomain should be stored as normalized 'public-test-church-normalized'
    expect(registerRes.body.data.subdomain).toBe('public-test-church-normalized');

    // 2. Query config using the raw input with domain suffix
    const resolveRes1 = await request(app)
      .get('/api/mobile/config/tenant/Public-Test-Church-Normalized.churchos.online');
    expect(resolveRes1.status).toBe(200);
    expect(resolveRes1.body.data.tenantId).toBe(registerRes.body.data.id);
    expect(resolveRes1.body.data.subdomain).toBe('public-test-church-normalized');

    // 3. Query config using the clean subdomain segment
    const resolveRes2 = await request(app)
      .get('/api/mobile/config/tenant/public-test-church-normalized');
    expect(resolveRes2.status).toBe(200);
    expect(resolveRes2.body.data.tenantId).toBe(registerRes.body.data.id);
  });
});
