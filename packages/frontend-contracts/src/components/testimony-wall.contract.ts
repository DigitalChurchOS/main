import { CTAContract } from '../core/cta.types';
import { TestimonyCardContract } from './testimony-card.contract';

export interface TestimonyWallContract {
  testimonies: TestimonyCardContract[];
  submitTestimonyCta: CTAContract;
}
