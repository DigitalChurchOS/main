import { FormContract } from '../core/form.types';
import { CTAContract } from '../core/cta.types';

export interface EventRegistrationFormContract {
  eventId: string;
  eventTitle: string;
  form: FormContract;
  submitCta: CTAContract;
}
