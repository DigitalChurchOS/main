import React, { useState, useEffect, useRef } from 'react';
import { ElementSchema, DeviceType } from '../types.js';
import { compileStyles } from '../utils.js';
import { InlineTextEditor } from './InlineTextEditor.js';
import { Icon } from './Icon.js';

interface CanvasProps {
  elements: ElementSchema[];
  activeDevice: DeviceType;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updater: (el: ElementSchema) => Partial<ElementSchema>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onAddElement: (schema: any, targetId: string, position: 'above' | 'below' | 'inside') => void;
  onMoveElement: (sourceId: string, targetId: string, position: 'above' | 'below' | 'inside') => void;
  canvasBg?: string;
  canvasThemeMode: 'dark' | 'light';
}

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  activeDevice,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onAddElement,
  onMoveElement,
  canvasBg,
  canvasThemeMode
}) => {
  const [dropIndicator, setDropIndicator] = useState<{
    targetId: string;
    position: 'above' | 'below' | 'inside';
  } | null>(null);

  // Resize state for legacy columns
  const handleColumnResize = (
    colId: string,
    newRatio: number,
    siblingId: string,
    newSiblingRatio: number
  ) => {
    onUpdateElement(colId, () => ({ props: { ratio: newRatio } }));
    onUpdateElement(siblingId, () => ({ props: { ratio: newSiblingRatio } }));
  };

  // Get active viewport dimensions
  const getDeviceWidth = () => {
    switch (activeDevice) {
      case 'laptop': return '1024px';
      case 'tablet': return '768px';
      case 'mobile': return '375px';
      default: return '100%';
    }
  };

  const getDeviceHeight = () => {
    switch (activeDevice) {
      case 'mobile': return '760px';
      case 'tablet': return '1024px';
      default: return '100%';
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const jsonData = e.dataTransfer.getData('application/json');
    const sourceId = e.dataTransfer.getData('text/plain');

    if (elements.length === 0) {
      if (jsonData) {
        const schema = JSON.parse(jsonData);
        // Add at root
        onAddElement(schema, 'root', 'inside');
      } else if (sourceId) {
        // Move to root
        onMoveElement(sourceId, 'root', 'inside');
      }
    }
    setDropIndicator(null);
  };

  return (
    <div 
      className="flex-1 flex flex-col items-center justify-start overflow-y-auto p-6 select-none bg-bg thin-scroll transition-colors duration-200"
      onClick={() => onSelectElement(null)}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      style={{ position: 'relative' }}
    >
      {/* Device Bezel Simulator wrapper */}
      <div
        style={{
          width: getDeviceWidth(),
          height: getDeviceHeight(),
          minHeight: activeDevice === 'desktop' ? 'calc(100vh - 120px)' : 'auto',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'var(--surface)',
          boxShadow: '0 18px 45px -28px rgba(0, 0, 0, 0.35)',
          border: activeDevice !== 'desktop' ? '12px solid var(--border-color)' : '1px solid var(--border-color)',
          borderRadius: activeDevice !== 'desktop' ? '28px' : '16px',
          position: 'relative'
        }}
        className={`flex flex-col ${canvasThemeMode === 'light' ? 'canvas-theme-light' : 'canvas-theme-dark'}`}
      >
        {/* Device Notch / Camera for Mobile & Tablet */}
        {activeDevice !== 'desktop' && (
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '18px',
            background: 'var(--border-color)',
            borderBottomLeftRadius: '10px',
            borderBottomRightRadius: '10px',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', marginRight: '6px' }}></div>
            <div style={{ width: '30px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }}></div>
          </div>
        )}

        {/* Inner Canvas Area */}
        <div 
          className="flex-1 p-6 relative w-full h-full overflow-y-auto overflow-x-hidden thin-scroll"
          style={{ 
            minHeight: '100%', 
            borderRadius: activeDevice !== 'desktop' ? '16px' : '0px',
            backgroundColor: canvasBg || 'var(--surface)'
          }}
        >
          {elements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-2xl text-muted hover:text-text hover:border-accent transition-colors">
              <Icon name="download-cloud" className="w-12 h-12 mb-3 text-accent opacity-40" />
              <p className="text-sm font-bold">Drag blocks from the left sidebar here</p>
              <p className="text-xs text-muted mt-1">Start by dropping a Flex Container or Row/Columns grid</p>
            </div>
          ) : (
            elements.map(el => (
              <CanvasNode
                key={el.id}
                el={el}
                activeDevice={activeDevice}
                selectedElementId={selectedElementId}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                onDuplicateElement={onDuplicateElement}
                onAddElement={onAddElement}
                onMoveElement={onMoveElement}
                onColumnResize={handleColumnResize}
                dropIndicator={dropIndicator}
                setDropIndicator={setDropIndicator}
                parentChildren={elements}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Recursive Canvas Node Component
// ==========================================
interface CanvasNodeProps {
  el: ElementSchema;
  activeDevice: DeviceType;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updater: (el: ElementSchema) => Partial<ElementSchema>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onAddElement: (schema: any, targetId: string, position: 'above' | 'below' | 'inside') => void;
  onMoveElement: (sourceId: string, targetId: string, position: 'above' | 'below' | 'inside') => void;
  onColumnResize: (colId: string, newRatio: number, siblingId: string, newSiblingRatio: number) => void;
  dropIndicator: { targetId: string; position: 'above' | 'below' | 'inside' } | null;
  setDropIndicator: (ind: { targetId: string; position: 'above' | 'below' | 'inside' } | null) => void;
  parentChildren: ElementSchema[];
}

const CanvasNode: React.FC<CanvasNodeProps> = ({
  el,
  activeDevice,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onAddElement,
  onMoveElement,
  onColumnResize,
  dropIndicator,
  setDropIndicator,
  parentChildren
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [activeTabIdx, setActiveTabIdx] = useState(el.props.activeTabIdx || 0);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const tabsLength = Array.isArray(el.props.tabs) ? el.props.tabs.length : 0;
    if (tabsLength > 0 && activeTabIdx > tabsLength - 1) {
      setActiveTabIdx(tabsLength - 1);
    }
  }, [el.props.tabs, activeTabIdx]);

  // Sync accordion collapsible state
  const [accordionOpenIdx, setAccordionOpenIdx] = useState<number | null>(0);

  const isSelected = selectedElementId === el.id;

  const style = compileStyles(el.styles, activeDevice);

  // Determine tag display text
  const getBadgeLabel = () => {
    switch (el.type) {
      case 'flexbox': return 'Section';
      case 'legacy_grid': return 'Row/Grid (Legacy)';
      case 'column': return `Column (${el.props.ratio}%)`;
      case 'dynamic_church_block': return 'Dynamic Church Block';
      default: return el.type;
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', el.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!nodeRef.current) return;
    const rect = nodeRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;

    // Containers: inside drop is allowed
    const isContainer = ['flexbox', 'column', 'legacy_grid', 'tabs'].includes(el.type);

    let position: 'above' | 'below' | 'inside' = 'below';

    if (relativeY < rect.height * 0.25) {
      position = 'above';
    } else if (relativeY > rect.height * 0.75) {
      position = 'below';
    } else if (isContainer) {
      position = 'inside';
    } else {
      // For leaf nodes, determine above or below based on split line
      position = relativeY < rect.height / 2 ? 'above' : 'below';
    }

    // Do not drop inside itself
    if (dropIndicator?.targetId !== el.id || dropIndicator?.position !== position) {
      setDropIndicator({ targetId: el.id, position });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we are leaving this target
    setDropIndicator(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const jsonData = e.dataTransfer.getData('application/json');
    const sourceId = e.dataTransfer.getData('text/plain');

    const position = dropIndicator?.position || 'below';

    if (jsonData) {
      // Adding new element
      const schema = JSON.parse(jsonData);
      onAddElement(schema, el.id, position);
    } else if (sourceId && sourceId !== el.id) {
      // Reordering element
      onMoveElement(sourceId, el.id, position);
    }

    setDropIndicator(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectElement(el.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (['heading', 'paragraph'].includes(el.type)) {
      setIsEditingText(true);
    }
  };

  const handleTextChange = (newVal: string) => {
    onUpdateElement(el.id, () => ({ props: { ...el.props, text: newVal } }));
  };

  // Drag column divider handler
  const startColumnResize = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const gridEl = nodeRef.current;
    if (!gridEl) return;

    const rect = gridEl.getBoundingClientRect();
    const colLeft = el.children[colIndex];
    const colRight = el.children[colIndex + 1];

    if (!colLeft || !colRight) return;

    const startLeftRatio = colLeft.props.ratio || 50;
    const startRightRatio = colRight.props.ratio || 50;
    const totalRatio = startLeftRatio + startRightRatio;

    const startX = e.clientX;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaRatio = (deltaX / rect.width) * 100;

      let newLeftRatio = Math.round(startLeftRatio + deltaRatio);
      let newRightRatio = Math.round(startRightRatio - deltaRatio);

      // Clamping between 10% and 90%
      if (newLeftRatio < 10) {
        newLeftRatio = 10;
        newRightRatio = totalRatio - 10;
      }
      if (newRightRatio < 10) {
        newRightRatio = 10;
        newLeftRatio = totalRatio - 10;
      }

      onColumnResize(colLeft.id, newLeftRatio, colRight.id, newRightRatio);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Render helpers for specific widgets
  const renderLeafElement = () => {
    switch (el.type) {
      case 'heading': {
        const Tag = el.props.level || 'h2';
        if (isEditingText) {
          return (
            <InlineTextEditor
              text={el.props.text || 'Heading'}
              onChange={handleTextChange}
              onBlur={() => setIsEditingText(false)}
              tagName={Tag}
              style={style}
            />
          );
        }
        return React.createElement(Tag, { style }, el.props.text || 'Heading');
      }

      case 'paragraph': {
        if (isEditingText) {
          return (
            <InlineTextEditor
              text={el.props.text || 'Paragraph text...'}
              onChange={handleTextChange}
              onBlur={() => setIsEditingText(false)}
              tagName="p"
              style={style}
            />
          );
        }
        return <p style={style} dangerouslySetInnerHTML={{ __html: el.props.text || 'Paragraph text...' }} />;
      }

      case 'button': {
        return (
          <a
            href={el.props.url || '#'}
            onClick={(e) => e.preventDefault()} // block link inside builder
            style={{ display: 'inline-block', ...style }}
            className="hover:opacity-90 active:scale-95 transition-all text-center"
          >
            {el.props.text || 'Button'}
          </a>
        );
      }

      case 'image': {
        const hoverClass = el.props.enableHoverZoom ? 'hover:scale-105 transition-transform duration-300' : '';
        return (
          <div style={{ overflow: 'hidden', ...style }}>
            <img
              src={el.props.src}
              alt={el.props.alt || ''}
              className={`w-full h-auto block ${hoverClass}`}
              style={{ borderRadius: style.borderRadius || 'inherit' }}
            />
          </div>
        );
      }

      case 'video': {
        if (el.props.provider === 'youtube') {
          // Extract video ID
          const ytMatch = el.props.src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          const ytId = ytMatch ? ytMatch[1] : 'dQw4w9WgXcQ';
          return (
            <div style={style} className="aspect-video relative bg-black">
              <iframe
                title="Youtube embed"
                src={`https://www.youtube.com/embed/${ytId}`}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
              ></iframe>
            </div>
          );
        } else if (el.props.provider === 'vimeo') {
          const vimMatch = el.props.src.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
          const vimId = vimMatch ? vimMatch[3] : '76979871';
          return (
            <div style={style} className="aspect-video relative bg-black">
              <iframe
                title="Vimeo embed"
                src={`https://player.vimeo.com/video/${vimId}`}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
              ></iframe>
            </div>
          );
        } else {
          return (
            <video
              src={el.props.src}
              controls
              style={style}
              className="bg-black"
            />
          );
        }
      }

      case 'accordion': {
        const items = el.props.items || [];
        return (
          <div style={style} className="divide-y divide-slate-200">
            {items.map((item: any, idx: number) => {
              const isOpen = accordionOpenIdx === idx;
              return (
                <div key={idx} className="py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setAccordionOpenIdx(isOpen ? null : idx); }}
                    className="w-full flex items-center justify-between text-left font-medium text-slate-900 py-1 hover:text-blue-700 transition-colors"
                  >
                    <span>{item.title}</span>
                    <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="w-4 h-4 text-slate-400" />
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? '200px' : '0px',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className="text-sm text-slate-600 mt-2 pl-1 leading-relaxed"
                  >
                    {item.content}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'countdown': {
        const targetStr = el.props.targetDate;
        const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0, expired: false });

        useEffect(() => {
          const calculateTime = () => {
            const diff = +new Date(targetStr) - +new Date();
            if (diff <= 0) {
              setTimeLeft(prev => ({ ...prev, expired: true }));
              return;
            }
            setTimeLeft({
              days: Math.floor(diff / (1000 * 60 * 60 * 24)),
              hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
              mins: Math.floor((diff / 1000 / 60) % 60),
              secs: Math.floor((diff / 1000) % 60),
              expired: false
            });
          };

          calculateTime();
          const timer = setInterval(calculateTime, 1000);
          return () => clearInterval(timer);
        }, [targetStr]);

        if (timeLeft.expired) {
          if (el.props.onExpire === 'hide') return null;
          if (el.props.onExpire === 'redirect') {
            return (
              <div style={style} className="text-center p-4 border border-rose-500/20 bg-rose-950/10 rounded-lg text-rose-400 text-xs">
                ⚠️ Timer Expired. Page will redirect to: <code className="bg-black/30 px-1 py-0.5 rounded">{el.props.expireRedirect || '#'}</code>
              </div>
            );
          }
          return (
            <div style={style} className="text-center p-4 font-semibold text-rose-400 border border-slate-800 rounded-lg bg-black/20">
              {el.props.expireText || 'Offer has ended!'}
            </div>
          );
        }

        const blocks = [
          { label: 'Days', val: timeLeft.days },
          { label: 'Hours', val: timeLeft.hours },
          { label: 'Mins', val: timeLeft.mins },
          { label: 'Secs', val: timeLeft.secs }
        ];

        return (
          <div style={style} className="flex gap-4 justify-center items-center">
            {blocks.map((b, i) => (
              <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-white border border-slate-200 min-w-[64px] shadow-sm font-sans">
                <span className="text-2xl font-bold text-slate-950 font-mono leading-none">{String(b.val).padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1.5">{b.label}</span>
              </div>
            ))}
          </div>
        );
      }

      case 'dynamic_church_block': {
        const fields = Array.isArray(el.props.fields) ? el.props.fields : [];
        return (
          <div style={style} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1">
                  {el.props.module || 'Digital Church OS'}
                </span>
                <h3 className="text-base font-semibold text-slate-950 mt-3">{el.props.blockName || 'Dynamic Church Block'}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{el.props.action || 'Connect this block to a tenant-scoped module data source.'}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-950 text-white flex items-center justify-center shrink-0">
                <Icon name="database-zap" className="w-5 h-5" />
              </div>
            </div>

            {fields.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {fields.map((field: string) => (
                  <span key={field} className="text-[10px] text-slate-600 bg-white border border-slate-200 rounded px-2 py-1">
                    {field}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }

      default:
        return <div className="text-xs text-red-400 p-2 border border-red-500/20 bg-red-950/10 rounded">Unknown Block Type: {el.type}</div>;
    }
  };

  return (
    <div
      ref={nodeRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        transition: 'border-color 0.2s, outline-color 0.2s',
        cursor: isSelected ? 'default' : 'pointer',
        minWidth: 0
      }}
      className={`
        canvas-node-wrapper
        group/node
        ${isSelected ? 'outline-2 outline-blue-600 outline-solid' : 'hover:outline-1 hover:outline-blue-500/50 hover:outline-dashed'}
        ${dropIndicator?.targetId === el.id && dropIndicator?.position === 'above' ? 'border-t-4 border-t-blue-600' : ''}
        ${dropIndicator?.targetId === el.id && dropIndicator?.position === 'below' ? 'border-b-4 border-b-blue-600' : ''}
        ${dropIndicator?.targetId === el.id && dropIndicator?.position === 'inside' ? 'bg-blue-50 border-2 border-blue-500/50' : ''}
      `}
    >
      {/* Floating Outline Badge Tag */}
      {!isEditingText && (
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '0px',
            fontSize: '9px',
            fontWeight: 700,
            background: isSelected ? '#2563eb' : '#111827',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: '4px 4px 0 0',
            zIndex: 40,
            pointerEvents: 'none',
            display: 'none'
          }}
          className="group-hover/node:block group-focus-within/node:block"
        >
          {getBadgeLabel()}
        </div>
      )}

      {/* Floating Controls Overlay (Active Element Only) */}
      {isSelected && !isEditingText && (
        <div
          style={{
            position: 'absolute',
            top: '-28px',
            right: '0px',
            display: 'flex',
            gap: '2px',
            background: '#111827',
            borderRadius: '4px 4px 0 0',
            padding: '2px',
            zIndex: 45
          }}
        >
          <div
            draggable
            onDragStart={handleDragStart}
            style={{ padding: '2px 4px', cursor: 'grab' }}
            title="Drag to Reorder"
            className="text-white hover:bg-slate-700 rounded"
          >
            <Icon name="move" className="w-3 h-3" />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicateElement(el.id); }}
            style={{ padding: '2px 4px' }}
            title="Duplicate"
            className="text-white hover:bg-slate-700 rounded"
          >
            <Icon name="copy" className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
            style={{ padding: '2px 4px' }}
            title="Delete"
            className="text-white hover:bg-slate-700 rounded font-bold"
          >
            <Icon name="trash-2" className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* -------------------- RENDER LOGIC -------------------- */}

      {/* A. Container Elements with Child Canvases */}
      {el.type === 'flexbox' && (
        <div style={style}>
          {el.children.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 text-xs text-slate-500 border border-dashed border-slate-300 rounded bg-slate-50">
              Empty section. Drop blocks here.
            </div>
          ) : (
            el.children.map(child => (
              <CanvasNode
                key={child.id}
                el={child}
                activeDevice={activeDevice}
                selectedElementId={selectedElementId}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                onDuplicateElement={onDuplicateElement}
                onAddElement={onAddElement}
                onMoveElement={onMoveElement}
                onColumnResize={onColumnResize}
                dropIndicator={dropIndicator}
                setDropIndicator={setDropIndicator}
                parentChildren={el.children}
              />
            ))
          )}
        </div>
      )}

      {el.type === 'legacy_grid' && (
        <div
          style={{
            ...style,
            display: 'grid',
            gridTemplateColumns: el.children.map(c => `${c.props.ratio || 50}fr`).join(' '),
            position: 'relative'
          }}
        >
          {el.children.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-xs text-slate-500 border border-dashed border-slate-300 rounded bg-slate-50 w-full">
              Empty Grid Row
            </div>
          ) : (
            el.children.map((col, idx) => (
              <React.Fragment key={col.id}>
                {/* Column Node Render */}
                <CanvasNode
                  el={col}
                  activeDevice={activeDevice}
                  selectedElementId={selectedElementId}
                  onSelectElement={onSelectElement}
                  onUpdateElement={onUpdateElement}
                  onDeleteElement={onDeleteElement}
                  onDuplicateElement={onDuplicateElement}
                  onAddElement={onAddElement}
                  onMoveElement={onMoveElement}
                  onColumnResize={onColumnResize}
                  dropIndicator={dropIndicator}
                  setDropIndicator={setDropIndicator}
                  parentChildren={el.children}
                />

                {/* Draggable Resizer Line between this column and next */}
                {idx < el.children.length - 1 && (
                  <div
                    onMouseDown={(e) => startColumnResize(e, idx)}
                    style={{
                      position: 'absolute',
                      left: `calc(${el.children.slice(0, idx + 1).reduce((sum, c) => sum + (c.props.ratio || 50), 0)}% - 6px)`,
                      top: 0,
                      bottom: 0,
                      width: '12px',
                      cursor: 'col-resize',
                      zIndex: 35
                    }}
                    className="group/resizer flex justify-center items-center"
                  >
                    <div className="w-[2px] h-10 bg-slate-300 group-hover/resizer:bg-blue-600 group-hover/resizer:w-[4px] rounded transition-all"></div>
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      )}

      {el.type === 'column' && (
        <div style={style}>
          {el.children.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 text-[10px] text-slate-500 border border-dashed border-slate-300 rounded bg-slate-50">
              Empty Column
            </div>
          ) : (
            el.children.map(child => (
              <CanvasNode
                key={child.id}
                el={child}
                activeDevice={activeDevice}
                selectedElementId={selectedElementId}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                onDuplicateElement={onDuplicateElement}
                onAddElement={onAddElement}
                onMoveElement={onMoveElement}
                onColumnResize={onColumnResize}
                dropIndicator={dropIndicator}
                setDropIndicator={setDropIndicator}
                parentChildren={el.children}
              />
            ))
          )}
        </div>
      )}

      {el.type === 'tabs' && (
        <div style={style}>
          {/* Tab Selection Headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
            {(el.props.tabs || []).map((tabName: string, idx: number) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setActiveTabIdx(idx); }}
                className={`py-2 px-4 text-xs font-semibold hover:text-blue-700 transition-colors border-b-2 ${
                  activeTabIdx === idx ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>

          {/* Sub-canvas for Selected Tab Panel */}
          {el.children && el.children.length > 0 ? (
            <div className="mt-2">
              {el.children
                .filter((child: any) => child.props.index === activeTabIdx)
                .map((activeTabChild: any) => (
                  <CanvasNode
                    key={activeTabChild.id}
                    el={activeTabChild}
                    activeDevice={activeDevice}
                    selectedElementId={selectedElementId}
                    onSelectElement={onSelectElement}
                    onUpdateElement={onUpdateElement}
                    onDeleteElement={onDeleteElement}
                    onDuplicateElement={onDuplicateElement}
                    onAddElement={onAddElement}
                    onMoveElement={onMoveElement}
                    onColumnResize={onColumnResize}
                    dropIndicator={dropIndicator}
                    setDropIndicator={setDropIndicator}
                    parentChildren={el.children}
                  />
                ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded bg-slate-50">
              Empty Tabs Sub-canvas
            </div>
          )}
        </div>
      )}

      {/* B. Leaf / Widget Elements */}
      {!['flexbox', 'legacy_grid', 'column', 'tabs'].includes(el.type) && renderLeafElement()}
    </div>
  );
};
