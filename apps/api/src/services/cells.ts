import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

export const CELL_MODULE_KEY = 'cell-fellowship';

const ACTIVE_MODULE_STATUSES = new Set(['active', 'trialing']);
const PRIMARY_MEMBERSHIP_ROLES = new Set(['member', 'assistant', 'host', 'secretary']);
const FELLOWSHIP_MODES = new Set(['online', 'offline', 'hybrid']);

const FELLOWSHIP_MODE_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  hybrid: 'Hybrid',
};

const DEFAULT_CELL_MODULE_SETTINGS = {
  enabled: true,
  adminPreviewOnly: true,
  publicPublishingEnabled: false,
  publicCellFinderEnabled: false,
  memberPortalEnabled: true,
  structureMode: 'hierarchy',
  hierarchyLabels: {
    tier1: 'Master Cell',
    tier2: 'Super Cell',
    tier3: 'Cell',
  },
  namingPrefix: '',
  lmsLeadershipCourseRequired: true,
  singleCellExclusivity: true,
  noticeBoardsEnabled: true,
  inviteLinksEnabled: true,
  givingAttributionEnabled: true,
  outreachScorecardEnabled: true,
  ministryManualEnabled: true,
  weeklyOutlinesEnabled: true,
  mapEnabled: true,
  exposePreciseLocations: false,
  liveMeetingsEnabled: true,
  worshipIntegrationEnabled: true,
  inactiveWarningMissedMeetings: 3,
};

const DEFAULT_CELL_MINISTRY_MANUAL = {
  id: 'cell-ministry-manual',
  title: 'Cell Ministry Manual',
  subtitle: 'A practical guide for understanding, leading, and multiplying cell fellowships.',
  description: 'This manual explains what a cell is, how it functions, and how leaders guide members into fellowship, discipleship, outreach, and church life.',
  version: '1.0',
  status: 'published',
  visibility: 'public',
  updatedAt: null,
  sections: [
    {
      id: 'purpose',
      title: 'What Is a Cell?',
      body: 'A cell is a small pastoral fellowship where members gather regularly for prayer, worship, Bible sharing, testimony, outreach, and mutual care. It extends the life of the church into homes, campuses, workplaces, and online communities.',
      bullets: [
        'Cells help every member belong to a smaller spiritual family.',
        'Cells make discipleship practical through weekly fellowship and follow-up.',
        'Cells support evangelism by welcoming visitors and new believers into a warm setting.',
      ],
      order: 1,
    },
    {
      id: 'function',
      title: 'How a Cell Functions',
      body: 'Each cell follows a clear rhythm: welcome, worship, prayer, Word sharing, testimonies, outreach planning, announcements, and pastoral follow-up. Leaders create an atmosphere where every member can participate and grow.',
      bullets: [
        'The leader prepares with the weekly outline before the meeting.',
        'The host keeps the environment warm, orderly, and welcoming.',
        'The secretary or assistant helps record attendance, testimonies, and follow-up needs.',
      ],
      order: 2,
    },
    {
      id: 'leadership',
      title: 'Leader Responsibilities',
      body: 'Cell leaders shepherd the group, guide discussion, encourage participation, report attendance, care for members, and help new converts become established in the church.',
      bullets: [
        'Pray for members and visitors by name.',
        'Use the weekly outline without turning the cell into a lecture.',
        'Follow up absent members and first-time visitors quickly.',
        'Submit accurate meeting reports after each fellowship.',
      ],
      order: 3,
    },
    {
      id: 'multiplication',
      title: 'Growth and Multiplication',
      body: 'Healthy cells grow through consistent fellowship, active outreach, strong pastoral care, and trained leaders. When a cell becomes strong enough, it can multiply into new cells while preserving care and accountability.',
      bullets: [
        'Track attendance, new visitors, conversions, and giving attribution.',
        'Identify emerging leaders early and guide them through training.',
        'Celebrate growth while keeping discipleship personal.',
      ],
      order: 4,
    },
  ],
};

const DEFAULT_WEEKLY_OUTLINES = [
  {
    id: 'outline-current-week',
    title: 'Living as a Faithful Witness',
    theme: 'Faith, fellowship, and outreach',
    weekStart: '2026-06-01',
    weekEnd: '2026-06-07',
    scripture: 'Acts 2:42-47',
    status: 'published',
    openingPrayer: 'Thank God for the cell family and ask for boldness, unity, and fresh impact this week.',
    worshipGuide: 'Lead one short worship song and invite one testimony of God at work during the week.',
    icebreaker: 'Ask each person to share one way fellowship has strengthened their walk with God.',
    sharingGuide: 'Discuss how the early church grew through teaching, fellowship, prayer, generosity, and daily witness. Help members identify one practical outreach step for the week.',
    discussionQuestions: [
      'What does Acts 2 show us about the purpose of Christian fellowship?',
      'How can our cell become warmer and easier for visitors to join?',
      'Who can each member invite or follow up this week?',
    ],
    prayerPoints: [
      'Pray for every member to be established in the Word and prayer.',
      'Pray for visitors and new believers to be planted in the right cell.',
      'Pray for multiplication through bold outreach and loving follow-up.',
    ],
    announcements: [
      'Remind members to invite at least one person to the next cell meeting.',
      'Record attendance and submit follow-up needs after the meeting.',
    ],
    leaderNotes: 'Keep the sharing conversational. Invite participation from quiet members and close with clear outreach commitments.',
    orderOfMeeting: [
      { label: 'Welcome and Opening Prayer', durationMinutes: 5, instructions: 'Greet everyone warmly and open with thanksgiving.' },
      { label: 'Worship and Testimony', durationMinutes: 10, instructions: 'Lead worship and receive one short testimony.' },
      { label: 'Word Sharing', durationMinutes: 20, instructions: 'Use the scripture and discussion questions to guide participation.' },
      { label: 'Prayer and Outreach Planning', durationMinutes: 10, instructions: 'Pray through the prayer points and agree on invite/follow-up actions.' },
      { label: 'Announcements and Report', durationMinutes: 5, instructions: 'Share announcements, confirm next meeting, and record attendance.' },
    ],
    createdAt: null,
    updatedAt: null,
    publishedAt: null,
  },
];

export interface GroupSettingsData {
  cellSizeLimit?: number;
  superCellSizeLimit?: number;
  autoNamingRuleEnabled?: boolean;
  hierarchyDeepLimit?: number;
  moduleSettings?: Record<string, any>;
  [key: string]: any;
}

export interface GroupTypeData {
  name: string;
  tierLevel: number;
  maxMembersThreshold?: number;
  nestedCellsThreshold?: number;
}

export interface GroupCreateData {
  name?: string;
  description?: string;
  parentId?: string;
  groupTypeId: string;
  leaderId?: string;
  coLeaderId?: string;
  hostId?: string;
  locationGeocoding?: string | Record<string, any>;
  onlineMeetingUrl?: string;
  fellowshipMode?: 'online' | 'offline' | 'hybrid';
}

export interface NoticePostData {
  title: string;
  content: string;
  category?: 'announcement' | 'alert' | 'sermon_outline' | 'video' | 'audio';
  fileAttachmentsJson?: string | Record<string, any> | any[];
  externalEmbedsJson?: string | Record<string, any> | any[];
}

export interface CellManualSectionData {
  id?: string;
  title: string;
  body: string;
  bullets?: string[];
  order?: number;
}

export interface CellManualData {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  version?: string;
  status?: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'members' | 'leaders';
  sections?: CellManualSectionData[];
}

export interface WeeklyOutlineData {
  id?: string;
  title?: string;
  theme?: string;
  weekStart?: string;
  weekEnd?: string;
  scripture?: string;
  status?: 'draft' | 'published' | 'archived';
  openingPrayer?: string;
  worshipGuide?: string;
  icebreaker?: string;
  sharingGuide?: string;
  discussionQuestions?: string[];
  prayerPoints?: string[];
  announcements?: string[];
  leaderNotes?: string;
  orderOfMeeting?: { label: string; durationMinutes?: number; instructions?: string }[];
}

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function jsonString(value: any, fallback: any = {}): string {
  if (value === undefined || value === null) return JSON.stringify(fallback);
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify({ value });
    }
  }
  return JSON.stringify(value);
}

function normalizeRole(role?: string) {
  if (!role) return 'member';
  const normalized = role.toLowerCase().trim();
  if (normalized === 'coleader' || normalized === 'co_leader') return 'assistant';
  return normalized;
}

