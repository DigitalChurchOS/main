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

const modules = [
  { key: 'events', name: 'Events & Registration', slots: ['event.card', 'event.detail', 'event.registrationForm'] },
  { key: 'giving', name: 'Giving & Tithing', slots: ['giving.form', 'giving.categoryCard'] },
  { key: 'sermons', name: 'Sermons & Preaching', slots: ['sermon.card', 'sermon.player'] },
  { key: 'media', name: 'Media Library', slots: ['media.card', 'media.player'] },
  { key: 'livestream', name: 'Live Broadcasting', slots: ['livestream.player', 'livestream.countdown', 'livestream.chatSlot'] },
  { key: 'prayer-testimony', name: 'Prayers & Testimonies', slots: ['prayer.sessionCard', 'prayer.room', 'prayer.requestForm', 'prayer.wall', 'testimony.card', 'testimony.wall'] },
  { key: 'groups', name: 'Small Groups', slots: ['group.card', 'group.detail'] },
  { key: 'courses', name: 'LMS Academy', slots: ['course.card', 'course.detail'] },
  { key: 'store', name: 'E-Commerce Store', slots: ['store.productCard', 'store.productDetail'] },
  { key: 'campaigns', name: 'Capital Campaigns', slots: ['campaign.card', 'campaign.progress'] },
  { key: 'partnerships', name: 'Kingdom Partnerships', slots: ['campaign.card', 'campaign.progress'] },
  { key: 'salvation', name: 'Salvation Journey', slots: ['salvation.responseForm'] },
  { key: 'member-portal', name: 'Member Portal', slots: ['member.profile', 'member.dashboard'] },
  { key: 'blog', name: 'Dynamic Blog', slots: ['blog.articleCard'] },
  { key: 'resources', name: 'Digital Resources', slots: ['resource.card'] },
  { key: 'services', name: 'Church Services', slots: ['service.card'] },
  { key: 'digital-library', name: 'Digital Library', slots: ['media.card', 'media.player'] },
  { key: 'podcast', name: 'Audio Podcasts', slots: ['media.card', 'media.player'] },
  { key: 'worship', name: 'Worship Media', slots: ['media.card', 'media.player'] },
  { key: 'cell-fellowship', name: 'Cell Fellowship', slots: ['group.card', 'group.detail'] },
  { key: 'live-meetings', name: 'Live Meetings', slots: ['prayer.room'] },
  { key: 'booking-appointments', name: 'Booking & Appointments', slots: ['event.registrationForm'] },
  { key: 'mobile-app', name: 'Mobile App Management', slots: ['layout.mobileNav'] },
  { key: 'multi-branch', name: 'Multi-Branch Engine', slots: ['service.card'] },
  { key: 'bible-engagement', name: 'Bible Engagement', slots: ['media.player'] }
];

modules.forEach(m => {
  const filename = `modules/${m.key}.module-contract.ts`;
  const contractConstName = `${m.key.replace(/-(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, c => c.toUpperCase())}ModuleContract`;

  const slotsJson = m.slots.map(s => `
    {
      slotKey: '${s}',
      displayName: '${s.split('.').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(' ')}',
      expectedDataType: '${s.split('.').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('')}Contract'
    }`).join(',');

  writeFile(filename, `
import { ModuleUIContract } from '../core/base.types';

export const ${contractConstName}: ModuleUIContract = {
  moduleKey: '${m.key}',
  displayName: '${m.name}',
  publicRoutes: [
    { path: '/${m.key}', type: 'listing', displayName: '${m.name} Listing' },
    { path: '/${m.key}/:id', type: 'detail', displayName: '${m.name} Detail' }
  ],
  widgets: [
    {
      widgetKey: '${m.key}.widget',
      displayName: '${m.name} Widget',
      exposedThemeSlots: ${JSON.stringify(m.slots)},
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: '${m.key}.dashboard', displayName: '${m.name} Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View ${m.name}', action: 'view', url: '/${m.key}' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [${slotsJson}],
  entitlementRules: [
    { moduleKey: '${m.key}', minBillingTier: 'free' }
  ],
  seo: {
    title: '${m.name}',
    description: 'Explore the ${m.name} module interface.'
  },
  localizationKeys: ['${m.key}.title', '${m.key}.empty'],
  analyticsEvents: [
    { eventName: '${m.key}_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
`);
});

console.log('Module contracts generation script complete.');
