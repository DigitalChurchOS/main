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
