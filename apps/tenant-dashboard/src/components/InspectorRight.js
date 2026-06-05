import React, { useState } from 'react';
import { Icon } from './Icon.js';
export const InspectorRight = ({ selectedElement, activeDevice, onUpdateElement }) => {
    const [activeTab, setActiveTab] = useState('general');
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
    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    if (!selectedElement) {
        return (React.createElement("aside", { className: "sidebar flex flex-col justify-center items-center text-center p-6 text-sm bg-sidebar border-l border-border transition-colors" },
            React.createElement(Icon, { name: "sliders", className: "w-12 h-12 mb-4 text-accent opacity-40" }),
            React.createElement("p", { className: "text-muted" }, "Select an element on the canvas to inspect and edit its properties.")));
    }
    const deviceStyles = selectedElement.styles?.[activeDevice] || {};
    const updateStyle = (key, value) => {
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
    const updateProp = (key, value) => {
        onUpdateElement((el) => {
            const updatedProps = {
                ...el.props,
                [key]: value
            };
            return { props: updatedProps };
        });
    };
    const getStyleVal = (key, fallback = '') => {
        return deviceStyles[key] || '';
    };
    // Helper for margin/padding parsing
    const getBoxVal = (prefix, side) => {
        const raw = getStyleVal(`${prefix}${side}`);
        return raw ? parseInt(raw, 10) : '';
    };
    const handleBoxChange = (prefix, side, value) => {
        const unitValue = value === '' ? '' : `${value}px`;
        if (prefix === 'margin' && linkMargin) {
            updateStyle('marginTop', unitValue);
            updateStyle('marginRight', unitValue);
            updateStyle('marginBottom', unitValue);
            updateStyle('marginLeft', unitValue);
        }
        else if (prefix === 'padding' && linkPadding) {
            updateStyle('paddingTop', unitValue);
            updateStyle('paddingRight', unitValue);
            updateStyle('paddingBottom', unitValue);
            updateStyle('paddingLeft', unitValue);
        }
        else {
            updateStyle(`${prefix}${side}`, unitValue);
        }
    };
    const fontOptions = ['Inter', 'Outfit', 'Roboto', 'Playfair Display', 'JetBrains Mono', 'system-ui'];
    const makeId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;
    const updateTabs = (tabs, children = selectedElement.children) => {
        onUpdateElement((el) => ({
            props: {
                ...el.props,
                tabs,
                activeTabIdx: Math.min(el.props.activeTabIdx || 0, Math.max(tabs.length - 1, 0))
            },
            children
        }));
    };
    const renameTab = (idx, title) => {
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
    const removeTab = (idx) => {
        const tabs = (selectedElement.props.tabs || []).filter((_, tabIdx) => tabIdx !== idx);
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
    const updateAccordionItems = (items) => {
        updateProp('items', items);
    };
    const updateAccordionItem = (idx, key, value) => {
        const items = [...(selectedElement.props.items || [])];
        items[idx] = { ...(items[idx] || { title: '', content: '' }), [key]: value };
        updateAccordionItems(items);
    };
    const addAccordionItem = () => {
        updateAccordionItems([...(selectedElement.props.items || []), { title: `Item ${(selectedElement.props.items || []).length + 1}`, content: 'Add content here.' }]);
    };
    const removeAccordionItem = (idx) => {
        updateAccordionItems((selectedElement.props.items || []).filter((_, itemIdx) => itemIdx !== idx));
    };
    return (React.createElement("aside", { className: "sidebar thin-scroll select-none bg-sidebar border-l border-border transition-colors overflow-y-auto" },
        React.createElement("div", { className: "flex bg-bg p-1 rounded-xl border border-border/40 mb-4 transition-colors" },
            React.createElement("button", { onClick: () => setActiveTab('general'), style: {
                    background: activeTab === 'general' ? 'var(--accent)' : 'transparent',
                    color: activeTab === 'general' ? '#ffffff' : 'var(--text-muted)'
                }, className: "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center transition-all" }, "General"),
            React.createElement("button", { onClick: () => setActiveTab('styling'), style: {
                    background: activeTab === 'styling' ? 'var(--accent)' : 'transparent',
                    color: activeTab === 'styling' ? '#ffffff' : 'var(--text-muted)'
                }, className: "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center transition-all" }, "Styling")),
        React.createElement("div", { className: "text-[10px] uppercase tracking-wider text-accent font-bold mb-3" },
            "Selected: ",
            React.createElement("span", { className: "text-text font-mono bg-accent/10 border border-accent/20 px-2 py-0.5 rounded capitalize" }, selectedElement.type.replace('_', ' '))),
        activeTab === 'styling' ? (React.createElement("div", { className: "stack gap-2.5" },
            React.createElement("div", { className: "rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors" },
                React.createElement("button", { onClick: () => toggleSection('spacing'), className: "w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(Icon, { name: "layout", className: "w-3.5 h-3.5 text-accent" }),
                        React.createElement("span", null, "Spacing (Margin & Padding)")),
                    React.createElement(Icon, { name: openSections.spacing ? "chevron-up" : "chevron-down", className: "w-3.5 h-3.5 text-muted" })),
                openSections.spacing && (React.createElement("div", { className: "p-3 bg-surface flex flex-col gap-3" },
                    React.createElement("div", { className: "border border-dashed border-border rounded-lg p-2.5 bg-bg/25" },
                        React.createElement("div", { className: "flex justify-between items-center text-[9px] text-muted mb-1.5" },
                            React.createElement("span", null, "MARGIN (px)"),
                            React.createElement("span", { onClick: () => setLinkMargin(!linkMargin), className: "cursor-pointer hover:text-accent font-semibold flex items-center gap-1" },
                                "\uD83D\uDD17 ",
                                linkMargin ? 'Linked' : 'Link All')),
                        React.createElement("div", { className: "grid grid-cols-4 gap-1.5 text-xs" },
                            React.createElement("label", { className: "text-[9px] text-muted font-bold" },
                                "T ",
                                React.createElement("input", { type: "number", className: "form-control btn-sm mt-0.5", style: { padding: '4px' }, value: getBoxVal('margin', 'Top'), onChange: (e) => handleBoxChange('margin', 'Top', e.target.value) })),
                            React.createElement("label", { className: "text-[9px] text-muted font-bold" },
                                "R ",
                                React.createElement("input", { type: "number", className: "form-control btn-sm mt-0.5", style: { padding: '4px' }, value: getBoxVal('margin', 'Right'), onChange: (e) => handleBoxChange('margin', 'Right', e.target.value) })),
                            React.createElement("label", { className: "text-[9px] text-muted font-bold" },
                                "B ",
                                React.createElement("input", { type: "number", className: "form-control btn-sm mt-0.5", style: { padding: '4px' }, value: getBoxVal('margin', 'Bottom'), onChange: (e) => handleBoxChange('margin', 'Bottom', e.target.value) })),
                            React.createElement("label", { className: "text-[9px] text-muted font-bold" },
                                "L ",
                                React.createElement("input", { type: "number", className: "form-control btn-sm mt-0.5", style: { padding: '4px' }, value: getBoxVal('margin', 'Left'), onChange: (e) => handleBoxChange('margin', 'Left', e.target.value) })))),
                    React.createElement("div", { className: "border border-dashed border-border rounded-lg p-2.5 bg-bg/25" },
                        React.createElement("div", { className: "flex justify-between items-center text-[9px] text-muted mb-1.5" },
                            React.createElement("span", null, "PADDING (px)"),
                            React.createElement("span", { onClick: () => setLinkPadding(!linkPadding), className: "cursor-pointer hover:text-accent font-semibold flex items-center gap-1" },
                                "\uD83D\uDD17 ",
                                linkPadding ? 'Linked' : 'Link All')),
                        React.createElement("div", { className: "grid grid-cols-4 gap-1.5 text-xs" },
                            React.createElement("label", { className: "text-[9px] text-muted font-bold" },
                                "T ",
                                React.createElement("input", { type: "number", className: "form-control btn-sm mt-0.5", style: { padding: '4px' }, value: getBoxVal('padding', 'Top'), onChange: (e) => handleBoxChange('padding', 'Top', e.target.value) })),
                            React.createElement("label", { className: "text-[9px] text-muted font-bold" },
                                "R ",
                                React.createElement("input", { type: "number", className: "form-control btn-sm mt-0.5", style: { padding: '4px' }, value: getBoxVal('padding', 'Right'), onChange: (e) => handleBoxChange('padding', 'Right', e.target.value) })),
                            React.createElement("label", { className: "text-[9px] text-muted font-bold" },
                                "B ",
                                React.createElement("input", { type: "number", className: "form-control btn-sm mt-0.5", style: { padding: '4px' }, value: getBoxVal('padding', 'Bottom'), onChange: (e) => handleBoxChange('padding', 'Bottom', e.target.value) })),
                            React.createElement("label", { className: "text-[9px] text-muted font-bold" },
                                "L ",
                                React.createElement("input", { type: "number", className: "form-control btn-sm mt-0.5", style: { padding: '4px' }, value: getBoxVal('padding', 'Left'), onChange: (e) => handleBoxChange('padding', 'Left', e.target.value) }))))))),
            React.createElement("div", { className: "rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors" },
                React.createElement("button", { onClick: () => toggleSection('sizing'), className: "w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(Icon, { name: "maximize", className: "w-3.5 h-3.5 text-accent" }),
                        React.createElement("span", null, "Sizing & Layout")),
                    React.createElement(Icon, { name: openSections.sizing ? "chevron-up" : "chevron-down", className: "w-3.5 h-3.5 text-muted" })),
                openSections.sizing && (React.createElement("div", { className: "p-3 bg-surface grid grid-cols-2 gap-3 text-xs" },
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Width"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: getStyleVal('width'), placeholder: "e.g. 100% or auto", onChange: (e) => updateStyle('width', e.target.value) })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Height"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: getStyleVal('height'), placeholder: "e.g. auto", onChange: (e) => updateStyle('height', e.target.value) })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Min Height"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: getStyleVal('minHeight'), placeholder: "e.g. 100px", onChange: (e) => updateStyle('minHeight', e.target.value) })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Max Width"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: getStyleVal('maxWidth'), placeholder: "e.g. 1200px", onChange: (e) => updateStyle('maxWidth', e.target.value) }))))),
            (selectedElement.type === 'flexbox' || selectedElement.type === 'column') && (React.createElement("div", { className: "rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors" },
                React.createElement("button", { onClick: () => toggleSection('flex'), className: "w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(Icon, { name: "box", className: "w-3.5 h-3.5 text-accent" }),
                        React.createElement("span", null, "Gen 2 Flex Settings")),
                    React.createElement(Icon, { name: openSections.flex ? "chevron-up" : "chevron-down", className: "w-3.5 h-3.5 text-muted" })),
                openSections.flex && (React.createElement("div", { className: "p-3 bg-surface flex flex-col gap-3 text-xs" },
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Direction"),
                        React.createElement("select", { className: "form-control btn-sm", value: getStyleVal('flexDirection', 'row'), onChange: (e) => updateStyle('flexDirection', e.target.value) },
                            React.createElement("option", { value: "row" }, "Row (Horizontal)"),
                            React.createElement("option", { value: "column" }, "Column (Vertical)"),
                            React.createElement("option", { value: "row-reverse" }, "Row Reverse"),
                            React.createElement("option", { value: "column-reverse" }, "Column Reverse"))),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Justify Content"),
                        React.createElement("select", { className: "form-control btn-sm", value: getStyleVal('justifyContent', 'flex-start'), onChange: (e) => updateStyle('justifyContent', e.target.value) },
                            React.createElement("option", { value: "flex-start" }, "Start"),
                            React.createElement("option", { value: "center" }, "Center"),
                            React.createElement("option", { value: "flex-end" }, "End"),
                            React.createElement("option", { value: "space-between" }, "Space Between"),
                            React.createElement("option", { value: "space-around" }, "Space Around"),
                            React.createElement("option", { value: "space-evenly" }, "Space Evenly"))),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Align Items"),
                        React.createElement("select", { className: "form-control btn-sm", value: getStyleVal('alignItems', 'stretch'), onChange: (e) => updateStyle('alignItems', e.target.value) },
                            React.createElement("option", { value: "stretch" }, "Stretch"),
                            React.createElement("option", { value: "flex-start" }, "Start"),
                            React.createElement("option", { value: "center" }, "Center"),
                            React.createElement("option", { value: "flex-end" }, "End"),
                            React.createElement("option", { value: "baseline" }, "Baseline"))),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Gap Spacing (px)"),
                        React.createElement("input", { type: "number", className: "form-control btn-sm", value: getStyleVal('gap') ? parseInt(getStyleVal('gap'), 10) : '', onChange: (e) => updateStyle('gap', e.target.value ? `${e.target.value}px` : '') })))))),
            ['heading', 'paragraph', 'button'].includes(selectedElement.type) && (React.createElement("div", { className: "rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors" },
                React.createElement("button", { onClick: () => toggleSection('typography'), className: "w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(Icon, { name: "type", className: "w-3.5 h-3.5 text-accent" }),
                        React.createElement("span", null, "Typography")),
                    React.createElement(Icon, { name: openSections.typography ? "chevron-up" : "chevron-down", className: "w-3.5 h-3.5 text-muted" })),
                openSections.typography && (React.createElement("div", { className: "p-3 bg-surface flex flex-col gap-3 text-xs" },
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Font Family"),
                        React.createElement("select", { className: "form-control btn-sm", value: getStyleVal('fontFamily'), onChange: (e) => updateStyle('fontFamily', e.target.value) },
                            React.createElement("option", { value: "" }, "Default Theme"),
                            fontOptions.map(font => React.createElement("option", { key: font, value: font }, font)))),
                    React.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } },
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null, "Font Size"),
                            React.createElement("input", { type: "text", className: "form-control btn-sm", value: getStyleVal('fontSize'), placeholder: "e.g. 16px", onChange: (e) => updateStyle('fontSize', e.target.value) })),
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null, "Font Weight"),
                            React.createElement("input", { type: "text", className: "form-control btn-sm", value: getStyleVal('fontWeight'), placeholder: "e.g. 500", onChange: (e) => updateStyle('fontWeight', e.target.value) }))),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Text Color"),
                        React.createElement("div", { style: { display: 'flex', gap: '8px' } },
                            React.createElement("input", { type: "color", className: "form-control btn-sm animate-none", style: { width: '40px', padding: '0', height: '34px', cursor: 'pointer' }, value: getStyleVal('color') || '#ffffff', onChange: (e) => updateStyle('color', e.target.value) }),
                            React.createElement("input", { type: "text", className: "form-control btn-sm font-mono", style: { flex: 1 }, value: getStyleVal('color'), placeholder: "#ffffff", onChange: (e) => updateStyle('color', e.target.value) }))),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Alignment"),
                        React.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' } }, ['left', 'center', 'right', 'justify'].map(align => (React.createElement("button", { key: align, onClick: () => updateStyle('textAlign', align), className: `btn btn-sm capitalize ${getStyleVal('textAlign') === align ? 'bg-accent text-white shadow' : 'bg-surface-soft text-muted hover:text-text'}`, style: { fontSize: '10px', padding: '6px 2px' } }, align))))))))),
            React.createElement("div", { className: "rounded-xl overflow-hidden border border-border bg-surface shadow-sm transition-colors" },
                React.createElement("button", { onClick: () => toggleSection('design'), className: "w-full flex items-center justify-between p-3 font-bold text-xs text-text border-b border-border/40 bg-surface-soft/20" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(Icon, { name: "palette", className: "w-3.5 h-3.5 text-accent" }),
                        React.createElement("span", null, "Design & Effects")),
                    React.createElement(Icon, { name: openSections.design ? "chevron-up" : "chevron-down", className: "w-3.5 h-3.5 text-muted" })),
                openSections.design && (React.createElement("div", { className: "p-3 bg-surface flex flex-col gap-3 text-xs" },
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Background Color"),
                        React.createElement("div", { style: { display: 'flex', gap: '8px' } },
                            React.createElement("input", { type: "color", className: "form-control btn-sm animate-none", style: { width: '40px', padding: '0', height: '34px', cursor: 'pointer' }, value: getStyleVal('backgroundColor') || '#11131a', onChange: (e) => updateStyle('backgroundColor', e.target.value) }),
                            React.createElement("input", { type: "text", className: "form-control btn-sm font-mono", style: { flex: 1 }, value: getStyleVal('backgroundColor'), placeholder: "transparent", onChange: (e) => updateStyle('backgroundColor', e.target.value) }))),
                    React.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } },
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null, "Border Style"),
                            React.createElement("select", { className: "form-control btn-sm", value: getStyleVal('borderStyle', 'none'), onChange: (e) => updateStyle('borderStyle', e.target.value) },
                                React.createElement("option", { value: "none" }, "None"),
                                React.createElement("option", { value: "solid" }, "Solid"),
                                React.createElement("option", { value: "dashed" }, "Dashed"),
                                React.createElement("option", { value: "dotted" }, "Dotted"))),
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null, "Border Radius"),
                            React.createElement("input", { type: "text", className: "form-control btn-sm", value: getStyleVal('borderRadius'), placeholder: "e.g. 8px", onChange: (e) => updateStyle('borderRadius', e.target.value) }))),
                    getStyleVal('borderStyle') !== 'none' && (React.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } },
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null, "Border Width"),
                            React.createElement("input", { type: "text", className: "form-control btn-sm", value: getStyleVal('borderWidth'), placeholder: "1px", onChange: (e) => updateStyle('borderWidth', e.target.value) })),
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null, "Border Color"),
                            React.createElement("input", { type: "text", className: "form-control btn-sm", value: getStyleVal('borderColor'), placeholder: "#cbd5e1", onChange: (e) => updateStyle('borderColor', e.target.value) })))),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null,
                            "Opacity (",
                            getStyleVal('opacity') || '1',
                            ")"),
                        React.createElement("input", { type: "range", min: "0", max: "1", step: "0.05", className: "w-full accent-accent bg-bg h-1 mt-1 cursor-pointer", value: getStyleVal('opacity') || '1', onChange: (e) => updateStyle('opacity', e.target.value) }))))))) : (React.createElement("div", { className: "stack gap-4" },
            React.createElement("div", { className: "p-4 rounded-xl border border-border bg-surface shadow-sm transition-colors" },
                React.createElement("span", { className: "text-[10px] font-bold text-muted display-block mb-3 text-transform uppercase tracking-wider" }, "Content"),
                selectedElement.type === 'heading' && (React.createElement("div", { className: "form-group" },
                    React.createElement("label", null, "Title Text"),
                    React.createElement("textarea", { className: "form-control btn-sm", style: { minHeight: '92px', resize: 'vertical' }, value: selectedElement.props.text || '', onChange: (e) => updateProp('text', e.target.value), placeholder: "Enter the page or section title" }))),
                selectedElement.type === 'paragraph' && (React.createElement("div", { className: "form-group" },
                    React.createElement("label", null, "Description Text"),
                    React.createElement("textarea", { className: "form-control btn-sm", style: { minHeight: '140px', resize: 'vertical' }, value: selectedElement.props.text || '', onChange: (e) => updateProp('text', e.target.value), placeholder: "Enter paragraph, description, announcement, or supporting copy" }))),
                selectedElement.type === 'button' && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Button Label"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: selectedElement.props.text || '', onChange: (e) => updateProp('text', e.target.value), placeholder: "Plan a Visit" })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Button Link"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm font-mono", value: selectedElement.props.url || '', onChange: (e) => updateProp('url', e.target.value), placeholder: "/services" })))),
                selectedElement.type === 'dynamic_church_block' && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Source Module"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: selectedElement.props.module || '', onChange: (e) => updateProp('module', e.target.value), placeholder: "Prayer & Testimony" })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Block Name"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: selectedElement.props.blockName || '', onChange: (e) => updateProp('blockName', e.target.value), placeholder: "Prayer Wall" })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Block Action"),
                        React.createElement("textarea", { className: "form-control btn-sm", style: { minHeight: '90px', resize: 'vertical' }, value: selectedElement.props.action || '', onChange: (e) => updateProp('action', e.target.value), placeholder: "Describe what this dynamic church block should render" })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Configured Fields"),
                        React.createElement("textarea", { className: "form-control btn-sm font-mono", style: { minHeight: '90px', resize: 'vertical' }, value: Array.isArray(selectedElement.props.fields) ? selectedElement.props.fields.join(', ') : '', onChange: (e) => updateProp('fields', e.target.value.split(',').map(v => v.trim()).filter(Boolean)), placeholder: "title, date, location, registration" })))),
                selectedElement.type === 'image' && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Image Source URL"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm font-mono", value: selectedElement.props.src || '', onChange: (e) => updateProp('src', e.target.value) })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Alt Text"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: selectedElement.props.alt || '', onChange: (e) => updateProp('alt', e.target.value) })))),
                selectedElement.type === 'tabs' && (React.createElement("div", { className: "stack gap-3" },
                    (selectedElement.props.tabs || []).map((tab, idx) => (React.createElement("div", { key: `${tab}-${idx}`, className: "p-3 rounded-lg border border-border bg-bg/30" },
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null,
                                "Tab ",
                                idx + 1,
                                " Title"),
                            React.createElement("input", { type: "text", className: "form-control btn-sm", value: tab, onChange: (e) => renameTab(idx, e.target.value), placeholder: "Overview" })),
                        React.createElement("button", { type: "button", className: "btn btn-sm bg-surface-soft text-muted hover:text-text border border-border", onClick: () => removeTab(idx), disabled: (selectedElement.props.tabs || []).length <= 1 }, "Remove Tab")))),
                    React.createElement("button", { type: "button", className: "btn btn-sm btn-primary", onClick: addTab }, "Add Tab"))),
                selectedElement.type === 'accordion' && (React.createElement("div", { className: "stack gap-3" },
                    (selectedElement.props.items || []).map((item, idx) => (React.createElement("div", { key: `${item.title}-${idx}`, className: "p-3 rounded-lg border border-border bg-bg/30" },
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null,
                                "Accordion ",
                                idx + 1,
                                " Title"),
                            React.createElement("input", { type: "text", className: "form-control btn-sm", value: item.title || '', onChange: (e) => updateAccordionItem(idx, 'title', e.target.value), placeholder: "Question or section title" })),
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null,
                                "Accordion ",
                                idx + 1,
                                " Content"),
                            React.createElement("textarea", { className: "form-control btn-sm", style: { minHeight: '90px', resize: 'vertical' }, value: item.content || '', onChange: (e) => updateAccordionItem(idx, 'content', e.target.value), placeholder: "Answer or panel content" })),
                        React.createElement("button", { type: "button", className: "btn btn-sm bg-surface-soft text-muted hover:text-text border border-border", onClick: () => removeAccordionItem(idx), disabled: (selectedElement.props.items || []).length <= 1 }, "Remove Item")))),
                    React.createElement("button", { type: "button", className: "btn btn-sm btn-primary", onClick: addAccordionItem }, "Add Accordion Item"))),
                !['heading', 'paragraph', 'button', 'dynamic_church_block', 'image', 'tabs', 'accordion'].includes(selectedElement.type) && (React.createElement("p", { className: "text-xs text-muted leading-relaxed" }, "This block does not have primary text content. Use Element Attributes below for its functional settings."))),
            React.createElement("div", { className: "p-4 rounded-xl border border-border bg-surface shadow-sm transition-colors" },
                React.createElement("span", { className: "text-[10px] font-bold text-muted display-block mb-3 text-transform uppercase tracking-wider" }, "Element Attributes"),
                selectedElement.type === 'heading' && (React.createElement("div", { className: "form-group" },
                    React.createElement("label", null, "Heading Level"),
                    React.createElement("select", { className: "form-control btn-sm", value: selectedElement.props.level || 'h2', onChange: (e) => updateProp('level', e.target.value) },
                        React.createElement("option", { value: "h1" }, "Heading 1"),
                        React.createElement("option", { value: "h2" }, "Heading 2"),
                        React.createElement("option", { value: "h3" }, "Heading 3"),
                        React.createElement("option", { value: "h4" }, "Heading 4")))),
                selectedElement.type === 'button' && (React.createElement("p", { className: "text-xs text-muted leading-relaxed" }, "Button text and destination are available in the Content panel above.")),
                selectedElement.type === 'image' && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Image Source URL"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm font-mono", value: selectedElement.props.src || '', onChange: (e) => updateProp('src', e.target.value) })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Alt Text"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: selectedElement.props.alt || '', onChange: (e) => updateProp('alt', e.target.value) })),
                    React.createElement("div", { className: "form-group flex flex-row items-center gap-2 mt-2" },
                        React.createElement("input", { type: "checkbox", id: "hoverZoom", style: { width: 'auto', cursor: 'pointer' }, checked: selectedElement.props.enableHoverZoom || false, onChange: (e) => updateProp('enableHoverZoom', e.target.checked) }),
                        React.createElement("label", { htmlFor: "hoverZoom", style: { marginBottom: '0', cursor: 'pointer', textTransform: 'none', color: 'var(--text)', fontSize: '11px' } }, "Enable Hover Zoom")))),
                selectedElement.type === 'video' && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Video Stream Source URL"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm font-mono", value: selectedElement.props.src || '', onChange: (e) => updateProp('src', e.target.value) })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Video Provider"),
                        React.createElement("select", { className: "form-control btn-sm", value: selectedElement.props.provider || 'html5', onChange: (e) => updateProp('provider', e.target.value) },
                            React.createElement("option", { value: "html5" }, "HTML5 (Native MP4)"),
                            React.createElement("option", { value: "youtube" }, "YouTube"),
                            React.createElement("option", { value: "vimeo" }, "Vimeo"))))),
                selectedElement.type === 'countdown' && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Target Date Picker (ISO)"),
                        React.createElement("input", { type: "datetime-local", className: "form-control btn-sm", value: selectedElement.props.targetDate ? selectedElement.props.targetDate.substring(0, 16) : '', onChange: (e) => updateProp('targetDate', new Date(e.target.value).toISOString()) })),
                    React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Expired Action"),
                        React.createElement("select", { className: "form-control btn-sm", value: selectedElement.props.onExpire || 'show_text', onChange: (e) => updateProp('onExpire', e.target.value) },
                            React.createElement("option", { value: "show_text" }, "Display Message"),
                            React.createElement("option", { value: "hide" }, "Hide Element"),
                            React.createElement("option", { value: "redirect" }, "Redirect Visitor"))),
                    selectedElement.props.onExpire === 'show_text' && (React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Expiration Text"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm", value: selectedElement.props.expireText || '', onChange: (e) => updateProp('expireText', e.target.value) }))),
                    selectedElement.props.onExpire === 'redirect' && (React.createElement("div", { className: "form-group" },
                        React.createElement("label", null, "Redirect URL"),
                        React.createElement("input", { type: "text", className: "form-control btn-sm font-mono", value: selectedElement.props.expireRedirect || '', onChange: (e) => updateProp('expireRedirect', e.target.value) }))))))))));
};
