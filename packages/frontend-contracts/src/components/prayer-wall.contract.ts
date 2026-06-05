import { CTAContract } from '../core/cta.types';

export interface PrayerRequestItem {
  id: string;
  requesterName: string;
  requestText: string;
  date: string;
  prayersCount: number;
  hasPrayed?: boolean;
}

export interface PrayerWallContract {
  requests: PrayerRequestItem[];
  submitRequestCta: CTAContract;
}
