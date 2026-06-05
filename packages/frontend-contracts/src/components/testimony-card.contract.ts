import { CTAContract } from '../core/cta.types';

export interface TestimonyCardContract {
  id: string;
  authorName: string;
  content: string;
  date: string;
  likesCount: number;
  cta: CTAContract;
}
