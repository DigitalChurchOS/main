import { useState, useEffect, useMemo, useRef } from "react";
import { Preview } from "./components/Preview";
import { SettingsPanel } from "./components/SettingsPanel";
import { CustomizerPanel } from "./components/CustomizerPanel";
import { EditorPanel } from "./components/EditorPanel";
import type { ThemeState } from "./utils/domParser";
import {
  parseHtml,
  serializeHtml,
  injectThemeTokens,
  applyThemeStructure,
  cssPath,
  changeElementTag,
  changeButtonRole,
  changeCardRole,

  cleanPageForExport,
  insertBlockAtSelector,
} from "./utils/domParser";
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  X,
  MousePointerClick,
  Navigation,
  Download,
  Settings,
  ChevronDown,
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Eye,
} from "lucide-react";

const ECCLESIA_THEME_FOLDER = "ecclesia-full-theme";

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textFromBlock(block: any, fallback: string) {
  return (
    block?.title ||
    block?.headline ||
    block?.subtitle ||
    block?.storyText ||
    block?.description ||
    block?.text ||
    block?.data?.title ||
    block?.data?.content ||
    fallback
  );
}

function createEcclesiaFallbackTemplate(pageTitle = "Ecclesia Page", blocks: any[] = []) {
  const title = escapeHtml(pageTitle || "Ecclesia Page");
  const sections = blocks.length
    ? blocks.map((block, index) => {
        const blockTitle = escapeHtml(textFromBlock(block, `Section ${index + 1}`));
        const blockText = escapeHtml(block?.subtitle || block?.description || block?.storyText || block?.data?.content || "Edit this Ecclesia CMS section.");
        return `<section class="ec-section" data-editor-type="section" data-editor-label="${blockTitle}">
  <p class="ec-eyebrow" data-editor-type="badge">${escapeHtml(block?.type || "Ecclesia")}</p>
  <h2 data-editor-type="title">${blockTitle}</h2>
  <p data-editor-type="description">${blockText}</p>
</section>`;
      }).join("\n")
    : `<section class="ec-section" data-editor-type="section" data-editor-label="Page Content">
  <p class="ec-eyebrow" data-editor-type="badge">Ecclesia</p>
  <h2 data-editor-type="title">${title}</h2>
  <p data-editor-type="description">This tenant page is ready for Ecclesia customization.</p>
</section>`;

  return `<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<style>
html{width:100%;max-width:100%;overflow-x:clip;scrollbar-gutter:stable}
*{box-sizing:border-box}
body{margin:0;width:100%;max-width:100%;overflow-x:clip;background:var(--site-bg,#fffaf3);color:var(--site-text,#1d1812);font-family:var(--font-body,Inter,system-ui,sans-serif)}
header{width:100%;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:24px clamp(24px,5vw,64px);background:var(--site-surface,#fff);border-bottom:1px solid var(--site-border,rgba(29,24,18,.12))}
.logo{font-weight:900;font-size:20px;color:var(--primary,#f97316)}
nav{display:flex;gap:18px;flex-wrap:wrap}
nav a{color:var(--site-muted,#74685e);text-decoration:none;font-weight:700}
.hero{padding:clamp(72px,9vw,128px) clamp(28px,6vw,88px);background:linear-gradient(135deg,var(--site-soft,#fff7ed),var(--site-bg,#fffaf3))}
.ec-eyebrow{color:var(--primary,#f97316);font-weight:900;text-transform:uppercase;letter-spacing:.08em;font-size:13px}
h1,h2{font-family:var(--font-title,Inter,system-ui,sans-serif);line-height:1.02;margin:0 0 18px;max-width:820px}
h1{font-size:clamp(46px,8vw,96px)}
h2{font-size:clamp(30px,5vw,58px)}
p{font-size:clamp(17px,2vw,22px);line-height:1.55;max-width:760px;color:var(--site-muted,#74685e)}
.btn{display:inline-block;margin-top:18px;background:var(--primary,#f97316);color:#fff;border-radius:var(--radius,18px);padding:14px 22px;text-decoration:none;font-weight:800}
.ec-section{padding:clamp(48px,7vw,92px) clamp(28px,6vw,88px);border-top:1px solid var(--site-border,rgba(29,24,18,.12));background:var(--site-surface,#fff)}
footer{padding:36px clamp(28px,6vw,88px);background:var(--site-soft,#fff7ed);color:var(--site-muted,#74685e)}
</style>
</head>
<body>
<header data-editor-type="header" data-editor-label="Header">
  <div class="logo" data-editor-type="title">Ecclesia</div>
  <nav>
    <a href="/" data-editor-type="button">Home</a>
    <a href="/about" data-editor-type="button">About</a>
    <a href="/contact" data-editor-type="button">Contact</a>
  </nav>
</header>
<section class="hero" data-editor-type="section" data-editor-label="Hero Section">
  <p class="ec-eyebrow" data-editor-type="badge">Ecclesia Theme</p>
  <h1 data-editor-type="title">${title}</h1>
  <p data-editor-type="description">Customize this tenant page with the active Ecclesia design system.</p>
  <a class="btn" href="/contact" data-editor-type="button">Get Connected</a>
</section>
${sections}
<footer data-editor-type="footer" data-editor-label="Footer">
  <p data-editor-type="description">Powered by Ecclesia Theme.</p>
</footer>
</body>
</html>`;
}

const AVAILABLE_THEMES = [
  {
    id: "ecclesia",
    name: "Ecclesia Theme",
    description: "A beautiful, content-rich design system for modern digital-first churches.",
    folderName: ECCLESIA_THEME_FOLDER,
    thumbnail: "/themes/ecclesia-full-theme/thumbnail.png"
  }
];

type CustomizerPageOption = {
  value: string;
  label: string;
  slug?: string;
  pageId?: string;
  sourceFile?: string;
};

