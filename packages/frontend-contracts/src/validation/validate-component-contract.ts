export interface ComponentValidationResult {
  isValid: boolean;
  errors: string[];
}

const PRIVATE_FIELDS = [
  'passwordHash',
  'password_hash',
  'creditCard',
  'apiKey',
  'clientSecret',
  'credentials',
  'encryptedCredentials',
  'privateKey'
];

export function validateComponentContractData(contractName: string, data: any): ComponentValidationResult {
  const errors: string[] = [];

  if (data === null || data === undefined) {
    errors.push('Contract data cannot be null or undefined');
    return { isValid: false, errors };
  }

  // 1. Detect private fields leak
  function checkPrivateFields(obj: any, pathStr = 'data'): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      if (PRIVATE_FIELDS.includes(key)) {
        errors.push('Unsafe private field detected in contract output at ' + pathStr + '.' + key);
      }
      if (typeof obj[key] === 'object') {
        checkPrivateFields(obj[key], pathStr + '.' + key);
      }
    }
  }
  checkPrivateFields(data);

  // 2. Detect direct raw database entities leak
  if (data && typeof data === 'object') {
    // Standard signature of a raw DB entity which is not mapped/sanitized
    if ('tenantId' in data || 'tenant_id' in data) {
      errors.push('Raw backend database record passed directly to theme component (leaked tenantId)');
    }
    if ('createdById' in data || 'updatedById' in data) {
      errors.push('Raw backend database record passed directly to theme component (leaked system references)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
