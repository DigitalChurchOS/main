export interface PluginGuardResult {
  isSafe: boolean;
  errors: string[];
}

const bannedFields = [
  'passwordHash',
  'password',
  'apiKey',
  'api_key',
  'secret',
  'clientSecret',
  'client_secret',
  'token',
  'privateKey',
  'private_key',
  'webhookSecret',
  'stripeSecret',
  'stripe_secret'
];

export function runPluginSecurityAudit(slotKey: string, data: any): PluginGuardResult {
  const errors: string[] = [];

  if (!data) {
    return { isSafe: true, errors: [] };
  }

  // Enforce no raw backend DB records containing platform-level secrets or direct queries
  const checkKeys = (obj: any, path = '') => {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key of Object.keys(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      
      // Prevent private keys or API credentials leakage
      const lowerKey = key.toLowerCase();
      const hasBanned = bannedFields.some(banned => lowerKey.includes(banned.toLowerCase()));
      
      if (hasBanned && obj[key] !== undefined && obj[key] !== null) {
        errors.push(`Unsafe private or credential field detected: "${fullPath}"`);
      }

      checkKeys(obj[key], fullPath);
    }
  };

  checkKeys(data);

  return {
    isSafe: errors.length === 0,
    errors
  };
}

export function sanitizePluginData(data: any, settingsSchema?: any[]): any {
  if (!data) return data;

  // Deep clone to prevent mutating original data
  const cloned = JSON.parse(JSON.stringify(data));

  // Determine secret field names to strip based on settings schema
  const secretFieldNames = new Set<string>();
  if (settingsSchema) {
    for (const field of settingsSchema) {
      if (field.type === 'secret') {
        secretFieldNames.add(field.name);
      }
    }
  }

  const clean = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const shouldStrip =
        secretFieldNames.has(key) ||
        bannedFields.some(banned => lowerKey.includes(banned.toLowerCase()));

      if (shouldStrip) {
        delete obj[key];
      } else {
        clean(obj[key]);
      }
    }
  };

  clean(cloned);
  return cloned;
}