function displayMember(member: any) {
  if (!member) return 'Unassigned';
  return [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email || member.id;
}

function normalizeLocation(locationGeocoding: any) {
  const location = typeof locationGeocoding === 'string'
    ? safeParse<Record<string, any>>(locationGeocoding, {})
    : (locationGeocoding || {});

  return {
    address: location.address || location.safeAddress || '',
    safeAddress: location.safeAddress || location.city || location.address || '',
    city: location.city || '',
    region: location.region || '',
    country: location.country || '',
    lat: typeof location.lat === 'number' ? location.lat : null,
    lng: typeof location.lng === 'number' ? location.lng : null,
    privacy: location.privacy || 'members_only',
    fellowshipMode: location.fellowshipMode || location.meetingMode || null,
  };
}

function locationInput(locationGeocoding: any) {
  return typeof locationGeocoding === 'string'
    ? safeParse<Record<string, any>>(locationGeocoding, {})
    : { ...(locationGeocoding || {}) };
}

function inferFellowshipMode(rawMode: any, onlineMeetingUrl?: string | null, locationGeocoding?: any) {
  const supplied = rawMode ? String(rawMode).trim().toLowerCase() : '';
  if (supplied) {
    if (!FELLOWSHIP_MODES.has(supplied)) {
      throw new Error('Fellowship mode must be online, offline, or hybrid');
    }
    return supplied;
  }

  const location = locationInput(locationGeocoding);
  const storedMode = location.fellowshipMode || location.meetingMode;
  if (storedMode) {
    return inferFellowshipMode(storedMode, onlineMeetingUrl, {});
  }

  const hasOnline = !!onlineMeetingUrl;
  const hasOfflineLocation = !!(location.address || location.safeAddress || location.city || location.region || location.country || location.lat || location.lng);
  if (hasOnline && hasOfflineLocation) return 'hybrid';
  if (hasOnline) return 'online';
  return 'offline';
}

function decorateLocationForMode(locationGeocoding: any, fellowshipMode: string) {
  const location = locationInput(locationGeocoding);
  return {
    ...location,
    fellowshipMode,
    meetingMode: fellowshipMode,
    safeAddress: location.safeAddress || (fellowshipMode === 'online' ? 'Online cell fellowship' : location.city || location.address || ''),
  };
}

function createContentId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTextList(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function normalizeManual(raw: any = {}) {
  const source = { ...DEFAULT_CELL_MINISTRY_MANUAL, ...(raw || {}) };
  const sectionsSource = Array.isArray(raw?.sections) ? raw.sections : DEFAULT_CELL_MINISTRY_MANUAL.sections;
  return {
    ...source,
    id: source.id || 'cell-ministry-manual',
    title: source.title || DEFAULT_CELL_MINISTRY_MANUAL.title,
    subtitle: source.subtitle || DEFAULT_CELL_MINISTRY_MANUAL.subtitle,
    description: source.description || DEFAULT_CELL_MINISTRY_MANUAL.description,
    version: source.version || DEFAULT_CELL_MINISTRY_MANUAL.version,
    status: source.status || 'draft',
    visibility: source.visibility || 'members',
    sections: sectionsSource.map((section: any, index: number) => ({
      id: section.id || createContentId('manual-section'),
      title: section.title || `Section ${index + 1}`,
      body: section.body || '',
      bullets: normalizeTextList(section.bullets),
      order: Number(section.order || index + 1),
    })).sort((a: any, b: any) => a.order - b.order),
  };
}

function normalizeWeeklyOutline(raw: any = {}, index = 0) {
  const source = { ...(raw || {}) };
  const id = source.id || createContentId('cell-outline');
  const weekStart = source.weekStart || source.weekOf || new Date().toISOString().slice(0, 10);
  const orderSource = Array.isArray(source.orderOfMeeting) ? source.orderOfMeeting : DEFAULT_WEEKLY_OUTLINES[0].orderOfMeeting;

  return {
    id,
    title: source.title || `Weekly Cell Outline ${index + 1}`,
    theme: source.theme || '',
    weekStart,
    weekEnd: source.weekEnd || '',
    scripture: source.scripture || '',
    status: source.status || 'draft',
    openingPrayer: source.openingPrayer || '',
    worshipGuide: source.worshipGuide || '',
    icebreaker: source.icebreaker || '',
    sharingGuide: source.sharingGuide || '',
    discussionQuestions: normalizeTextList(source.discussionQuestions),
    prayerPoints: normalizeTextList(source.prayerPoints),
    announcements: normalizeTextList(source.announcements),
    leaderNotes: source.leaderNotes || '',
    orderOfMeeting: orderSource.map((item: any, orderIndex: number) => ({
      label: item.label || `Meeting Step ${orderIndex + 1}`,
      durationMinutes: Number(item.durationMinutes || 0),
      instructions: item.instructions || '',
    })),
    readOnlineUrl: `/api/cells/outlines/${id}`,
    pdfDownloadUrl: `/api/cells/outlines/${id}/pdf`,
    createdAt: source.createdAt || new Date().toISOString(),
    updatedAt: source.updatedAt || null,
    publishedAt: source.publishedAt || null,
  };
}

function fileSafe(value: string) {
  return String(value || 'cell-resource')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'cell-resource';
}

function pdfText(value: any) {
  return String(value ?? '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[\\()]/g, '\\$&');
}

function wrapPdfLine(line: string, maxLength = 92) {
  const text = String(line || '').trim();
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildSimplePdf(title: string, lines: string[]) {
  const wrapped = lines.flatMap((line) => wrapPdfLine(line));
  const pages: string[][] = [];
  for (let index = 0; index < wrapped.length; index += 38) {
    pages.push(wrapped.slice(index, index + 38));
  }
  if (pages.length === 0) pages.push(['']);

  const fontObjectNumber = 3 + pages.length * 2;
  const pageObjectNumbers = pages.map((_, index) => 3 + index * 2);
  const objects: string[] = [
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(' ')}] /Count ${pages.length} >> endobj`,
  ];

  pages.forEach((pageLines, index) => {
    const pageObjectNumber = pageObjectNumbers[index];
    const contentObjectNumber = pageObjectNumber + 1;
    const stream = [
      'BT',
      '/F1 15 Tf',
      '50 760 Td',
      `(${pdfText(index === 0 ? title : `${title} - continued`)}) Tj`,
      '/F1 10 Tf',
      ...pageLines.map((line) => `0 -17 Td (${pdfText(line)}) Tj`),
      'ET',
    ].join('\n');

    objects.push(`${pageObjectNumber} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >> endobj`);
    objects.push(`${contentObjectNumber} 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream\nendobj`);
  });

  objects.push(`${fontObjectNumber} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

function parseMeetingNotes(notes: string | null | undefined) {
  return safeParse<Record<string, any>>(notes, {});
}

function formatMeeting(meeting: any) {
  const notes = parseMeetingNotes(meeting.notes);
  return {
    ...meeting,
    location: notes.location || notes.venue || null,
    report: notes.report || null,
    outlineId: notes.outlineId || null,
    outlineTitle: notes.outlineTitle || null,
    attendanceLogged: Number(meeting.attendanceCount || 0) > 0 || (meeting.attendances?.length || 0) > 0,
    attendanceEntriesCount: meeting.attendances?.length || 0,
  };
}

function formatGroup(group: any) {
  const rosterSource = group.members || [];
  const location = normalizeLocation(group.locationGeocoding);
  const fellowshipMode = inferFellowshipMode(location.fellowshipMode, group.onlineMeetingUrl, group.locationGeocoding);
  const membersRoster = rosterSource.map((m: any) => ({
    id: m.id,
    groupId: m.groupId,
    memberId: m.memberId,
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt,
    member: m.member || null,
    memberName: displayMember(m.member),
    email: m.member?.email || null,
    phone: m.member?.phone || null,
  }));

  return {
    ...group,
    location: { ...location, fellowshipMode },
    fellowshipMode,
    fellowshipModeLabel: FELLOWSHIP_MODE_LABELS[fellowshipMode],
    deliveryClassification: FELLOWSHIP_MODE_LABELS[fellowshipMode],
    parentName: group.parent?.name || null,
    leaderName: displayMember(group.leader),
    coLeaderName: displayMember(group.coLeader),
    hostName: displayMember(group.host),
    membersRoster,
    memberCount: membersRoster.filter((m: any) => m.status === 'active').length,
    childCount: group.children?.length || 0,
    meetingCount: group.meetings?.length || 0,
    inviteCount: group.inviteLinks?.length || 0,
  };
}

async function logCellActivity(
  tenantId: string,
  userId: string | null | undefined,
  actionType: string,
  metadata: Record<string, any> = {}
) {
  await prisma.cmsActivityLog.create({
    data: {
      tenantId,
      userId: userId || null,
      actionType,
      pageId: metadata.groupId || metadata.meetingId || metadata.noticeId || null,
      metadataJson: jsonString(metadata, {}),
    },
  }).catch(() => undefined);

  await trackEvent(tenantId, {
    category: 'cell_fellowship',
    name: actionType,
    entityId: metadata.groupId || metadata.meetingId || metadata.inviteLinkId || metadata.memberId || null,
    userId: userId || null,
    value: typeof metadata.value === 'number' ? metadata.value : null,
    metadata,
  }).catch(() => undefined);
}

async function getCentralModuleSettings(tenantId: string) {
  const record = await prisma.moduleSettings.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey: CELL_MODULE_KEY } },
  });

  const settings = record?.settings
    ? safeParse<Record<string, any>>(record.settings, {})
    : {};

  const merged = {
    ...DEFAULT_CELL_MODULE_SETTINGS,
    ...settings,
    hierarchyLabels: {
      ...DEFAULT_CELL_MODULE_SETTINGS.hierarchyLabels,
      ...(settings.hierarchyLabels || {}),
      ...(settings.tier1Label ? { tier1: settings.tier1Label } : {}),
      ...(settings.tier2Label ? { tier2: settings.tier2Label } : {}),
      ...(settings.tier3Label ? { tier3: settings.tier3Label } : {}),
    },
  };

  return merged;
}

