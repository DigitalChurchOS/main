import { CTAContract } from '../core/cta.types';

export interface PrayerSessionCardContract {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  hostName: string;
  activeParticipants: number;
  cta: CTAContract;
}
