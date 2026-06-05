import React, { useState, useEffect } from 'react';
import { SidebarLeft } from './components/SidebarLeft.js';
import { Canvas } from './components/Canvas.js';
import { InspectorRight } from './components/InspectorRight.js';
import { Icon } from './components/Icon.js';
import { ElementSchema, DeviceType, HistoryState } from './types.js';
import {
  generateId,
  findElementById,
  updateElementInTree,
  deleteElementFromTree,
  insertElementInTree,
  moveElementInTree,
  getBreadcrumbPath
} from './utils.js';

// Helper to recursively assign new unique IDs on duplication or insertion
const cloneElementWithNewIds = (el: ElementSchema): ElementSchema => {
  const shortType = el.type.substring(0, 3);
  return {
    ...el,
    id: generateId(shortType),
    children: (el.children || []).map(child => cloneElementWithNewIds(child))
  };
};

interface InspectorBoundaryProps {
  resetKey: string;
  children: React.ReactNode;
}

interface InspectorBoundaryState {
  hasError: boolean;
  message: string;
}

class InspectorBoundary extends React.Component<InspectorBoundaryProps, InspectorBoundaryState> {
  state: InspectorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): InspectorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidUpdate(prevProps: InspectorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  componentDidCatch(error: unknown) {
    console.error('Inspector failed to render', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <aside className="sidebar thin-scroll select-none" style={{ borderLeft: '1px solid var(--border-color)', background: '#ffffff', overflowY: 'auto' }}>
          <div className="p-4 border border-rose-200 bg-rose-50 rounded-lg text-sm text-rose-800">
            <div className="font-semibold mb-1">Properties panel paused</div>
            <p className="text-xs leading-relaxed">Select another block to reload the inspector. The page preview is still safe.</p>
            {this.state.message && <pre className="mt-3 text-[10px] whitespace-pre-wrap">{this.state.message}</pre>}
          </div>
        </aside>
      );
    }

    return this.props.children;
  }
}

