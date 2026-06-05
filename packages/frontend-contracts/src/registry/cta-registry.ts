import { CTAAction, CTAContract } from '../core/cta.types';

const standardCTAs = new Map<CTAAction, Partial<CTAContract>>();

standardCTAs.set('view', { label: 'View Details', action: 'view' });
standardCTAs.set('register', { label: 'Register Now', action: 'register' });
standardCTAs.set('join', { label: 'Join Us', action: 'join' });
standardCTAs.set('watch', { label: 'Watch Live', action: 'watch' });
standardCTAs.set('give', { label: 'Give Online', action: 'give' });
standardCTAs.set('donate', { label: 'Donate Now', action: 'donate' });
standardCTAs.set('partner', { label: 'Partner with Us', action: 'partner' });
standardCTAs.set('enroll', { label: 'Enroll Today', action: 'enroll' });
standardCTAs.set('download', { label: 'Download File', action: 'download' });
standardCTAs.set('submit', { label: 'Submit', action: 'submit' });
standardCTAs.set('share', { label: 'Share', action: 'share' });
standardCTAs.set('pray', { label: 'Submit Prayer', action: 'pray' });
standardCTAs.set('i_prayed', { label: 'I Prayed', action: 'i_prayed' });
standardCTAs.set('request_follow_up', { label: 'Request Connection', action: 'request_follow_up' });
standardCTAs.set('contact', { label: 'Contact Us', action: 'contact' });
standardCTAs.set('login', { label: 'Login to Account', action: 'login' });
standardCTAs.set('continue', { label: 'Continue Reading', action: 'continue' });

export function getStandardCTA(action: CTAAction, customOverrides?: Partial<CTAContract>): CTAContract {
  const defaults = standardCTAs.get(action) || { label: 'Click Here', action };
  return {
    label: customOverrides?.label || defaults.label!,
    action: action,
    url: customOverrides?.url || '#',
    isPrimary: customOverrides?.isPrimary ?? true,
    analyticsKey: customOverrides?.analyticsKey || 'cta_' + action,
    openInNewTab: customOverrides?.openInNewTab ?? false,
    iconName: customOverrides?.iconName
  };
}
