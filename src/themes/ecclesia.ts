export const ECCLESIA_THEME_KEY = 'ecclesia';
export const ECCLESIA_THEME_NAME = 'Ecclesia';
export const ECCLESIA_GLOBAL_CONTENT_KEY = 'ecclesia-global-content';
export const ECCLESIA_THEME_ASSET_BASE = '/themes/ecclesia';

export type JsonRecord = Record<string, any>;

export interface EcclesiaSourcePage {
  key: string;
  name: string;
  title: string;
  slug: string;
  file: string;
  sourceUrl: string;
  icon: string;
  module: string;
  description: string;
}

export interface EcclesiaPageTemplate {
  key: string;
  name: string;
  title: string;
  slug: string;
  icon: string;
  description: string;
  type: 'page';
  status: 'draft' | 'published';
  sourceFile?: string;
  sourceUrl?: string;
  module?: string;
  structure: {
    template: string;
    sections: string[];
    widgetAware: boolean;
    builderEditable: boolean;
    sourceFile?: string;
    sourceUrl?: string;
    assetBase?: string;
    sourcePackage?: string;
    staticSource?: boolean;
  };
  blocks: JsonRecord[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

export const ECCLESIA_THEME_STYLESHEETS = [
  `${ECCLESIA_THEME_ASSET_BASE}/assets/styles.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/media.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/livestream.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/podcast.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/blog.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/events.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/giving.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/library.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/lms.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/prayer.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/services.css`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/worship.css`,
];

export const ECCLESIA_THEME_SCRIPTS = [
  `${ECCLESIA_THEME_ASSET_BASE}/assets/app.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/media.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/livestream.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/podcast.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/blog.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/events.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/giving.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/library.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/lms.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/prayer.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/services.js`,
  `${ECCLESIA_THEME_ASSET_BASE}/assets/worship.js`,
];

export const ECCLESIA_THEME_SOURCE_PAGES: EcclesiaSourcePage[] = [
  sourcePage('index', 'Home', '', 'index.html', 'home', 'Core', 'Ecclesia homepage with hero, service cards, church life, sermons, and giving CTA.'),
  sourcePage('about', 'About', 'about', 'about.html', 'badge-info', 'Core', 'Mission, story, leadership, and church identity page.'),
  sourcePage('sermons', 'Sermons', 'sermons', 'sermons.html', 'mic-2', 'Media', 'Sermon landing page for recent messages and message collections.'),
  sourcePage('events', 'Events', 'events', 'events.html', 'calendar-days', 'Events', 'Featured events and church calendar page.'),
  sourcePage('ministries', 'Ministries', 'ministries', 'ministries.html', 'network', 'Ministries', 'Ministry directory and serving pathways.'),
  sourcePage('prayer', 'Prayer', 'prayer', 'prayer.html', 'heart-handshake', 'Prayer', 'Prayer request and care entry point.'),
  sourcePage('contact', 'Contact', 'contact', 'contact.html', 'mail', 'Core', 'Contact, visit planning, and location details.'),
  sourcePage('login', 'Member Login', 'login', 'login.html', 'log-in', 'Members', 'Member login and registration page from the Ecclesia package.'),
  sourcePage('account', 'Member Account', 'account', 'account.html', 'circle-user-round', 'Members', 'Member account, profile, and giving activity page from the Ecclesia package.'),
  sourcePage('giving', 'Giving', 'giving', 'giving.html', 'hand-coins', 'Giving', 'Giving page with generosity prompts and secure giving entry.'),
  sourcePage('giving-partnership', 'Partnership', 'partnership', 'giving-partnership.html', 'handshake', 'Giving', 'Partnership campaign and recurring support page.'),
  sourcePage('livestream-page', 'Livestream', 'livestream', 'livestream-page.html', 'radio-tower', 'Livestream', 'Live worship page with stream, prayer, and service actions.'),
  sourcePage('media-archive', 'Media Archive', 'media', 'media-archive.html', 'folder-play', 'Media', 'Media archive for videos, sermon clips, and collections.'),
  sourcePage('media-single', 'Media Single', 'media/sample-message', 'media-single.html', 'play-square', 'Media', 'Single media item with player, notes, and related content.'),
  sourcePage('podcast-archive', 'Podcast', 'podcast', 'podcast-archive.html', 'podcast', 'Podcast', 'Podcast archive with latest episodes and subscription CTA.'),
  sourcePage('podcast-episode', 'Podcast Episode', 'podcast/sample-episode', 'podcast-episode.html', 'mic', 'Podcast', 'Single podcast episode page.'),
  sourcePage('blog-archive', 'Blog', 'blog', 'blog-archive.html', 'newspaper', 'Blog', 'Article archive for devotionals, news, and church stories.'),
  sourcePage('blog-single', 'Blog Post', 'blog/sample-post', 'blog-single.html', 'file-text', 'Blog', 'Single article page with content and related posts.'),
  sourcePage('services-archive', 'Services', 'services', 'services-archive.html', 'calendar-clock', 'Services', 'Service times, gatherings, and worship schedule page.'),
  sourcePage('service-single', 'Service Detail', 'services/sample-service', 'service-single.html', 'calendar-star', 'Services', 'Single service or gathering detail page.'),
  sourcePage('library-archive', 'Library', 'library', 'library-archive.html', 'library', 'Library', 'Digital resource library and downloads archive.'),
  sourcePage('resource-single', 'Resource Single', 'library/sample-resource', 'resource-single.html', 'book-open', 'Library', 'Single downloadable resource page.'),
  sourcePage('courses-archive', 'Courses', 'courses', 'courses-archive.html', 'graduation-cap', 'LMS', 'Course catalog for discipleship and training.'),
  sourcePage('course-main', 'Course Main', 'courses/main', 'course-main.html', 'notebook-tabs', 'LMS', 'Course landing page with lessons and progress context.'),
  sourcePage('lesson-single', 'Lesson Single', 'courses/lesson', 'lesson-single.html', 'book-marked', 'LMS', 'Single lesson page for course content.'),
  sourcePage('events-archive', 'Events Archive', 'events/archive', 'events-archive.html', 'calendar-range', 'Events', 'Full event archive with categories and listings.'),
  sourcePage('event-single', 'Event Detail', 'events/sample-event', 'event-single.html', 'calendar-star', 'Events', 'Single event page with schedule and registration CTA.'),
  sourcePage('event-register', 'Event Register', 'events/register', 'event-register.html', 'clipboard-check', 'Events', 'Event registration form page.'),
  sourcePage('prayer-home', 'Prayer Home', 'prayer-home', 'prayer-home.html', 'heart', 'Prayer', 'Prayer module home with room and wall pathways.'),
  sourcePage('prayer-wall', 'Prayer Wall', 'prayer/wall', 'prayer-wall.html', 'messages-square', 'Prayer', 'Public prayer wall layout.'),
  sourcePage('prayer-room', 'Prayer Room', 'prayer/room', 'prayer-room.html', 'door-open', 'Prayer', 'Guided prayer room page.'),
  sourcePage('testimony-wall', 'Testimony Wall', 'testimonies', 'testimony-wall.html', 'message-circle-heart', 'Testimony', 'Moderated testimony wall.'),
  sourcePage('testimony-single', 'Testimony Single', 'testimonies/sample-story', 'testimony-single.html', 'message-square-heart', 'Testimony', 'Single testimony story page.'),
  sourcePage('testimony-submit', 'Submit Testimony', 'testimonies/submit', 'testimony-submit.html', 'send', 'Testimony', 'Testimony submission form.'),
  sourcePage('worship', 'Worship', 'worship', 'worship.html', 'music', 'Worship', 'Worship resources, songs, audio, and chord chart page.'),
];

export interface EcclesiaSectionTemplate {
  name: string;
  key: string;
  type: 'section';
  category: string;
  description: string;
  structure: JsonRecord;
}

export interface EcclesiaWidgetDefinition {
  type: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  editableFields: string[];
  themeSlots: string[];
  dataSource: string;
  responsiveBehavior: string;
  allowedContexts: string[];
  defaultContent: JsonRecord;
}

const accentPresets = {
  orange: { primary: '#f97316', secondary: '#facc15', soft: 'rgba(249,115,22,.14)' },
  blue: { primary: '#2563eb', secondary: '#38bdf8', soft: 'rgba(37,99,235,.14)' },
  purple: { primary: '#7c3aed', secondary: '#a855f7', soft: 'rgba(124,58,237,.14)' },
  green: { primary: '#059669', secondary: '#34d399', soft: 'rgba(5,150,105,.14)' },
  red: { primary: '#dc2626', secondary: '#f97316', soft: 'rgba(220,38,38,.14)' },
  rose: { primary: '#e11d48', secondary: '#fb7185', soft: 'rgba(225,29,72,.14)' },
  gold: { primary: '#d97706', secondary: '#fbbf24', soft: 'rgba(217,119,6,.16)' },
};

const themeModePalettes = {
  light: {
    background: '#fffaf3',
    surface: '#ffffff',
    mutedSurface: '#f6efe6',
    textPrimary: '#1d1812',
    textSecondary: '#74685e',
    border: 'rgba(29,24,18,.12)',
    gradient: ['#fff7ed', '#ffedd5', '#fed7aa'],
  },
  dark: {
    background: '#101018',
    surface: '#171724',
    mutedSurface: '#222233',
    textPrimary: '#fffaf3',
    textSecondary: '#c8beb2',
    border: 'rgba(255,255,255,.12)',
    gradient: ['#151521', '#1d1d2b', '#27243a'],
  },
  sepia: {
    background: '#f4eadc',
    surface: '#fff7ea',
    mutedSurface: '#eadccb',
    textPrimary: '#2b2118',
    textSecondary: '#736456',
    border: 'rgba(43,33,24,.14)',
    gradient: ['#fff7ea', '#f4eadc', '#eadccb'],
  },
  slate: {
    background: '#0f172a',
    surface: '#172033',
    mutedSurface: '#202b42',
    textPrimary: '#f8fafc',
    textSecondary: '#b6c1d4',
    border: 'rgba(255,255,255,.12)',
    gradient: ['#111c33', '#172033', '#22304b'],
  },
};

const palettePresets = {
  warm: {
    background: '#fffaf4',
    surface: '#ffffff',
    mutedSurface: '#fff2e5',
    textPrimary: '#201b18',
    textSecondary: '#746b65',
    border: 'rgba(91,64,45,.14)',
    gradient: ['#fff7ed', '#ffedd5', '#fed7aa'],
  },
  cool: {
    background: '#f8fbff',
    surface: '#ffffff',
    mutedSurface: '#eef6ff',
    textPrimary: '#172033',
    textSecondary: '#64748b',
    border: 'rgba(37,99,235,.13)',
    gradient: ['#eff6ff', '#e0f2fe', '#dbeafe'],
  },
  neutral: {
    background: '#fafafa',
    surface: '#ffffff',
    mutedSurface: '#f4f4f5',
    textPrimary: '#18181b',
    textSecondary: '#71717a',
    border: 'rgba(24,24,27,.12)',
    gradient: ['#fafafa', '#f4f4f5', '#e4e4e7'],
  },
  elegant: {
    background: '#fbfaf7',
    surface: '#ffffff',
    mutedSurface: '#f3eee7',
    textPrimary: '#1f1b16',
    textSecondary: '#6d6259',
    border: 'rgba(62,45,31,.14)',
    gradient: ['#fbfaf7', '#f4efe8', '#e8ded1'],
  },
  midnight: {
    background: '#121621',
    surface: '#1b2230',
    mutedSurface: '#232c3d',
    textPrimary: '#f8fafc',
    textSecondary: '#a8b3c5',
    border: 'rgba(255,255,255,.11)',
    gradient: ['#151a26', '#1d2636', '#101827'],
  },
  modern: {
    background: '#ffffff',
    surface: '#f9fafb',
    mutedSurface: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    border: 'rgba(17,24,39,.1)',
    gradient: ['#ffffff', '#f9fafb', '#f3f4f6'],
  },
  vibrant: {
    background: '#f5f3ff',
    surface: '#ffffff',
    mutedSurface: '#ede9fe',
    textPrimary: '#1e1b4b',
    textSecondary: '#4c1d95',
    border: 'rgba(76,29,149,.13)',
    gradient: ['#f5f3ff', '#ede9fe', '#ddd6fe'],
  },
  ivory: {
    background: '#faf9f6',
    surface: '#ffffff',
    mutedSurface: '#f4f3ee',
    textPrimary: '#1c1917',
    textSecondary: '#78716c',
    border: 'rgba(28,25,23,.11)',
    gradient: ['#faf9f6', '#f4f3ee', '#e7e5e4'],
  },
  charcoal: {
    background: '#1c1917',
    surface: '#292524',
    mutedSurface: '#44403c',
    textPrimary: '#f5f5f4',
    textSecondary: '#a8a29e',
    border: 'rgba(255,255,255,.1)',
    gradient: ['#1c1917', '#292524', '#44403c'],
  },
  slate: {
    background: '#0f172a',
    surface: '#1e293b',
    mutedSurface: '#334155',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    border: 'rgba(255,255,255,.09)',
    gradient: ['#0f172a', '#1e293b', '#334155'],
  },
  cream: {
    background: '#fffdf9',
    surface: '#ffffff',
    mutedSurface: '#fcf8f2',
    textPrimary: '#292524',
    textSecondary: '#78716c',
    border: 'rgba(120,113,108,.13)',
    gradient: ['#fffdf9', '#fcf8f2', '#f5f5f4'],
  }
};

const fontPairingPresets = {
  manropeInter: { heading: 'Manrope', body: 'Inter' },
  interMerriweather: { heading: 'Inter', body: 'Merriweather' },
  interPlayfair: { heading: 'Inter', body: 'Playfair Display' },
  manropeSourceSerif: { heading: 'Manrope', body: 'Source Serif 4' },
  dmSansCrimson: { heading: 'DM Sans', body: 'Crimson Text' },
  outfitInter: { heading: 'Outfit', body: 'Inter' },
  playfairInter: { heading: 'Playfair Display', body: 'Inter' },
  slabInter: { heading: 'Roboto Slab', body: 'Inter' },
};

const typographyPresetFonts = {
  sans: { heading: 'Outfit', body: 'Inter' },
  serif: { heading: 'Playfair Display', body: 'Inter' },
  geometric: { heading: 'Outfit', body: 'Inter' },
  slab: { heading: 'Roboto Slab', body: 'Inter' },
  modernSans: { heading: 'Outfit', body: 'Inter' },
  elegantSerif: { heading: 'Playfair Display', body: 'Merriweather' },
  editorial: { heading: 'Lora', body: 'Inter' },
  contemporaryChurch: { heading: 'Manrope', body: 'Inter' },
  corporate: { heading: 'Manrope', body: 'Inter' },
  classicMinistry: { heading: 'Lora', body: 'Merriweather' },
};

export function createEcclesiaThemeSettings(overrides: JsonRecord = {}) {
  const defaultDesign = {
    colorMode: 'light',
    accentPreset: 'orange',
    colorPalette: 'warm',
    typographyPreset: 'sans',
    fontPairing: 'outfitInter',
    iconStyle: 'lucideLine',
    spacingScale: 'comfortable',
    sectionSpacing: 'balanced',
    backgroundStyle: 'softGradient',
    animationPreference: 'subtle',
    edgeStyle: 'smooth',
    shadowDepth: 'soft',
    glow: false,
    glass: true,
    layout: false,
  };

  const design = { ...defaultDesign, ...(overrides.design || {}) };

  const accent = accentPresets[design.accentPreset as keyof typeof accentPresets] || accentPresets.orange;
  let palette = themeModePalettes[design.colorMode as keyof typeof themeModePalettes]
    || palettePresets[design.colorPalette as keyof typeof palettePresets]
    || themeModePalettes.light;

  if (design.colorMode === 'dark') {
    if (design.colorPalette === 'warm') {
      palette = {
        background: '#1c1917',
        surface: '#292524',
        mutedSurface: '#3e3935',
        textPrimary: '#f5f5f4',
        textSecondary: '#a8a29e',
        border: 'rgba(255,255,255,.11)',
        gradient: ['#1c1917', '#292524', '#3e3935'],
      };
    } else if (design.colorPalette === 'cool') {
      palette = palettePresets.slate;
    } else if (design.colorPalette === 'neutral' || design.colorPalette === 'modern') {
      palette = {
        background: '#18181b',
        surface: '#27272a',
        mutedSurface: '#3f3f46',
        textPrimary: '#f4f4f5',
        textSecondary: '#a1a1aa',
        border: 'rgba(255,255,255,.1)',
        gradient: ['#18181b', '#27272a', '#3f3f46'],
      };
    } else if (design.colorPalette === 'elegant' || design.colorPalette === 'cream' || design.colorPalette === 'ivory') {
      palette = {
        background: '#1f1b16',
        surface: '#2c251e',
        mutedSurface: '#3a3128',
        textPrimary: '#fdfcfb',
        textSecondary: '#c8bfb7',
        border: 'rgba(255,255,255,.1)',
        gradient: ['#1f1b16', '#2c251e', '#3a3128'],
      };
    } else if (design.colorPalette === 'vibrant') {
      palette = {
        background: '#120d2b',
        surface: '#1c153b',
        mutedSurface: '#2d215c',
        textPrimary: '#f5f3ff',
        textSecondary: '#c7bcf7',
        border: 'rgba(255,255,255,.12)',
        gradient: ['#120d2b', '#1c153b', '#2d215c'],
      };
    }
  }

  let fonts = { heading: 'Manrope', body: 'Inter' };
  if (design.fontPairing && fontPairingPresets[design.fontPairing as keyof typeof fontPairingPresets]) {
    fonts = fontPairingPresets[design.fontPairing as keyof typeof fontPairingPresets];
  } else if (design.typographyPreset && typographyPresetFonts[design.typographyPreset as keyof typeof typographyPresetFonts]) {
    fonts = typographyPresetFonts[design.typographyPreset as keyof typeof typographyPresetFonts];
  }

  let borderRadius = '34px';
  const radiusPreset = design.radius || design.edgeStyle;
  if (radiusPreset === 'pillow') {
    borderRadius = '50px';
  } else if (radiusPreset === 'medium' || radiusPreset === 'soft') {
    borderRadius = '16px';
  } else if (radiusPreset === 'sharp') {
    borderRadius = '0px';
  }

  let shadowStyle = '0 4px 12px rgba(0,0,0,0.05)';
  if (design.shadowDepth === 'none') {
    shadowStyle = 'none';
  } else if (design.shadowDepth === 'deep') {
    shadowStyle = '0 12px 36px rgba(0,0,0,0.12)';
  }

  let sectionPadding = '104px';
  if (design.sectionSpacing === 'compact' || design.sectionSpacing === 'tight') {
    sectionPadding = '64px';
  } else if (design.sectionSpacing === 'generous' || design.sectionSpacing === 'airy') {
    sectionPadding = '128px';
  }

  let gridGap = '24px';
  if (design.spacingScale === 'compact') {
    gridGap = '16px';
  } else if (design.spacingScale === 'spacious') {
    gridGap = '36px';
  }

  let transitionSpeed = '220ms';
  let animationLevel = 'subtle';
  if (design.animationPreference === 'none') {
    transitionSpeed = '0ms';
    animationLevel = 'none';
  } else if (design.animationPreference === 'expressive') {
    transitionSpeed = '350ms';
    animationLevel = 'expressive';
  }

  const base = {
    metadata: {
      key: ECCLESIA_THEME_KEY,
      name: ECCLESIA_THEME_NAME,
      version: '1.0.0',
      role: 'platform-reference-theme',
      systemTheme: true,
      builderFirst: true,
      marketplaceCompatible: true,
      sourcePackage: 'ecclesia-full-theme',
    },
    sourcePackage: {
      assetBase: ECCLESIA_THEME_ASSET_BASE,
      localPath: 'ecclesia-full-theme',
      previewUrl: `${ECCLESIA_THEME_ASSET_BASE}/index.html`,
      sourcePages: ECCLESIA_THEME_SOURCE_PAGES,
      stylesheets: ECCLESIA_THEME_STYLESHEETS,
      scripts: ECCLESIA_THEME_SCRIPTS,
    },
    assets: {
      assetBase: ECCLESIA_THEME_ASSET_BASE,
      stylesheets: ECCLESIA_THEME_STYLESHEETS,
      scripts: ECCLESIA_THEME_SCRIPTS,
      audio: [
        `${ECCLESIA_THEME_ASSET_BASE}/assets/songs/KING-OF-ETERNITY.mp3`,
        `${ECCLESIA_THEME_ASSET_BASE}/assets/songs/YOUR-DOMINION-IS-FOR-ETERNITY.mp3`,
      ],
    },
    colorMode: design.colorMode,
    accentPreset: design.accentPreset,
    colorPalette: design.colorPalette,
    typographyPreset: design.typographyPreset,
    fontPairing: design.fontPairing,
    edgeStyle: radiusPreset,
    cardStyle: 'shadow',
    buttonStyle: 'solid',
    sectionSpacing: design.sectionSpacing,
    spacingScale: design.spacingScale,
    backgroundStyle: design.backgroundStyle,
    iconStyle: design.iconStyle,
    animationPreference: design.animationPreference,
    shadowDepth: design.shadowDepth,
    glassHeader: design.glass !== false,
    themeGlow: Boolean(design.glow),
    pageBodyWidth: design.layout ? 'wide' : 'full',
    design,
    colors: {
      primary: accent.primary,
      secondary: design.colorMode === 'dark' ? '#f8fafc' : '#0f172a',
      accent: accent.primary,
      accentSecondary: accent.secondary,
      accentSoft: accent.soft,
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
      background: palette.background,
      surface: palette.surface,
      mutedSurface: palette.mutedSurface,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      border: palette.border,
      gradientA: palette.gradient[0],
      gradientB: palette.gradient[1],
      gradientC: palette.gradient[2],
    },
    fonts,
    typography: {
      headingFont: fonts.heading,
      bodyFont: fonts.body,
      fontScale: 'fluid',
      lineHeight: '1.55',
      letterSpacing: '0',
      headingWeight: 850,
      bodyWeight: 500,
    },
    layout: {
      contentWidth: '1180px',
      sectionWidth: '1320px',
      sectionPadding,
      gridGap,
      verticalRhythm: 'balanced',
      headerStyle: overrides.layout?.headerStyle || 'sticky',
      footerStyle: overrides.layout?.footerStyle || 'expanded',
      mobileLayout: overrides.layout?.mobileLayout || 'stacked',
      pageBodyWidth: overrides.layout?.pageBodyWidth || (design.layout ? 'wide' : 'full'),
    },
    components: {
      buttonStyle: overrides.components?.buttonStyle || 'solid',
      cardStyle: overrides.components?.cardStyle || 'shadow',
      borderRadius,
      radiusPreset,
      edgeStyle: radiusPreset || 'smooth',
      shadowStyle,
      shadowDepth: design.shadowDepth || 'soft',
      inputStyle: 'soft',
    },
    motion: {
      hoverEffects: design.animationPreference !== 'none',
      animationLevel,
      transitionSpeed,
      reducedMotionRespect: true,
    },
    header: {
      style: overrides.header?.style || 'sticky',
      logoDisplay: overrides.header?.logoDisplay || 'markAndName',
      glass: overrides.header?.glass ?? design.glass !== false,
      transparent: overrides.header?.transparent || false,
      floating: overrides.header?.floating || false,
      splitNavigation: overrides.header?.splitNavigation || false,
      ctaLabel: 'Watch Live',
      ctaUrl: '/livestream',
    },
    footer: {
      style: overrides.footer?.style || 'expanded',
      blocks: overrides.footer?.blocks || ['churchInfo', 'navigation', 'serviceTimes', 'contact', 'social', 'newsletter'],
    },
    customizer: {
      storageKey: 'ecclesia-theme-customizer',
      defaults: {
        mode: design.colorMode,
        accent: design.accentPreset,
        font: design.typographyPreset,
        radius: radiusPreset || 'smooth',
        glow: Boolean(design.glow),
        glass: design.glass !== false,
        layout: Boolean(design.layout),
      },
      controls: {
        mode: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'sepia', label: 'Sepia' },
          { value: 'slate', label: 'Slate' },
        ],
        accent: [
          { value: 'orange', label: 'Orange', color: '#f97316' },
          { value: 'blue', label: 'Blue', color: '#2563eb' },
          { value: 'green', label: 'Green', color: '#059669' },
          { value: 'red', label: 'Red', color: '#dc2626' },
          { value: 'purple', label: 'Purple', color: '#7c3aed' },
          { value: 'rose', label: 'Rose', color: '#e11d48' },
        ],
        font: [
          { value: 'sans', label: 'Sans' },
          { value: 'serif', label: 'Serif' },
          { value: 'geometric', label: 'Geometric' },
          { value: 'slab', label: 'Slab' },
        ],
        radius: [
          { value: 'sharp', label: 'Sharp' },
          { value: 'medium', label: 'Medium' },
          { value: 'smooth', label: 'Smooth' },
          { value: 'pillow', label: 'Pillow' },
        ],
        toggles: [
          { value: 'glow', label: 'Glow' },
          { value: 'glass', label: 'Glass header' },
          { value: 'layout', label: 'Wide layout' },
        ],
      },
    },
    moduleRail: [
      { label: 'Media', url: 'media-archive.html', icon: 'tv' },
      { label: 'Livestream', url: 'livestream-page.html', icon: 'video' },
      { label: 'Podcast', url: 'podcast-archive.html', icon: 'mic' },
      { label: 'Articles', url: 'blog-archive.html', icon: 'newspaper' },
      { label: 'Services', url: 'services-archive.html', icon: 'calendar' },
      { label: 'Library', url: 'library-archive.html', icon: 'book-open' },
      { label: 'LMS', url: 'courses-archive.html', icon: 'graduation-cap' },
      { label: 'Worship', url: 'worship.html', icon: 'music' },
      { label: 'Account', url: 'login.html', icon: 'user-circle' },
    ],
    logo: {
      display: overrides.logo?.display || 'markAndName',
      primaryUrl: overrides.logo?.primaryUrl || '',
      faviconUrl: overrides.logo?.faviconUrl || '',
    },
    accessibility: {
      contrastMode: 'normal',
      fontScaling: 'normal',
      reducedMotion: 'system',
      focusStyle: 'accent-ring',
    },
    performance: {
      lazyLoading: true,
      assetOptimization: true,
      imageOptimization: true,
    },
    websiteSettings: {
      homepageSlug: '',
      notFoundSlug: '404',
      maintenanceMode: false,
      language: 'en',
      rtlReady: true,
    },
    seo: {
      defaultTitlePattern: '{{pageTitle}} | {{churchName}}',
      openGraph: true,
      twitterCards: true,
      canonicalUrls: true,
      structuredData: true,
      sitemap: true,
      robots: 'index,follow',
    },
  };

  return deepMerge(base, overrides);
}

export function createEcclesiaGlobalContent(churchName = 'Grace City Church') {
  return {
    churchIdentity: {
      churchName,
      logoUrl: '',
      faviconUrl: '',
      tagline: 'A place to belong, grow, serve, and encounter God.',
      description: 'A Spirit-filled church helping people encounter Jesus, grow in the Word, build strong families, and serve their city.',
    },
    leadership: {
      leadPastor: 'Lead Pastor',
      pastorBio: 'Share a short welcome from your lead pastor and the heart behind your church.',
      pastorImage: '',
    },
    contact: {
      phone: '+1 555 000 0000',
      email: 'hello@example.church',
      address: '123 Worship Avenue, Your City',
      mapUrl: '',
    },
    social: {
      facebook: '',
      youtube: '',
      instagram: '',
      tiktok: '',
      x: '',
      linkedIn: '',
    },
    services: {
      serviceTimes: [
        { label: 'Sunday Worship', time: '9:30 AM', location: 'Main Auditorium' },
        { label: 'Midweek Word & Prayer', time: 'Wednesday 7:00 PM', location: 'Main Campus and online' },
      ],
      serviceLocations: [
        { name: 'Main Campus', address: '123 Worship Avenue, Your City' },
      ],
    },
    callsToAction: {
      primary: { label: 'Plan a Visit', url: '/new-visitor' },
      secondary: { label: 'Watch Live', url: '/livestream' },
      giving: { label: 'Give Now', url: '/giving' },
    },
  };
}

export function createEcclesiaNavigationItems() {
  return [
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about' },
    { label: 'Sermons', url: '/sermons' },
    { label: 'Events', url: '/events' },
    { label: 'Ministries', url: '/ministries' },
    { label: 'Prayer', url: '/prayer' },
    { label: 'Contact', url: '/contact' },
    { label: 'Account', url: '/login' },
    { label: 'Media', url: '/media' },
    { label: 'Livestream', url: '/livestream' },
    { label: 'Podcast', url: '/podcast' },
    { label: 'Articles', url: '/blog' },
    { label: 'Services', url: '/services' },
    { label: 'Library', url: '/library' },
    { label: 'LMS', url: '/courses' },
    { label: 'Worship', url: '/worship' },
  ];
}

export function createEcclesiaFooterLinks() {
  return [
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about' },
    { label: 'Contact', url: '/contact' },
    { label: 'Account', url: '/login' },
    { label: 'Media', url: '/media' },
    { label: 'Livestream', url: '/livestream' },
    { label: 'Podcast', url: '/podcast' },
    { label: 'Articles', url: '/blog' },
    { label: 'Services', url: '/services' },
    { label: 'Library', url: '/library' },
    { label: 'LMS', url: '/courses' },
    { label: 'Worship', url: '/worship' },
  ];
}

export function getEcclesiaSectionTemplates(): EcclesiaSectionTemplate[] {
  return [
    section('Hero Section', 'hero-banner', 'Core', 'Headline, media, and primary calls to action.', { type: 'hero', fields: ['kicker', 'title', 'subtitle', 'buttonText', 'buttonUrl', 'imageUrl'] }),
    section('Welcome Section', 'welcome-section', 'Church Identity', 'Church story and pastoral greeting.', { type: 'about_template', fields: ['headline', 'storyText', 'valuesList'] }),
    section('Service Times', 'service-times', 'Church Identity', 'Global service rhythm and campus details.', { type: 'service_times', source: 'global.services' }),
    section('Ministry Grid', 'ministry-grid', 'Ministries', 'Responsive ministry cards.', { type: 'ministries_list', fields: ['items'] }),
    section('Events Preview', 'events-preview', 'Events', 'Upcoming public events.', { type: 'upcoming_events', source: 'events' }),
    section('Sermon Highlights', 'sermon-highlights', 'Media', 'Latest sermon or series cards.', { type: 'sermon_grid', source: 'media' }),
    section('Livestream CTA', 'livestream-cta', 'Livestream', 'Watch live call-to-action.', { type: 'livestream_cta', source: 'livestream' }),
    section('Prayer CTA', 'prayer-cta', 'Prayer', 'Prayer request and prayer wall prompt.', { type: 'prayer_request_form', source: 'prayer' }),
    section('Testimony Wall', 'testimony-wall', 'Prayer', 'Moderated testimony cards.', { type: 'testimony_wall', source: 'prayer' }),
    section('Giving CTA', 'giving-cta', 'Giving', 'Giving, campaign, and partnership prompt.', { type: 'giving_cta', source: 'giving' }),
    section('Contact Section', 'contact-section', 'Contact', 'Contact form, map, and staff contact details.', { type: 'contact_form', source: 'global.contact' }),
    section('Footer CTA', 'footer-cta', 'Conversion', 'Final next-step invitation.', { type: 'cta_section', fields: ['title', 'text', 'buttonText', 'buttonUrl'] }),
  ];
}

export function getEcclesiaWidgets(): EcclesiaWidgetDefinition[] {
  return [
    widget('hero', 'Hero Section', 'Custom Layout', 'layout', 'Hero with headline, supporting copy, media, and CTA.', ['kicker', 'title', 'subtitle', 'buttonText', 'buttonUrl']),
    widget('service_times', 'Service Times', 'Church Identity', 'clock', 'Weekly worship schedule and location.', ['title', 'sundayTimes', 'midweekTimes', 'address'], 'global.services'),
    widget('ministries_list', 'Ministry Highlights', 'Church Identity', 'network', 'Featured ministries and pathways.', ['title', 'text', 'items'], 'manual'),
    widget('leadership_team', 'Leadership Team', 'Church Identity', 'users-round', 'Pastors, staff, and ministry leader cards.', ['headline', 'members'], 'global.leadership'),
    widget('contact_form', 'Contact Form', 'Membership / Visitor', 'mail', 'Public contact and follow-up form.', ['header', 'email', 'phone', 'showMap'], 'global.contact'),
    widget('giving_cta', 'Giving CTA', 'Giving / Partnership', 'hand-coins', 'Giving prompt linked to tenant giving flow.', ['title', 'text', 'buttonText', 'buttonUrl'], 'giving'),
    widget('upcoming_events', 'Upcoming Events', 'Events', 'calendar-days', 'List of upcoming public events.', ['title', 'text', 'items'], 'events'),
    widget('sermon_grid', 'Sermon Grid', 'Sermon / Media', 'layout-grid', 'Grid of recent sermon messages.', ['title', 'text', 'items'], 'media'),
    widget('livestream_cta', 'Live Service CTA', 'Livestream', 'radio', 'CTA for joining live worship.', ['title', 'text', 'buttonText', 'buttonUrl'], 'livestream'),
    widget('prayer_request_form', 'Prayer Request Form', 'Prayer & Testimony', 'heart-handshake', 'Public prayer request submission form.', ['title', 'text', 'buttonText'], 'prayer'),
    widget('testimony_wall', 'Testimony Wall', 'Prayer & Testimony', 'messages-square', 'Testimony collection preview.', ['title', 'text', 'items'], 'prayer'),
    widget('cta_section', 'CTA Section', 'Custom Layout', 'send', 'Focused call-to-action section.', ['title', 'text', 'buttonText', 'buttonUrl']),
  ];
}

export function getEcclesiaPageTemplates(): EcclesiaPageTemplate[] {
  const templates: EcclesiaPageTemplate[] = [
    page('home-page', 'Home', '', 'home', 'A premium homepage with worship, next steps, ministry, media, prayer, giving, and visitor paths.', ['hero', 'service_times', 'ministries_list', 'upcoming_events', 'livestream_cta', 'sermon_grid', 'prayer_request_form', 'giving_cta', 'cta_section'], [
      hero('Welcome Home', 'A church family where people encounter God, grow in faith, and find their place.'),
      serviceTimes(),
      ministries('Find Your Place'),
      listSection('upcoming_events', 'Upcoming Events', 'Gatherings, services, and community moments for every season.'),
      cta('Join Us Live', 'Experience worship and teaching wherever you are.', 'Watch Live', '/livestream', 'livestream_cta'),
      listSection('sermon_grid', 'Latest Sermons', 'Catch up on recent messages and sermon series.'),
      cta('Need Prayer?', 'Our team would be honored to stand with you.', 'Request Prayer', '/prayer', 'prayer_request_form'),
      giving('Partner With The Vision'),
      cta('New Here?', 'We would love to help you plan your first visit.', 'Start Here', '/new-visitor'),
    ]),
    page('about', 'About', 'about', 'badge-info', 'Mission, vision, values, story, and church identity.', ['hero', 'about_template', 'leadership_team'], [
      hero('About Our Church', 'Learn the heart, story, and values that shape our community.'),
      { type: 'about_template', headline: 'Our Story', storyText: 'Share your church story, mission, vision, and ministry culture here.', valuesList: ['Worship', 'Word', 'Prayer', 'Community', 'Mission'] },
      leadership(),
    ]),
    page('contact', 'Contact', 'contact', 'mail', 'Contact form, map, phone, email, and pastoral care path.', ['hero', 'contact_form'], [
      hero('Contact Us', 'Questions, prayer needs, or planning a visit? We are ready to help.'),
      contact(),
    ]),
    page('events', 'Events', 'events', 'calendar-days', 'Event calendar, featured events, registration prompts, and reminders.', ['hero', 'upcoming_events', 'cta_section'], [
      hero('Upcoming Events', 'Find gatherings, outreaches, classes, and special services.'),
      listSection('upcoming_events', 'Featured Events', 'Create events in ChurchOS and highlight them here.'),
      cta('Invite Someone', 'Share what is coming up with a friend or family member.', 'See All Events', '/events'),
    ]),
    page('event-detail', 'Event Detail', 'events/sample-event', 'calendar-star', 'Single event layout with registration and details.', ['hero', 'cta_section'], [
      hero('Featured Event', 'A focused event page with registration, location, and next steps.'),
      cta('Save Your Seat', 'Registration details and event information appear here.', 'Register', '#register'),
    ]),
    page('sermons', 'Sermons', 'sermons', 'mic-2', 'Sermon archive, latest messages, series, and media filters.', ['hero', 'sermon_grid'], [
      hero('Sermons & Media', 'Watch, listen, and grow through recent messages.'),
      listSection('sermon_grid', 'Recent Messages', 'Sermons published in the Media module can appear here.'),
    ]),
    page('sermon-detail', 'Sermon Detail', 'sermons/sample-sermon', 'play-square', 'Single sermon page with notes, speaker, and media player.', ['hero', 'sermon_grid'], [
      hero('Message Title', 'A sermon detail page for replay, notes, and next steps.'),
      listSection('sermon_grid', 'More From This Series', 'Related messages can appear here.'),
    ]),
    page('livestream', 'Livestream', 'livestream', 'radio-tower', 'Live player, countdown, chat, notes, and giving CTA.', ['hero', 'livestream_cta', 'giving_cta'], [
      hero('Watch Live', 'Join worship live from wherever you are.'),
      cta('Live Service', 'Livestream player, countdown, and service notes can appear here.', 'Open Livestream', '#player', 'livestream_cta'),
      giving('Worship Through Giving'),
    ]),
    page('prayer', 'Prayer', 'prayer', 'heart-handshake', 'Prayer request form, prayer wall, and corporate prayer schedule.', ['hero', 'prayer_request_form'], [
      hero('Prayer Changes Things', 'Share a request and let our team pray with you.'),
      cta('Send A Prayer Request', 'Your request can be routed to the prayer team securely.', 'Submit Request', '#prayer', 'prayer_request_form'),
    ]),
    page('testimonies', 'Testimonies', 'testimonies', 'messages-square', 'Moderated testimony wall and featured stories.', ['hero', 'testimony_wall'], [
      hero('Stories Of Grace', 'Celebrate what God is doing in our community.'),
      listSection('testimony_wall', 'Testimony Wall', 'Approved testimonies can be featured here.'),
    ]),
    page('giving', 'Giving', 'giving', 'hand-coins', 'Giving form, campaigns, recurring gifts, and impact stories.', ['hero', 'giving_cta'], [
      hero('Give Securely', 'Partner with the vision and support the work of ministry.'),
      giving('Make A Difference Today'),
    ]),
    page('partnership', 'Partnership', 'partnership', 'handshake', 'Partnership projects, campaigns, and giving opportunities.', ['hero', 'giving_cta'], [
      hero('Partner With Us', 'Help carry the mission forward through prayer, giving, and service.'),
      giving('Partnership Projects'),
    ]),
    page('ministries', 'Ministries', 'ministries', 'network', 'Ministry directory and department highlights.', ['hero', 'ministries_list'], [
      hero('Ministries', 'Find a team, group, or serving pathway built for your season.'),
      ministries('Ministry Pathways'),
    ]),
    page('leadership', 'Leadership', 'leadership', 'users-round', 'Pastors, staff, and ministry leaders.', ['hero', 'leadership_team'], [
      hero('Our Leadership', 'Meet the people serving and shepherding our church family.'),
      leadership(),
    ]),
    page('blog', 'Blog', 'blog', 'file-text', 'Church blog, devotionals, announcements, and articles.', ['hero', 'feature_grid'], [
      hero('Church Blog', 'Articles, devotionals, and updates from church life.'),
      listSection('feature_grid', 'Latest Posts', 'Published blog posts can appear here.'),
    ]),
    page('blog-post', 'Blog Post', 'blog/sample-post', 'newspaper', 'Single article layout with share and related posts.', ['hero', 'feature_grid'], [
      hero('Article Title', 'A focused article page for devotionals, stories, or announcements.'),
      listSection('feature_grid', 'Related Posts', 'Readers can continue exploring related content.'),
    ]),
    page('new-visitor', 'New Visitor', 'new-visitor', 'clipboard-plus', 'First-time guest pathway and visitor form.', ['hero', 'service_times', 'contact_form'], [
      hero('Plan Your Visit', 'We want your first visit to feel simple, warm, and clear.'),
      serviceTimes(),
      contact('Tell Us You Are Coming'),
    ]),
    page('membership', 'Membership', 'membership', 'user-plus', 'Membership next steps and discipleship path.', ['hero', 'cta_section'], [
      hero('Become A Member', 'Take your next step into belonging, discipleship, and service.'),
      cta('Start Membership', 'Membership classes, forms, and follow-up can connect here.', 'Get Started', '#membership'),
    ]),
    page('volunteer', 'Volunteer', 'volunteer', 'hand', 'Volunteer opportunities and team signup CTA.', ['hero', 'ministries_list', 'cta_section'], [
      hero('Serve With Us', 'Use your gifts to build people and strengthen the mission.'),
      ministries('Serving Teams'),
      cta('Join A Team', 'Tell us where you would love to serve.', 'Volunteer', '#volunteer'),
    ]),
    page('cell-groups', 'Cell Groups', 'cell-groups', 'users', 'Small groups, cell finder, and join CTA.', ['hero', 'ministries_list'], [
      hero('Find Community', 'Life is better when faith is shared in community.'),
      ministries('Groups Near You'),
    ]),
    page('group-detail', 'Group Detail', 'cell-groups/sample-group', 'users-round', 'Single group page with meeting details and join CTA.', ['hero', 'cta_section'], [
      hero('Group Name', 'Meeting rhythm, leader details, and group description.'),
      cta('Join This Group', 'A group leader can follow up after signup.', 'Request To Join', '#join'),
    ]),
    page('salvation', 'Salvation', 'salvation', 'heart', 'Salvation invitation, prayer, and follow-up form.', ['hero', 'contact_form'], [
      hero('A New Life In Christ', 'Begin a relationship with Jesus and let us walk with you.'),
      contact('I Made A Decision'),
    ]),
    page('resources', 'Resources', 'resources', 'library', 'Digital library, downloads, and discipleship resources.', ['hero', 'feature_grid'], [
      hero('Resources', 'Access messages, guides, downloads, and discipleship materials.'),
      listSection('feature_grid', 'Featured Resources', 'Library resources can appear here.'),
    ]),
    page('podcast', 'Podcast', 'podcast', 'podcast', 'Podcast show, latest episodes, and subscription CTA.', ['hero', 'sermon_grid'], [
      hero('Podcast', 'Listen to recent messages and conversations on the go.'),
      listSection('sermon_grid', 'Latest Episodes', 'Podcast episodes can appear here.'),
    ]),
    page('media-library', 'Media Library', 'media-library', 'folder-play', 'Media library preview with filters and collections.', ['hero', 'sermon_grid'], [
      hero('Media Library', 'Explore sermons, videos, clips, and teaching collections.'),
      listSection('sermon_grid', 'Featured Media', 'Media assets can appear here.'),
    ]),
    page('landing-page', 'Landing Page', 'start-here', 'mouse-pointer-click', 'Focused campaign page with one primary conversion.', ['hero', 'contact_form'], [
      hero('Start Here', 'One page, one invitation, one clear next step.'),
      contact('Take The Next Step'),
    ]),
    page('blank-page', 'Blank Page', 'blank', 'file', 'A clean builder-ready page with a single editable section.', ['hero'], [
      hero('Blank Page', 'Start with a simple section and build from there.'),
    ]),
    page('404', '404 Page', '404', 'circle-alert', 'Not found page with navigation back to helpful next steps.', ['hero', 'cta_section'], [
      hero('Page Not Found', 'The page you are looking for may have moved.'),
      cta('Keep Exploring', 'Return home or choose a helpful next step.', 'Back Home', '/'),
    ]),
  ];

  const existingSlugs = new Set(templates.map((template) => template.slug));
  for (const source of ECCLESIA_THEME_SOURCE_PAGES) {
    if (!existingSlugs.has(source.slug)) {
      templates.push(sourceBackedPage(source));
      existingSlugs.add(source.slug);
    }
  }

  return templates.map(withSourcePageMetadata);
}

export function createEcclesiaDefaultPages(tenantId: string, websiteId: string, churchName: string) {
  const globalContent = createEcclesiaGlobalContent(churchName);

  return getEcclesiaPageTemplates().map((template) => ({
    tenantId,
    websiteId,
    title: template.title,
    slug: template.slug,
    isHome: template.key === 'home-page',
    content: JSON.stringify(hydrateBlocks(template.blocks, globalContent)),
    status: 'published',
    seoTitle: template.seo.title.replace('{{churchName}}', churchName),
    seoDescription: template.seo.description.replace('{{churchName}}', churchName),
    seoKeywords: template.seo.keywords,
  }));
}

function page(
  key: string,
  title: string,
  slug: string,
  icon: string,
  description: string,
  sections: string[],
  blocks: JsonRecord[],
  source?: EcclesiaSourcePage
): EcclesiaPageTemplate {
  return {
    key,
    name: title,
    title,
    slug,
    icon,
    description,
    type: 'page',
    status: 'published',
    sourceFile: source?.file,
    sourceUrl: source?.sourceUrl,
    module: source?.module,
    structure: {
      template: key,
      sections,
      widgetAware: true,
      builderEditable: true,
      sourceFile: source?.file,
      sourceUrl: source?.sourceUrl,
      assetBase: source ? ECCLESIA_THEME_ASSET_BASE : undefined,
      sourcePackage: source ? 'ecclesia-full-theme' : undefined,
      staticSource: Boolean(source),
    },
    blocks,
    seo: {
      title: `${title} | {{churchName}}`,
      description,
      keywords: [key.replace(/-/g, ' '), 'church', 'ministry', 'community'].join(', '),
    },
  };
}

function sourcePage(key: string, name: string, slug: string, file: string, icon: string, module: string, description: string): EcclesiaSourcePage {
  return {
    key,
    name,
    title: name,
    slug,
    file,
    sourceUrl: `${ECCLESIA_THEME_ASSET_BASE}/${file}`,
    icon,
    module,
    description,
  };
}

function sourceBackedPage(source: EcclesiaSourcePage): EcclesiaPageTemplate {
  return page(source.key, source.name, source.slug, source.icon, source.description, ['hero', 'cta_section'], [
    hero(source.name, source.description),
    cta('Customize This Page', 'This Ecclesia page is backed by the supplied static theme file and can be rebuilt with editable ChurchOS sections.', 'Open Source Preview', source.sourceUrl),
  ], source);
}

function withSourcePageMetadata(template: EcclesiaPageTemplate): EcclesiaPageTemplate {
  const source = ECCLESIA_THEME_SOURCE_PAGES.find((item) => item.slug === template.slug || item.key === template.key);
  if (!source) return template;
  return {
    ...template,
    sourceFile: source.file,
    sourceUrl: source.sourceUrl,
    module: source.module,
    structure: {
      ...template.structure,
      sourceFile: source.file,
      sourceUrl: source.sourceUrl,
      assetBase: ECCLESIA_THEME_ASSET_BASE,
      sourcePackage: 'ecclesia-full-theme',
      staticSource: true,
      builderEditable: true,
    },
  };
}

function section(name: string, key: string, category: string, description: string, structure: JsonRecord): EcclesiaSectionTemplate {
  return { name, key, type: 'section', category, description, structure };
}

function widget(
  type: string,
  name: string,
  category: string,
  icon: string,
  description: string,
  editableFields: string[],
  dataSource = 'manual'
): EcclesiaWidgetDefinition {
  return {
    type,
    name,
    category,
    icon,
    description,
    editableFields,
    themeSlots: ['typography', 'colors', 'spacing', 'shape', 'motion'],
    dataSource,
    responsiveBehavior: 'Stacks cleanly on mobile and inherits Ecclesia theme tokens.',
    allowedContexts: ['public-page', 'template', 'landing-page'],
    defaultContent: { type, title: name, text: description, buttonText: '', buttonUrl: '#', items: [] },
  };
}

function hero(title: string, subtitle: string): JsonRecord {
  return {
    type: 'hero',
    kicker: 'Welcome home',
    title,
    subtitle,
    buttonText: 'Plan A Visit',
    buttonUrl: '/new-visitor',
  };
}

function serviceTimes(): JsonRecord {
  return {
    type: 'service_times',
    title: 'Service Times',
    sundayTimes: '{{serviceTimes}}',
    midweekTimes: 'Wednesday Word & Prayer - 7:00 PM',
    address: '{{address}}',
  };
}

function ministries(title: string): JsonRecord {
  return {
    type: 'ministries_list',
    title,
    text: 'There is a place for every generation and every gift.',
    items: [
      { name: 'Worship', desc: 'Encounter God through music, prayer, and creative arts.' },
      { name: 'Groups', desc: 'Build friendships and grow through weekly community.' },
      { name: 'Outreach', desc: 'Serve the city with compassion and practical love.' },
    ],
  };
}

function leadership(): JsonRecord {
  return {
    type: 'leadership_team',
    headline: 'Pastoral Leadership',
    members: [
      { name: '{{leadPastor}}', role: 'Lead Pastor', bio: '{{pastorBio}}' },
      { name: 'Ministry Team', role: 'Church Staff', bio: 'Add ministry leaders, department heads, and staff members.' },
    ],
  };
}

function contact(header = 'Contact Us'): JsonRecord {
  return {
    type: 'contact_form',
    header,
    email: '{{email}}',
    phone: '{{phone}}',
    showMap: true,
  };
}

function cta(title: string, text: string, buttonText: string, buttonUrl: string, type = 'cta_section'): JsonRecord {
  return { type, title, text, buttonText, buttonUrl };
}

function giving(title: string): JsonRecord {
  return {
    type: 'giving_cta',
    title,
    text: 'Your generosity helps people encounter Jesus, find community, and receive care.',
    buttonText: 'Give Now',
    buttonUrl: '/giving',
  };
}

function listSection(type: string, title: string, text: string): JsonRecord {
  return {
    type,
    title,
    text,
    items: [
      { name: 'Featured Item', desc: 'Connect this section to a ChurchOS module or edit it manually.' },
      { name: 'Second Item', desc: 'Cards inherit typography, color, radius, and spacing tokens.' },
      { name: 'Third Item', desc: 'Layouts stack responsively across desktop, tablet, and mobile.' },
    ],
  };
}

function hydrateBlocks(blocks: JsonRecord[], globalContent: JsonRecord) {
  const identity = globalContent.churchIdentity || {};
  const contactInfo = globalContent.contact || {};
  const leadershipInfo = globalContent.leadership || {};
  const services = globalContent.services || {};
  const firstService = Array.isArray(services.serviceTimes) ? services.serviceTimes[0] : null;
  const firstLocation = Array.isArray(services.serviceLocations) ? services.serviceLocations[0] : null;

  return blocks.map((block) => replacePlaceholders(block, {
    churchName: identity.churchName || '',
    serviceTimes: firstService ? `${firstService.label} - ${firstService.time}` : '',
    address: firstLocation?.address || contactInfo.address || '',
    email: contactInfo.email || '',
    phone: contactInfo.phone || '',
    leadPastor: leadershipInfo.leadPastor || '',
    pastorBio: leadershipInfo.pastorBio || '',
  }));
}

function replacePlaceholders(value: any, replacements: Record<string, string>): any {
  if (typeof value === 'string') {
    return Object.entries(replacements).reduce((next, [key, replacement]) => {
      return next.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
    }, value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => replacePlaceholders(item, replacements));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, replacePlaceholders(child, replacements)])
    );
  }

  return value;
}

function deepMerge(base: JsonRecord, override: JsonRecord): JsonRecord {
  const output = { ...base };

  for (const [key, value] of Object.entries(override || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      output[key] = deepMerge(base[key], value);
    } else {
      output[key] = value;
    }
  }

  return output;
}