export async function getCellModuleAccess(tenantId: string) {
  const [tenantModule, settings] = await Promise.all([
    prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: CELL_MODULE_KEY } },
    }),
    getCentralModuleSettings(tenantId),
  ]);

  const entitlementActive = !!tenantModule && ACTIVE_MODULE_STATUSES.has(tenantModule.status);
  const moduleEnabled = settings.enabled !== false;
  const publicAllowed =
    entitlementActive &&
    moduleEnabled &&
    settings.publicPublishingEnabled === true;

  return {
    tenantModule,
    settings,
    entitlementActive,
    moduleEnabled,
    adminPreviewAllowed: settings.adminPreviewOnly !== false,
    publicAllowed,
    publicCellFinderAllowed: publicAllowed && settings.publicCellFinderEnabled === true,
    memberPortalAllowed: entitlementActive && moduleEnabled && settings.memberPortalEnabled !== false,
  };
}

export async function assertPublicCellAccess(tenantId: string, finder = false) {
  const access = await getCellModuleAccess(tenantId);
  const allowed = finder ? access.publicCellFinderAllowed : access.publicAllowed;
  if (!allowed) {
    throw new Error('Cell / Fellowship public access is not enabled for this church');
  }
  return access;
}

async function resolveMemberIdentifier(tenantId: string, identifier: string) {
  const trimmed = identifier.trim();
  const member = await prisma.member.findFirst({
    where: {
      tenantId,
      OR: [
        { id: trimmed },
        { email: trimmed },
        { phone: trimmed },
      ],
    },
  });

  if (!member) {
    throw new Error('Member not found for this church');
  }
  return member;
}

async function groupDepth(tenantId: string, groupId: string | null | undefined): Promise<number> {
  if (!groupId) return 0;
  const group = await prisma.group.findFirst({
    where: { id: groupId, tenantId },
    select: { parentId: true },
  });
  if (!group) return 0;
  return 1 + await groupDepth(tenantId, group.parentId);
}

/**
 * Verification check for Cell Leader eligibility.
 * A leader is eligible when they are already marked as a leader, have a certified
 * volunteer profile, or completed the required LMS course.
 */
export async function verifyLeadershipPrerequisite(tenantId: string, memberId: string): Promise<boolean> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (member?.membershipStatus === 'leader') {
    return true;
  }

  const volProfile = await prisma.volunteerProfile.findFirst({
    where: { memberId, tenantId },
  });
  if (volProfile?.trainingStatus === 'certified') {
    return true;
  }

  const enrollment = await prisma.lmsEnrollment.findFirst({
    where: {
      memberId,
      tenantId,
      status: 'completed',
      course: {
        OR: [
          { slug: 'cell-ministry-leadership-course' },
          { title: { contains: 'Cell Ministry Leadership' } },
        ],
      },
    },
  });

  return !!enrollment;
}

export async function upsertGroupSettings(tenantId: string, data: GroupSettingsData) {
  const moduleSettingsPatch = data.moduleSettings || Object.fromEntries(
    Object.entries(data).filter(([key]) => key in DEFAULT_CELL_MODULE_SETTINGS)
  );

  if (Object.keys(moduleSettingsPatch).length > 0) {
    const current = await getCentralModuleSettings(tenantId);
    await prisma.moduleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: CELL_MODULE_KEY } },
      create: {
        tenantId,
        moduleKey: CELL_MODULE_KEY,
        settings: jsonString({ ...current, ...moduleSettingsPatch }, DEFAULT_CELL_MODULE_SETTINGS),
      },
      update: {
        settings: jsonString({ ...current, ...moduleSettingsPatch }, DEFAULT_CELL_MODULE_SETTINGS),
      },
    });
  }

  const settings = await prisma.groupSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      cellSizeLimit: data.cellSizeLimit ?? 25,
      superCellSizeLimit: data.superCellSizeLimit ?? 25,
      autoNamingRuleEnabled: data.autoNamingRuleEnabled ?? true,
      hierarchyDeepLimit: data.hierarchyDeepLimit ?? 3,
    },
    update: {
      ...(data.cellSizeLimit !== undefined && { cellSizeLimit: data.cellSizeLimit }),
      ...(data.superCellSizeLimit !== undefined && { superCellSizeLimit: data.superCellSizeLimit }),
      ...(data.autoNamingRuleEnabled !== undefined && { autoNamingRuleEnabled: data.autoNamingRuleEnabled }),
      ...(data.hierarchyDeepLimit !== undefined && { hierarchyDeepLimit: data.hierarchyDeepLimit }),
    },
  });

  await logCellActivity(tenantId, null, 'cell_settings_update', { settingsId: settings.id });
  return { ...settings, moduleSettings: await getCentralModuleSettings(tenantId) };
}

export async function getGroupSettings(tenantId: string) {
  let settings = await prisma.groupSettings.findUnique({
    where: { tenantId },
  });
  if (!settings) {
    settings = await prisma.groupSettings.create({
      data: {
        tenantId,
        cellSizeLimit: 25,
        superCellSizeLimit: 25,
        autoNamingRuleEnabled: true,
        hierarchyDeepLimit: 3,
      },
    });
  }

  const access = await getCellModuleAccess(tenantId);
  return {
    ...settings,
    moduleKey: CELL_MODULE_KEY,
    moduleSettings: access.settings,
    entitlement: access.tenantModule,
    publicAccess: {
      publicAllowed: access.publicAllowed,
      publicCellFinderAllowed: access.publicCellFinderAllowed,
      memberPortalAllowed: access.memberPortalAllowed,
      adminPreviewAllowed: access.adminPreviewAllowed,
    },
  };
}

async function saveCellContentPatch(tenantId: string, patch: Record<string, any>) {
  const current = await getCentralModuleSettings(tenantId);
  await prisma.moduleSettings.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: CELL_MODULE_KEY } },
    create: {
      tenantId,
      moduleKey: CELL_MODULE_KEY,
      settings: jsonString({ ...current, ...patch }, DEFAULT_CELL_MODULE_SETTINGS),
    },
    update: {
      settings: jsonString({ ...current, ...patch }, DEFAULT_CELL_MODULE_SETTINGS),
    },
  });
  return getCentralModuleSettings(tenantId);
}

async function getCellContentLibrary(tenantId: string) {
  const settings = await getCentralModuleSettings(tenantId);
  const contentSettings = settings as Record<string, any>;
  const manual = normalizeManual(contentSettings.cellMinistryManual);
  const weeklyOutlines = (Array.isArray(contentSettings.weeklyOutlines) ? contentSettings.weeklyOutlines : DEFAULT_WEEKLY_OUTLINES)
    .map((outline: any, index: number) => normalizeWeeklyOutline(outline, index))
    .sort((a: any, b: any) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());

  return { settings, manual, weeklyOutlines };
}

export async function getCellMinistryManual(tenantId: string, publicView = false) {
  if (publicView) {
    await assertPublicCellAccess(tenantId, false);
  }

  const { settings, manual } = await getCellContentLibrary(tenantId);
  if (settings.ministryManualEnabled === false) {
    throw new Error('Cell ministry manual is not enabled for this church');
  }
  if (publicView && (manual.status !== 'published' || manual.visibility !== 'public')) {
    throw new Error('Cell ministry manual is not published publicly');
  }

  return {
    ...manual,
    readOnlineUrl: publicView ? '/api/cells/public/manual' : '/api/cells/manual',
    pdfDownloadUrl: publicView ? '/api/cells/public/manual.pdf' : '/api/cells/manual/pdf',
  };
}

export async function updateCellMinistryManual(tenantId: string, data: CellManualData, actorUserId?: string | null) {
  const { manual: currentManual } = await getCellContentLibrary(tenantId);
  const manual = normalizeManual({
    ...currentManual,
    ...data,
    sections: data.sections || currentManual.sections,
    updatedAt: new Date().toISOString(),
  });

  if (!manual.title) {
    throw new Error('Manual title is required');
  }

  await saveCellContentPatch(tenantId, { cellMinistryManual: manual });
  await logCellActivity(tenantId, actorUserId, 'cell_manual_update', { manualId: manual.id, title: manual.title });
  return getCellMinistryManual(tenantId);
}

