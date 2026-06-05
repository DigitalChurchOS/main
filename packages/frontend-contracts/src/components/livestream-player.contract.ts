import { CTAContract } from '../core/cta.types';

export interface LivestreamPlayerContract {
  id: string;
  title: string;
  status: 'live' | 'offline' | 'countdown';
  streamUrl?: string | null;
  countdownTarget?: string | null;
  chatEnabled: boolean;
  cta?: CTAContract | null;
}
