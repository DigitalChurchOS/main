import { FormContract } from '../core/form.types';
import { SEOContract } from '../core/seo.types';

export interface GroupDetailContract {
  id: string;
  name: string;
  description?: string | null;
  schedule?: string | null;
  location?: string | null;
  membersCount: number;
  joinForm: FormContract;
  seo: SEOContract;
}