export async function publishCellMinistryManual(tenantId: string, actorUserId?: string | null) {
  const manual = await updateCellMinistryManual(tenantId, { status: 'published' }, actorUserId);
  await logCellActivity(tenantId, actorUserId, 'cell_manual_publish', { manualId: manual.id, title: manual.title });
  return manual;
}

export async function buildCellMinistryManualPdf(tenantId: string, publicView = false) {
  const manual = await getCellMinistryManual(tenantId, publicView);
  const lines = [
    manual.subtitle || '',
    manual.description || '',
    `Version: ${manual.version || '1.0'}`,
    '',
    ...manual.sections.flatMap((section: any) => [
      section.title,
      section.body,
      ...normalizeTextList(section.bullets).map((bullet) => `- ${bullet}`),
      '',
    ]),
  ];

  return {
    filename: `${fileSafe(manual.title)}.pdf`,
    buffer: buildSimplePdf(manual.title, lines),
  };
}

export async function listWeeklyOutlines(tenantId: string, filters: { status?: string } = {}) {
  const { settings, weeklyOutlines } = await getCellContentLibrary(tenantId);
  if (settings.weeklyOutlinesEnabled === false) {
    throw new Error('Cell weekly outlines are not enabled for this church');
  }

  return filters.status
    ? weeklyOutlines.filter((outline: any) => outline.status === filters.status)
    : weeklyOutlines;
}

export async function getWeeklyOutline(tenantId: string, outlineId: string) {
  const outlines = await listWeeklyOutlines(tenantId);
  const outline = outlines.find((item: any) => item.id === outlineId);
  if (!outline) {
    throw new Error('Weekly outline not found');
  }
  return outline;
}

export async function getActiveWeeklyOutline(tenantId: string) {
  const outlines = await listWeeklyOutlines(tenantId, { status: 'published' });
  const nowMs = Date.now();
  const current = outlines.find((outline: any) => {
    const startMs = new Date(outline.weekStart).getTime();
    const endMs = outline.weekEnd ? new Date(outline.weekEnd).getTime() : startMs + 7 * 24 * 60 * 60 * 1000;
    return startMs <= nowMs && endMs >= nowMs;
  });

  return current || outlines[0] || null;
}

export async function createWeeklyOutline(tenantId: string, data: WeeklyOutlineData, actorUserId?: string | null) {
  if (!data.title) {
    throw new Error('Outline title is required');
  }

  const { weeklyOutlines } = await getCellContentLibrary(tenantId);
  const outline = normalizeWeeklyOutline({
    ...data,
    id: data.id || createContentId('cell-outline'),
    status: data.status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: data.status === 'published' ? new Date().toISOString() : null,
  });

  await saveCellContentPatch(tenantId, { weeklyOutlines: [outline, ...weeklyOutlines] });
  await logCellActivity(tenantId, actorUserId, 'cell_weekly_outline_create', { outlineId: outline.id, title: outline.title });
  return outline;
}

export async function updateWeeklyOutline(tenantId: string, outlineId: string, data: WeeklyOutlineData, actorUserId?: string | null) {
  const { weeklyOutlines } = await getCellContentLibrary(tenantId);
  const index = weeklyOutlines.findIndex((outline: any) => outline.id === outlineId);
  if (index === -1) {
    throw new Error('Weekly outline not found');
  }

  const updated = normalizeWeeklyOutline({
    ...weeklyOutlines[index],
    ...data,
    id: outlineId,
    updatedAt: new Date().toISOString(),
  }, index);
  const next = weeklyOutlines.map((outline: any, outlineIndex: number) => outlineIndex === index ? updated : outline);

  await saveCellContentPatch(tenantId, { weeklyOutlines: next });
  await logCellActivity(tenantId, actorUserId, 'cell_weekly_outline_update', { outlineId, title: updated.title });
  return updated;
}

export async function publishWeeklyOutline(tenantId: string, outlineId: string, actorUserId?: string | null) {
  const outline = await updateWeeklyOutline(tenantId, outlineId, {
    status: 'published',
  }, actorUserId);
  const published = await updateWeeklyOutline(tenantId, outlineId, {
    publishedAt: new Date().toISOString(),
  } as WeeklyOutlineData, actorUserId);
  await logCellActivity(tenantId, actorUserId, 'cell_weekly_outline_publish', { outlineId, title: outline.title });
  return published;
}

export async function buildWeeklyOutlinePdf(tenantId: string, outlineId: string) {
  const outline = await getWeeklyOutline(tenantId, outlineId);
  const lines = [
    `Week: ${outline.weekStart}${outline.weekEnd ? ` to ${outline.weekEnd}` : ''}`,
    outline.theme ? `Theme: ${outline.theme}` : '',
    outline.scripture ? `Scripture: ${outline.scripture}` : '',
    '',
    'Order of Meeting',
    ...outline.orderOfMeeting.flatMap((item: any, index: number) => [
      `${index + 1}. ${item.label}${item.durationMinutes ? ` (${item.durationMinutes} min)` : ''}`,
      item.instructions || '',
    ]),
    '',
    'Opening Prayer',
    outline.openingPrayer || '',
    '',
    'Worship Guide',
    outline.worshipGuide || '',
    '',
    'Sharing Guide',
    outline.sharingGuide || '',
    '',
    'Discussion Questions',
    ...normalizeTextList(outline.discussionQuestions).map((item, index) => `${index + 1}. ${item}`),
    '',
    'Prayer Points',
    ...normalizeTextList(outline.prayerPoints).map((item) => `- ${item}`),
    '',
    'Announcements',
    ...normalizeTextList(outline.announcements).map((item) => `- ${item}`),
    '',
    'Leader Notes',
    outline.leaderNotes || '',
  ];

  return {
    filename: `${fileSafe(outline.title)}.pdf`,
    buffer: buildSimplePdf(outline.title, lines),
  };
}

export async function createGroupType(tenantId: string, data: GroupTypeData) {
  if (!data.name || data.tierLevel === undefined) {
    throw new Error('name and tierLevel are required');
  }

  const groupType = await prisma.groupType.create({
    data: {
      tenantId,
      name: data.name.trim(),
      tierLevel: data.tierLevel,
      maxMembersThreshold: data.maxMembersThreshold ?? 25,
      nestedCellsThreshold: data.nestedCellsThreshold ?? 25,
    },
  });

  await logCellActivity(tenantId, null, 'cell_group_type_create', { groupTypeId: groupType.id, name: groupType.name });
  return groupType;
}

export async function ensureDefaultGroupTypes(tenantId: string) {
  const existing = await prisma.groupType.count({ where: { tenantId } });
  if (existing > 0) return listGroupTypes(tenantId);

  const access = await getCellModuleAccess(tenantId);
  const labels = access.settings.hierarchyLabels;
  await prisma.groupType.createMany({
    data: [
      { tenantId, name: labels.tier1 || 'Master Cell', tierLevel: 1, maxMembersThreshold: 25, nestedCellsThreshold: 25 },
      { tenantId, name: labels.tier2 || 'Super Cell', tierLevel: 2, maxMembersThreshold: 25, nestedCellsThreshold: 25 },
      { tenantId, name: labels.tier3 || 'Cell', tierLevel: 3, maxMembersThreshold: 25, nestedCellsThreshold: 25 },
    ],
  });

  await logCellActivity(tenantId, null, 'cell_default_group_types_seeded', {});
  return listGroupTypes(tenantId);
}

export async function listGroupTypes(tenantId: string) {
  return await prisma.groupType.findMany({
    where: { tenantId },
    orderBy: { tierLevel: 'asc' },
  });
}

