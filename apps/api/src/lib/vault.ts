import crypto from 'crypto';

const VAULT_SECRET = process.env.VAULT_SECRET || 'fallback-vault-secret-do-not-use-in-production';

/**
 * Derives a 32-byte (256-bit) encryption key unique to a specific tenant
 * by mixing the global VAULT_SECRET and the tenant's ID.
 */
function deriveKey(tenantId: string): Buffer {
  return crypto.pbkdf2Sync(VAULT_SECRET, tenantId, 10000, 32, 'sha256');
}

/**
 * Encrypts cleartext using AES-256-GCM.
 * The derived key is unique to the tenant ID.
 * Returns a colon-separated string: "iv_hex:auth_tag_hex:ciphertext_hex"
 */
export function encryptCredentials(plainText: string, tenantId: string): string {
  const key = deriveKey(tenantId);
  const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a colon-separated payload: "iv_hex:auth_tag_hex:ciphertext_hex"
 * using the key derived from the given tenant ID.
 */
export function decryptCredentials(encryptedPayload: string, tenantId: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted payload format');
  }

  const [ivHex, authTagHex, cipherTextHex] = parts;
  const key = deriveKey(tenantId);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