// PRE-BUILT DESIGN TEMPLATES
const templates = {
  hero: (): ElementSchema[] => [
    {
      id: 'flex_hero_banner',
      type: 'flexbox',
      props: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' },
      styles: {
        desktop: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          paddingTop: '80px',
          paddingBottom: '80px',
          paddingLeft: '40px',
          paddingRight: '40px',
          minHeight: '400px',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: '#e5e7eb'
        },
        mobile: {
          paddingTop: '40px',
          paddingBottom: '40px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }
      },
      children: [
        {
          id: 'hero_badge',
          type: 'button',
          props: { text: 'ChurchOS CMS Builder', url: '#' },
          styles: {
            desktop: {
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              paddingLeft: '14px',
              paddingRight: '14px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              textAlign: 'center',
              borderStyle: 'solid',
              borderWidth: '1px',
              borderColor: '#bfdbfe',
              textTransform: 'uppercase',
              letterSpacing: '0'
            }
          },
          children: []
        },
        {
          id: 'hero_heading',
          type: 'heading',
          props: { text: 'Build Dynamic Church Pages for Christ Embassy Next Church', level: 'h1' },
          styles: {
            desktop: {
              fontSize: '44px',
              fontWeight: '800',
              color: '#111827',
              textAlign: 'center',
              lineHeight: '1.2',
              maxWidth: '800px',
              paddingBottom: '8px'
            },
            mobile: {
              fontSize: '28px'
            }
          },
          children: []
        },
        {
          id: 'hero_desc',
          type: 'paragraph',
          props: { text: 'A clean ChurchOS page builder with church-native sections, dynamic ministry blocks, responsive styling, and reusable page structure.' },
          styles: {
            desktop: {
              fontSize: '15px',
              color: '#4b5563',
              textAlign: 'center',
              lineHeight: '1.6',
              maxWidth: '620px',
              paddingBottom: '16px'
            },
            mobile: {
              fontSize: '13px'
            }
          },
          children: []
        },
        {
          id: 'hero_btn_container',
          type: 'flexbox',
          props: { display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '12px' },
          styles: {
            desktop: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              minHeight: 'auto',
              borderStyle: 'none'
            },
            mobile: {
              flexDirection: 'column',
              width: '100%'
            }
          },
          children: [
            {
              id: 'hero_cta_primary',
              type: 'button',
              props: { text: 'Start Designing Now', url: '#' },
              styles: {
                desktop: {
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'center',
                  borderStyle: 'none',
                  boxShadow: '0 8px 18px rgba(17, 24, 39, 0.12)'
                },
                mobile: {
                  width: '100%'
                }
              },
              children: []
            },
            {
              id: 'hero_cta_secondary',
              type: 'button',
              props: { text: 'Explore Dynamic Blocks', url: '#' },
              styles: {
                desktop: {
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'center',
                  borderStyle: 'solid',
                  borderWidth: '1px',
                  borderColor: '#d1d5db'
                },
                mobile: {
                  width: '100%'
                }
              },
              children: []
            }
          ]
        }
      ]
    }
  ],
  church_landing: (): ElementSchema[] => [
    {
      id: 'grid_row',
      type: 'legacy_grid',
      props: { columnsCount: 2 },
      styles: {
        desktop: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          paddingTop: '40px',
          paddingBottom: '40px',
          paddingLeft: '32px',
          paddingRight: '32px',
          minHeight: '300px',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          borderWidth: '1px',
          borderColor: '#e5e7eb',
          borderStyle: 'solid'
        },
        mobile: {
          gridTemplateColumns: '1fr',
          paddingTop: '24px',
          paddingBottom: '24px',
          paddingLeft: '16px',
          paddingRight: '16px',
          gap: '24px'
        }
      },
      children: [
        {
          id: 'grid_col_left',
          type: 'column',
          props: { ratio: 50 },
          styles: { desktop: { padding: '10px', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } },
          children: [
            {
              id: 'col_heading',
              type: 'heading',
              props: { text: 'Next Church Ministry Launch', level: 'h2' },
              styles: {
                desktop: { fontSize: '28px', fontWeight: '700', color: '#111827', paddingBottom: '8px' }
              },
              children: []
            },
            {
              id: 'col_p',
              type: 'paragraph',
              props: { text: 'Create a focused ministry page with event countdowns, service calls to action, and live ChurchOS module data.' },
              styles: {
                desktop: { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', paddingBottom: '16px' }
              },
              children: []
            },
            {
              id: 'col_countdown',
              type: 'countdown',
              props: { targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), timezone: 'UTC', onExpire: 'show_text', expireText: 'This event has ended.' },
              styles: {
                desktop: { display: 'flex', gap: '8px', paddingBottom: '20px' }
              },
              children: []
            }
          ]
        },
        {
          id: 'grid_col_right',
          type: 'column',
          props: { ratio: 50 },
          styles: { desktop: { padding: '10px', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } },
          children: [
            {
              id: 'col_dynamic_block',
              type: 'dynamic_church_block',
              props: { module: 'Events', blockName: 'Event Registration', action: 'Register members and visitors', fields: ['eventTitle', 'date', 'capacity', 'registrationForm'] },
              styles: {
                desktop: {
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  borderWidth: '1px',
                  borderColor: '#e5e7eb',
                  borderStyle: 'solid'
                }
              },
              children: []
            }
          ]
        }
      ]
    }
  ]
};