export async function createGroup(tenantId: string, data: GroupCreateData, actorUserId?: string | null) {
  const settings = await getGroupSettings(tenantId);
  const groupType = await prisma.groupType.findFirst({
    where: { id: data.groupTypeId, tenantId },
  });

  if (!groupType) {
    throw new Error('Invalid group type specified');
  }

  if (data.parentId) {
    const parentGroup = await prisma.group.findFirst({
      where: { id: data.parentId, tenantId },
      include: { groupType: true },
    });
    if (!parentGroup) {
      throw new Error('Parent group not found');
    }

    const newDepth = await groupDepth(tenantId, data.parentId) + 1;
    if (newDepth > settings.hierarchyDeepLimit) {
      throw new Error(`Hierarchy depth limit of ${settings.hierarchyDeepLimit} exceeded`);
    }

    if (parentGroup.groupType.tierLevel >= groupType.tierLevel) {
      throw new Error('Parent group must be a higher hierarchy tier than the child group');
    }
  }

  let finalName = data.name?.trim();
  if (!finalName && settings.autoNamingRuleEnabled) {
    const count = await prisma.group.count({
      where: { tenantId, groupTypeId: data.groupTypeId },
    });
    const prefix = settings.moduleSettings.namingPrefix || groupType.name;
    finalName = `${prefix} Group ${count + 1}`;
  }

  if (!finalName) {
    throw new Error('Group name is required when auto-naming is disabled');
  }

  if (data.leaderId && settings.moduleSettings.lmsLeadershipCourseRequired !== false) {
    const isEligible = await verifyLeadershipPrerequisite(tenantId, data.leaderId);
    if (!isEligible) {
      await logCellActivity(tenantId, actorUserId, 'cell_leader_assignment_blocked', {
        groupName: finalName,
        memberId: data.leaderId,
      });
      throw new Error('Leader does not meet LMS certification or certified eligibility prerequisites');
    }
  }

  const fellowshipMode = inferFellowshipMode(data.fellowshipMode, data.onlineMeetingUrl, data.locationGeocoding);
  const locationGeocoding = decorateLocationForMode(data.locationGeocoding, fellowshipMode);

  const group = await prisma.group.create({
    data: {
      tenantId,
      parentId: data.parentId || null,
      groupTypeId: data.groupTypeId,
      name: finalName,
      description: data.description || null,
      leaderId: data.leaderId || null,
      coLeaderId: data.coLeaderId || null,
      hostId: data.hostId || null,
      locationGeocoding: jsonString(locationGeocoding, {}),
      onlineMeetingUrl: fellowshipMode === 'offline' ? null : data.onlineMeetingUrl || null,
    },
  });

  await prisma.groupNoticeBoard.create({
    data: { tenantId, groupId: group.id },
  });

  const roleRows = [
    data.leaderId ? { memberId: data.leaderId, role: 'leader' } : null,
    data.coLeaderId ? { memberId: data.coLeaderId, role: 'assistant' } : null,
    data.hostId ? { memberId: data.hostId, role: 'host' } : null,
  ].filter(Boolean) as { memberId: string; role: string }[];

  for (const row of roleRows) {
    await prisma.groupMember.create({
      data: { tenantId, groupId: group.id, memberId: row.memberId, role: row.role, status: 'active' },
    }).catch(() => undefined);
  }

  await logCellActivity(tenantId, actorUserId, 'cell_group_create', { groupId: group.id, groupTypeId: groupType.id, fellowshipMode });
  return formatGroup({ ...group, groupType, members: [], children: [], meetings: [], inviteLinks: [] });
}

export async function listGroups(
  tenantId: string,
  filters: { parentId?: string; groupTypeId?: string; status?: string; search?: string } = {}
) {
  const whereClause: any = { tenantId };
  if (filters.parentId !== undefined) {
    whereClause.parentId = filters.parentId === 'null' || !filters.parentId ? null : filters.parentId;
  }
  if (filters.groupTypeId) whereClause.groupTypeId = filters.groupTypeId;
  if (filters.status) whereClause.status = filters.status;
  if (filters.search) {
    whereClause.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  const groups = await prisma.group.findMany({
    where: whereClause,
    include: {
      groupType: true,
      parent: { select: { id: true, name: true, parentId: true } },
      children: { select: { id: true, name: true, status: true } },
      leader: true,
      coLeader: true,
      host: true,
      members: { include: { member: true } },
      meetings: { include: { attendances: true }, orderBy: { scheduledAt: 'desc' } },
      inviteLinks: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return groups.map(formatGroup);
}

export async function getGroup(tenantId: string, groupId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, tenantId },
    include: {
      groupType: true,
      parent: { select: { id: true, name: true, parentId: true } },
      children: { include: { groupType: true, members: true } },
      leader: true,
      coLeader: true,
      host: true,
      members: { include: { member: true } },
      meetings: { include: { attendances: true }, orderBy: { scheduledAt: 'desc' } },
      inviteLinks: { include: { inviteConversions: true } },
      noticeBoard: { include: { posts: { orderBy: { createdAt: 'desc' } } } },
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }
  return formatGroup(group);
}

export async function updateGroup(tenantId: string, groupId: string, data: Partial<GroupCreateData> & { status?: string }, actorUserId?: string | null) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }

  const fellowshipMode = data.fellowshipMode !== undefined || data.onlineMeetingUrl !== undefined || data.locationGeocoding !== undefined
    ? inferFellowshipMode(
        data.fellowshipMode,
        data.onlineMeetingUrl !== undefined ? data.onlineMeetingUrl : group.onlineMeetingUrl,
        data.locationGeocoding !== undefined ? data.locationGeocoding : group.locationGeocoding
      )
    : null;

  const updateData: any = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.status) updateData.status = data.status;
  if (data.onlineMeetingUrl !== undefined || fellowshipMode) {
    updateData.onlineMeetingUrl = fellowshipMode === 'offline' ? null : (data.onlineMeetingUrl !== undefined ? data.onlineMeetingUrl || null : group.onlineMeetingUrl);
  }
  if (data.locationGeocoding !== undefined || fellowshipMode) {
    updateData.locationGeocoding = jsonString(
      decorateLocationForMode(data.locationGeocoding !== undefined ? data.locationGeocoding : group.locationGeocoding, fellowshipMode || inferFellowshipMode(null, group.onlineMeetingUrl, group.locationGeocoding)),
      {}
    );
  }
  if (data.parentId !== undefined) updateData.parentId = data.parentId || null;

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: updateData,
  });

  await logCellActivity(tenantId, actorUserId, 'cell_group_update', { groupId, updatedFields: Object.keys(updateData) });
  return updated;
}

async function syncRoleMembership(tenantId: string, groupId: string, memberId: string, role: string) {
  const existing = await prisma.groupMember.findFirst({
    where: { tenantId, groupId, memberId },
  });

  if (existing) {
    return prisma.groupMember.update({
      where: { id: existing.id },
      data: { role, status: 'active' },
    });
  }

  return prisma.groupMember.create({
    data: { tenantId, groupId, memberId, role, status: 'active' },
  });
}

export async function assignGroupRoles(
  tenantId: string,
  groupId: string,
  rolesData: { leaderId?: string; coLeaderId?: string; hostId?: string },
  actorUserId?: string | null
) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }

  const settings = await getGroupSettings(tenantId);
  if (rolesData.leaderId && settings.moduleSettings.lmsLeadershipCourseRequired !== false) {
    const isEligible = await verifyLeadershipPrerequisite(tenantId, rolesData.leaderId);
    if (!isEligible) {
      await logCellActivity(tenantId, actorUserId, 'cell_leader_assignment_blocked', { groupId, memberId: rolesData.leaderId });
      throw new Error('Leader does not meet LMS certification or certified eligibility prerequisites');
    }
  }

  const updateData: any = {};
  if (rolesData.leaderId !== undefined) updateData.leaderId = rolesData.leaderId || null;
  if (rolesData.coLeaderId !== undefined) updateData.coLeaderId = rolesData.coLeaderId || null;
  if (rolesData.hostId !== undefined) updateData.hostId = rolesData.hostId || null;

  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: updateData,
  });

  if (rolesData.leaderId) await syncRoleMembership(tenantId, groupId, rolesData.leaderId, 'leader');
  if (rolesData.coLeaderId) await syncRoleMembership(tenantId, groupId, rolesData.coLeaderId, 'assistant');
  if (rolesData.hostId) await syncRoleMembership(tenantId, groupId, rolesData.hostId, 'host');

  await logCellActivity(tenantId, actorUserId, 'cell_roles_assign', { groupId, roles: updateData });
  return updatedGroup;
}

export async function addMemberToGroup(tenantId: string, groupId: string, memberIdentifier: string, role = 'member', actorUserId?: string | null) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }

  const member = await resolveMemberIdentifier(tenantId, memberIdentifier);
  const normalizedRole = normalizeRole(role);
  const settings = await getGroupSettings(tenantId);

  if (normalizedRole === 'leader' && settings.moduleSettings.lmsLeadershipCourseRequired !== false) {
    const isEligible = await verifyLeadershipPrerequisite(tenantId, member.id);
    if (!isEligible) {
      throw new Error('Leader does not meet LMS certification or certified eligibility prerequisites');
    }
  }

  if (settings.moduleSettings.singleCellExclusivity !== false && PRIMARY_MEMBERSHIP_ROLES.has(normalizedRole)) {
    const activeMembership = await prisma.groupMember.findFirst({
      where: { tenantId, memberId: member.id, status: 'active' },
    });

    if (activeMembership && activeMembership.groupId !== groupId) {
      throw new Error('Member is already active in another cell');
    }
  }

  const existing = await prisma.groupMember.findFirst({
    where: { tenantId, groupId, memberId: member.id },
  });

  const membership = existing
    ? await prisma.groupMember.update({
        where: { id: existing.id },
        data: { role: normalizedRole, status: 'active' },
      })
    : await prisma.groupMember.create({
        data: { tenantId, groupId, memberId: member.id, role: normalizedRole, status: 'active' },
      });

  await logCellActivity(tenantId, actorUserId, 'cell_member_assign', { groupId, memberId: member.id, role: normalizedRole });
  return membership;
}

