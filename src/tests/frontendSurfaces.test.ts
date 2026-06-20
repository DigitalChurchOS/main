import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';

describe('Ecclesia frontend surface mock integration endpoint', () => {
  let tenantId: string;

  beforeAll(async () => {
    await prisma.tenant.deleteMany({ where: { subdomain: 'surface-test' } });
    const tenant = await prisma.tenant.create({
      data: { name: 'Surface Test Church', subdomain: 'surface-test', status: 'active' },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('accepts a tenant-isolated frontend surface submission', async () => {
    const res = await request(app)
      .post('/api/frontend-surfaces/new-visitor/submit')
      .set('X-Tenant-ID', tenantId)
      .send({
        surfaceKey: 'form-new-visitor',
        surfaceTitle: 'New Visitor / Guest Connection Card Form',
        moduleKey: 'crm',
        answers: {
          firstName: 'Ada',
          lastName: 'Stone',
          email: 'ada@example.com',
        },
        metadata: { phase: 'IV' },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.tenantId).toBe(tenantId);
    expect(res.body.data.slug).toBe('new-visitor');
    expect(res.body.data.status).toBe('accepted');
  });

  it('rejects malformed surface submissions with custom-alert friendly errors', async () => {
    const res = await request(app)
      .post('/api/frontend-surfaces/new-visitor/submit')
      .set('X-Tenant-ID', tenantId)
      .send({ surfaceKey: 'form-new-visitor' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('answers object is required');
  });

  it('handles generic surface actions for modal and global component checks', async () => {
    const res = await request(app)
      .post('/api/frontend-surfaces/network-alert-modal/action')
      .set('X-Tenant-ID', tenantId)
      .send({ action: 'Preview Modal' });

    expect(res.status).toBe(200);
    expect(res.body.data.tenantId).toBe(tenantId);
    expect(res.body.data.status).toBe('handled');
  });
});