export const App: React.FC = () => {
  const pageContext = new URLSearchParams(window.location.search);
  const initialTitle = pageContext.get('title') || 'Sunday Experience Landing Page';
  const initialSlug = pageContext.get('slug') || '';
  const initialStatus = pageContext.get('status') || 'draft';
  
  let queryTheme = pageContext.get('theme');
  let queryAccent = pageContext.get('accent');

  if (!queryTheme || !queryAccent) {
    try {
      const savedState = localStorage.getItem('churchos.unifiedDashboard.v1');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed && parsed.theme) {
          if (!queryTheme) queryTheme = parsed.theme.mode;
          if (!queryAccent) queryAccent = parsed.theme.accent;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const initialTheme = (queryTheme as 'dark' | 'light') || 'light';
  const initialAccent = queryAccent || '#7C3AED';

  const [elements, setElements] = useState<ElementSchema[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeDevice, setActiveDevice] = useState<DeviceType>('desktop');
  const [activeTemplate, setActiveTemplate] = useState<string>('hero');

  // Page Settings
  const [pageTitle, setPageTitle] = useState(initialTitle);
  const [pageDesc, setPageDesc] = useState('Minimal ChurchOS CMS page with dynamic sections, reusable blocks, and responsive layouts.');
  const [canvasBg, setCanvasBg] = useState('#ffffff');

  // Dynamic theme & accent state (Charcoal Grace UI)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(initialTheme);
  const [brandAccent, setBrandAccent] = useState(initialAccent);

  // Scoped canvas preview theme (only toggles content simulation)
  const [canvasThemeMode, setCanvasThemeMode] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    document.body.classList.toggle('light-mode', themeMode === 'light');
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', brandAccent);
  }, [brandAccent]);

  // Listen for message events for real-time theme updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'themeChange') {
        const { theme: nextTheme, accent: nextAccent } = event.data;
        if (nextTheme) setThemeMode(nextTheme);
        if (nextAccent) setBrandAccent(nextAccent);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // History states for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Publish / Save State
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [compiledSchema, setCompiledSchema] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  const showToastNotification = (msg: string) => {
    setToast({ message: msg, show: true });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Load template helper
  const loadTemplate = (tempKey: 'hero' | 'church_landing') => {
    const fn = templates[tempKey];
    if (fn) {
      const initial = fn();
      setElements(initial);
      setSelectedElementId(null);
      
      const state: HistoryState = {
        elements: JSON.parse(JSON.stringify(initial)),
        selectedElementId: null
      };
      setHistory([state]);
      setHistoryIndex(0);
      setActiveTemplate(tempKey);
      showToastNotification(`Loaded ${tempKey.replace('_', ' ')} template successfully!`);
    }
  };

  // Set default initial template on mount
  useEffect(() => {
    loadTemplate('hero');
  }, []);

  // Push new history state
  const pushState = (newElements: ElementSchema[], newSelectedId: string | null = selectedElementId) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    const nextState: HistoryState = {
      elements: JSON.parse(JSON.stringify(newElements)),
      selectedElementId: newSelectedId
    };
    setHistory([...nextHistory, nextState]);
    setHistoryIndex(nextHistory.length);
    setElements(newElements);
    setSelectedElementId(newSelectedId);
  };

  // Undo / Redo mechanics
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const prevState = history[prevIdx];
      setHistoryIndex(prevIdx);
      setElements(prevState.elements);
      setSelectedElementId(prevState.selectedElementId);
      showToastNotification('Undo performed (Ctrl+Z)');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextState = history[nextIdx];
      setHistoryIndex(nextIdx);
      setElements(nextState.elements);
      setSelectedElementId(nextState.selectedElementId);
      showToastNotification('Redo performed (Ctrl+Y)');
    }
  };

  // Node operations
  const handleSelectElement = (id: string | null) => {
    setSelectedElementId(id);
  };

  const handleUpdateElement = (id: string, updater: (el: ElementSchema) => Partial<ElementSchema>) => {
    const updated = updateElementInTree(elements, id, updater);
    pushState(updated);
  };

  const handleDeleteElement = (id: string) => {
    const updated = deleteElementFromTree(elements, id);
    pushState(updated, selectedElementId === id ? null : selectedElementId);
    showToastNotification('Element deleted');
  };

  const handleDuplicateElement = (id: string) => {
    const target = findElementById(elements, id);
    if (!target) return;
    const duplicated = cloneElementWithNewIds(target);
    const updated = insertElementInTree(elements, id, duplicated, 'below');
    pushState(updated, duplicated.id);
    showToastNotification('Element duplicated');
  };

  const handleAddElement = (schema: any, targetId: string, position: 'above' | 'below' | 'inside') => {
    const newEl = cloneElementWithNewIds(schema);
    let updated: ElementSchema[];

    if (targetId === 'root') {
      updated = [...elements, newEl];
    } else {
      updated = insertElementInTree(elements, targetId, newEl, position);
    }
    pushState(updated, newEl.id);
    showToastNotification(`Added ${newEl.type} element`);
  };

  const handleMoveElement = (sourceId: string, targetId: string, position: 'above' | 'below' | 'inside') => {
    const updated = moveElementInTree(elements, sourceId, targetId, position);
    pushState(updated, sourceId);
    showToastNotification('Element reordered');
  };

  // Keyboard Shortcuts: Ctrl+Z, Ctrl+Y, Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          handleDeleteElement(selectedElementId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, historyIndex, history, selectedElementId]);

  // Save Draft action
  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      localStorage.setItem('page_builder_draft', JSON.stringify(elements));
      showToastNotification('Draft saved successfully!');
    }, 1200);
  };

  // Publish Schema action
  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      const output = JSON.stringify(
        {
          compiledAt: new Date().toISOString(),
          version: '2.0.0-flex',
          pageSettings: {
            title: pageTitle,
            description: pageDesc,
            background: canvasBg
          },
          themeSettings: { accentColor: '#2563eb', font: 'Inter' },
          pageSchema: elements
        },
        null,
        2
      );
      setCompiledSchema(output);
      showToastNotification('Schema compiled successfully!');
    }, 1500);
  };

  const handleBackToCms = () => {
    const params = new URLSearchParams({
      module: 'cms',
      theme: themeMode,
      accent: brandAccent
    });
    window.location.href = `/admin.html?${params.toString()}`;
  };

  // Breadcrumbs path calculations
  const breadcrumbs = selectedElementId ? getBreadcrumbPath(elements, selectedElementId) : [];

  const selectedElement = selectedElementId ? findElementById(elements, selectedElementId) : null;
  const inspectorVisibilityClass = selectedElement ? 'flex' : 'hidden 2xl:flex';

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden text-text bg-bg transition-colors duration-200">
      
      {/* -------------------- 1. TOP ACTION TOOLBAR -------------------- */}
      <header className="h-16 flex items-center justify-between px-5 bg-surface border-b border-border z-30 select-none transition-colors duration-200">
        
        {/* Left Section: Logo & Preset Templates selector */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleBackToCms}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-soft hover:bg-border/30 border border-border rounded-xl text-xs font-bold text-text hover:text-accent transition-all duration-150 cursor-pointer"
          >
            <Icon name="arrow-left" className="w-4 h-4" />
            <span>Back to CMS</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-accent text-white p-2 rounded-xl flex items-center justify-center shadow-md shadow-accent/20">
              <Icon name="panel-left" className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-normal text-text">ChurchOS CMS</span>
              <span className="text-[10px] text-muted font-semibold ml-2 px-1.5 py-0.5 rounded-md bg-surface-soft border border-border uppercase">Builder</span>
              {initialSlug && (
                <span className="text-[10px] text-muted font-mono ml-2">/{initialSlug}</span>
              )}
              <span className="text-[10px] text-muted font-semibold ml-2 px-1.5 py-0.5 rounded-md bg-surface-soft border border-border uppercase">{initialStatus}</span>
            </div>
          </div>

          {/* Template Selectors Dropdown */}
          <div className="flex items-center gap-2 bg-surface-soft px-3 py-1.5 rounded-xl border border-border">
            <span className="text-xs text-muted font-medium">Template</span>
            <select
              value={activeTemplate}
              onChange={(e) => loadTemplate(e.target.value as any)}
              className="bg-transparent text-xs text-text font-semibold focus:outline-none cursor-pointer"
            >
              <option value="hero">Service Hero Page</option>
              <option value="church_landing">Ministry Landing Page</option>
            </select>
          </div>
        </div>

        {/* Center Section: Device Viewport Switches */}
        <div className="flex items-center gap-1 bg-surface-soft p-1 rounded-xl border border-border">
          {[
            { id: 'desktop', icon: 'monitor', label: 'Desktop' },
            { id: 'laptop', icon: 'laptop', label: 'Laptop' },
            { id: 'tablet', icon: 'tablet', label: 'Tablet' },
            { id: 'mobile', icon: 'smartphone', label: 'Mobile' }
          ].map(device => (
            <button
              key={device.id}
              onClick={() => { setActiveDevice(device.id as DeviceType); showToastNotification(`Switched to ${device.label} layout overrides`); }}
              style={{
                background: activeDevice === device.id ? 'var(--accent)' : 'transparent',
                boxShadow: 'none',
                color: activeDevice === device.id ? '#ffffff' : 'var(--text-muted)'
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:text-text"
              title={`${device.label} Overrides`}
            >
              <Icon name={device.icon} className="w-4 h-4" />
              <span className="hidden md:inline">{device.label}</span>
            </button>
          ))}
        </div>

        {/* Right Section: History, Save & Publish Buttons */}
        <div className="flex items-center gap-3">
          {/* Undo/Redo operations */}
          <div className="flex items-center border border-border rounded-xl bg-surface overflow-hidden">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-surface-soft text-muted disabled:opacity-30 disabled:hover:bg-transparent"
              title="Undo (Ctrl+Z)"
            >
              <Icon name="undo-2" className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-border"></div>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-surface-soft text-muted disabled:opacity-30 disabled:hover:bg-transparent"
              title="Redo (Ctrl+Y)"
            >
              <Icon name="redo-2" className="w-4 h-4" />
            </button>
          </div>


          {/* Action buttons */}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="h-10 px-4 text-xs font-semibold bg-surface hover:bg-surface-soft border border-border rounded-lg transition-all active:scale-95 flex items-center gap-2 text-text"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-muted border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icon name="save" className="w-3.5 h-3.5" />
            )}
            Save
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-10 px-4 text-xs font-bold bg-accent rounded-lg transition-all active:scale-95 flex items-center gap-2 text-white shadow-lg shadow-accent/20"
          >
            {isPublishing ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icon name="rocket" className="w-3.5 h-3.5" />
            )}
            Publish
          </button>
        </div>

      </header>

      {/* -------------------- 2. MAIN 3-PANEL INTERFACE -------------------- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Elements Inventory panel */}
        <SidebarLeft
          elements={elements}
          selectedElementId={selectedElementId}
          onSelectElement={handleSelectElement}
          onDeleteElement={handleDeleteElement}
          onLoadTemplate={(key) => loadTemplate(key)}
          pageTitle={pageTitle}
          setPageTitle={setPageTitle}
          pageDesc={pageDesc}
          setPageDesc={setPageDesc}
          canvasBg={canvasBg}
          setCanvasBg={setCanvasBg}
          brandAccent={brandAccent}
          setBrandAccent={setBrandAccent}
          canvasThemeMode={canvasThemeMode}
          setCanvasThemeMode={setCanvasThemeMode}
        />

        {/* Center Workspace Canvas panel */}
        <Canvas
          elements={elements}
          activeDevice={activeDevice}
          selectedElementId={selectedElementId}
          onSelectElement={handleSelectElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onAddElement={handleAddElement}
          onMoveElement={handleMoveElement}
          canvasBg={canvasBg}
          canvasThemeMode={canvasThemeMode}
        />

        {/* Right Side Styles / Properties Inspector panel */}
        <div className={`${inspectorVisibilityClass} h-full shrink-0`}>
          <InspectorBoundary resetKey={selectedElementId || 'empty'}>
            <InspectorRight
              selectedElement={selectedElement}
              activeDevice={activeDevice}
              onUpdateElement={(updater) => {
                if (selectedElementId) {
                  handleUpdateElement(selectedElementId, updater);
                }
              }}
            />
          </InspectorBoundary>
        </div>

      </div>

      {/* -------------------- 3. BOTTOM BREADCRUMB NAVIGATION -------------------- */}
      <footer className="h-10 flex items-center px-5 bg-surface border-t border-border text-xs text-muted select-none z-30 justify-between transition-colors duration-200">
        <div className="flex items-center gap-2 font-medium overflow-x-auto whitespace-nowrap">
          <span className="text-muted font-bold uppercase tracking-normal text-[10px]">Path</span>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            breadcrumbs.map((node, idx) => (
              <React.Fragment key={node.id}>
                {idx > 0 && <span className="text-muted/40">/</span>}
                <button
                  onClick={() => handleSelectElement(node.id)}
                  style={{
                    color: node.id === selectedElementId ? 'var(--accent)' : 'var(--text-muted)'
                  }}
                  className="font-semibold hover:opacity-80 transition-colors capitalize"
                >
                  {node.type.replace('_', ' ')}
                </button>
              </React.Fragment>
            ))
          ) : (
            <span className="italic text-muted/65">No element selected</span>
          )}
        </div>
        
        <div className="text-[10px] text-muted font-semibold font-mono hidden md:block">
          Active Viewport: <span className="text-accent capitalize font-bold">{activeDevice}</span> | Nodes: {elements.length > 0 ? history[historyIndex]?.elements.length : 0}
        </div>
      </footer>

      {/* -------------------- 4. COMPILED SCHEMA POPUP MODAL -------------------- */}
      {compiledSchema && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 backdrop-blur-sm transition-all duration-300">
          <div className="bg-surface border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-green-500/10 text-green-500 p-2 rounded-xl border border-green-500/20">
                  <Icon name="check-circle" className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-normal">Schema Compiled Successfully</h3>
                  <p className="text-[10px] text-muted">Ready for the CMS layout library</p>
                </div>
              </div>
              
              <button
                onClick={() => setCompiledSchema(null)}
                className="text-muted hover:text-text transition-colors"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-5 overflow-auto bg-bg/50 thin-scroll">
              <pre className="text-xs text-accent/90 font-mono leading-relaxed select-text select-all whitespace-pre-wrap">{compiledSchema}</pre>
            </div>

            <div className="p-4 border-t border-border bg-surface-soft flex gap-3 justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(compiledSchema);
                  showToastNotification('Copied compiled schema JSON to clipboard!');
                }}
                className="px-4 py-2 bg-accent hover:opacity-90 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setCompiledSchema(null)}
                className="px-4 py-2 bg-surface hover:bg-surface-soft text-text border border-border font-semibold rounded-lg text-xs transition-colors"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- 5. FLOATING GLASS TOAST NOTIFICATION -------------------- */}
      {toast.show && (
        <div className="fixed bottom-14 right-6 bg-surface border border-border text-text px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom duration-300">
          <Icon name="bell" className="w-4 h-4 text-accent animate-pulse" />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

    </div>
  );
};
