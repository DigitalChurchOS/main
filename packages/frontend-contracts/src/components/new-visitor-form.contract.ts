import { FormContract } from '../core/form.types';
import { CTAContract } from '../core/cta.types';

export interface NewVisitorFormContract {
  form: FormContract;
  submitCta: CTAContract;
}
