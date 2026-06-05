import { FormContract } from '../core/form.types';
import { CTAContract } from '../core/cta.types';
import { GivingCategoryCardContract } from './giving-category-card.contract';

export interface GivingFormContract {
  categories: GivingCategoryCardContract[];
  form: FormContract;
  suggestedAmounts: number[];
  submitCta: CTAContract;
}
