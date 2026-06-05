export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'hidden';

export interface FormFieldValidation {
  required: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  errorMessage?: string;
}

export interface FormFieldContract {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  validation: FormFieldValidation;
}

export interface FormContract {
  formKey: string;
  displayName: string;
  fields: FormFieldContract[];
  submitUrl: string;
  submitMethod: 'POST' | 'PUT' | 'PATCH';
  successMessage?: string;
  errorMessage?: string;
  recaptchaRequired?: boolean;
}
