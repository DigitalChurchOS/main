import { FormContract } from '../core/form.types';

const formsMap = new Map<string, FormContract>();

export function registerFormContract(form: FormContract): void {
  if (formsMap.has(form.formKey)) {
    throw new Error('Duplicate form key: ' + form.formKey + ' is already registered.');
  }
  formsMap.set(form.formKey, form);
}

export function getFormContract(formKey: string): FormContract | undefined {
  return formsMap.get(formKey);
}

export function listFormContracts(): FormContract[] {
  return Array.from(formsMap.values());
}
