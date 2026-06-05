import { validateComponentContractData } from '@churchos/frontend-contracts';

export interface GuardResult {
  isSafe: boolean;
  errors: string[];
}

export function runSecurityAudit(slotKey: string, data: any): GuardResult {
  const validation = validateComponentContractData(slotKey, data);
  return {
    isSafe: validation.isValid,
    errors: validation.errors
  };
}

export function sanitizeContractData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  // Recursively remove any private fields or DB keys from reaching components
  const sanitized = Array.isArray(data) ? [] : {};
  
  const PRIVATE_KEYS = ['passwordHash', 'password_hash', 'creditCard', 'apiKey', 'clientSecret', 'privateKey'];
  
  for (const [key, value] of Object.entries(data)) {
    if (PRIVATE_KEYS.includes(key)) {
      continue; // Strip key
    }
    if (typeof value === 'object' && value !== null) {
      (sanitized as any)[key] = sanitizeContractData(value);
    } else {
      (sanitized as any)[key] = value;
    }
  }
  return sanitized;
}
