import prisma from '../../lib/prisma';
import { decryptCredentials } from '../../lib/vault';
import { MockTwilioDriver } from './drivers/MockTwilioDriver';
import { MockStripeDriver } from './drivers/MockStripeDriver';
import { MockAwsS3Driver } from './drivers/MockAwsS3Driver';
import { MockOpenAiDriver } from './drivers/MockOpenAiDriver';
import { MockGeminiDriver } from './drivers/MockGeminiDriver';

/**
 * Resolves and instantiates the active database-configured driver for a given tenant,
 * category, and optionally, a specific feature module.
 *
 * Supports module-specific provider overrides. Falls back to default category configuration.
 *
 * @param tenantId The active tenant ID.
 * @param categoryId The service category (e.g., "sms", "payment", "media_storage").
 * @param moduleKey Optional module name to check for customized overrides.
 */
export async function resolveDriver(
  tenantId: string,
  categoryId: string,
  moduleKey?: string
): Promise<any> {
  let connectedService = null;

  // 1. Check if there's a module override
  if (moduleKey) {
    const override = await prisma.moduleProviderOverride.findFirst({
      where: { tenantId, moduleKey, categoryId },
      include: { connectedService: { include: { provider: true } } },
    });

    if (override && override.connectedService.isActive) {
      connectedService = override.connectedService;
    }
  }

  // 2. Fall back to default active service for this category
  if (!connectedService) {
    connectedService = await prisma.tenantConnectedService.findFirst({
      where: {
        tenantId,
        isActive: true,
        provider: { categoryId },
      },
      include: { provider: true },
    });
  }

  if (!connectedService) {
    throw new Error(`No active provider configured for category: ${categoryId}`);
  }

  // 3. Decrypt credentials
  const decrypted = decryptCredentials(connectedService.encryptedCredentials, tenantId);
  const config = JSON.parse(decrypted);

  // 4. Instantiate and return the driver based on provider ID
  switch (connectedService.providerId) {
    case 'twilio':
      return new MockTwilioDriver(config);
    case 'stripe':
      return new MockStripeDriver(config);
    case 'aws_s3':
      return new MockAwsS3Driver(config);
    case 'openai':
      return new MockOpenAiDriver(config);
    case 'gemini':
      return new MockGeminiDriver(config);
    // Add additional providers here as they are implemented
    default:
      throw new Error(`Driver implementation missing for provider: ${connectedService.providerId}`);
  }
}
