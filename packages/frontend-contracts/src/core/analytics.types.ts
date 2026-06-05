export type AnalyticsEventType =
  | 'page_view'
  | 'cta_click'
  | 'media_play'
  | 'media_pause'
  | 'media_complete'
  | 'media_progress'
  | 'form_view'
  | 'form_submit'
  | 'form_error'
  | 'donation_initiate'
  | 'donation_complete'
  | 'event_registration_complete'
  | 'course_enroll'
  | 'prayer_request_submitted'
  | 'login_success'
  | 'search_performed';

export interface AnalyticsEventContract {
  eventName: string;
  eventType: AnalyticsEventType;
  payloadKeys: string[];
  description?: string;
}
