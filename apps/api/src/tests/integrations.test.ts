import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { decryptCredentials } from '../lib/vault';
import { resolveDriver } from '../services/integrations/registry';
import { MockTwilioDriver } from '../services/integrations/drivers/MockTwilioDriver';
import { MockAwsS3Driver } from '../services/integrations/drivers/MockAwsS3Driver';
import { MockStripeDriver } from '../services/integrations/drivers/MockStripeDriver';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Connected Services & Integrations Engine', () => {
  let tenantId: string;
  let adminToken: string;
  let twilioServiceId: string;
  let s3ServiceId: string;

  beforeAll(async () => {
    // 1. Clean up integrations from prior runs
    await prisma.moduleProviderOverride.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Integrations Grace Church', subdomain: 'grace-int' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & assign tenant.settings permission
    const settingsPerm = await prisma.permission.findFirst({
      where: { name: 'tenant.settings' },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    if (settingsPerm) {
      await prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: settingsPerm.id },
      });
    }

    // 4. Create Admin User
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@grace-int.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // A. CREDENTIALS ENCRYPTION AND SAVE
  // ─────────────────────────────────────────────────────────────
  describe('Credentials Vault Encryption', () => {
    it('should encrypt and save Twilio credentials safely', async () => {
      const creds = {
        accountSid: 'AC_test_sid_12345',
        authToken: 'auth_token_secret_998877',
        fromNumber: '+1234567890',
      };

      const res = await request(app)
        .post('/api/services')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          providerId: 'twilio',
          credentials: creds,
          providerMode: 'bring_your_own',
          isActive: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerId).toBe('twilio');
      twilioServiceId = res.body.data.id;

      // Direct DB verification: check that credentials are encrypted in DB
      const stored = await prisma.tenantConnectedService.findUnique({
        where: { id: twilioServiceId },
      });

      expect(stored).toBeDefined();
      expect(stored!.encryptedCredentials).not.toContain('AC_test_sid_12345'); // Plaintext check
      expect(stored!.encryptedCredentials).toContain(':'); // Cipher formatting check

      // Decrypt and compare to ensure correct retrieval
      const decrypted = decryptCredentials(stored!.encryptedCredentials, tenantId);
      const parsed = JSON.parse(decrypted);

      expect(parsed.accountSid).toBe(creds.accountSid);
      expect(parsed.authToken).toBe(creds.authToken);
      expect(parsed.fromNumber).toBe(creds.fromNumber);
    });

    it('should encrypt and save AWS S3 credentials safely', async () => {
      const creds = {
        bucketName: 'grace-int-bucket',
        accessKeyId: 'AWS_ACCESS_KEY_XYZ',
        secretAccessKey: 'AWS_SECRET_ACCESS_KEY_112233',
        region: 'us-east-1',
      };

      const res = await request(app)
        .post('/api/services')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          providerId: 'aws_s3',
          credentials: creds,
          providerMode: 'bring_your_own',
          isActive: true,
        });

      expect(res.status).toBe(200);
      s3ServiceId = res.body.data.id;

      const stored = await prisma.tenantConnectedService.findUnique({
        where: { id: s3ServiceId },
      });
      expect(stored!.encryptedCredentials).not.toContain('AWS_SECRET_ACCESS_KEY_112233');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // B. GET CONFIG LIST & MASKING KEYS
  // ─────────────────────────────────────────────────────────────
  describe('Config Retrieval and Masking', () => {
    it('should list services and mask credentials parameters keys', async () => {
      const res = await request(app)
        .get('/api/services')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);

      const twilioConfig = res.body.data.find((s: any) => s.providerId === 'twilio');
      expect(twilioConfig).toBeDefined();
      expect(twilioConfig.configuredKeys).toContain('accountSid');
      expect(twilioConfig.configuredKeys).toContain('authToken');
      expect(twilioConfig.configuredKeys).toContain('fromNumber');
      expect(twilioConfig.encryptedCredentials).toBeUndefined(); // Verify raw string is blocked
    });
  });

  // ─────────────────────────────────────────────────────────────
  // C. DYNAMIC DRIVER RESOLUTION & OVERRIDES
  // ─────────────────────────────────────────────────────────────
  describe('Driver Resolution & Module Overrides', () => {
    it('should resolve default Twilio driver for sms category', async () => {
      const driver = await resolveDriver(tenantId, 'sms');

      expect(driver).toBeInstanceOf(MockTwilioDriver);
      // Run mock functionality
      const smsResult = await driver.sendSMS('+1999888777', 'Hello Test!');
      expect(smsResult.success).toBe(true);
      expect(smsResult.messageId).toContain('tw_msg_');
    });

    it('should resolve default AWS S3 driver for media_storage category', async () => {
      const driver = await resolveDriver(tenantId, 'media_storage');

      expect(driver).toBeInstanceOf(MockAwsS3Driver);
      const uploadResult = await driver.uploadFile('test.png', Buffer.from('data'), 'image/png');
      expect(uploadResult.success).toBe(true);
      expect(uploadResult.fileUrl).toContain('grace-int-bucket.s3.us-east-1.amazonaws.com');
    });

    it('should respect module-specific overrides', async () => {
      // 1. Save a Stripe configuration for payments category
      const stripeCreds = {
        secretKey: 'sk_test_stripe_secret_key_112233',
        webhookSecret: 'whsec_stripe_webhook_secret_445566',
      };

      const stripeServiceRes = await request(app)
        .post('/api/services')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          providerId: 'stripe',
          credentials: stripeCreds,
          providerMode: 'bring_your_own',
          isActive: true,
        });

      expect(stripeServiceRes.status).toBe(200);
      const stripeServiceId = stripeServiceRes.body.data.id;

      // 2. Set an override for the 'donations' module to use Stripe for 'payment' category
      const overrideRes = await request(app)
        .post('/api/services/overrides')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          moduleKey: 'donations-module',
          categoryId: 'payment',
          connectedServiceId: stripeServiceId,
        });

      expect(overrideRes.status).toBe(200);
      expect(overrideRes.body.success).toBe(true);

      // 3. Verify that requesting with the moduleKey resolves the Stripe driver
      const driver = await resolveDriver(tenantId, 'payment', 'donations-module');
      expect(driver).toBeInstanceOf(MockStripeDriver);
      const paymentRes = await driver.createPaymentIntent(1000, 'usd');
      expect(paymentRes.success).toBe(true);
      expect(paymentRes.transactionId).toContain('ch_');

      // 4. Verify that requesting without moduleKey also resolves Stripe (since it is the default payment provider)
      const defaultDriver = await resolveDriver(tenantId, 'payment');
      expect(defaultDriver).toBeInstanceOf(MockStripeDriver);
    });
  });
});
