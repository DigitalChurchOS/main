import { VisibilityState } from '../core/visibility.types';

export interface PrayerRoomContract {
  id: string;
  title: string;
  meetingToken: string;
  chatEnabled: boolean;
  hostId?: string | null;
  visibility: VisibilityState;
}