const CUSTOMIZER_PAGES_LIST: CustomizerPageOption[] = [
  { value: "index.html", label: "Home Page (index.html)" },
  { value: "about.html", label: "About Page (about.html)" },
  { value: "contact.html", label: "Contact Page (contact.html)" },
  { value: "login.html", label: "Member Login / Register (login.html)" },
  { value: "account.html", label: "Member Account Profile (account.html)" },
  { value: "ministries.html", label: "Ministries Page (ministries.html)" },
  { value: "sermons.html", label: "Sermons Archive (sermons.html)" },
  { value: "media-single.html", label: "Single Sermon (media-single.html)" },
  { value: "media-archive.html", label: "Media Archive (media-archive.html)" },
  { value: "livestream-page.html", label: "Livestream Page (livestream-page.html)" },
  { value: "giving.html", label: "Giving Page (giving.html)" },
  { value: "giving-partnership.html", label: "Partnership Campaign (giving-partnership.html)" },
  { value: "events.html", label: "Events Landing (events.html)" },
  { value: "event-single.html", label: "Single Event (event-single.html)" },
  { value: "event-register.html", label: "Event Registration (event-register.html)" },
  { value: "events-archive.html", label: "Events Archive (events-archive.html)" },
  { value: "blog-archive.html", label: "Blog Archive (blog-archive.html)" },
  { value: "blog-single.html", label: "Single Blog Post (blog-single.html)" },
  { value: "podcast-archive.html", label: "Podcast Archive (podcast-archive.html)" },
  { value: "podcast-episode.html", label: "Podcast Episode (podcast-episode.html)" },
  { value: "services-archive.html", label: "Services Archive (services-archive.html)" },
  { value: "service-single.html", label: "Single Service (service-single.html)" },
  { value: "library-archive.html", label: "Library Archive (library-archive.html)" },
  { value: "resource-single.html", label: "Single Resource (resource-single.html)" },
  { value: "courses-archive.html", label: "Courses Archive (courses-archive.html)" },
  { value: "course-main.html", label: "Course Landing (course-main.html)" },
  { value: "lesson-single.html", label: "Single Lesson (lesson-single.html)" },
  { value: "prayer-home.html", label: "Prayer Home (prayer-home.html)" },
  { value: "prayer-room.html", label: "Prayer Room (prayer-room.html)" },
  { value: "prayer-wall.html", label: "Prayer Wall (prayer-wall.html)" },
  { value: "prayer.html", label: "Prayer & Testimony (prayer.html)" },
  { value: "testimony-wall.html", label: "Testimony Wall (testimony-wall.html)" },
  { value: "testimony-single.html", label: "Single Testimony (testimony-single.html)" },
  { value: "testimony-submit.html", label: "Submit Testimony (testimony-submit.html)" },
  { value: "worship.html", label: "Worship / Style Guide (worship.html)" }
];


const CUSTOMIZER_FILE_SLUGS: Record<string, string> = {
  'index.html': '',
  'home.html': '',
  'about.html': 'about',
  'sermons.html': 'sermons',
  'events.html': 'events',
  'ministries.html': 'ministries',
  'prayer.html': 'prayer',
  'contact.html': 'contact',
  'login.html': 'login',
  'account.html': 'account',
  'giving.html': 'giving',
  'giving-partnership.html': 'partnership',
  'livestream-page.html': 'livestream',
  'media-archive.html': 'media',
  'media-single.html': 'media/sample-message',
  'podcast-archive.html': 'podcast',
  'podcast-episode.html': 'podcast/sample-episode',
  'blog-archive.html': 'blog',
  'blog-single.html': 'blog/sample-post',
  'services-archive.html': 'services',
  'service-single.html': 'services/sample-service',
  'library-archive.html': 'library',
  'resource-single.html': 'library/sample-resource',
  'courses-archive.html': 'courses',
  'course-main.html': 'courses/main',
  'lesson-single.html': 'courses/lesson',
  'events-archive.html': 'events/archive',
  'event-single.html': 'events/sample-event',
  'event-register.html': 'events/register',
  'prayer-home.html': 'prayer-home',
  'prayer-wall.html': 'prayer/wall',
  'prayer-room.html': 'prayer/room',
  'testimony-wall.html': 'testimonies',
  'testimony-single.html': 'testimonies/sample-story',
  'testimony-submit.html': 'testimonies/submit',
  'worship.html': 'worship',
};

function fileForCmsPage(page: any) {
  if (typeof page.sourceFile === "string" && page.sourceFile) return page.sourceFile;
  const slug = typeof page.slug === "string" ? page.slug : "";
  const mappedFile = Object.keys(CUSTOMIZER_FILE_SLUGS).find((file) => CUSTOMIZER_FILE_SLUGS[file] === slug);
  if (mappedFile) return mappedFile;
  if (!slug) return "index.html";
  return `${slug.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "page"}.html`;
}

function labelForCmsPage(page: any, file: string) {
  const title = String(page.title || page.name || "Untitled page");
  const slug = String(page.slug || "").replace(/^\/+/, "");
  return slug ? `${title} (/${slug})` : `${title} (${file})`;
}