export async function transferMemberToGroup(
  tenantId: string,
  fromGroupId: string,
  toGroupId: string,
  memberIdentifier: string,
  actorUserId?: string | null
) {
  const member = await resolveMemberIdentifier(tenantId, memberIdentifier);
  const targetGroup = await prisma.group.findFirst({ where: { id: toGroupId, tenantId } });
  if (!targetGroup) throw new Error('Target group not found');

  return await prisma.$transaction(async (tx) => {
    await tx.groupMember.updateMany({
      where: { tenantId, memberId: member.id, status: 'active' },
      data: { status: 'transferred' },
    });

    const membership = await tx.groupMember.create({
      data: { tenantId, groupId: toGroupId, memberId: member.id, role: 'member', status: 'active' },
    });

    await logCellActivity(tenantId, actorUserId, 'cell_member_transfer', {
      fromGroupId,
      toGroupId,
      memberId: member.id,
    });

    return membership;
  });
}

export async function removeMemberFromGroup(tenantId: string, groupId: string, memberIdentifier: string, actorUserId?: string | null) {
  const member = await resolveMemberIdentifier(tenantId, memberIdentifier);
  const membership = await prisma.groupMember.findFirst({
    where: { tenantId, groupId, memberId: member.id, status: 'active' },
  });

  if (!membership) {
    throw new Error('Active group membership not found');
  }

  const updated = await prisma.groupMember.update({
    where: { id: membership.id },
    data: { status: 'inactive' },
  });

  await logCellActivity(tenantId, actorUserId, 'cell_member_remove', { groupId, memberId: member.id });
  return updated;
}

export async function scheduleMeeting(
  tenantId: string,
  groupId: string,
  meetingData: { topic: string; scheduledAt: string; studyGuideUrl?: string; location?: string; notes?: string; recurrence?: string },
  actorUserId?: string | null
) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }
  if (!meetingData.scheduledAt) {
    throw new Error('scheduledAt is required');
  }

  const activeOutline = meetingData.studyGuideUrl
    ? null
    : await getActiveWeeklyOutline(tenantId).catch(() => null);

  const meeting = await prisma.groupMeeting.create({
    data: {
      tenantId,
      groupId,
      topic: meetingData.topic || 'Cell Fellowship',
      scheduledAt: new Date(meetingData.scheduledAt),
      studyGuideUrl: meetingData.studyGuideUrl || activeOutline?.pdfDownloadUrl || null,
      notes: jsonString({
        location: meetingData.location || null,
        recurrence: meetingData.recurrence || null,
        notes: meetingData.notes || null,
        outlineId: activeOutline?.id || null,
        outlineTitle: activeOutline?.title || null,
      }, {}),
    },
  });

  await logCellActivity(tenantId, actorUserId, 'cell_meeting_schedule', { groupId, meetingId: meeting.id });
  return formatMeeting(meeting);
}

export async function logMeetingAttendance(
  tenantId: string,
  meetingId: string,
  attendancesList: { memberId: string; status: 'present' | 'absent' | 'excused' }[],
  checkedInById?: string
) {
  const meeting = await prisma.groupMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) {
    throw new Error('Meeting not found');
  }

  const normalized: {
    tenantId: string;
    meetingId: string;
    memberId: string;
    status: 'present' | 'absent' | 'excused';
    checkedInById: string | null;
  }[] = [];
  for (const attendance of attendancesList) {
    const member = await resolveMemberIdentifier(tenantId, attendance.memberId);
    normalized.push({
      tenantId,
      meetingId,
      memberId: member.id,
      status: attendance.status,
      checkedInById: checkedInById || null,
    });
  }

  return await prisma.$transaction(async (tx) => {
    await tx.groupAttendance.deleteMany({ where: { meetingId } });
    if (normalized.length > 0) {
      await tx.groupAttendance.createMany({ data: normalized });
    }

    const presentCount = normalized.filter((a) => a.status === 'present').length;
    const updated = await tx.groupMeeting.update({
      where: { id: meetingId },
      data: {
        heldAt: new Date(),
        attendanceCount: presentCount,
      },
      include: { attendances: true },
    });

    await logCellActivity(tenantId, checkedInById, 'cell_attendance_log', {
      groupId: meeting.groupId,
      meetingId,
      value: presentCount,
      totalEntries: normalized.length,
    });

    return formatMeeting(updated);
  });
}

export async function submitMeetingReport(
  tenantId: string,
  meetingId: string,
  report: Record<string, any>,
  actorUserId?: string | null
) {
  const meeting = await prisma.groupMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');

  const existingNotes = parseMeetingNotes(meeting.notes);
  const updated = await prisma.groupMeeting.update({
    where: { id: meetingId },
    data: {
      heldAt: meeting.heldAt || new Date(),
      notes: jsonString({ ...existingNotes, report }, {}),
    },
  });

  await logCellActivity(tenantId, actorUserId, 'cell_meeting_report_submit', { groupId: meeting.groupId, meetingId });
  return formatMeeting(updated);
}

export async function listMeetings(tenantId: string, groupId: string) {
  const meetings = await prisma.groupMeeting.findMany({
    where: { groupId, tenantId },
    include: { attendances: true },
    orderBy: { scheduledAt: 'desc' },
  });
  return meetings.map(formatMeeting);
}

export async function verifyNoticeBoardAccess(
  tenantId: string,
  groupId: string,
  userId: string,
  permissionType: 'read' | 'write'
): Promise<boolean> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId, role: { tenantId } },
    include: { role: true },
  });
  const isAdmin = userRoles.some((ur) => ur.role.name === 'Admin');
  if (isAdmin) return true;

  const member = await prisma.member.findFirst({ where: { userId, tenantId } });
  if (!member) return false;

  if (permissionType === 'read') {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, memberId: member.id, status: 'active' },
    });
    if (membership) return true;
  }

  const directMembership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      memberId: member.id,
      status: 'active',
      role: permissionType === 'read' ? undefined : { in: ['leader', 'assistant', 'secretary'] },
    },
  });
  if (directMembership) return true;

  let currentGroup = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  while (currentGroup && currentGroup.parentId) {
    const parentGroup = await prisma.group.findFirst({ where: { id: currentGroup.parentId, tenantId } });
    if (!parentGroup) break;
    const isParentLeader = parentGroup.leaderId === member.id || parentGroup.coLeaderId === member.id;
    if (isParentLeader) return true;
    currentGroup = parentGroup;
  }

  return false;
}

export async function listNoticePosts(tenantId: string, groupId: string, userId?: string | null) {
  if (userId) {
    const isAuthorized = await verifyNoticeBoardAccess(tenantId, groupId, userId, 'read');
    if (!isAuthorized) {
      throw new Error('Not authorized to read this group notice board');
    }
  }

  const board = await prisma.groupNoticeBoard.findFirst({
    where: { groupId, tenantId },
    include: { posts: { orderBy: { createdAt: 'desc' } } },
  });

  return board?.posts || [];
}

export async function postNotice(
  tenantId: string,
  groupId: string,
  postedByUserId: string,
  postData: NoticePostData
) {
  const isAuthorized = await verifyNoticeBoardAccess(tenantId, groupId, postedByUserId, 'write');
  if (!isAuthorized) {
    throw new Error('Not authorized to post to this group notice board');
  }

  const noticeBoard = await prisma.groupNoticeBoard.findFirst({
    where: { groupId, tenantId },
  });
  if (!noticeBoard) {
    throw new Error('Notice board not found');
  }

  const post = await prisma.groupNoticePost.create({
    data: {
      tenantId,
      boardId: noticeBoard.id,
      postedByUserId,
      title: postData.title,
      content: postData.content,
      category: postData.category || 'announcement',
      fileAttachmentsJson: postData.fileAttachmentsJson ? jsonString(postData.fileAttachmentsJson, []) : null,
      externalEmbedsJson: postData.externalEmbedsJson ? jsonString(postData.externalEmbedsJson, []) : null,
    },
  });

  await logCellActivity(tenantId, postedByUserId, 'cell_notice_create', { groupId, noticeId: post.id });
  return post;
}

export async function delegateNoticeBoardWrite(tenantId: string, groupId: string, memberIdentifier: string, actorUserId?: string | null) {
  const member = await resolveMemberIdentifier(tenantId, memberIdentifier);
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, memberId: member.id, tenantId, status: 'active' },
  });

  if (!membership) {
    throw new Error('Active group membership not found');
  }

  const updated = await prisma.groupMember.update({
    where: { id: membership.id },
    data: { role: 'secretary' },
  });

  await logCellActivity(tenantId, actorUserId, 'cell_notice_delegate_access', { groupId, memberId: member.id });
  return updated;
}

