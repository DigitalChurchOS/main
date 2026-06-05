import { FormFieldContract } from '../core/form.types';

export interface PluginFormContract {
  formKey: string;
  displayName: string;
  description: string;
  fields: FormFieldContract[];
  validationRules?: any;
  submitAction: string; // endpoint or handler label
  successState?: any;
  errorState?: any;
  spamProtectionHooks?: string[];
  analyticsEvents?: string[];
  requiredPermissions?: string[];
  requiredModules?: string[];
  visibilityRules?: any;
}