const apiFetch = async (method: string, path: string, body?: any) => {
  const params = new URLSearchParams(window.location.search);
  const tenantId = localStorage.getItem("churchos.tenantId") || params.get("tenantId") || "";
  const tenantSubdomain = localStorage.getItem("churchos.subdomain") || params.get("subdomain") || getSubdomainFromHostname() || "";
  const token = localStorage.getItem("churchos.token") || "local-preview-token";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
  if (tenantId) headers["x-tenant-id"] = tenantId;
  if (tenantSubdomain) headers["x-tenant-subdomain"] = tenantSubdomain;
  const options: RequestInit = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(path, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
};

function getSubdomainFromHostname(): string | null {
  const host = window.location.hostname.toLowerCase();
  const parts = host.split('.');
  
  const BASE_DOMAINS = ['churched.online', 'churchos.local', 'churchos.com', 'localhost'];
  
  for (const base of BASE_DOMAINS) {
    if (host === base) {
      return null;
    }
    if (host.endsWith(`.${base}`)) {
      return host.slice(0, -(base.length + 1));
    }
  }
  
  if (parts.length > 2 && !BASE_DOMAINS.includes(host)) {
    return parts[0];
  }
  
  return null;
}

function getFullHtml(blocks?: any[]): string | null {
  if (!blocks || blocks.length === 0) return null;
  const block = blocks.find((b: any) => typeof b.html === 'string' || typeof b.content === 'string');
  if (!block) return null;
  const html = block.html || block.content || null;
  if (!html) return null;

  // Validate that the HTML has actual page structure — not just a stub.
  // If the body lacks any header, footer, section, nav, or main element,
  // the content is broken/stale and we should fall back to the theme template.
  const hasStructure = /<(header|footer|section|nav|main)[\s>]/i.test(html);
  if (!hasStructure) {
    console.warn("getFullHtml: DB content lacks page structure (no header/footer/section/nav/main). Falling back to theme template.");
    return null;
  }

  return html;
}

export function App() {
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [pageId, setPageId] = useState<string>(() => urlParams.get("pageId") || "");
  const [themeId, setThemeId] = useState<string>("");
  const [websiteId, setWebsiteId] = useState<string>("");
  const [resolvingTenant, setResolvingTenant] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [tenantSubdomain, setTenantSubdomain] = useState<string>(() => localStorage.getItem("churchos.subdomain") || "");
  
  const [pagesList, setPagesList] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'preview'>('idle');
  const previewWindowRef = useRef<Window | null>(null);

  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return ECCLESIA_THEME_FOLDER;
  });

  useEffect(() => {
    localStorage.setItem("ec_autosave_theme_folder", currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const initTenantAndEntities = async () => {
      try {
        const queryTenantId = urlParams.get("tenantId");
        const querySubdomain = urlParams.get("subdomain");
        const queryWebsiteId = urlParams.get("websiteId") || "";
        const hostSubdomain = getSubdomainFromHostname();
        
        let resolvedTenantId = "";
        let resolvedSubdomain = "";

        if (queryTenantId) {
          resolvedTenantId = queryTenantId;
        } else if (queryWebsiteId) {
          try {
            const res = await fetch(`/api/public/resolve-website-tenant?websiteId=${encodeURIComponent(queryWebsiteId)}`);
            if (res.ok) {
              const json = await res.json();
              if (json.data && json.data.tenantId) {
                resolvedTenantId = json.data.tenantId;
                resolvedSubdomain = json.data.tenant?.subdomain || json.data.website?.tenant?.subdomain || "";
              }
            }
          } catch (e) {
            console.warn("Could not resolve tenant from websiteId:", e);
          }
        } else if (querySubdomain) {
          const res = await fetch(`/api/public/resolve-subdomain?subdomain=${encodeURIComponent(querySubdomain)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.id) {
              resolvedTenantId = json.data.id;
              resolvedSubdomain = json.data.subdomain || querySubdomain;
            }
          }
        } else if (hostSubdomain) {
          const res = await fetch(`/api/public/resolve-subdomain?subdomain=${encodeURIComponent(hostSubdomain)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.id) {
              resolvedTenantId = json.data.id;
              resolvedSubdomain = json.data.subdomain || hostSubdomain;
            }
          }
        }

        if (resolvedTenantId) {
          localStorage.setItem("churchos.tenantId", resolvedTenantId);
          if (resolvedSubdomain) {
            localStorage.setItem("churchos.subdomain", resolvedSubdomain);
            setTenantSubdomain(resolvedSubdomain);
          } else if (!querySubdomain && !hostSubdomain) {
            localStorage.removeItem("churchos.subdomain");
            setTenantSubdomain("");
          }
        } else {
          const existing = localStorage.getItem("churchos.tenantId");
          if (existing === "demo-church-local") {
            localStorage.removeItem("churchos.tenantId");
          }
        }

        const existingToken = localStorage.getItem("churchos.token");
        if (!existingToken) {
          localStorage.setItem("churchos.token", "local-preview-token");
        }

        // Fetch themes, websites and pages
        const themesRes = await apiFetch("GET", "/api/theme-engine/themes");
        const websitesRes = await apiFetch("GET", "/api/cms/websites");
        const pagesRes = await apiFetch("GET", "/api/cms/pages");
        if (!resolvedSubdomain) {
          try {
            const domainRes = await apiFetch("GET", "/api/tenant/domain");
            const domainSubdomain = domainRes?.data?.subdomain || "";
            if (domainSubdomain) {
              localStorage.setItem("churchos.subdomain", domainSubdomain);
              setTenantSubdomain(domainSubdomain);
            }
          } catch (domainErr) {
            const storedSubdomain = localStorage.getItem("churchos.subdomain") || "";
            if (storedSubdomain) setTenantSubdomain(storedSubdomain);
            console.warn("Could not resolve tenant subdomain for preview URLs:", domainErr);
          }
        }

        if (pagesRes && pagesRes.data) {
          setPagesList(pagesRes.data);
        }

        // 2. Resolve websiteId
        let finalWebsiteId = "";
        let resolvedWebsite: any = null;
        if (websitesRes && websitesRes.data) {
          const matched = websitesRes.data.find((w: any) => w.id === queryWebsiteId);
          if (matched) {
            finalWebsiteId = matched.id;
            resolvedWebsite = matched;
          } else {
            if (websitesRes.data.length > 0) {
              console.warn(`Website ${queryWebsiteId} was not found under the resolved tenant. Falling back to the tenant primary website.`);
              finalWebsiteId = websitesRes.data[0].id;
              resolvedWebsite = websitesRes.data[0];
            }
          }
        }
        setWebsiteId(finalWebsiteId);

        // 1. Resolve themeId
        const queryThemeId = urlParams.get("themeId") || "";
        let finalThemeId = "";
        if (resolvedWebsite && resolvedWebsite.themeId) {
          finalThemeId = resolvedWebsite.themeId;
        } else if (themesRes && themesRes.data) {
          const matched = themesRes.data.find(
            (t: any) => t.id === queryThemeId || t.name.toLowerCase() === queryThemeId.toLowerCase()
          );
          if (matched) {
            finalThemeId = matched.id;
          } else if (themesRes.data.length > 0) {
            finalThemeId = themesRes.data[0].id;
          }
        }
        setThemeId(finalThemeId);

        // 3. Resolve pageId
        let finalPageId = pageId;
        if (finalPageId) {
          const matchedPage = pagesRes?.data?.find((p: any) => p.id === finalPageId);
          if (!matchedPage) {
            const homePage = pagesRes?.data?.find((p: any) => p.slug === "" || p.isHome);
            finalPageId = homePage?.id || "";
            setPageId(finalPageId);
          }
        } else if (pagesRes && pagesRes.data) {
          const homePage = pagesRes.data.find((p: any) => p.slug === "" || p.isHome);
          if (homePage) {
            finalPageId = homePage.id;
            setPageId(homePage.id);
          }
        }

        // 4. Update URL search parameters silently
        const currentUrl = new URL(window.location.href);
        let urlChanged = false;
        if (finalThemeId && currentUrl.searchParams.get("themeId") !== finalThemeId) {
          currentUrl.searchParams.set("themeId", finalThemeId);
          urlChanged = true;
        }
        if (finalWebsiteId && currentUrl.searchParams.get("websiteId") !== finalWebsiteId) {
          currentUrl.searchParams.set("websiteId", finalWebsiteId);
          urlChanged = true;
        }
        if (finalPageId && currentUrl.searchParams.get("pageId") !== finalPageId) {
          currentUrl.searchParams.set("pageId", finalPageId);
          urlChanged = true;
        }
        
        if (urlChanged) {
          window.history.replaceState({}, "", currentUrl.toString());
        }

      } catch (err: any) {
        console.error("Initialization error:", err);
        setTenantError(err.message || "Failed to initialize customizer workspace settings.");
      } finally {
        setResolvingTenant(false);
      }
    };

    initTenantAndEntities();
  }, []);

  // Customizer state
  const [themeState, setThemeState] = useState<ThemeState>(() => {
    const saved = localStorage.getItem("ec_autosave_theme");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      preset: "Horizon",
      personality: "Modern",
      typography: "Modern Sans",
      typeSize: "Balanced",
      family: "Ocean",
      style: "Rich",
      shape: "Soft",
      visual: "Elevated",
      density: "Comfortable",
      motion: "Gentle",
      atmosphere: "Light",
      previewMode: "light",
      headerStyle: "floating",
      headerContentBoxed: false,
      headerLook: "flat",
      headerGlass: false,
      headerShadow: true,
      headerShadowIntensity: 'medium',
      headerShadowThemed: false,
      headerSolidThemed: false,
      headerBorder: false,
      headerBorderSize: "small",
      headerBorderColor: "accent",
      headerLayout: "logo-left",
      headerEffect: "static",
      headerFontSize: "medium",
      headerFontWeight: "bold",
      mobileMenuPosition: "right",
      mobileDrawerMode: "reveal",
      mobileHamburgerShape: "circle",
      mobileDrawerButtonsFullWidth: false,
      footerStyle: "classic",
      footerWidgets: "show",
      footerWidgetLayout: "feature",
      footerBottom: "split",
      footerLegal: "show",
      footerManual: false,
      copyrightText: "Ecclesia Theme. All rights reserved.",
      privacyLabel: "Privacy Policy",
      privacyHref: "#privacy",
      termsLabel: "Terms of Use",
      termsHref: "#terms",
    };
  });

  // UI state
  const [deviceSize, setDeviceSize] = useState<"desktop" | "laptop" | "tablet" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "customizer" | "editor">("customizer");
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<{ blockType: string; category: string; html: string } | null>(null);

  // HTML Page state
  const [rawHtml, setRawHtml] = useState<string>(() => {
    return createEcclesiaFallbackTemplate("Loading Ecclesia");
  });
  const [importedFilename, setImportedFilename] = useState<string>(() => {
    const saved = localStorage.getItem("ec_autosave_filename") || "";
    return CUSTOMIZER_FILE_SLUGS[saved] !== undefined ? saved : "index.html";
  });
  
  // Element selection state
  const [selectedElement, setSelectedElement] = useState<{
    path: string;
    type: string;
    label: string;
    text: string;
    href: string;
    src: string;
    alt: string;
    tagName?: string;
  } | null>(null);

  const [activeSectionPath, setActiveSectionPath] = useState<string | null>(null);


  // Auto-save effects
  useEffect(() => {
    localStorage.setItem("ec_autosave_theme", JSON.stringify(themeState));
  }, [themeState]);

  useEffect(() => {
    localStorage.setItem("ec_autosave_html", rawHtml);
  }, [rawHtml]);

  useEffect(() => {
    localStorage.setItem("ec_autosave_filename", importedFilename);
  }, [importedFilename]);

  // Pages list is loaded and resolved inside initTenantAndEntities

  // Load theme settings from CMS
  useEffect(() => {
    const loadThemeSettings = async () => {
      if (!themeId) return;
      try {
        const res = await apiFetch("GET", "/api/theme-engine/themes");
        if (res && res.data) {
          const themeRecord = res.data.find((t: any) => t.id === themeId);
          if (themeRecord) {
            const rawSettings = themeRecord.draftSettings || themeRecord.settings || "{}";
            const settings = typeof rawSettings === "string" ? JSON.parse(rawSettings) : rawSettings;
            
            const filteredSettings: any = {};
            for (const key of Object.keys(settings)) {
              if (settings[key] !== null && typeof settings[key] !== "object") {
                filteredSettings[key] = settings[key];
              }
            }

            setThemeState((prev) => ({
              ...prev,
              ...filteredSettings,
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to load theme settings:", err);
      }
    };
    loadThemeSettings();
  }, [themeId]);

  // Parse sections inside HTML
  const sections = useMemo(() => {
    const doc = parseHtml(rawHtml);
    const nodes = Array.from(doc.querySelectorAll("header, section, footer, main, [data-editor-type='header'], [data-editor-type='section'], [data-editor-type='footer']"));
    return nodes.map((node) => {
      const path = cssPath(node);
      const tag = node.tagName.toLowerCase();
      let label = (node as HTMLElement).dataset.editorLabel || "Section";
      if (tag === "header") label = "Header";
      if (tag === "footer") label = "Footer";

      return {
        path,
        type: tag === "header" ? "header" : tag === "footer" ? "footer" : "section",
        label,
      };
    });
  }, [rawHtml]);

  // Parse children of current active section
  const childrenOfSection = useMemo(() => {
    if (!activeSectionPath) return [];
    const doc = parseHtml(rawHtml);
    const parent = doc.querySelector(activeSectionPath);
    if (!parent) return [];

    const nodes = Array.from(parent.querySelectorAll("[data-editor-type], h1, h2, h3, h4, p, button, a, img, .card, .feature-card, .person-card"));
    return nodes
      .filter((n) => n !== parent)
      .map((node) => {
        const path = cssPath(node);
        const tag = node.tagName.toLowerCase();
        let type = "element";
        if ((node as HTMLElement).dataset.editorType) type = (node as HTMLElement).dataset.editorType!;
        else if (["h1", "h2", "h3", "h4"].includes(tag)) type = "title";
        else if (tag === "p") type = "description";
        else if (["a", "button"].includes(tag)) type = "button";
        else if (tag === "img") type = "image";
        else if (node.classList.contains("card") || node.classList.contains("feature-card") || node.classList.contains("person-card")) type = "card";

        return {
          path,
          type,
          label: (node as HTMLElement).dataset.editorLabel || type.toUpperCase(),
          text: (node as HTMLElement).innerText || (node as HTMLImageElement).alt || type,
        };
      });
  }, [rawHtml, activeSectionPath]);

  // Compute live HTML to render in iframe (applies theme styling dynamically)
  const renderedHtml = useMemo(() => {
    const doc = parseHtml(rawHtml);
    injectThemeTokens(doc, themeState);
    applyThemeStructure(doc, themeState);

    // Inject base tag so relative assets resolve correctly inside the srcDoc iframe
    let baseTag = doc.querySelector("base");
    if (!baseTag) {
      baseTag = doc.createElement("base");
      doc.head.insertBefore(baseTag, doc.head.firstChild);
    }
    baseTag.setAttribute("href", `${window.location.origin}/themes/${currentTheme}/`);

    return serializeHtml(doc);
  }, [rawHtml, themeState, currentTheme]);

  const pageOptions = useMemo<CustomizerPageOption[]>(() => {
    const options = new Map<string, CustomizerPageOption>();
    CUSTOMIZER_PAGES_LIST.forEach((option) => options.set(option.value, option));
    pagesList.forEach((page) => {
      const value = fileForCmsPage(page);
      options.set(value, {
        value,
        label: labelForCmsPage(page, value),
        slug: typeof page.slug === "string" ? page.slug : "",
        pageId: page.id,
        sourceFile: page.sourceFile || value,
      });
    });
    return Array.from(options.values());
  }, [pagesList]);

  const fetchPage = async (filename: string, themeFolder = currentTheme, targetPageId = pageId) => {
    const baseName = filename.split("/").pop() || "index.html";
    let fallbackPageTitle = baseName.replace(/\.html$/i, "").replace(/-/g, " ");
    let fallbackBlocks: any[] = [];
    let shouldTryThemeTemplate =
      CUSTOMIZER_FILE_SLUGS[baseName] !== undefined ||
      CUSTOMIZER_PAGES_LIST.some((page) => page.value === baseName);

    try {
      const timestamp = new Date().getTime();

      if (targetPageId) {
        try {
          const res = await apiFetch("GET", `/api/cms/pages/${targetPageId}`);
          if (res && res.data) {
            const pageData = res.data;
            const blocks = typeof pageData.draftContent === 'string'
              ? JSON.parse(pageData.draftContent || "[]")
              : (pageData.draftContent || (typeof pageData.content === 'string'
                ? JSON.parse(pageData.content || "[]")
                : (pageData.content || [])));
            fallbackPageTitle = pageData.title || fallbackPageTitle;
            fallbackBlocks = Array.isArray(blocks) ? blocks : [];
            shouldTryThemeTemplate = Boolean(pageData.sourceFile) || shouldTryThemeTemplate;
            
            const savedHtml = getFullHtml(blocks);
            if (savedHtml) {
              setRawHtml(savedHtml);
              setImportedFilename(baseName);
              setSelectedElement(null);
              setActiveSectionPath(null);

              return;
            }

            if (!shouldTryThemeTemplate) {
              setRawHtml(createEcclesiaFallbackTemplate(fallbackPageTitle, fallbackBlocks));
              setImportedFilename(baseName);
              setSelectedElement(null);
              setActiveSectionPath(null);

              return;
            }
          }
        } catch (dbErr) {
          console.warn("Could not load page from database, falling back to theme template:", dbErr);
        }
      }

      const response = await fetch(`/themes/${themeFolder}/${baseName}?t=${timestamp}`);
      if (response.ok) {
        const text = await response.text();
        setRawHtml(text);
        setImportedFilename(baseName);
        setSelectedElement(null);
        setActiveSectionPath(null);
      } else if (targetPageId) {
        setRawHtml(createEcclesiaFallbackTemplate(fallbackPageTitle, fallbackBlocks));
        setImportedFilename(baseName);
        setSelectedElement(null);
        setActiveSectionPath(null);
      }
    } catch (err) {
      console.warn("Fetch error, using generated Ecclesia fallback", err);
      setRawHtml(createEcclesiaFallbackTemplate(fallbackPageTitle, fallbackBlocks));
      setImportedFilename(baseName);
      setSelectedElement(null);
      setActiveSectionPath(null);
    }
  };

  const navigateCustomizerPage = async (filename: string) => {
    const pageOption = pageOptions.find((option) => option.value === filename);
    const sourceFilename = pageOption?.sourceFile || filename;
    const rawFilename = sourceFilename.split(/[?#]/)[0].split("/").filter(Boolean).pop() || "index.html";
    const urlFilename = rawFilename.includes(".")
      ? rawFilename
      : (Object.keys(CUSTOMIZER_FILE_SLUGS).find((key) => CUSTOMIZER_FILE_SLUGS[key] === rawFilename) || `${rawFilename}.html`);
    const mappedSlug = pageOption?.slug !== undefined
      ? pageOption.slug
      : CUSTOMIZER_FILE_SLUGS[urlFilename] !== undefined
      ? CUSTOMIZER_FILE_SLUGS[urlFilename]
      : (urlFilename === "index.html" ? "" : urlFilename.replace(".html", ""));
    
    let pageRecord = pageOption?.pageId
      ? pagesList.find((p) => p.id === pageOption.pageId)
      : pagesList.find((p) => p.slug === mappedSlug);
    let resolvedPageId = pageRecord?.id || "";
    
    if (!pageRecord && websiteId) {
      try {
        const opt = pageOptions.find(p => p.value === filename || p.value === urlFilename);
        const title = opt ? opt.label.split(" (")[0] : urlFilename.replace(".html", "");
        const newPage = await apiFetch("POST", "/api/cms/pages", {
          websiteId,
          slug: mappedSlug,
          title: title,
          status: "draft",
          content: []
        });
        if (newPage && newPage.data) {
          pageRecord = newPage.data;
          resolvedPageId = pageRecord.id;
          setPagesList((prev) => [...prev, pageRecord]);
        }
      } catch (createErr) {
        console.error("Failed to dynamically create page in database:", createErr);
      }
    }

    if (resolvedPageId) {
      setPageId(resolvedPageId);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("pageId", resolvedPageId);
      window.history.pushState({}, "", newUrl.toString());
    } else {
      setPageId("");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("pageId");
      window.history.pushState({}, "", newUrl.toString());
    }
    
    fetchPage(urlFilename, currentTheme, resolvedPageId);
  };

  const handleSelectTheme = (themeFolder: string) => {
    setCurrentTheme(themeFolder);
    fetchPage("index.html", themeFolder);
  };

  // Load correct page template once tenant resolves and pages are loaded
  useEffect(() => {
    if (resolvingTenant) return;
    if (!pagesList.length) return;

    const pageRecord = pagesList.find((p) => p.id === pageId);
    const slug = pageRecord ? pageRecord.slug : "";
    const filename = pageRecord
      ? fileForCmsPage(pageRecord)
      : Object.keys(CUSTOMIZER_FILE_SLUGS).find((key) => CUSTOMIZER_FILE_SLUGS[key] === slug) || "index.html";

    fetchPage(filename, currentTheme, pageId);
  }, [resolvingTenant, pagesList, pageId, currentTheme]);

  // Sync scroll lock on escape key and listen for frame navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "ec-navigate") {
        navigateCustomizerPage(event.data.href);
      } else if (event.data && event.data.type === "ec-block-dropped") {
        const { targetPath, position, html } = event.data.data;
        setIsDragging(false);
        setDragData(null);
        let nextHtml = "";
        setRawHtml((currentHtml) => {
          const doc = parseHtml(currentHtml);
          const newSelector = insertBlockAtSelector(doc, targetPath, position, html);
          nextHtml = newSelector ? serializeHtml(doc) : currentHtml;
          return nextHtml;
        });

        // Trigger auto-save immediately with updated HTML
        setTimeout(() => {
          if (nextHtml) {
            saveThemeDraft(nextHtml, themeState, true);
          }
        }, 100);
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("message", handleMessage);
    };
  }, [pagesList, pageOptions, currentTheme, websiteId]);

  const handleImport = (content: string, filename: string) => {
    setRawHtml(content);
    setImportedFilename(filename);
    setSelectedElement(null);
    setActiveSectionPath(null);
  };

  const handleSaveElementProperties = (
    path: string,
    updates: { text?: string; href?: string; src?: string; alt?: string }
  ) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      if (updates.text !== undefined) (el as HTMLElement).innerText = updates.text;
      if (updates.href !== undefined) el.setAttribute("href", updates.href);
      if (updates.src !== undefined) el.setAttribute("src", updates.src);
      if (updates.alt !== undefined) el.setAttribute("alt", updates.alt);
      setRawHtml(serializeHtml(doc));
      
      // Update local selection state
      if (selectedElement && selectedElement.path === path) {
        setSelectedElement({
          ...selectedElement,
          text: updates.text !== undefined ? updates.text : selectedElement.text,
          href: updates.href !== undefined ? updates.href : selectedElement.href,
          src: updates.src !== undefined ? updates.src : selectedElement.src,
          alt: updates.alt !== undefined ? updates.alt : selectedElement.alt,
        });
      }
    }
  };

  const handleRewriteTag = (path: string, newTag: string) => {
    const doc = parseHtml(rawHtml);
    const newPath = changeElementTag(doc, path, newTag);
    setRawHtml(serializeHtml(doc));
    
    // Update local selection path to match new node type
    if (selectedElement && selectedElement.path === path) {
      setSelectedElement({
        ...selectedElement,
        path: newPath,
        tagName: newTag.toUpperCase(),
      });
    }
  };

  const handleChangeButtonRole = (path: string, role: "primary" | "soft" | "light") => {
    const doc = parseHtml(rawHtml);
    changeButtonRole(doc, path, role);
    setRawHtml(serializeHtml(doc));
  };

  const handleChangeCardRole = (path: string, role: "generic" | "icon" | "person") => {
    const doc = parseHtml(rawHtml);
    changeCardRole(doc, path, role);
    setRawHtml(serializeHtml(doc));
  };

  const handleDuplicateElement = (path: string) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      const clone = el.cloneNode(true);
      el.after(clone);
      setRawHtml(serializeHtml(doc));
      setSelectedElement(null);
    }
  };

  const handleDeleteElement = (path: string) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      el.remove();
      setRawHtml(serializeHtml(doc));
      setSelectedElement(null);
    }
  };

  const handleSaveSectionStyles = (path: string, bg: string, bgImg: string) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      if (bg) (el as HTMLElement).style.background = bg;
      if (bgImg) (el as HTMLElement).style.backgroundImage = `url('${bgImg}')`;
      setRawHtml(serializeHtml(doc));
    }
  };



  const handleClose = () => {
    window.close();
    setTimeout(() => {
      window.location.href = "/admin/";
    }, 100);
  };

  const saveThemeDraft = async (latestHtml: string, latestThemeState: ThemeState, isAuto = false) => {
    if (!themeId) {
      if (!isAuto) alert("No active theme identified to save customizations.");
      return;
    }
    setSaveStatus('saving');
    try {
      const draftRes = await apiFetch("PATCH", `/api/theme-engine/themes/${themeId}/customization/draft`, latestThemeState);
      let activeThemeId = themeId;
      if (draftRes && draftRes.data && draftRes.data.id) {
        activeThemeId = draftRes.data.id;
        setThemeId(activeThemeId);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("themeId", activeThemeId);
        window.history.replaceState({}, "", newUrl.toString());
      }
      if (pageId) {
        const doc = parseHtml(latestHtml);
        injectThemeTokens(doc, latestThemeState);
        applyThemeStructure(doc, latestThemeState);
        const cleanedHtml = cleanPageForExport(doc);
        const blocksPayload = [{ html: cleanedHtml }];
        await apiFetch("PATCH", `/api/cms/pages/${pageId}/draft`, { draftContent: blocksPayload });
      }
      setSaveStatus('saved');
    } catch (err: any) {
      console.error("Save error:", err);
      if (!isAuto) alert(`Failed to save: ${err.message || err}`);
      setSaveStatus('idle');
    }
  };

  const handleSave = () => {
    saveThemeDraft(rawHtml, themeState, false);
  };

  const handlePublish = async () => {
    if (publishStatus === 'preview') {
      const currentPageRecord = pagesList.find((page) => page.id === pageId);
      const pageSlug = currentPageRecord?.slug !== undefined
        ? currentPageRecord.slug
        : CUSTOMIZER_FILE_SLUGS[importedFilename] !== undefined
        ? CUSTOMIZER_FILE_SLUGS[importedFilename] 
        : (importedFilename === "index.html" ? "" : importedFilename.replace(".html", ""));
      const slugPath = pageSlug ? `/${pageSlug}` : "/";

      // Build the subdomain-based preview URL
      // Production: [subdomain].churched.online/[slug]
      // Local dev:  [subdomain].localhost:3000/[slug]
      const currentHost = window.location.hostname.toLowerCase();
      const port = window.location.port;
      const protocol = window.location.protocol;
      const subdomain = getSubdomainFromHostname();
      const previewSubdomain = subdomain || tenantSubdomain || localStorage.getItem("churchos.subdomain") || "demo";

      let previewOrigin: string;
      if (subdomain) {
        // Already on a subdomain — use same origin
        previewOrigin = `${protocol}//${window.location.host}`;
      } else if (currentHost === 'localhost' || currentHost.endsWith('.localhost')) {
        // Local dev mirrors production subdomain routing.
        previewOrigin = `${protocol}//${previewSubdomain}.localhost${port ? `:${port}` : ''}`;
      } else {
        // Production uses the tenant subdomain on churched.online.
        previewOrigin = `${protocol}//${previewSubdomain}.churched.online`;
      }
      const previewUrl = `${previewOrigin}${slugPath}`;
      
      if (previewWindowRef.current && !previewWindowRef.current.closed) {
        previewWindowRef.current.location.href = previewUrl;
        previewWindowRef.current.focus();
      } else {
        previewWindowRef.current = window.open(previewUrl, 'church_preview_tab');
      }
      return;
    }

    if (!themeId) {
      alert("No active theme identified to publish.");
      return;
    }
    setPublishStatus('publishing');
    try {
      const draftRes = await apiFetch("PATCH", `/api/theme-engine/themes/${themeId}/customization/draft`, themeState);
      let activeThemeId = themeId;
      if (draftRes && draftRes.data && draftRes.data.id) {
        activeThemeId = draftRes.data.id;
        setThemeId(activeThemeId);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("themeId", activeThemeId);
        window.history.replaceState({}, "", newUrl.toString());
      }

      if (pageId) {
        const doc = parseHtml(renderedHtml);
        const cleanedHtml = cleanPageForExport(doc);
        const blocksPayload = [{ html: cleanedHtml }];
        await apiFetch("PATCH", `/api/cms/pages/${pageId}/draft`, { draftContent: blocksPayload });
      }

      await apiFetch("POST", `/api/theme-engine/themes/${activeThemeId}/customization/publish`);

      if (websiteId) {
        await apiFetch("POST", `/api/theme-engine/themes/${activeThemeId}/activate`, { websiteId });
      }

      if (pageId) {
        await apiFetch("POST", `/api/cms/pages/${pageId}/publish`);
      }

      setPublishStatus('published');
      
      setTimeout(() => {
        setPublishStatus('preview');
      }, 1000);
      
    } catch (err: any) {
      console.error("Publish error:", err);
      alert(`Failed to publish: ${err.message || err}`);
      setPublishStatus('idle');
    }
  };

  useEffect(() => {
    if (saveStatus === 'saved') {
      setSaveStatus('idle');
    }
    if (publishStatus === 'published' || publishStatus === 'preview') {
      setPublishStatus('idle');
    }
  }, [themeState, rawHtml]);

  if (resolvingTenant) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily: "sans-serif"
      }}>
        <Loader2 size={48} className="animate-spin" style={{ color: "#38bdf8", marginBottom: "16px" }} />
        <h3>Initializing Website Editing Studio...</h3>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Resolving workspace tenant configuration...</p>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily: "sans-serif",
        padding: "20px",
        textAlign: "center"
      }}>
        <div style={{
          background: "#1e293b",
          border: "1px solid #ef4444",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "480px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
        }}>
          <h2 style={{ color: "#f87171", marginTop: 0, marginBottom: "16px" }}>Workspace Configuration Error</h2>
          <p style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>
            {tenantError}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("churchos.tenantId");
              localStorage.removeItem("churchos.subdomain");
              localStorage.removeItem("churchos.token");
              window.location.reload();
            }}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: 0,
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
          >
            Reset Workspace & Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${isFullscreen ? "fullscreen" : ""}`} id="app">
      <header className="topbar">
        <div className="brand" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
          <button
            className="icon-btn"
            onClick={handleClose}
            title="Back to Dashboard"
            style={{
              padding: "6px 10px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "inherit",
              display: "flex",
              alignItems: "center"
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <strong style={{ whiteSpace: "nowrap" }}>Theme Builder</strong>
        </div>

        <div className="page-switcher">
          <label>Page</label>
          <div className="custom-dropdown" 
               tabIndex={0} 
               onBlur={(e) => {
                 if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                   setIsPageMenuOpen(false);
                 }
               }}
          >
            <div className="dropdown-selected" onClick={() => setIsPageMenuOpen(!isPageMenuOpen)}>
               <span className="dropdown-label">{
                 pageOptions.find(p => p.value === importedFilename)?.label || `${importedFilename} (Custom)`
               }</span>
               <ChevronDown size={14} className={`dropdown-icon ${isPageMenuOpen ? "open" : ""}`} />
             </div>
             {isPageMenuOpen && (
               <div className="dropdown-options">
                 {pageOptions.map((opt) => (

                  <div
                    key={opt.value}
                    className={`dropdown-item ${importedFilename === opt.value ? "active" : ""}`}
                    onClick={async () => {
                      await navigateCustomizerPage(opt.value);
                      setIsPageMenuOpen(false);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="top-actions">
          <button
            className={`editor-switch ${!editorMode ? "browse" : ""}`}
            onClick={() => setEditorMode(!editorMode)}
            title={editorMode ? "Switch to Browse Mode" : "Switch to Editor Mode"}
          >
            <span className="switch-knob">
              {editorMode ? <MousePointerClick /> : <Navigation />}
            </span>
          </button>

          <div className="screen-switcher">
            <button
              className={`screen-btn ${deviceSize === "desktop" ? "active" : ""}`}
              onClick={() => setDeviceSize("desktop")}
            >
              <Monitor />
              <span>Desktop</span>
            </button>
            <button
              className={`screen-btn ${deviceSize === "laptop" ? "active" : ""}`}
              onClick={() => setDeviceSize("laptop")}
            >
              <Laptop />
              <span>Laptop</span>
            </button>
            <button
              className={`screen-btn ${deviceSize === "tablet" ? "active" : ""}`}
              onClick={() => setDeviceSize("tablet")}
            >
              <Tablet />
              <span>Tablet</span>
            </button>
            <button
              className={`screen-btn ${deviceSize === "mobile" ? "active" : ""}`}
              onClick={() => setDeviceSize("mobile")}
            >
              <Smartphone />
              <span>Mobile</span>
            </button>
          </div>

          <button className="icon-btn" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            className="screen-btn"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid var(--border)",
              background: saveStatus === 'saved' ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: saveStatus === 'saved' ? "#10b981" : "inherit",
              borderColor: saveStatus === 'saved' ? "#10b981" : "var(--border)",
              cursor: saveStatus === 'saving' ? "not-allowed" : "pointer",
              height: "36px",
              padding: "0 12px",
              borderRadius: "6px",
              transition: "all 0.2s"
            }}
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Check size={14} style={{ color: "#10b981" }} />
            ) : (
              <Save size={14} />
            )}
            <span>
              {saveStatus === 'saving' ? "Saving..." : saveStatus === 'saved' ? "Saved" : "Save"}
            </span>
          </button>
          <button
            className="publish-btn"
            onClick={handlePublish}
            disabled={publishStatus === 'publishing'}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: publishStatus === 'publishing' ? "not-allowed" : "pointer",
              height: "36px",
              padding: "0 12px",
              borderRadius: "6px",
              background: publishStatus === 'preview' 
                ? "var(--primary)" 
                : publishStatus === 'published' 
                  ? "#10b981" 
                  : "var(--primary)",
              color: "#ffffff",
              transition: "all 0.2s"
            }}
          >
            {publishStatus === 'publishing' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : publishStatus === 'published' ? (
              <Check size={14} style={{ color: "#ffffff" }} />
            ) : publishStatus === 'preview' ? (
              <Eye size={14} />
            ) : (
              <Download size={14} />
            )}
            <span>
              {publishStatus === 'publishing' 
                ? "Publishing..." 
                : publishStatus === 'published' 
                  ? "Published" 
                  : publishStatus === 'preview' 
                    ? "Preview" 
                    : "Publish"}
            </span>
          </button>
        </div>
      </header>

      {/* Floating Toolbar when Fullscreen */}
      <div className="fullscreen-floating">
        <button className="icon-btn" onClick={() => setIsFullscreen(false)}>
          <X />
        </button>
        <button
          className={`screen-btn ${deviceSize === "desktop" ? "active" : ""}`}
          onClick={() => setDeviceSize("desktop")}
        >
          <Monitor />
        </button>
        <button
          className={`screen-btn ${deviceSize === "laptop" ? "active" : ""}`}
          onClick={() => setDeviceSize("laptop")}
        >
          <Laptop />
        </button>
        <button
          className={`screen-btn ${deviceSize === "tablet" ? "active" : ""}`}
          onClick={() => setDeviceSize("tablet")}
        >
          <Tablet />
        </button>
        <button
          className={`screen-btn ${deviceSize === "mobile" ? "active" : ""}`}
          onClick={() => setDeviceSize("mobile")}
        >
          <Smartphone />
        </button>
      </div>

      <main className="workspace">
        <aside className="sidebar">

          <div style={{ minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {activeTab === "settings" && (
              <SettingsPanel
                htmlContent={rawHtml}
                onImport={handleImport}
                currentTheme={currentTheme}
                onSelectTheme={handleSelectTheme}
                themes={AVAILABLE_THEMES}
              />
            )}
            
            {activeTab === "customizer" && (
              <CustomizerPanel
                state={themeState}
                onChange={(updates) => setThemeState((prev) => ({ ...prev, ...updates }))}
              />
            )}

            {activeTab === "editor" && (
              <EditorPanel
                state={themeState}
                selectedElement={selectedElement}
                sections={sections}
                childrenOfSection={childrenOfSection}
                onChange={(updates) => setThemeState((prev) => ({ ...prev, ...updates }))}
                onSelectElementByPath={(path) => {
                  const doc = parseHtml(rawHtml);
                  const node = doc.querySelector(path);
                  if (node) {
                    const tag = node.tagName.toLowerCase();
                    let type = "element";
                    if ((node as HTMLElement).dataset.editorType) type = (node as HTMLElement).dataset.editorType!;
                    else if (["h1", "h2", "h3", "h4"].includes(tag)) type = "title";
                    else if (tag === "p") type = "description";
                    else if (["a", "button"].includes(tag)) type = "button";
                    else if (tag === "img") type = "image";
                    else if (node.classList.contains("card") || node.classList.contains("feature-card") || node.classList.contains("person-card")) type = "card";

                    setSelectedElement({
                      path,
                      type,
                      label: (node as HTMLElement).dataset.editorLabel || type.toUpperCase(),
                      text: (node as HTMLElement).innerText || (node as HTMLImageElement).alt || "",
                      href: node.getAttribute("href") || "",
                      src: node.getAttribute("src") || "",
                      alt: node.getAttribute("alt") || "",
                    });
                  }
                }}
                onSaveElement={handleSaveElementProperties}
                onRewriteTag={handleRewriteTag}
                onChangeButtonRole={handleChangeButtonRole}
                onChangeCardRole={handleChangeCardRole}
                onDuplicateElement={handleDuplicateElement}
                onDeleteElement={handleDeleteElement}
                onSelectSection={(path) => {
                  setActiveSectionPath(path);
                  setSelectedElement(null);
                }}
                activeSectionPath={activeSectionPath}
                onSaveSectionStyles={handleSaveSectionStyles}
                onBackToSections={() => {
                  setActiveSectionPath(null);
                  setSelectedElement(null);
                }}
                onDragStart={(blockData) => {
                  setEditorMode(true);
                  if (blockData) {
                    setIsDragging(true);
                    setDragData(blockData);
                  }
                }}
                onDragEnd={() => {
                  setIsDragging(false);
                  setDragData(null);
                }}
              />
            )}
          </div>

          <div className="bottom-tabs">
            <button
              className={`bottom-tab ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("settings");
                setSelectedElement(null);
                setActiveSectionPath(null);
              }}
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              className={`bottom-tab ${activeTab === "customizer" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("customizer");
                setSelectedElement(null);
                setActiveSectionPath(null);
                setEditorMode(false);
              }}
            >
              Interface
            </button>
            <button
              className={`bottom-tab ${activeTab === "editor" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("editor");
                setSelectedElement(null);
                setActiveSectionPath(null);
                setEditorMode(true);
              }}
            >
              Editor
            </button>
          </div>
        </aside>

        <Preview
          html={renderedHtml}
          deviceSize={deviceSize}
          editorMode={editorMode}
          isDragging={isDragging}
          dragData={dragData}
          onElementSelect={(data) => {
            setSelectedElement(data);
            setActiveTab("editor");
          }}
        />
      </main>
    </div>
  );
}
export default App;
