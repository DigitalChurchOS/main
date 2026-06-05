import { CTAContract } from '../core/cta.types';

export interface ProductCardContract {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  thumbnailUrl?: string | null;
  isDigital: boolean;
  cta: CTAContract;
}
