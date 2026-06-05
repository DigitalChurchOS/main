import React, { useState } from 'react';
import { ElementSchema, DeviceType } from '../types';
import { Icon } from './Icon.js';

interface InspectorRightProps {
  selectedElement: ElementSchema | null;
  activeDevice: DeviceType;
  onUpdateElement: (updater: (el: ElementSchema) => Partial<ElementSchema>) => void;
}

export const InspectorRight: React.FC<InspectorRightProps> = ({
  selectedElement,
  activeDevice,
  onUpdateElement
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'styling'>('general');
  const [linkMargin, setLinkMargin] = useState(false);
  const [linkPadding, setLinkPadding] = useState(false);

  // Accordion state for Styling sections
  const [openSections, setOpenSections] = useState({
    spacing: true,
    sizing: true,
    flex: true,
    typography: true,
    design: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!selectedElement) {
    return (
      <aside className="sidebar flex flex-col justify-center items-center text-center p-6 text-sm bg-sidebar border-l border-border transition-colors">
        <Icon name="sliders" className="w-12 h-12 mb-4 text-accent opacity-40" />
        <p className="text-muted">Select an element on the canvas to inspect and edit its properties.</p>
      </aside>
    );
  }

  const deviceStyles = selectedElement.styles?.[activeDevice] || {};

  const updateStyle = (key: string, value: string) => {
    onUpdateElement((el) => {
      const currentDeviceStyles = el.styles?.[activeDevice] || {};
      const updatedStyles = {
        ...(el.styles || {}),
        [activeDevice]: {
          ...currentDeviceStyles,
          [key]: value
        }
      };
      return { styles: updatedStyles };
    });
  };

  const updateProp = (key: string, value: any) => {
    onUpdateElement((el) => {
      const updatedProps = {
        ...el.props,
        [key]: value
      };
      return { props: updatedProps };
    });
  };

  const getStyleVal = (key: string, fallback = '') => {
    return deviceStyles[key] || '';
  };

  // Helper for margin/padding parsing
  const getBoxVal = (prefix: string, side: string) => {
    const raw = getStyleVal(`${prefix}${side}`);
    return raw ? parseInt(raw, 10) : '';
  };

  const handleBoxChange = (prefix: string, side: string, value: string) => {
    const unitValue = value === '' ? '' : `${value}px`;
    if (prefix === 'margin' && linkMargin) {
      updateStyle('marginTop', unitValue);
      updateStyle('marginRight', unitValue);
      updateStyle('marginBottom', unitValue);
      updateStyle('marginLeft', unitValue);
    } else if (prefix === 'padding' && linkPadding) {
      updateStyle('paddingTop', unitValue);
      updateStyle('paddingRight', unitValue);
      updateStyle('paddingBottom', unitValue);
      updateStyle('paddingLeft', unitValue);
    } else {
      updateStyle(`${prefix}${side}`, unitValue);
    }
  };

  const fontOptions = ['Inter', 'Outfit', 'Roboto', 'Playfair Display', 'JetBrains Mono', 'system-ui'];
  const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;

  const updateTabs = (tabs: string[], children = selectedElement.children) => {
    onUpdateElement((el) => ({
      props: {
        ...el.props,
        tabs,
        activeTabIdx: Math.min(el.props.activeTabIdx || 0, Math.max(tabs.length - 1, 0))
      },
      children
    }));
  };

  const renameTab = (idx: number, title: string) => {
    const tabs = [...(selectedElement.props.tabs || [])];
    tabs[idx] = title;
    updateTabs(tabs);
  };

  const addTab = () => {
    const tabs = [...(selectedElement.props.tabs || []), `Tab ${(selectedElement.props.tabs || []).length + 1}`];
    const nextIndex = tabs.length - 1;
    const child = {
      id: makeId('tab_panel'),
      type: 'flexbox',
      props: { index: nextIndex },
      styles: { desktop: { padding: '16px', minHeight: '80px', borderStyle: 'dashed', borderWidth: '1px', borderColor: 'var(--border-color-raw)' } },
      children: []
    };
    updateTabs(tabs, [...(selectedElement.children || []), child]);
  };

  const removeTab = (idx: number) => {
    const tabs = (selectedElement.props.tabs || []).filter((_: string, tabIdx: number) => tabIdx !== idx);
    const children = (selectedElement.children || [])
      .filter(child => child.props.index !== idx)
      .map(child => ({
        ...child,
        props: {
          ...child.props,
          index: child.props.index > idx ? child.props.index - 1 : child.props.index
        }
      }));
    updateTabs(tabs, children);
  };

  const updateAccordionItems = (items: { title: string; content: string }[]) => {
    updateProp('items', items);
  };

  const updateAccordionItem = (idx: number, key: 'title' | 'content', value: string) => {
    const items = [...(selectedElement.props.items || [])];
    items[idx] = { ...(items[idx] || { title: '', content: '' }), [key]: value };
    updateAccordionItems(items);
  };

  const addAccordionItem = () => {
    updateAccordionItems([...(selectedElement.props.items || []), { title: `Item ${(selectedElement.props.items || []).length + 1}`, content: 'Add content here.' }]);
  };

  const removeAccordionItem = (idx: number) => {
    updateAccordionItems((selectedElement.props.items || []).filter((_: unknown, itemIdx: number) => itemIdx !== idx));
  };

  return (
    <aside className="sidebar thin-scroll select-none bg-sidebar border-l border-border transition-colors overflow-y-auto">
      
      {/* 1. Header Tabs */}
      <div className="flex bg-bg p-1 rounded-xl border border-border/40 mb-4 transition-colors">
        <button
          onClick={() => setActiveTab('general')}
          style={{
            background: activeTab === 'general' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'general' ? '#ffffff' : 'var(--text-muted)'
          }}
          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center transition-all"
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('styling')}
          style={{
            background: activeTab === 'styling' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'styling' ? '#ffffff' : 'var(--text-muted)'
          }}
          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center transition-all"
        >
          Styling
        </button>
      </div>

      <div className="text-[10px] uppercase tracking-wider text-accent font-bold mb-3">
        Selected: <span className="text-text font-mono bg-accent/10 border border-accent/20 px-2 py-0.5 rounded capitalize">{selectedElement.type.replace('_', ' ')}</span>
      </div>

      {/* ========================================== */}
      {/* A. STYLING TAB PANEL (COLLAPSIBLE ACCORDIONS) */}
      {/* ========================================== */}
      {activeTab === 'styling' ? (
        <div className="stack gap-2.5">
          
          {/* Section 1: Spacing */}
          <div className="rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors">
            <button
              onClick={() => toggleSection('spacing')}
              className="w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20"
            >
              <div className="flex items-center gap-2">
                <Icon name="layout" className="w-3.5 h-3.5 text-accent" />
                <span>Spacing (Margin & Padding)</span>
              </div>
              <Icon name={openSections.spacing ? "chevron-up" : "chevron-down"} className="w-3.5 h-3.5 text-muted" />
            </button>
            
            {openSections.spacing && (
              <div className="p-3 bg-surface flex flex-col gap-3">
                {/* Margins */}
                <div className="border border-dashed border-border rounded-lg p-2.5 bg-bg/25">
                  <div className="flex justify-between items-center text-[9px] text-muted mb-1.5">
                    <span>MARGIN (px)</span>
                    <span onClick={() => setLinkMargin(!linkMargin)} className="cursor-pointer hover:text-accent font-semibold flex items-center gap-1">
                      🔗 {linkMargin ? 'Linked' : 'Link All'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    <label className="text-[9px] text-muted font-bold">T <input type="number" className="form-control btn-sm mt-0.5" style={{ padding: '4px' }} value={getBoxVal('margin', 'Top')} onChange={(e) => handleBoxChange('margin', 'Top', e.target.value)} /></label>
                    <label className="text-[9px] text-muted font-bold">R <input type="number" className="form-control btn-sm mt-0.5" style={{ padding: '4px' }} value={getBoxVal('margin', 'Right')} onChange={(e) => handleBoxChange('margin', 'Right', e.target.value)} /></label>
                    <label className="text-[9px] text-muted font-bold">B <input type="number" className="form-control btn-sm mt-0.5" style={{ padding: '4px' }} value={getBoxVal('margin', 'Bottom')} onChange={(e) => handleBoxChange('margin', 'Bottom', e.target.value)} /></label>
                    <label className="text-[9px] text-muted font-bold">L <input type="number" className="form-control btn-sm mt-0.5" style={{ padding: '4px' }} value={getBoxVal('margin', 'Left')} onChange={(e) => handleBoxChange('margin', 'Left', e.target.value)} /></label>
                  </div>
                </div>

                {/* Paddings */}
                <div className="border border-dashed border-border rounded-lg p-2.5 bg-bg/25">
                  <div className="flex justify-between items-center text-[9px] text-muted mb-1.5">
                    <span>PADDING (px)</span>
                    <span onClick={() => setLinkPadding(!linkPadding)} className="cursor-pointer hover:text-accent font-semibold flex items-center gap-1">
                      🔗 {linkPadding ? 'Linked' : 'Link All'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    <label className="text-[9px] text-muted font-bold">T <input type="number" className="form-control btn-sm mt-0.5" style={{ padding: '4px' }} value={getBoxVal('padding', 'Top')} onChange={(e) => handleBoxChange('padding', 'Top', e.target.value)} /></label>
                    <label className="text-[9px] text-muted font-bold">R <input type="number" className="form-control btn-sm mt-0.5" style={{ padding: '4px' }} value={getBoxVal('padding', 'Right')} onChange={(e) => handleBoxChange('padding', 'Right', e.target.value)} /></label>
                    <label className="text-[9px] text-muted font-bold">B <input type="number" className="form-control btn-sm mt-0.5" style={{ padding: '4px' }} value={getBoxVal('padding', 'Bottom')} onChange={(e) => handleBoxChange('padding', 'Bottom', e.target.value)} /></label>
                    <label className="text-[9px] text-muted font-bold">L <input type="number" className="form-control btn-sm mt-0.5" style={{ padding: '4px' }} value={getBoxVal('padding', 'Left')} onChange={(e) => handleBoxChange('padding', 'Left', e.target.value)} /></label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Size & Dimensions */}
          <div className="rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors">
            <button
              onClick={() => toggleSection('sizing')}
              className="w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20"
            >
              <div className="flex items-center gap-2">
                <Icon name="maximize" className="w-3.5 h-3.5 text-accent" />
                <span>Sizing & Layout</span>
              </div>
              <Icon name={openSections.sizing ? "chevron-up" : "chevron-down"} className="w-3.5 h-3.5 text-muted" />
            </button>
            
            {openSections.sizing && (
              <div className="p-3 bg-surface grid grid-cols-2 gap-3 text-xs">
                <div className="form-group">
                  <label>Width</label>
                  <input type="text" className="form-control btn-sm" value={getStyleVal('width')} placeholder="e.g. 100% or auto" onChange={(e) => updateStyle('width', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Height</label>
                  <input type="text" className="form-control btn-sm" value={getStyleVal('height')} placeholder="e.g. auto" onChange={(e) => updateStyle('height', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Min Height</label>
                  <input type="text" className="form-control btn-sm" value={getStyleVal('minHeight')} placeholder="e.g. 100px" onChange={(e) => updateStyle('minHeight', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Max Width</label>
                  <input type="text" className="form-control btn-sm" value={getStyleVal('maxWidth')} placeholder="e.g. 1200px" onChange={(e) => updateStyle('maxWidth', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Gen 2 Flex alignments */}
          {(selectedElement.type === 'flexbox' || selectedElement.type === 'column') && (
            <div className="rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors">
              <button
                onClick={() => toggleSection('flex')}
                className="w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20"
              >
                <div className="flex items-center gap-2">
                  <Icon name="box" className="w-3.5 h-3.5 text-accent" />
                  <span>Gen 2 Flex Settings</span>
                </div>
                <Icon name={openSections.flex ? "chevron-up" : "chevron-down"} className="w-3.5 h-3.5 text-muted" />
              </button>
              
              {openSections.flex && (
                <div className="p-3 bg-surface flex flex-col gap-3 text-xs">
                  <div className="form-group">
                    <label>Direction</label>
                    <select className="form-control btn-sm" value={getStyleVal('flexDirection', 'row')} onChange={(e) => updateStyle('flexDirection', e.target.value)}>
                      <option value="row">Row (Horizontal)</option>
                      <option value="column">Column (Vertical)</option>
                      <option value="row-reverse">Row Reverse</option>
                      <option value="column-reverse">Column Reverse</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Justify Content</label>
                    <select className="form-control btn-sm" value={getStyleVal('justifyContent', 'flex-start')} onChange={(e) => updateStyle('justifyContent', e.target.value)}>
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                      <option value="space-between">Space Between</option>
                      <option value="space-around">Space Around</option>
                      <option value="space-evenly">Space Evenly</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Align Items</label>
                    <select className="form-control btn-sm" value={getStyleVal('alignItems', 'stretch')} onChange={(e) => updateStyle('alignItems', e.target.value)}>
                      <option value="stretch">Stretch</option>
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                      <option value="baseline">Baseline</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Gap Spacing (px)</label>
                    <input type="number" className="form-control btn-sm" value={getStyleVal('gap') ? parseInt(getStyleVal('gap'), 10) : ''} onChange={(e) => updateStyle('gap', e.target.value ? `${e.target.value}px` : '')} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Typography */}
          {['heading', 'paragraph', 'button'].includes(selectedElement.type) && (
            <div className="rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors">
              <button
                onClick={() => toggleSection('typography')}
                className="w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20"
              >
                <div className="flex items-center gap-2">
                  <Icon name="type" className="w-3.5 h-3.5 text-accent" />
                  <span>Typography</span>
                </div>
                <Icon name={openSections.typography ? "chevron-up" : "chevron-down"} className="w-3.5 h-3.5 text-muted" />
              </button>
              
              {openSections.typography && (
                <div className="p-3 bg-surface flex flex-col gap-3 text-xs">
                  <div className="form-group">
                    <label>Font Family</label>
                    <select className="form-control btn-sm" value={getStyleVal('fontFamily')} onChange={(e) => updateStyle('fontFamily', e.target.value)}>
                      <option value="">Default Theme</option>
                      {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Font Size</label>
                      <input type="text" className="form-control btn-sm" value={getStyleVal('fontSize')} placeholder="e.g. 16px" onChange={(e) => updateStyle('fontSize', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Font Weight</label>
                      <input type="text" className="form-control btn-sm" value={getStyleVal('fontWeight')} placeholder="e.g. 500" onChange={(e) => updateStyle('fontWeight', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Text Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" className="form-control btn-sm animate-none" style={{ width: '40px', padding: '0', height: '34px', cursor: 'pointer' }} value={getStyleVal('color') || '#ffffff'} onChange={(e) => updateStyle('color', e.target.value)} />
                      <input type="text" className="form-control btn-sm font-mono" style={{ flex: 1 }} value={getStyleVal('color')} placeholder="#ffffff" onChange={(e) => updateStyle('color', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Alignment</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                      {['left', 'center', 'right', 'justify'].map(align => (
                        <button
                          key={align}
                          onClick={() => updateStyle('textAlign', align)}
                          className={`btn btn-sm capitalize ${getStyleVal('textAlign') === align ? 'bg-accent text-white shadow' : 'bg-surface-soft text-muted hover:text-text'}`}
                          style={{ fontSize: '10px', padding: '6px 2px' }}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 5: Design & Effects */}
          <div className="rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors">
            <button
              onClick={() => toggleSection('design')}
              className="w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20"
            >
              <div className="flex items-center gap-2">
                <Icon name="palette" className="w-3.5 h-3.5 text-accent" />
                <span>Design & Effects</span>
              </div>
              <Icon name={openSections.design ? "chevron-up" : "chevron-down"} className="w-3.5 h-3.5 text-muted" />
            </button>
            
            {openSections.design && (
              <div className="p-3 bg-surface flex flex-col gap-3 text-xs">
                {/* Background Color */}
                <div className="form-group">
                  <label>Background Color</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" className="form-control btn-sm animate-none" style={{ width: '40px', padding: '0', height: '34px', cursor: 'pointer' }} value={getStyleVal('backgroundColor') || '#11131a'} onChange={(e) => updateStyle('backgroundColor', e.target.value)} />
                    <input type="text" className="form-control btn-sm font-mono" style={{ flex: 1 }} value={getStyleVal('backgroundColor')} placeholder="transparent" onChange={(e) => updateStyle('backgroundColor', e.target.value)} />
                  </div>
                </div>

                {/* Borders */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Border Style</label>
                    <select className="form-control btn-sm" value={getStyleVal('borderStyle', 'none')} onChange={(e) => updateStyle('borderStyle', e.target.value)}>
                      <option value="none">None</option>
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Border Radius</label>
                    <input type="text" className="form-control btn-sm" value={getStyleVal('borderRadius')} placeholder="e.g. 8px" onChange={(e) => updateStyle('borderRadius', e.target.value)} />
                  </div>
                </div>

                {/* Border Details */}
                {getStyleVal('borderStyle') !== 'none' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Border Width</label>
                      <input type="text" className="form-control btn-sm" value={getStyleVal('borderWidth')} placeholder="1px" onChange={(e) => updateStyle('borderWidth', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Border Color</label>
                      <input type="text" className="form-control btn-sm" value={getStyleVal('borderColor')} placeholder="#cbd5e1" onChange={(e) => updateStyle('borderColor', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Opacity */}
                <div className="form-group">
                  <label>Opacity ({getStyleVal('opacity') || '1'})</label>
                  <input type="range" min="0" max="1" step="0.05" className="w-full accent-accent bg-bg h-1 mt-1 cursor-pointer" value={getStyleVal('opacity') || '1'} onChange={(e) => updateStyle('opacity', e.target.value)} />
                </div>
              </div>
            )}
          </div>

        </div>
      ) : (
        // ==========================================
        // B. GENERAL PROPERTIES TAB PANEL (Functional attributes)
        // ==========================================
        <div className="stack gap-4">
          <div className="p-4 rounded-xl border border-border bg-surface shadow-sm transition-colors">
            <span className="text-[10px] font-bold text-muted display-block mb-3 text-transform uppercase tracking-wider">Content</span>

            {selectedElement.type === 'heading' && (
              <div className="form-group">
                <label>Title Text</label>
                <textarea
                  className="form-control btn-sm"
                  style={{ minHeight: '92px', resize: 'vertical' }}
                  value={selectedElement.props.text || ''}
                  onChange={(e) => updateProp('text', e.target.value)}
                  placeholder="Enter the page or section title"
                />
              </div>
            )}

            {selectedElement.type === 'paragraph' && (
              <div className="form-group">
                <label>Description Text</label>
                <textarea
                  className="form-control btn-sm"
                  style={{ minHeight: '140px', resize: 'vertical' }}
                  value={selectedElement.props.text || ''}
                  onChange={(e) => updateProp('text', e.target.value)}
                  placeholder="Enter paragraph, description, announcement, or supporting copy"
                />
              </div>
            )}

            {selectedElement.type === 'button' && (
              <>
                <div className="form-group">
                  <label>Button Label</label>
                  <input
                    type="text"
                    className="form-control btn-sm"
                    value={selectedElement.props.text || ''}
                    onChange={(e) => updateProp('text', e.target.value)}
                    placeholder="Plan a Visit"
                  />
                </div>
                <div className="form-group">
                  <label>Button Link</label>
                  <input
                    type="text"
                    className="form-control btn-sm font-mono"
                    value={selectedElement.props.url || ''}
                    onChange={(e) => updateProp('url', e.target.value)}
                    placeholder="/services"
                  />
                </div>
              </>
            )}

            {selectedElement.type === 'dynamic_church_block' && (
              <>
                <div className="form-group">
                  <label>Source Module</label>
                  <input type="text" className="form-control btn-sm" value={selectedElement.props.module || ''} onChange={(e) => updateProp('module', e.target.value)} placeholder="Prayer & Testimony" />
                </div>
                <div className="form-group">
                  <label>Block Name</label>
                  <input type="text" className="form-control btn-sm" value={selectedElement.props.blockName || ''} onChange={(e) => updateProp('blockName', e.target.value)} placeholder="Prayer Wall" />
                </div>
                <div className="form-group">
                  <label>Block Action</label>
                  <textarea className="form-control btn-sm" style={{ minHeight: '90px', resize: 'vertical' }} value={selectedElement.props.action || ''} onChange={(e) => updateProp('action', e.target.value)} placeholder="Describe what this dynamic church block should render" />
                </div>
                <div className="form-group">
                  <label>Configured Fields</label>
                  <textarea
                    className="form-control btn-sm font-mono"
                    style={{ minHeight: '90px', resize: 'vertical' }}
                    value={Array.isArray(selectedElement.props.fields) ? selectedElement.props.fields.join(', ') : ''}
                    onChange={(e) => updateProp('fields', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
                    placeholder="title, date, location, registration"
                  />
                </div>
              </>
            )}

            {selectedElement.type === 'image' && (
              <>
                <div className="form-group">
                  <label>Image Source URL</label>
                  <input type="text" className="form-control btn-sm font-mono" value={selectedElement.props.src || ''} onChange={(e) => updateProp('src', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Alt Text</label>
                  <input type="text" className="form-control btn-sm" value={selectedElement.props.alt || ''} onChange={(e) => updateProp('alt', e.target.value)} />
                </div>
              </>
            )}

            {selectedElement.type === 'tabs' && (
              <div className="stack gap-3">
                {(selectedElement.props.tabs || []).map((tab: string, idx: number) => (
                  <div key={`${tab}-${idx}`} className="p-3 rounded-lg border border-border bg-bg/30">
                    <div className="form-group">
                      <label>Tab {idx + 1} Title</label>
                      <input
                        type="text"
                        className="form-control btn-sm"
                        value={tab}
                        onChange={(e) => renameTab(idx, e.target.value)}
                        placeholder="Overview"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm bg-surface-soft text-muted hover:text-text border border-border"
                      onClick={() => removeTab(idx)}
                      disabled={(selectedElement.props.tabs || []).length <= 1}
                    >
                      Remove Tab
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-primary" onClick={addTab}>
                  Add Tab
                </button>
              </div>
            )}

            {selectedElement.type === 'accordion' && (
              <div className="stack gap-3">
                {(selectedElement.props.items || []).map((item: { title: string; content: string }, idx: number) => (
                  <div key={`${item.title}-${idx}`} className="p-3 rounded-lg border border-border bg-bg/30">
                    <div className="form-group">
                      <label>Accordion {idx + 1} Title</label>
                      <input
                        type="text"
                        className="form-control btn-sm"
                        value={item.title || ''}
                        onChange={(e) => updateAccordionItem(idx, 'title', e.target.value)}
                        placeholder="Question or section title"
                      />
                    </div>
                    <div className="form-group">
                      <label>Accordion {idx + 1} Content</label>
                      <textarea
                        className="form-control btn-sm"
                        style={{ minHeight: '90px', resize: 'vertical' }}
                        value={item.content || ''}
                        onChange={(e) => updateAccordionItem(idx, 'content', e.target.value)}
                        placeholder="Answer or panel content"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm bg-surface-soft text-muted hover:text-text border border-border"
                      onClick={() => removeAccordionItem(idx)}
                      disabled={(selectedElement.props.items || []).length <= 1}
                    >
                      Remove Item
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-primary" onClick={addAccordionItem}>
                  Add Accordion Item
                </button>
              </div>
            )}

            {!['heading', 'paragraph', 'button', 'dynamic_church_block', 'image', 'tabs', 'accordion'].includes(selectedElement.type) && (
              <p className="text-xs text-muted leading-relaxed">This block does not have primary text content. Use Element Attributes below for its functional settings.</p>
            )}
          </div>
          
          <div className="p-4 rounded-xl border border-border bg-surface shadow-sm transition-colors">
            <span className="text-[10px] font-bold text-muted display-block mb-3 text-transform uppercase tracking-wider">Element Attributes</span>
            
            {/* Inline attributes config based on type */}
            {selectedElement.type === 'heading' && (
              <div className="form-group">
                <label>Heading Level</label>
                <select className="form-control btn-sm" value={selectedElement.props.level || 'h2'} onChange={(e) => updateProp('level', e.target.value)}>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="h4">Heading 4</option>
                </select>
              </div>
            )}

            {selectedElement.type === 'button' && (
              <p className="text-xs text-muted leading-relaxed">Button text and destination are available in the Content panel above.</p>
            )}

            {selectedElement.type === 'image' && (
              <>
                <div className="form-group">
                  <label>Image Source URL</label>
                  <input type="text" className="form-control btn-sm font-mono" value={selectedElement.props.src || ''} onChange={(e) => updateProp('src', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Alt Text</label>
                  <input type="text" className="form-control btn-sm" value={selectedElement.props.alt || ''} onChange={(e) => updateProp('alt', e.target.value)} />
                </div>
                <div className="form-group flex flex-row items-center gap-2 mt-2">
                  <input type="checkbox" id="hoverZoom" style={{ width: 'auto', cursor: 'pointer' }} checked={selectedElement.props.enableHoverZoom || false} onChange={(e) => updateProp('enableHoverZoom', e.target.checked)} />
                  <label htmlFor="hoverZoom" style={{ marginBottom: '0', cursor: 'pointer', textTransform: 'none', color: 'var(--text)', fontSize: '11px' }}>Enable Hover Zoom</label>
                </div>
              </>
            )}

            {selectedElement.type === 'video' && (
              <>
                <div className="form-group">
                  <label>Video Stream Source URL</label>
                  <input type="text" className="form-control btn-sm font-mono" value={selectedElement.props.src || ''} onChange={(e) => updateProp('src', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Video Provider</label>
                  <select className="form-control btn-sm" value={selectedElement.props.provider || 'html5'} onChange={(e) => updateProp('provider', e.target.value)}>
                    <option value="html5">HTML5 (Native MP4)</option>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                  </select>
                </div>
              </>
            )}

            {selectedElement.type === 'countdown' && (
              <>
                <div className="form-group">
                  <label>Target Date Picker (ISO)</label>
                  <input type="datetime-local" className="form-control btn-sm" value={selectedElement.props.targetDate ? selectedElement.props.targetDate.substring(0, 16) : ''} onChange={(e) => updateProp('targetDate', new Date(e.target.value).toISOString())} />
                </div>
                <div className="form-group">
                  <label>Expired Action</label>
                  <select className="form-control btn-sm" value={selectedElement.props.onExpire || 'show_text'} onChange={(e) => updateProp('onExpire', e.target.value)}>
                    <option value="show_text">Display Message</option>
                    <option value="hide">Hide Element</option>
                    <option value="redirect">Redirect Visitor</option>
                  </select>
                </div>
                {selectedElement.props.onExpire === 'show_text' && (
                  <div className="form-group">
                    <label>Expiration Text</label>
                    <input type="text" className="form-control btn-sm" value={selectedElement.props.expireText || ''} onChange={(e) => updateProp('expireText', e.target.value)} />
                  </div>
                )}
                {selectedElement.props.onExpire === 'redirect' && (
                  <div className="form-group">
                    <label>Redirect URL</label>
                    <input type="text" className="form-control btn-sm font-mono" value={selectedElement.props.expireRedirect || ''} onChange={(e) => updateProp('expireRedirect', e.target.value)} />
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      )}

    </aside>
  );
};
