import React, { useState } from 'react';
import { ElementSchema, DeviceType } from '../types';
import { Icon } from './Icon.js';

interface SidebarLeftProps {
  elements: ElementSchema[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onDeleteElement: (id: string) => void;
  onLoadTemplate: (key: 'hero' | 'church_landing') => void;
  pageTitle: string;
  setPageTitle: (t: string) => void;
  pageDesc: string;
  setPageDesc: (d: string) => void;
  canvasBg: string;
  setCanvasBg: (bg: string) => void;
  brandAccent: string;
  setBrandAccent: (acc: string) => void;
  canvasThemeMode: 'dark' | 'light';
  setCanvasThemeMode: (mode: 'dark' | 'light') => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onDeleteElement,
  onLoadTemplate,
  pageTitle,
  setPageTitle,
  pageDesc,
  setPageDesc,
  canvasBg,
  setCanvasBg,
  brandAccent,
  setBrandAccent,
  canvasThemeMode,
  setCanvasThemeMode
}) => {
  const [activePanel, setActivePanel] = useState<'elements' | 'outline' | 'templates' | 'settings'>('elements');
  const [activeCategory, setActiveCategory] = useState<string>('layout');

  const categories = [
    { id: 'layout', label: 'Layout', icon: 'layout' },
    { id: 'standard', label: 'Content', icon: 'type' },
    { id: 'church', label: 'Church Data', icon: 'church' },
  ];

  const elementsData = {
    layout: [
      {
        type: 'flexbox',
        label: 'Flex Container (Gen 2)',
        icon: 'box',
        note: 'Flexbox block container with align/direction styling',
        defaultSchema: {
          type: 'flexbox',
          props: { display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '16px' },
          styles: {
            desktop: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              paddingTop: '20px',
              paddingBottom: '20px',
              minHeight: '100px',
              borderStyle: 'dashed',
              borderWidth: '1px',
              borderColor: 'var(--border-color-raw)'
            }
          },
          children: []
        }
      },
      {
        type: 'legacy_grid',
        label: 'Row / Columns (Legacy)',
        icon: 'columns',
        note: 'Row-Column grid layout with 1-6 columns',
        defaultSchema: {
          type: 'legacy_grid',
          props: { columnsCount: 2 },
          styles: {
            desktop: {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              paddingTop: '20px',
              paddingBottom: '20px',
              minHeight: '120px',
              borderStyle: 'dashed',
              borderWidth: '1px',
              borderColor: 'var(--border-color-raw)'
            }
          },
          children: [
            {
              id: '',
              type: 'column',
              props: { ratio: 50 },
              styles: { desktop: { padding: '16px', minHeight: '80px', background: 'var(--border-color-raw)' } },
              children: []
            },
            {
              id: '',
              type: 'column',
              props: { ratio: 50 },
              styles: { desktop: { padding: '16px', minHeight: '80px', background: 'var(--border-color-raw)' } },
              children: []
            }
          ]
        }
      }
    ],
    standard: [
      {
        type: 'heading',
        label: 'Heading',
        icon: 'heading',
        note: 'Editable inline heading text block',
        defaultSchema: {
          type: 'heading',
          props: { text: 'Build Something Beautiful', level: 'h2' },
          styles: {
            desktop: { fontSize: '32px', fontWeight: '700', color: 'var(--text)', paddingBottom: '12px' },
            mobile: { fontSize: '24px' }
          },
          children: []
        }
      },
      {
        type: 'paragraph',
        label: 'Paragraph',
        icon: 'align-left',
        note: 'Body text description content block',
        defaultSchema: {
          type: 'paragraph',
          props: { text: 'Build a responsive church page with sections, ministry content, calls to action, and live module blocks.' },
          styles: {
            desktop: { fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6', paddingBottom: '16px' }
          },
          children: []
        }
      },
      {
        type: 'button',
        label: 'Action Button',
        icon: 'square',
        note: 'Clickable call-to-action button with custom link',
        defaultSchema: {
          type: 'button',
          props: { text: 'Get Started Now', url: '#' },
          styles: {
            desktop: {
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              paddingLeft: '20px',
              paddingRight: '20px',
              paddingTop: '10px',
              paddingBottom: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center',
              borderStyle: 'none'
            }
          },
          children: []
        }
      },
      {
        type: 'image',
        label: 'Single Image',
        icon: 'image',
        note: 'Image media placeholder with alt tags',
        defaultSchema: {
          type: 'image',
          props: {
            src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
            alt: 'Analytics illustration',
            enableHoverZoom: false
          },
          styles: {
            desktop: { width: '100%', borderRadius: '10px', transition: 'transform 0.3s ease' }
          },
          children: []
        }
      },
      {
        type: 'video',
        label: 'Video Block',
        icon: 'video',
        note: 'Vimeo, YouTube, or HTML5 native video embed',
        defaultSchema: {
          type: 'video',
          props: { src: 'https://www.w3schools.com/html/mov_bbb.mp4', provider: 'html5' },
          styles: {
            desktop: { width: '100%', borderRadius: '8px', overflow: 'hidden' }
          },
          children: []
        }
      },
      {
        type: 'accordion',
        label: 'Accordion Panels',
        icon: 'chevrons-down',
        note: 'Collapsible accordion content block',
        defaultSchema: {
          type: 'accordion',
          props: {
            items: [
              { title: 'What is Gen 2 Flex System?', content: 'Gen 2 Flex editor lets you control layouts dynamically using CSS grids and flexbox direction parameters.' },
              { title: 'Is it mobile responsive?', content: 'Yes, styles can be overridden independently for desktop, laptop, tablet, and mobile viewports.' }
            ]
          },
          styles: {
            desktop: { background: 'var(--border-color-raw)', padding: '16px', borderRadius: '10px' }
          },
          children: []
        }
      },
      {
        type: 'countdown',
        label: 'Countdown Timer',
        icon: 'clock',
        note: 'Visual countdown timer for services, events, campaigns, or prayer sessions',
        defaultSchema: {
          type: 'countdown',
          props: { targetDate: '2026-12-31T23:59:59Z', timezone: 'UTC', onExpire: 'show_text', expireText: 'This event has ended.' },
          styles: {
            desktop: { display: 'flex', gap: '12px', justifyContent: 'center', padding: '16px' }
          },
          children: []
        }
      },
      {
        type: 'tabs',
        label: 'Tabbed Sub-canvases',
        icon: 'layers',
        note: 'Tabbed container holding multiple panels',
        defaultSchema: {
          type: 'tabs',
          props: {
            tabs: ['Overview', 'Schedule', 'Next Steps'],
            activeTabIdx: 0
          },
          styles: {
            desktop: { background: 'var(--border-color-raw)', padding: '16px', borderRadius: '10px' }
          },
          children: [
            {
              type: 'flexbox',
              props: { index: 0 },
              styles: { desktop: { padding: '16px', minHeight: '80px' } },
              children: []
            },
            {
              type: 'flexbox',
              props: { index: 1 },
              styles: { desktop: { padding: '16px', minHeight: '80px' } },
              children: []
            },
            {
              type: 'flexbox',
              props: { index: 2 },
              styles: { desktop: { padding: '16px', minHeight: '80px' } },
              children: []
            }
          ]
        }
      }
    ],
    church: [
      {
        type: 'dynamic_church_block',
        label: 'Upcoming Services',
        icon: 'calendar-days',
        note: 'Displays next services, locations, hosts, and countdown data',
        defaultSchema: {
          type: 'dynamic_church_block',
          props: { module: 'Church Services', blockName: 'Upcoming Services', action: 'Display next services', fields: ['title', 'date', 'time', 'location', 'speaker'] },
          styles: {
            desktop: {
              background: 'var(--surface-soft)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border-color)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }
          },
          children: []
        }
      },
      {
        type: 'dynamic_church_block',
        label: 'Livestream Player',
        icon: 'radio',
        note: 'Connects to livestream, chat, prayer, notes, and giving CTA',
        defaultSchema: {
          type: 'dynamic_church_block',
          props: { module: 'Livestream', blockName: 'Live Service Player', action: 'Render active stream', fields: ['player', 'chat', 'viewerCount', 'prayerRequest', 'givingCTA'] },
          styles: {
            desktop: { background: 'var(--surface-soft)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)', borderRadius: '12px', padding: '18px' }
          },
          children: []
        }
      },
      {
        type: 'dynamic_church_block',
        label: 'Sermon Grid',
        icon: 'clapperboard',
        note: 'Lists sermons, series, speakers, media, and replay content',
        defaultSchema: {
          type: 'dynamic_church_block',
          props: { module: 'Sermons / Media', blockName: 'Sermon Grid', action: 'List latest sermons', fields: ['series', 'speaker', 'date', 'video', 'audio'] },
          styles: { desktop: { background: 'var(--surface-soft)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)', borderRadius: '12px', padding: '18px' } },
          children: []
        }
      },
      {
        type: 'dynamic_church_block',
        label: 'Events Grid',
        icon: 'calendar-plus',
        note: 'Shows events, registration, capacity, countdowns, and reminders',
        defaultSchema: {
          type: 'dynamic_church_block',
          props: { module: 'Events', blockName: 'Upcoming Events Grid', action: 'Display event listings', fields: ['date', 'location', 'registration', 'capacity'] },
          styles: { desktop: { background: 'var(--surface-soft)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)', borderRadius: '12px', padding: '18px' } },
          children: []
        }
      },
      {
        type: 'dynamic_church_block',
        label: 'Giving Campaign',
        icon: 'badge-dollar-sign',
        note: 'Campaign card with progress, pledges, recurring giving, and receipt hooks',
        defaultSchema: {
          type: 'dynamic_church_block',
          props: { module: 'Giving', blockName: 'Giving Campaign', action: 'Show campaign progress', fields: ['goal', 'progress', 'pledges', 'recurringGiving'] },
          styles: { desktop: { background: 'var(--surface-soft)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)', borderRadius: '12px', padding: '18px' } },
          children: []
        }
      },
      {
        type: 'dynamic_church_block',
        label: 'Prayer Wall',
        icon: 'heart-handshake',
        note: 'Prayer requests, testimony wall, reactions, and active prayer sessions',
        defaultSchema: {
          type: 'dynamic_church_block',
          props: { module: 'Prayer & Testimony', blockName: 'Prayer Wall', action: 'Display approved prayer requests', fields: ['requests', 'iPrayed', 'testimonies', 'sessions'] },
          styles: { desktop: { background: 'var(--surface-soft)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)', borderRadius: '12px', padding: '18px' } },
          children: []
        }
      },
      {
        type: 'dynamic_church_block',
        label: 'Cell Group Finder',
        icon: 'map',
        note: 'Find groups by location, leader, language, day, and join request',
        defaultSchema: {
          type: 'dynamic_church_block',
          props: { module: 'Cell Groups', blockName: 'Cell Group Finder', action: 'Search available groups', fields: ['location', 'leader', 'day', 'language', 'joinRequest'] },
          styles: { desktop: { background: 'var(--surface-soft)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)', borderRadius: '12px', padding: '18px' } },
          children: []
        }
      },
      {
        type: 'dynamic_church_block',
        label: 'Member Dashboard',
        icon: 'user-round-check',
        note: 'Personalized member actions, groups, courses, giving, and notifications',
        defaultSchema: {
          type: 'dynamic_church_block',
          props: { module: 'Member Management', blockName: 'Member Dashboard', action: 'Render personalized member panel', fields: ['profile', 'events', 'groups', 'courses', 'givingHistory'] },
          styles: { desktop: { background: 'var(--surface-soft)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)', borderRadius: '12px', padding: '18px' } },
          children: []
        }
      }
    ]
  };

  const handleDragStart = (e: React.DragEvent, elementSchema: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(elementSchema));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Recursive Page Outline Tree Component
  const renderOutlineTree = (nodes: ElementSchema[], depth = 0) => {
    return nodes.map((node) => {
      const isSelected = selectedElementId === node.id;
      const getIcon = (type: string) => {
        switch (type) {
          case 'flexbox': return 'box';
          case 'legacy_grid': return 'columns';
          case 'column': return 'align-justify';
          case 'heading': return 'heading';
          case 'paragraph': return 'align-left';
          case 'button': return 'square';
          case 'image': return 'image';
          case 'video': return 'video';
          case 'accordion': return 'chevrons-down';
          case 'countdown': return 'clock';
          case 'tabs': return 'layers';
          case 'dynamic_church_block': return 'church';
          default: return 'help-circle';
        }
      };

      return (
        <div key={node.id} className="flex flex-col select-none">
          <div
            onClick={() => onSelectElement(node.id)}
            style={{
              paddingLeft: `${depth * 14 + 10}px`
            }}
            className={`flex items-center justify-between py-2 pr-3 text-xs font-semibold cursor-pointer transition-all border-l-2 hover:bg-surface-soft/50 ${
              isSelected 
                ? 'bg-accent/10 border-accent text-accent' 
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name={getIcon(node.type)} className="w-3.5 h-3.5 opacity-60" />
              <span className="capitalize">{node.type.replace('_', ' ')}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteElement(node.id); }}
              className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-0.5"
              style={{ transition: 'opacity 0.2s' }}
            >
              <Icon name="trash" className="w-3 h-3" />
            </button>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="flex flex-col border-l border-border ml-[18px]">
              {renderOutlineTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="builder-sidebar h-full flex overflow-hidden border-r border-border bg-sidebar select-none">
      
      {/* 1. Left vertical icon strip */}
      <div 
        className="w-14 h-full flex flex-col items-center py-4 gap-4 bg-bg border-r border-border/60"
        style={{ zIndex: 10 }}
      >
        {[
          { id: 'elements', icon: 'plus-circle', tooltip: 'Add Elements' },
          { id: 'outline', icon: 'git-branch', tooltip: 'Page Outline' },
          { id: 'templates', icon: 'file-text', tooltip: 'Templates' },
          { id: 'settings', icon: 'settings', tooltip: 'Page Settings' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id as any)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activePanel === tab.id
                ? 'bg-accent text-white shadow-lg'
                : 'text-muted hover:text-text hover:bg-surface-soft'
            }`}
            title={tab.tooltip}
          >
            <Icon name={tab.icon} className="w-5 h-5" />
          </button>
        ))}

        <div className="w-7 h-px bg-border my-1"></div>
        <button
          onClick={() => setCanvasThemeMode(canvasThemeMode === 'light' ? 'dark' : 'light')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-text hover:bg-surface-soft transition-all"
          title={canvasThemeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          <Icon name={canvasThemeMode === 'light' ? 'moon' : 'sun'} className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Secondary panel content */}
      <div 
        className="w-[240px] h-full flex flex-col p-4 bg-surface"
        style={{ overflowY: 'auto' }}
      >
        
        {/* TAB 1: ADD ELEMENTS PANEL */}
        {activePanel === 'elements' && (
          <div className="flex-1 flex flex-col h-full">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Add Elements</h3>
            
            {/* Element Category Buttons */}
            <div className="flex border-b border-border mb-4 pb-1 justify-between gap-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`py-1.5 px-2 text-[10px] uppercase font-bold tracking-wider rounded transition-all ${
                    activeCategory === cat.id ? 'bg-surface-soft text-accent' : 'text-muted hover:text-text'
                  }`}
                >
                  {cat.label.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Draggable Cards List */}
            <div className="flex flex-col gap-2.5 overflow-y-auto thin-scroll flex-1 pr-1">
              {elementsData[activeCategory as keyof typeof elementsData]?.map((el, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => handleDragStart(e, el.defaultSchema)}
                  className="block-card group flex flex-col border border-border bg-surface-soft/40 hover:bg-accent/5 hover:border-accent rounded-xl p-3 cursor-grab transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/10 transition-colors group-hover:bg-accent/20">
                      <Icon name={el.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-text">{el.label}</span>
                  </div>
                  <p className="text-[10px] text-muted leading-normal">{el.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PAGE OUTLINE HIERARCHY TREE */}
        {activePanel === 'outline' && (
          <div className="flex-grow flex flex-col h-full">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Page Outline</h3>
            <div className="flex-1 overflow-y-auto thin-scroll pr-1 border border-border rounded-xl bg-bg/40 py-2">
              {elements.length === 0 ? (
                <div className="p-6 text-center text-[11px] text-muted italic">No elements on canvas</div>
              ) : (
                <div className="group">
                  {renderOutlineTree(elements)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PRE-MADE TEMPLATES */}
        {activePanel === 'templates' && (
          <div className="flex-grow flex flex-col h-full gap-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Templates</h3>
            <p className="text-[10px] text-muted leading-normal mb-2">Select a preset to load a pre-configured church page design.</p>
            
            <button
              onClick={() => onLoadTemplate('hero')}
              className="w-full flex flex-col text-left p-3 border border-border hover:border-accent bg-surface-soft/30 rounded-xl transition-all group"
            >
              <span className="text-xs font-bold text-text group-hover:text-accent">Service Hero Page</span>
              <span className="text-[9px] text-muted mt-1 leading-relaxed">Clean church hero with service-focused copy, action buttons, and responsive layout.</span>
            </button>

            <button
              onClick={() => onLoadTemplate('church_landing')}
              className="w-full flex flex-col text-left p-3 border border-border hover:border-accent bg-surface-soft/30 rounded-xl transition-all group"
            >
              <span className="text-xs font-bold text-text group-hover:text-accent">Ministry Landing Page</span>
              <span className="text-[9px] text-muted mt-1 leading-relaxed">Two-column ministry page with event countdown and dynamic church module block.</span>
            </button>
          </div>
        )}

        {/* TAB 4: PAGE-LEVEL SETTINGS */}
        {activePanel === 'settings' && (
          <div className="flex-grow flex flex-col h-full gap-3 text-xs">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Page Settings</h3>
            
            <div className="form-group floating-field">
              <input
                type="text"
                className="form-control"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="My Custom Landing Page"
              />
              <label>Page Title</label>
            </div>

            <div className="form-group floating-field">
              <textarea
                className="form-control h-20 resize-none thin-scroll"
                value={pageDesc}
                onChange={(e) => setPageDesc(e.target.value)}
                placeholder="Responsive church page with SEO, ministry content, and dynamic module blocks."
              />
              <label>SEO Meta Description</label>
            </div>

            <div className="form-group">
              <label>Canvas Background Styling</label>
              <select
                className="form-control"
                value={canvasBg}
                onChange={(e) => setCanvasBg(e.target.value)}
              >
                <option value="var(--surface)">Theme Card Surface (Default)</option>
                <option value="var(--bg)">Theme Background Tone</option>
                <option value="#0c0d12">Midnight Charcoal</option>
                <option value="#181a24">Deep Royal Blue</option>
                <option value="#121212">Clean Dark Black</option>
                <option value="#FFFFFF">Clean Bright White</option>
              </select>
            </div>

            {/* Brand Accent Selector */}
            <div className="form-group mt-2">
              <label>Brand Accent Color</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  { name: 'Orange', hex: '#F97316' },
                  { name: 'Blue', hex: '#2563EB' },
                  { name: 'Purple', hex: '#7C3AED' },
                  { name: 'Green', hex: '#16A34A' },
                  { name: 'Red', hex: '#DC2626' },
                  { name: 'Pink', hex: '#DB2777' },
                  { name: 'Gray', hex: '#374151' }
                ].map(acc => (
                  <button
                    key={acc.hex}
                    onClick={() => setBrandAccent(acc.hex)}
                    style={{
                      backgroundColor: acc.hex
                    }}
                    className={`w-6 h-6 rounded-full hover:scale-110 active:scale-95 transition-all ${
                      brandAccent === acc.hex ? 'ring-2 ring-offset-2 ring-text ring-offset-surface' : ''
                    }`}
                    title={acc.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="text-[10px] text-muted mt-4 leading-relaxed p-3 border border-border/50 rounded-lg bg-bg/30">
              💡 Background adjustments and metadata will save with page drafts and publish automatically in the schema outputs.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
