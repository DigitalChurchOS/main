import React, { useState } from 'react';
import { FormContract } from '@churchos/frontend-contracts';
import { DefaultInput } from './DefaultInput';
import { DefaultSelect } from './DefaultSelect';
import { DefaultTextarea } from './DefaultTextarea';
import { DefaultCheckbox } from './DefaultCheckbox';
import { DefaultRadioGroup } from './DefaultRadioGroup';
import { DefaultFileUpload } from './DefaultFileUpload';
import { DefaultFormState } from './DefaultFormState';
import { PluginInjectionRenderer } from '../../plugins';

export interface DefaultFormRendererProps {
  formContract: FormContract;
  onSubmitSuccess?: (data: any) => void;
  onSubmitFailure?: (error: Error) => void;
  spamProtectionHook?: () => Promise<boolean>;
  analyticsHook?: (eventName: string, payload?: any) => void;
}

export const DefaultFormRenderer: React.FC<DefaultFormRendererProps> = ({
  formContract,
  onSubmitSuccess,
  onSubmitFailure,
  spamProtectionHook,
  analyticsHook
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    formContract.fields.forEach(field => {
      initial[field.name] = field.defaultValue !== undefined ? field.defaultValue : '';
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    formContract.fields.forEach(field => {
      const val = formData[field.name];
      if (field.validation.required && (!val || val === '')) {
        newErrors[field.name] = field.validation.errorMessage || `${field.label} is required`;
      } else if (field.validation.pattern && val) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(val)) {
          newErrors[field.name] = field.validation.errorMessage || `Invalid format for ${field.label}`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validate()) return;

    if (spamProtectionHook) {
      const isSpam = await spamProtectionHook();
      if (isSpam) {
        setErrorMsg('Spam filter check failed. Submission blocked.');
        return;
      }
    }

    setIsSubmitting(true);

    if (analyticsHook) {
      analyticsHook('form_submit_start', { formKey: formContract.formKey });
    }

    try {
      // Simulate or call the actual endpoint
      const response = await fetch(formContract.submitUrl, {
        method: formContract.submitMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to submit: Server responded with status ${response.status}`);
      }

      const responseData = await response.json().catch(() => ({}));
      
      setSuccessMsg(formContract.successMessage || 'Form submitted successfully.');
      
      if (analyticsHook) {
        analyticsHook('form_submit_success', { formKey: formContract.formKey });
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(responseData);
      }
      
      // Reset form fields
      setFormData(() => {
        const reset: Record<string, any> = {};
        formContract.fields.forEach(field => {
          reset[field.name] = field.defaultValue !== undefined ? field.defaultValue : '';
        });
        return reset;
      });
    } catch (err: any) {
      const msg = err.message || formContract.errorMessage || 'An error occurred during submission.';
      setErrorMsg(msg);
      
      if (analyticsHook) {
        analyticsHook('form_submit_error', { formKey: formContract.formKey, error: msg });
      }

      if (onSubmitFailure) {
        onSubmitFailure(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return React.createElement(
    'div',
    { className: 'w-full max-w-xl mx-auto p-6 bg-white border border-slate-200 rounded-xl space-y-6 font-sans' },
    React.createElement(PluginInjectionRenderer, { point: 'form.before', parentData: { formKey: formContract.formKey } }),
    React.createElement('h3', { className: 'text-lg font-bold text-slate-800 border-b border-slate-100 pb-2' }, formContract.displayName),
    
    React.createElement(
      'form',
      { onSubmit: handleSubmit, className: 'space-y-4' },
      formContract.fields.map(field => {
        const value = formData[field.name];
        const fieldError = errors[field.name];
        
        switch (field.type) {
          case 'textarea':
            return React.createElement(DefaultTextarea, {
              key: field.name,
              label: field.label,
              name: field.name,
              placeholder: field.placeholder,
              required: field.validation.required,
              value: value,
              onChange: (e) => handleFieldChange(field.name, e.target.value),
              error: fieldError
            });
            
          case 'select':
            return React.createElement(DefaultSelect, {
              key: field.name,
              label: field.label,
              name: field.name,
              required: field.validation.required,
              options: field.options,
              value: value,
              onChange: (e) => handleFieldChange(field.name, e.target.value),
              error: fieldError
            });
            
          case 'checkbox':
            return React.createElement(DefaultCheckbox, {
              key: field.name,
              label: field.label,
              name: field.name,
              required: field.validation.required,
              checked: !!value,
              onChange: (e) => handleFieldChange(field.name, e.target.checked),
              error: fieldError
            });
            
          case 'radio':
            return React.createElement(DefaultRadioGroup, {
              key: field.name,
              label: field.label,
              name: field.name,
              required: field.validation.required,
              options: field.options,
              value: value,
              onChange: (e) => handleFieldChange(field.name, e.target.value),
              error: fieldError
            });
            
          case 'file':
            return React.createElement(DefaultFileUpload, {
              key: field.name,
              label: field.label,
              name: field.name,
              required: field.validation.required,
              onChange: (e) => handleFieldChange(field.name, e.target.files),
              error: fieldError
            });
            
          case 'hidden':
            return React.createElement('input', {
              key: field.name,
              type: 'hidden',
              name: field.name,
              value: value
            });
            
          default:
            return React.createElement(DefaultInput, {
              key: field.name,
              label: field.label,
              name: field.name,
              placeholder: field.placeholder,
              type: field.type,
              required: field.validation.required,
              value: value,
              onChange: (e) => handleFieldChange(field.name, e.target.value),
              error: fieldError
            });
        }
      }),
      
      React.createElement(PluginInjectionRenderer, { point: 'form.hiddenFields', parentData: { formKey: formContract.formKey } }),

      React.createElement(DefaultFormState, {
        isSubmitting: isSubmitting,
        successMessage: successMsg,
        errorMessage: errorMsg,
        onReset: () => setSuccessMsg(null)
      }),
      
      React.createElement(PluginInjectionRenderer, { point: 'form.beforeSubmit', parentData: { formKey: formContract.formKey } }),

      !successMsg && React.createElement(
        'button',
        {
          type: 'submit',
          disabled: isSubmitting,
          className: `w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-white rounded-md text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-900 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`
        },
        'Submit Form'
      ),

      React.createElement(PluginInjectionRenderer, { point: 'form.afterSubmit', parentData: { formKey: formContract.formKey } })
    ),
    React.createElement(PluginInjectionRenderer, { point: 'form.after', parentData: { formKey: formContract.formKey } })
  );
};
