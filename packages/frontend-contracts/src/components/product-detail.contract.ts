import { FormContract } from '../core/form.types';
import { SEOContract } from '../core/seo.types';

export interface ProductDetailContract {
  id: string;
  title: string;
  price: number;
  descriptionHtml?: string | null;
  images: string[];
  isDigital: boolean;
  purchaseForm: FormContract;
  seo: SEOContract;
}
