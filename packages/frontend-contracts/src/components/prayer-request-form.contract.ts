import { FormContract } from '../core/form.types';
import { CTAContract } from '../core/cta.types';

export interface PrayerRequestFormContract {
  form: FormContract;
  submitCta: CTAContract;
}