export async function createInviteLink(tenantId: string, groupId: string, createdByMemberIdentifier: string, customMessage?: string, actorUserId?: string | null) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }
  const creator = await resolveMemberIdentifier(tenantId, createdByMemberIdentifier);

  const token = `cell-invite-${Math.random().toString(36).slice(2, 11)}`;
  const inviteLink = await prisma.groupInviteLink.create({
    data: {
      tenantId,
      groupId,
      createdByMemberId: creator.id,
      token,
      customMessage: customMessage || null,
      active: true,
    },
  });

  await logCellActivity(tenantId, actorUserId, 'cell_invite_create', { groupId, inviteLinkId: inviteLink.id });
  return inviteLink;
}

export async function listInviteLinks(tenantId: string, groupId: string) {
  return await prisma.groupInviteLink.findMany({
    where: { tenantId, groupId },
    include: { creator: true, inviteConversions: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getInviteLanding(tenantId: string, token: string) {
  await assertPublicCellAccess(tenantId, false);
  const invite = await prisma.groupInviteLink.findFirst({
    where: { tenantId, token, active: true },
    include: { group: { include: { groupType: true, leader: true } }, creator: true },
  });
  if (!invite) throw new Error('Invalid or inactive invite link token');

  return {
    token: invite.token,
    customMessage: invite.customMessage,
    group: {
      id: invite.group.id,
      name: invite.group.name,
      type: invite.group.groupType.name,
      leaderName: displayMember(invite.group.leader),
      onlineMeetingUrl: invite.group.onlineMeetingUrl,
      location: normalizeLocation(invite.group.locationGeocoding),
    },
    invitedBy: displayMember(invite.creator),
  };
}

export async function recordInviteClick(tenantId: string, token: string, sessionId?: string | null) {
  await assertPublicCellAccess(tenantId, false);
  const invite = await prisma.groupInviteLink.findFirst({ where: { tenantId, token, active: true } });
  if (!invite) throw new Error('Invalid or inactive invite link token');

  const updated = await prisma.groupInviteLink.update({
    where: { id: invite.id },
    data: { clicksCount: { increment: 1 } },
  });

  await trackEvent(tenantId, {
    category: 'cell_fellowship',
    name: 'cell_invite_click',
    entityId: invite.id,
    sessionId: sessionId || null,
    metadata: { groupId: invite.groupId },
  }).catch(() => undefined);

  return updated;
}

export async function convertInvite(
  tenantId: string,
  token: string,
  visitorDetails: { firstName: string; lastName: string; email: string; phone?: string }
) {
  await assertPublicCellAccess(tenantId, false);
  const inviteLink = await prisma.groupInviteLink.findFirst({
    where: { token, tenantId, active: true },
  });

  if (!inviteLink) {
    throw new Error('Invalid or inactive invite link token');
  }

  let member = await prisma.member.findFirst({
    where: { email: visitorDetails.email, tenantId },
  });

  if (!member) {
    member = await prisma.member.create({
      data: {
        tenantId,
        firstName: visitorDetails.firstName,
        lastName: visitorDetails.lastName,
        email: visitorDetails.email,
        phone: visitorDetails.phone,
        membershipStatus: 'visitor',
      },
    });
  }

  const activeCell = await prisma.groupMember.findFirst({
    where: { memberId: member.id, tenantId, status: 'active' },
  });

  if (!activeCell) {
    await prisma.groupMember.create({
      data: {
        tenantId,
        groupId: inviteLink.groupId,
        memberId: member.id,
        role: 'member',
        status: 'active',
      },
    });
  }

  await prisma.groupInviteLink.update({
    where: { id: inviteLink.id },
    data: { clicksCount: { increment: 1 } },
  });

  const conversion = await prisma.groupInviteConversion.create({
    data: {
      tenantId,
      inviteLinkId: inviteLink.id,
      visitorMemberId: member.id,
      attributionStatus: 'verified',
    },
  });

  await logCellActivity(tenantId, null, 'cell_invite_convert', {
    groupId: inviteLink.groupId,
    inviteLinkId: inviteLink.id,
    memberId: member.id,
  });

  return { member, conversion };
}

export async function calculateScorecard(tenantId: string, groupId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, tenantId },
    include: {
      groupType: true,
      children: true,
      members: { where: { status: 'active' }, include: { member: true } },
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  const memberEmails = group.members.map((m) => m.member.email).filter(Boolean) as string[];
  const membersCount = group.members.length;
  const childCellsCount = group.children.filter((child) => child.status === 'active').length;

  const meetings = await prisma.groupMeeting.findMany({
    where: { groupId, tenantId },
    include: { attendances: true },
  });

  let averageAttendanceRate = 0;
  if (meetings.length > 0) {
    let totalPresent = 0;
    let totalAssigned = 0;
    for (const meeting of meetings) {
      totalPresent += meeting.attendances.filter((a) => a.status === 'present').length;
      totalAssigned += meeting.attendances.length;
    }
    averageAttendanceRate = totalAssigned > 0 ? Number(((totalPresent / totalAssigned) * 100).toFixed(1)) : 0;
  }

  let totalGivingAttribution = 0;
  if (memberEmails.length > 0) {
    const donationSum = await prisma.donation.aggregate({
      _sum: { amount: true },
      where: { tenantId, status: 'succeeded', donorEmail: { in: memberEmails } },
    });
    const partnershipSum = await prisma.partnership.aggregate({
      _sum: { amount: true },
      where: { tenantId, status: 'succeeded', partnerEmail: { in: memberEmails } },
    });
    totalGivingAttribution = (donationSum._sum.amount || 0) + (partnershipSum._sum.amount || 0);
  }

  const inviteLinks = await prisma.groupInviteLink.findMany({ where: { groupId, tenantId } });
  const linkIds = inviteLinks.map((link) => link.id);
  const outreachConversionsCount = linkIds.length > 0
    ? await prisma.groupInviteConversion.count({
        where: { tenantId, inviteLinkId: { in: linkIds }, attributionStatus: 'verified' },
      })
    : 0;

  const growthTarget = group.groupType.maxMembersThreshold || 25;
  const nestedTarget = group.groupType.nestedCellsThreshold || 25;
  const growthScore = Math.min(10, Number(((membersCount / Math.max(growthTarget, 1)) * 10).toFixed(1)));
  const multiplicationIndex = Math.min(10, Number(((childCellsCount / Math.max(nestedTarget, 1)) * 10).toFixed(1)));
  const rosterAttendanceIndex = Math.min(10, Number((averageAttendanceRate / 10).toFixed(1)));
  const givingConsistencyIndex = Math.min(10, Number((totalGivingAttribution / 1000).toFixed(1)));
  const newSoulsIndex = Math.min(10, outreachConversionsCount);
  const totalScore = Number(((growthScore + multiplicationIndex + rosterAttendanceIndex + givingConsistencyIndex + newSoulsIndex) / 5).toFixed(1));

  return {
    groupId,
    groupName: group.name,
    tierLevel: group.groupType.tierLevel,
    membersCount,
    childCellsCount,
    averageAttendanceRate,
    totalGivingAttribution,
    outreachConversionsCount,
    growthScore,
    multiplicationIndex,
    rosterAttendanceIndex,
    givingConsistencyIndex,
    newSoulsIndex,
    totalScore,
    accredited: membersCount >= growthTarget && averageAttendanceRate >= 75,
    recommendationStatus: membersCount >= growthTarget ? 'eligible_for_review' : 'needs_growth',
    requiredImprovements: [
      ...(membersCount < growthTarget ? [`Add ${growthTarget - membersCount} more active members`] : []),
      ...(averageAttendanceRate < 75 ? ['Raise attendance average to at least 75%'] : []),
    ],
  };
}

export async function getPromotionRecommendations(tenantId: string) {
  const groups = await prisma.group.findMany({
    where: { tenantId, status: 'active' },
    include: { groupType: true },
  });

  const recommendations = [];
  for (const group of groups) {
    const scorecard = await calculateScorecard(tenantId, group.id);
    if (scorecard.recommendationStatus === 'eligible_for_review') {
      recommendations.push({ groupId: group.id, groupName: group.name, scorecard });
    }
  }
  return recommendations;
}

export async function promoteGroup(tenantId: string, groupId: string, approvedByAdminId: string) {
  const scorecard = await calculateScorecard(tenantId, groupId);
  const group = await prisma.group.findFirst({
    where: { id: groupId, tenantId },
    include: { groupType: true, leader: true },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  const currentLevel = group.groupType.tierLevel;
  if (currentLevel <= 1) {
    throw new Error('Group is already at the highest hierarchy level (Master Cell)');
  }

  const targetMembersThreshold = group.groupType.maxMembersThreshold;
  if (scorecard.membersCount < targetMembersThreshold) {
    throw new Error(`Promotional thresholds not met. Current active members: ${scorecard.membersCount}/${targetMembersThreshold}`);
  }

  const targetLevel = currentLevel - 1;
  const nextGroupType = await prisma.groupType.findFirst({
    where: { tierLevel: targetLevel, tenantId },
  });

  if (!nextGroupType) {
    throw new Error(`Target Group Type for tier level ${targetLevel} is not configured`);
  }

  return await prisma.$transaction(async (tx) => {
    const promotion = await tx.groupPromotion.create({
      data: {
        tenantId,
        targetId: groupId,
        type: 'group_level_up',
        oldValue: group.groupType.name,
        newValue: nextGroupType.name,
        scorecardSnapshotJson: JSON.stringify(scorecard),
        approvedByAdminId,
        pastorAuthorityVerified: true,
      },
    });

    await tx.group.update({
      where: { id: groupId },
      data: { groupTypeId: nextGroupType.id },
    });

    if (group.leaderId) {
      const nextRole = targetLevel === 2 ? 'Super Cell Leader' : 'Master Cell Leader';
      await tx.groupPromotion.create({
        data: {
          tenantId,
          targetId: group.leaderId,
          type: 'leader_level_up',
          oldValue: 'Cell Leader',
          newValue: nextRole,
          scorecardSnapshotJson: JSON.stringify(scorecard),
          approvedByAdminId,
          pastorAuthorityVerified: true,
        },
      });
    }

    await logCellActivity(tenantId, approvedByAdminId, 'cell_promotion_execute', { groupId, promotionId: promotion.id });
    return promotion;
  });
}

export async function getCellOverview(tenantId: string) {
  const [settings, groups, membersWithoutCells, recentActivity, recommendations, manual, outlines, activeOutline] = await Promise.all([
    getGroupSettings(tenantId),
    listGroups(tenantId),
    prisma.member.count({
      where: {
        tenantId,
        groupMemberships: { none: { status: 'active' } },
      },
    }),
    prisma.cmsActivityLog.findMany({
      where: { tenantId, actionType: { startsWith: 'cell_' } },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    getPromotionRecommendations(tenantId),
    getCellMinistryManual(tenantId).catch(() => null),
    listWeeklyOutlines(tenantId).catch(() => []),
    getActiveWeeklyOutline(tenantId).catch(() => null),
  ]);

  const activeGroups = groups.filter((group: any) => group.status === 'active');
  const meetings = groups.flatMap((group: any) => group.meetings || []);
  const upcomingMeetings = meetings.filter((meeting: any) => new Date(meeting.scheduledAt).getTime() >= Date.now());
  const totalMembersAssigned = groups.reduce((sum: number, group: any) => sum + group.memberCount, 0);
  const inviteConversions = await prisma.groupInviteConversion.count({ where: { tenantId, attributionStatus: 'verified' } });

  return {
    moduleKey: CELL_MODULE_KEY,
    settings,
    counts: {
      totalGroups: groups.length,
      activeGroups: activeGroups.length,
      inactiveGroups: groups.length - activeGroups.length,
      totalMembersAssigned,
      membersWithoutCells,
      upcomingMeetings: upcomingMeetings.length,
      inviteConversions,
      promotionRecommendations: recommendations.length,
      weeklyOutlines: outlines.length,
    },
    groups,
    recommendations,
    recentActivity,
    content: {
      manual,
      activeOutline,
      publishedOutlines: outlines.filter((outline: any) => outline.status === 'published').length,
    },
  };
}

export async function getHierarchyTree(tenantId: string) {
  const groups = await listGroups(tenantId);
  const byParent = new Map<string | null, any[]>();
  for (const group of groups) {
    const key = group.parentId || null;
    byParent.set(key, [...(byParent.get(key) || []), group]);
  }

  function attachChildren(group: any): any {
    return {
      ...group,
      children: (byParent.get(group.id) || []).map(attachChildren),
    };
  }

  return (byParent.get(null) || []).map(attachChildren);
}

export async function getCellMapData(tenantId: string) {
  const access = await getCellModuleAccess(tenantId);
  const groups = await listGroups(tenantId, { status: 'active' });

  return groups.map((group: any, index: number) => {
    const location = group.location;
    const hasCoordinates = location.lat !== null && location.lng !== null;
    const fallbackLat = 40.7128 + (index % 5) * 0.01;
    const fallbackLng = -74.006 - (index % 5) * 0.01;

    return {
      groupId: group.id,
      name: group.name,
      type: group.groupType?.name || 'Cell',
      fellowshipMode: group.fellowshipMode,
      fellowshipModeLabel: group.fellowshipModeLabel,
      memberCount: group.memberCount,
      leaderName: group.leaderName,
      location: {
        address: group.fellowshipMode === 'online' ? 'Online only' : (access.settings.exposePreciseLocations ? location.address : location.safeAddress),
        city: location.city,
        region: location.region,
        lat: hasCoordinates ? location.lat : fallbackLat,
        lng: hasCoordinates ? location.lng : fallbackLng,
        approximate: !hasCoordinates || !access.settings.exposePreciseLocations,
      },
    };
  });
}

export async function getCellAnalytics(tenantId: string) {
  const groups = await listGroups(tenantId);
  const scorecards = [];
  for (const group of groups) {
    scorecards.push(await calculateScorecard(tenantId, group.id));
  }

  const meetings = await prisma.groupMeeting.findMany({
    where: { tenantId },
    orderBy: { scheduledAt: 'asc' },
  });

  return {
    healthByGroup: scorecards,
    attendanceTrend: meetings.map((meeting) => ({
      date: meeting.scheduledAt.toISOString().slice(0, 10),
      attendance: meeting.attendanceCount,
      groupId: meeting.groupId,
    })),
    hierarchySummary: {
      totalGroups: groups.length,
      rootGroups: groups.filter((group: any) => !group.parentId).length,
      leafCells: groups.filter((group: any) => group.childCount === 0).length,
    },
  };
}

export async function getPublicCellFinder(tenantId: string) {
  await assertPublicCellAccess(tenantId, true);
  const groups = await listGroups(tenantId, { status: 'active' });
  return groups.map((group: any) => ({
    id: group.id,
    name: group.name,
    slug: group.id,
    type: group.groupType?.name || 'Cell',
    description: group.description,
    leaderName: group.leaderName,
    meetingCount: group.meetingCount,
    memberCount: group.memberCount,
    fellowshipMode: group.fellowshipMode,
    fellowshipModeLabel: group.fellowshipModeLabel,
    location: {
      city: group.location.city,
      region: group.location.region,
      address: group.location.safeAddress,
      approximate: true,
    },
    online: group.fellowshipMode === 'online' || group.fellowshipMode === 'hybrid',
    offline: group.fellowshipMode === 'offline' || group.fellowshipMode === 'hybrid',
  }));
}

export async function getMemberCellPortal(tenantId: string, userId: string) {
  const access = await getCellModuleAccess(tenantId);
  if (!access.memberPortalAllowed) {
    throw new Error('Member cell portal is not enabled for this church');
  }

  const member = await prisma.member.findFirst({ where: { tenantId, userId } });
  if (!member) throw new Error('Member profile not found');

  const membership = await prisma.groupMember.findFirst({
    where: { tenantId, memberId: member.id, status: 'active' },
    include: { group: { include: { groupType: true, leader: true, coLeader: true, host: true } } },
  });

  if (!membership) {
    return { member, membership: null, group: null, notices: [], meetings: [], inviteLinks: [], manual: null, activeOutline: null };
  }

  const [notices, meetings, inviteLinks, manual, activeOutline] = await Promise.all([
    listNoticePosts(tenantId, membership.groupId, userId).catch(() => []),
    listMeetings(tenantId, membership.groupId),
    listInviteLinks(tenantId, membership.groupId),
    getCellMinistryManual(tenantId).catch(() => null),
    getActiveWeeklyOutline(tenantId).catch(() => null),
  ]);

  return {
    member,
    membership,
    group: formatGroup({ ...membership.group, members: [], children: [], meetings: [], inviteLinks: [] }),
    notices,
    meetings,
    inviteLinks: inviteLinks.filter((link: any) => link.createdByMemberId === member.id),
    manual,
    activeOutline,
  };
}

export async function getLeaderDashboard(tenantId: string, userId: string) {
  const member = await prisma.member.findFirst({ where: { tenantId, userId } });
  if (!member) throw new Error('Member profile not found');

  const groups = await prisma.group.findMany({
    where: {
      tenantId,
      OR: [{ leaderId: member.id }, { coLeaderId: member.id }],
    },
    include: {
      groupType: true,
      parent: true,
      children: true,
      leader: true,
      coLeader: true,
      host: true,
      members: { include: { member: true } },
      meetings: { include: { attendances: true } },
      inviteLinks: true,
    },
  });

  const [manual, activeOutline] = await Promise.all([
    getCellMinistryManual(tenantId).catch(() => null),
    getActiveWeeklyOutline(tenantId).catch(() => null),
  ]);

  return {
    member,
    groups: groups.map(formatGroup),
    manual,
    activeOutline,
  };
}
