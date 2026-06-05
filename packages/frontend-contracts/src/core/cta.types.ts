export type CTAAction =
  | 'view'
  | 'register'
  | 'join'
  | 'watch'
  | 'give'
  | 'donate'
  | 'partner'
  | 'enroll'
  | 'download'
  | 'submit'
  | 'share'
  | 'pray'
  | 'i_prayed'
  | 'request_follow_up'
  | 'contact'
  | 'login'
  | 'continue';

export interface CTAContract {
  label: string;
  action: CTAAction;
  url: string;
  isPrimary?: boolean;
  analyticsKey?: string;
  openInNewTab?: boolean;
  iconName?: string;
}
