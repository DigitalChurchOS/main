import { ModuleUIContract } from '../core/base.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateModuleContract(contract: ModuleUIContract): ValidationResult {
  const errors: string[] = [];

  if (!contract.moduleKey) {
    errors.push('Missing moduleKey');
  }
  if (!contract.displayName) {
    errors.push('Missing displayName');
  }
  if (!contract.publicRoutes || !Array.isArray(contract.publicRoutes)) {
    errors.push('Missing or invalid publicRoutes array');
  } else {
    contract.publicRoutes.forEach((route, idx) => {
      if (!route.path) {
        errors.push('Route at index ' + idx + ' is missing path');
      }
      if (!route.type) {
        errors.push('Route at index ' + idx + ' is missing type');
      }
    });
  }

  if (!contract.seo) {
    errors.push('Missing required SEO details object');
  } else if (!contract.seo.title) {
    errors.push('SEO metadata is missing title');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
