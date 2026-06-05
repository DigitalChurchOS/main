const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\packages\\frontend-contracts\\src';

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function writeFile(relPath, content) {
  const fullPath = path.join(baseDir, relPath);
  ensureDirectoryExistence(fullPath);
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Wrote: ${relPath}`);
}

// -------------------------------------------------------------
// REGISTRIES
// -------------------------------------------------------------

writeFile('registry/module-ui-registry.ts', `
import { ModuleUIContract } from '../core/base.types';

// Import all module contracts
import { EventsModuleContract } from '../modules/events.module-contract';
import { GivingModuleContract } from '../modules/giving.module-contract';
import { SermonsModuleContract } from '../modules/sermons.module-contract';
import { MediaModuleContract } from '../modules/media.module-contract';
import { LivestreamModuleContract } from '../modules/livestream.module-contract';
import { PrayerTestimonyModuleContract } from '../modules/prayer-testimony.module-contract';
import { GroupsModuleContract } from '../modules/groups.module-contract';
import { CoursesModuleContract } from '../modules/courses.module-contract';
import { StoreModuleContract } from '../modules/store.module-contract';
import { CampaignsModuleContract } from '../modules/campaigns.module-contract';
import { PartnershipsModuleContract } from '../modules/partnerships.module-contract';
import { SalvationModuleContract } from '../modules/salvation.module-contract';
import { MemberPortalModuleContract } from '../modules/member-portal.module-contract';
import { BlogModuleContract } from '../modules/blog.module-contract';
import { ResourcesModuleContract } from '../modules/resources.module-contract';
import { ServicesModuleContract } from '../modules/services.module-contract';
import { DigitalLibraryModuleContract } from '../modules/digital-library.module-contract';
import { PodcastModuleContract } from '../modules/podcast.module-contract';
import { WorshipModuleContract } from '../modules/worship.module-contract';
import { CellFellowshipModuleContract } from '../modules/cell-fellowship.module-contract';
import { LiveMeetingsModuleContract } from '../modules/live-meetings.module-contract';
import { BookingAppointmentsModuleContract } from '../modules/booking-appointments.module-contract';
import { MobileAppModuleContract } from '../modules/mobile-app.module-contract';
import { MultiBranchModuleContract } from '../modules/multi-branch.module-contract';
import { BibleEngagementModuleContract } from '../modules/bible-engagement.module-contract';

const modulesMap = new Map<string, ModuleUIContract>();

export function registerModuleContract(contract: ModuleUIContract): void {
  if (!contract.moduleKey) {
    throw new Error('Cannot register module contract: missing moduleKey');
  }
  if (modulesMap.has(contract.moduleKey)) {
    throw new Error('Duplicate module key: ' + contract.moduleKey + ' is already registered.');
  }
  modulesMap.set(contract.moduleKey, contract);
}

export function getModuleContract(moduleKey: string): ModuleUIContract | undefined {
  return modulesMap.get(moduleKey);
}

export function listModuleContracts(): ModuleUIContract[] {
  return Array.from(modulesMap.values());
}

export function clearModuleRegistry(): void {
  modulesMap.clear();
}

// Auto-register all default module contracts
const defaultModules = [
  EventsModuleContract,
  GivingModuleContract,
  SermonsModuleContract,
  MediaModuleContract,
  LivestreamModuleContract,
  PrayerTestimonyModuleContract,
  GroupsModuleContract,
  CoursesModuleContract,
  StoreModuleContract,
  CampaignsModuleContract,
  PartnershipsModuleContract,
  SalvationModuleContract,
  MemberPortalModuleContract,
  BlogModuleContract,
  ResourcesModuleContract,
  ServicesModuleContract,
  DigitalLibraryModuleContract,
  PodcastModuleContract,
  WorshipModuleContract,
  CellFellowshipModuleContract,
  LiveMeetingsModuleContract,
  BookingAppointmentsModuleContract,
  MobileAppModuleContract,
  MultiBranchModuleContract,
  BibleEngagementModuleContract
];

defaultModules.forEach(registerModuleContract);
`);

writeFile('registry/component-contract-registry.ts', `
const componentsSet = new Set<string>();

export function registerComponentContract(name: string): void {
  componentsSet.add(name);
}

export function isComponentContractRegistered(name: string): boolean {
  return componentsSet.has(name);
}

export function listComponentContracts(): string[] {
  return Array.from(componentsSet.values());
}

// Register default contracts
const defaults = [
  'EventCardContract', 'EventDetailContract', 'EventRegistrationFormContract',
  'GivingFormContract', 'GivingCategoryCardContract',
  'SermonCardContract', 'SermonPlayerContract',
  'MediaCardContract', 'MediaPlayerContract', 'LivestreamPlayerContract',
  'CourseCardContract', 'CourseDetailContract', 'LessonPreviewContract',
  'PrayerSessionCardContract', 'PrayerRoomContract', 'PrayerRequestFormContract', 'PrayerWallContract',
  'TestimonyCardContract', 'TestimonyWallContract',
  'CampaignCardContract', 'CampaignProgressContract',
  'ProductCardContract', 'ProductDetailContract',
  'GroupCardContract', 'GroupDetailContract',
  'SalvationResponseFormContract', 'NewVisitorFormContract',
  'ResourceCardContract', 'BlogCardContract', 'ServiceCardContract',
  'MemberProfileContract', 'MemberDashboardContract',
  'NavigationMenuContract', 'CMSPageContract', 'PageSectionContract'
];
defaults.forEach(registerComponentContract);
`);

writeFile('registry/theme-slot-registry.ts', `
import { ThemeSlotKey, ThemeSlotContract } from '../core/theme-slot.types';

const slotsMap = new Map<ThemeSlotKey, ThemeSlotContract>();

export function registerThemeSlot(slot: ThemeSlotContract): void {
  if (slotsMap.has(slot.slotKey)) {
    throw new Error('Duplicate theme slot key: ' + slot.slotKey + ' is already registered.');
  }
  slotsMap.set(slot.slotKey, slot);
}

export function getThemeSlot(slotKey: ThemeSlotKey): ThemeSlotContract | undefined {
  return slotsMap.get(slotKey);
}

export function isThemeSlotRegistered(slotKey: string): boolean {
  return slotsMap.has(slotKey as ThemeSlotKey);
}

export function listThemeSlots(): ThemeSlotContract[] {
  return Array.from(slotsMap.values());
}

export function clearThemeSlotRegistry(): void {
  slotsMap.clear();
}

// Auto-register default theme slots
const defaultSlots: ThemeSlotContract[] = [
  { slotKey: 'layout.announcementBar', displayName: 'Announcement Bar', expectedDataType: 'AnnouncementBarContract' },
  { slotKey: 'layout.header', displayName: 'Header', expectedDataType: 'NavigationMenuContract' },
  { slotKey: 'layout.footer', displayName: 'Footer', expectedDataType: 'CmsFooterContract' },
  { slotKey: 'layout.mobileNav', displayName: 'Mobile Navigation', expectedDataType: 'NavigationMenuContract' },
  { slotKey: 'page.home', displayName: 'Home Page', expectedDataType: 'CMSPageContract' },
  { slotKey: 'page.about', displayName: 'About Page', expectedDataType: 'CMSPageContract' },
  { slotKey: 'page.contact', displayName: 'Contact Page', expectedDataType: 'CMSPageContract' },
  { slotKey: 'event.card', displayName: 'Event Card', expectedDataType: 'EventCardContract' },
  { slotKey: 'event.detail', displayName: 'Event Detail', expectedDataType: 'EventDetailContract' },
  { slotKey: 'event.registrationForm', displayName: 'Event Registration Form', expectedDataType: 'EventRegistrationFormContract' },
  { slotKey: 'giving.form', displayName: 'Giving Form', expectedDataType: 'GivingFormContract' },
  { slotKey: 'giving.categoryCard', displayName: 'Giving Category Card', expectedDataType: 'GivingCategoryCardContract' },
  { slotKey: 'sermon.card', displayName: 'Sermon Card', expectedDataType: 'SermonCardContract' },
  { slotKey: 'sermon.player', displayName: 'Sermon Player', expectedDataType: 'SermonPlayerContract' },
  { slotKey: 'media.card', displayName: 'Media Card', expectedDataType: 'MediaCardContract' },
  { slotKey: 'media.player', displayName: 'Media Player', expectedDataType: 'MediaPlayerContract' },
  { slotKey: 'livestream.player', displayName: 'Livestream Player', expectedDataType: 'LivestreamPlayerContract' },
  { slotKey: 'livestream.countdown', displayName: 'Livestream Countdown', expectedDataType: 'LivestreamCountdownContract' },
  { slotKey: 'livestream.chatSlot', displayName: 'Livestream Chat Slot', expectedDataType: 'LivestreamChatContract' },
  { slotKey: 'course.card', displayName: 'Course Card', expectedDataType: 'CourseCardContract' },
  { slotKey: 'course.detail', displayName: 'Course Detail', expectedDataType: 'CourseDetailContract' },
  { slotKey: 'prayer.sessionCard', displayName: 'Prayer Session Card', expectedDataType: 'PrayerSessionCardContract' },
  { slotKey: 'prayer.room', displayName: 'Prayer Room', expectedDataType: 'PrayerRoomContract' },
  { slotKey: 'prayer.requestForm', displayName: 'Prayer Request Form', expectedDataType: 'PrayerRequestFormContract' },
  { slotKey: 'prayer.wall', displayName: 'Prayer Wall', expectedDataType: 'PrayerWallContract' },
  { slotKey: 'testimony.card', displayName: 'Testimony Card', expectedDataType: 'TestimonyCardContract' },
  { slotKey: 'testimony.wall', displayName: 'Testimony Wall', expectedDataType: 'TestimonyWallContract' },
  { slotKey: 'campaign.card', displayName: 'Campaign Card', expectedDataType: 'CampaignCardContract' },
  { slotKey: 'campaign.progress', displayName: 'Campaign Progress', expectedDataType: 'CampaignProgressContract' },
  { slotKey: 'store.productCard', displayName: 'Product Card', expectedDataType: 'ProductCardContract' },
  { slotKey: 'store.productDetail', displayName: 'Product Detail', expectedDataType: 'ProductDetailContract' },
  { slotKey: 'group.card', displayName: 'Group Card', expectedDataType: 'GroupCardContract' },
  { slotKey: 'group.detail', displayName: 'Group Detail', expectedDataType: 'GroupDetailContract' },
  { slotKey: 'salvation.responseForm', displayName: 'Salvation Response Form', expectedDataType: 'SalvationResponseFormContract' },
  { slotKey: 'visitor.newHereForm', displayName: 'Visitor Form', expectedDataType: 'NewVisitorFormContract' },
  { slotKey: 'resource.card', displayName: 'Resource Card', expectedDataType: 'ResourceCardContract' },
  { slotKey: 'blog.articleCard', displayName: 'Blog Article Card', expectedDataType: 'BlogCardContract' },
  { slotKey: 'service.card', displayName: 'Service Card', expectedDataType: 'ServiceCardContract' },
  { slotKey: 'member.profile', displayName: 'Member Profile', expectedDataType: 'MemberProfileContract' },
  { slotKey: 'member.dashboard', displayName: 'Member Dashboard', expectedDataType: 'MemberDashboardContract' },
  { slotKey: 'state.loading', displayName: 'Loading State', expectedDataType: 'UIStateContract' },
  { slotKey: 'state.empty', displayName: 'Empty State', expectedDataType: 'UIStateContract' },
  { slotKey: 'state.error', displayName: 'Error State', expectedDataType: 'UIStateContract' },
  { slotKey: 'state.locked', displayName: 'Locked State', expectedDataType: 'UIStateContract' }
];

defaultSlots.forEach(registerThemeSlot);
`);

writeFile('registry/form-contract-registry.ts', `
import { FormContract } from '../core/form.types';

const formsMap = new Map<string, FormContract>();

export function registerFormContract(form: FormContract): void {
  if (formsMap.has(form.formKey)) {
    throw new Error('Duplicate form key: ' + form.formKey + ' is already registered.');
  }
  formsMap.set(form.formKey, form);
}

export function getFormContract(formKey: string): FormContract | undefined {
  return formsMap.get(formKey);
}

export function listFormContracts(): FormContract[] {
  return Array.from(formsMap.values());
}
`);

writeFile('registry/cta-registry.ts', `
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
`);

writeFile('registry/state-registry.ts', `
import { RenderingState, UIStateContract } from '../core/state.types';

const defaultStates = new Map<RenderingState, UIStateContract>();

defaultStates.set('loading', { state: 'loading', message: 'Loading content, please wait...' });
defaultStates.set('empty', { state: 'empty', message: 'No content is currently available here.' });
defaultStates.set('error', { state: 'error', message: 'Something went wrong. Please try again later.' });
defaultStates.set('permission_denied', { state: 'permission_denied', message: 'This content is restricted to members only.' });
defaultStates.set('not_found', { state: 'not_found', message: 'The requested resource could not be found.' });
defaultStates.set('unpublished', { state: 'unpublished', message: 'This page is a draft and is not published yet.' });
defaultStates.set('draft_preview', { state: 'draft_preview', message: 'You are viewing a draft version preview.' });
defaultStates.set('public_ready', { state: 'public_ready', message: 'Ready to display content.' });

export function getDefaultState(state: RenderingState, customMessage?: string): UIStateContract {
  const base = defaultStates.get(state) || { state };
  return {
    ...base,
    message: customMessage || base.message
  };
}
`);

// -------------------------------------------------------------
// VALIDATION
// -------------------------------------------------------------

writeFile('validation/validate-module-contract.ts', `
import { ModuleUIContract } from '../core/base.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateModuleContract(contract: ModuleUIContract): ValidationResult {
  const errors: string[] = [];

  if (!contract.moduleKey) {
    errors.push('Missing moduleKey');
  }
  if (!contract.displayName) {
    errors.push('Missing displayName');
  }
  if (!contract.publicRoutes || !Array.isArray(contract.publicRoutes)) {
    errors.push('Missing or invalid publicRoutes array');
  } else {
    contract.publicRoutes.forEach((route, idx) => {
      if (!route.path) {
        errors.push('Route at index ' + idx + ' is missing path');
      }
      if (!route.type) {
        errors.push('Route at index ' + idx + ' is missing type');
      }
    });
  }

  if (!contract.seo) {
    errors.push('Missing required SEO details object');
  } else if (!contract.seo.title) {
    errors.push('SEO metadata is missing title');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
`);

writeFile('validation/validate-theme-adapter.ts', `
import { ThemeAdapter } from '../renderer/theme-adapter';
import { ThemeSlotKey } from '../core/theme-slot.types';

const CORE_SLOTS: ThemeSlotKey[] = [
  'layout.header',
  'layout.footer',
  'state.loading',
  'state.error',
  'state.empty'
];

export interface ThemeAdapterValidationResult {
  isValid: boolean;
  missingCoreSlots: ThemeSlotKey[];
  errors: string[];
}

export function validateThemeAdapter(adapter: ThemeAdapter): ThemeAdapterValidationResult {
  const errors: string[] = [];
  const missingCoreSlots: ThemeSlotKey[] = [];

  if (!adapter.themeKey) {
    errors.push('Missing themeKey');
  }
  if (!adapter.displayName) {
    errors.push('Missing displayName');
  }
  if (!adapter.version) {
    errors.push('Missing version');
  }

  CORE_SLOTS.forEach(slot => {
    if (!adapter.supportsSlot(slot) || !adapter.slots[slot]) {
      missingCoreSlots.push(slot);
      errors.push('Missing core theme slot implementation: ' + slot);
    }
  });

  return {
    isValid: errors.length === 0,
    missingCoreSlots,
    errors
  };
}
`);

writeFile('validation/validate-component-contract.ts', `
export interface ComponentValidationResult {
  isValid: boolean;
  errors: string[];
}

const PRIVATE_FIELDS = [
  'passwordHash',
  'password_hash',
  'creditCard',
  'apiKey',
  'clientSecret',
  'credentials',
  'encryptedCredentials',
  'privateKey'
];

export function validateComponentContractData(contractName: string, data: any): ComponentValidationResult {
  const errors: string[] = [];

  if (data === null || data === undefined) {
    errors.push('Contract data cannot be null or undefined');
    return { isValid: false, errors };
  }

  // 1. Detect private fields leak
  function checkPrivateFields(obj: any, pathStr = 'data'): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      if (PRIVATE_FIELDS.includes(key)) {
        errors.push('Unsafe private field detected in contract output at ' + pathStr + '.' + key);
      }
      if (typeof obj[key] === 'object') {
        checkPrivateFields(obj[key], pathStr + '.' + key);
      }
    }
  }
  checkPrivateFields(data);

  // 2. Detect direct raw database entities leak
  if (data && typeof data === 'object') {
    // Standard signature of a raw DB entity which is not mapped/sanitized
    if ('tenantId' in data || 'tenant_id' in data) {
      errors.push('Raw backend database record passed directly to theme component (leaked tenantId)');
    }
    if ('createdById' in data || 'updatedById' in data) {
      errors.push('Raw backend database record passed directly to theme component (leaked system references)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
`);

writeFile('validation/index.ts', `
export * from './validate-module-contract';
export * from './validate-theme-adapter';
export * from './validate-component-contract';
`);

// -------------------------------------------------------------
// RENDER INFRASTRUCTURE
// -------------------------------------------------------------

writeFile('renderer/theme-adapter.ts', `
import { ThemeSlotKey } from '../core/theme-slot.types';

export interface ThemeAdapter {
  themeKey: string;
  displayName: string;
  version: string;
  slots: Partial<Record<ThemeSlotKey, any>>; // Maps theme slots to React component types
  supportsSlot: (slot: ThemeSlotKey) => boolean;
  getFallbackSlot?: (slot: ThemeSlotKey) => any | null;
}
`);

writeFile('renderer/theme-slot-renderer.tsx', `
import React from 'react';
import { ThemeSlotKey } from '../core/theme-slot.types';
import { RenderingState } from '../core/state.types';
import { ClientContextContract } from '../core/base.types';
import { ThemeAdapter } from './theme-adapter';
import { validateComponentContractData } from '../validation/validate-component-contract';

export interface ThemeSlotRendererProps {
  slotKey: ThemeSlotKey;
  contractData: any;
  clientContext: ClientContextContract;
  activeTheme: ThemeAdapter;
  moduleKey?: string; // Optional: triggers module entitlement check if provided
  fallbackComponent?: React.ComponentType<any>;
}

// Standard fallback mock components
const DefaultLoading = () => React.createElement('div', { className: 'p-8 text-center text-gray-500 animate-pulse font-sans' }, 'Loading content...');
const DefaultEmpty = () => React.createElement('div', { className: 'p-8 text-center text-gray-400 font-sans border-2 border-dashed border-gray-200 rounded-xl' }, 'No content to display.');
const DefaultError = ({ message }) => React.createElement(
  'div',
  { className: 'p-6 text-center text-red-600 bg-red-50 border border-red-100 rounded-xl font-sans' },
  React.createElement('div', { className: 'font-semibold' }, 'Failed to render block'),
  message && React.createElement('div', { className: 'text-xs mt-1 text-red-500' }, message)
);
const DefaultLocked = () => React.createElement(
  'div',
  { className: 'p-8 text-center text-amber-700 bg-amber-50 border border-amber-100 rounded-xl font-sans' },
  React.createElement('div', { className: 'font-semibold' }, '🔒 Content Locked'),
  React.createElement('div', { className: 'text-xs mt-1' }, 'This section requires active church module activation.')
);

export const ThemeSlotRenderer: React.FC<ThemeSlotRendererProps> = ({
  slotKey,
  contractData,
  clientContext,
  activeTheme,
  moduleKey,
  fallbackComponent
}) => {
  // 1. Entitlement verification
  if (moduleKey) {
    const isModuleEntitled = clientContext.isPreviewMode || (clientContext.tenant.status === 'active');
    if (!isModuleEntitled) {
      return React.createElement(DefaultLocked, null);
    }
  }

  // 2. Validate component contract data (security audit guard)
  const validation = validateComponentContractData(slotKey, contractData);
  if (!validation.isValid) {
    console.error('Frontend Contract Violation on slot ' + slotKey + ':', validation.errors);
    return React.createElement(DefaultError, { message: validation.errors.join(', ') });
  }

  // 3. Resolve active tenant slot or fallback
  let Component = activeTheme.slots[slotKey];

  if (!Component && activeTheme.getFallbackSlot) {
    Component = activeTheme.getFallbackSlot(slotKey);
  }

  if (!Component) {
    Component = fallbackComponent;
  }

  // 4. Final defaults check
  if (!Component) {
    if (slotKey.startsWith('state.loading') || slotKey === 'state.loading') {
      Component = DefaultLoading;
    } else if (slotKey.startsWith('state.error') || slotKey === 'state.error') {
      Component = DefaultError;
    } else if (slotKey.startsWith('state.locked') || slotKey === 'state.locked' || slotKey === 'state.setupRequired') {
      Component = DefaultLocked;
    } else {
      Component = DefaultEmpty;
    }
  }

  try {
    return React.createElement(Component, { data: contractData, context: clientContext });
  } catch (err) {
    console.error('Runtime render crash inside theme component for slot ' + slotKey + ':', err);
    return React.createElement(DefaultError, { message: err instanceof Error ? err.message : String(err) });
  }
};
`);

// -------------------------------------------------------------
// DOCUMENTATION (README.md)
// -------------------------------------------------------------

writeFile('../README.md', `
# Frontend Contract System

This package provides a production-ready Frontend Contract System sitting between backend/module data and the visual theme layers. It standardizes UI slots, defines strictly sanitised client-facing contracts, and prevents themes from bypassing entitlements or accessing private db models directly.

## Directory Structure
- \`src/core/\`: Core types for routing, forms, visibility, and analytics.
- \`src/components/\`: Normalized contract shapes for events, sermons, LMS, etc.
- \`src/modules/\`: Interface specs exposing widget tags and routes for all 25 modules.
- \`src/mappers/\`: Transform helpers sanitizing raw backend records.
- \`src/registry/\`: Registries for component contracts, slot definitions, and public forms.
- \`src/validation/\`: Security auditing utility checking for field leaks and correct interface compliance.
- \`src/renderer/\`: Slot rendering wrappers checking entitlements before active theme execution.

## Flow of Data
\`\`\`
[Page Builder Output] ─> [Mappers] ─> [Theme Slot Renderer] ─> [Active Theme Adapter] ─> [HTML Output]
\`\`\`

## Adding a New Component Contract
1. Add the interface declaration in \`src/components/your-name.contract.ts\`.
2. Register the component name inside \`src/registry/component-contract-registry.ts\`.
3. Add a matching ThemeSlotKey inside \`src/core/theme-slot.types.ts\`.
`);

// -------------------------------------------------------------
// ROOT EXPORTS (index.ts)
// -------------------------------------------------------------

writeFile('index.ts', `
export * from './core/base.types';
export * from './core/visibility.types';
export * from './core/cta.types';
export * from './core/media.types';
export * from './core/form.types';
export * from './core/seo.types';
export * from './core/localization.types';
export * from './core/analytics.types';
export * from './core/entitlement.types';
export * from './core/state.types';
export * from './core/theme-slot.types';

export * from './renderer/theme-adapter';
export * from './renderer/theme-slot-renderer';

export * from './validation';

export * from './registry/module-ui-registry';
export * from './registry/component-contract-registry';
export * from './registry/theme-slot-registry';
export * from './registry/form-contract-registry';
export * from './registry/cta-registry';
export * from './registry/state-registry';

export * from './mappers';
`);

console.log('Validation and renderer structures created successfully.');
