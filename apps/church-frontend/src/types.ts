/* ── Types for the church-frontend SPA ────────────────── */

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

export interface ThemeInfo {
  id: string;
  name: string;
  settings: ThemeSettings;
  draftSettings: ThemeSettings | null;
}

export interface ThemeSettings {
  metadata?: { key: string; name: string; version: string; systemTheme?: boolean; builderFirst?: boolean; sourcePackage?: string };
  sourcePackage?: { assetBase: string; stylesheets: string[]; scripts: string[]; pages: string[] };
  colorMode?: string;
  accentPreset?: string;
  typographyPreset?: string;
  edgeStyle?: string;
  glassHeader?: boolean;
  themeGlow?: boolean;
  pageBodyWidth?: string;
  design?: Record<string, any>;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    accentSecondary: string;
    accentSoft: string;
    background: string;
    surface: string;
    mutedSurface: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    gradientA: string;
    gradientB: string;
    gradientC: string;
  };
  fonts?: { heading: string; body: string };
  typography?: Record<string, any>;
  layout?: {
    contentWidth: string;
    headerStyle: string;
    footerStyle: string;
    mobileLayout: string;
    sectionPadding: string;
    pageBodyWidth: string;
  };
  components?: {
    buttonStyle: string;
    cardStyle: string;
    borderRadius: string;
    edgeStyle: string;
    shadowDepth: string;
  };
  motion?: { animationLevel: string; transitionSpeed: string };
  header?: {
    style: string;
    logoDisplay: string;
    glass: boolean;
    ctaLabel: string;
    ctaUrl: string;
  };
  footer?: { style: string };
  /* Customizer-specific header/footer fields */
  headerStyle?: string;
  headerGlass?: boolean;
  headerShadow?: boolean;
  headerLayout?: string;
  headerEffect?: string;
  headerFontSize?: string;
  headerFontWeight?: string;
  footerStyle?: string;
  footerWidgets?: string;
  footerBottom?: string;
  copyrightText?: string;
  [key: string]: any;
}

export interface NavItem {
  label: string;
  url: string;
  icon?: string;
}

export interface SocialLink {
  name: string;
  url: string;
}

export interface FooterData {
  id: string;
  copyrightText: string;
  socialLinks: SocialLink[];
  secondaryLinks: NavItem[];
}

export interface NavigationData {
  id: string;
  items: NavItem[];
}

export interface ModuleEntitlement {
  moduleKey: string;
  enabled: boolean;
}

export interface SiteContext {
  tenant: Tenant;
  theme: ThemeInfo;
  moduleEntitlements: ModuleEntitlement[];
  navigation: NavigationData | null;
  footer: FooterData | null;
  announcement: { id: string; isActive: boolean; text: string; ctaUrl?: string; ctaLabel?: string };
  enabledPlugins: string[];
  pluginSettings: Record<string, any>;
}

export interface GlobalContent {
  churchIdentity: {
    churchName: string;
    logoUrl: string;
    faviconUrl: string;
    tagline: string;
    description: string;
  };
  leadership: { leadPastor: string; pastorBio: string; pastorImage: string };
  contact: { phone: string; email: string; address: string; mapUrl: string };
  social: Record<string, string>;
  services: {
    serviceTimes: { label: string; time: string; location?: string }[];
    serviceLocations: { name: string; address: string }[];
  };
  callsToAction: {
    primary: { label: string; url: string };
    secondary: { label: string; url: string };
    giving: { label: string; url: string };
  };
}

export interface ContentBlock {
  slotKey: string;
  data: {
    title: string;
    heading?: string;
    content?: string;
    sections?: SectionData[];
  };
}

export interface SectionData {
  id: string;
  title: string;
  key: string;
  blocks: BlockData[];
}

export interface BlockData {
  id: string;
  type: string;
  moduleKey: string;
  data: Record<string, any>;
  properties: Record<string, any>;
}

export interface PageRenderResponse {
  data: {
    pageId: string;
    title: string;
    slug: string;
    isHome: boolean;
    contentBlocks: ContentBlock[];
    isPreview: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    sourceFile?: string | null;
    sourceUrl?: string | null;
    module?: string | null;
    globalContent: GlobalContent;
    navigation: NavigationData | null;
    footer: FooterData | null;
    theme: { name: string; settings: ThemeSettings };
  };
}
