import React, { useRef, useEffect } from 'react';
export const InlineTextEditor = ({ text, onChange, onBlur, tagName, style, className }) => {
    const elementRef = useRef(null);
    useEffect(() => {
        if (elementRef.current && elementRef.current.innerHTML !== text) {
            elementRef.current.innerHTML = text;
        }
    }, [text]);
    const handleInput = () => {
        if (elementRef.current) {
            onChange(elementRef.current.innerHTML);
        }
    };
    const format = (command, value = '') => {
        document.execCommand(command, false, value);
        handleInput();
    };
    const promptLink = async () => {
        const showSystemPrompt = window.showSystemPrompt;
        const url = showSystemPrompt
            ? await showSystemPrompt('Enter link URL (e.g. https://example.com):', 'https://')
            : prompt('Enter link URL (e.g. https://example.com):', 'https://');
        if (url) {
            format('createLink', url);
        }
    };
    const Tag = tagName;
    return (React.createElement("div", { style: { position: 'relative', width: '100%' }, className: "group" },
        React.createElement("div", { style: {
                position: 'absolute',
                top: '-40px',
                left: '0',
                display: 'flex',
                gap: '4px',
                background: '#1a1c24',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px',
                zIndex: 50,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                opacity: 0,
                pointerEvents: 'none',
                transition: 'opacity 0.2s'
            }, className: "group-focus-within:opacity-100 group-focus-within:pointer-events-auto" },
            React.createElement("button", { onMouseDown: (e) => { e.preventDefault(); format('bold'); }, style: { padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer' }, title: "Bold" }, "B"),
            React.createElement("button", { onMouseDown: (e) => { e.preventDefault(); format('italic'); }, style: { padding: '4px 8px', fontSize: '11px', fontStyle: 'italic', background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer' }, title: "Italic" }, "I"),
            React.createElement("button", { onMouseDown: (e) => { e.preventDefault(); format('underline'); }, style: { padding: '4px 8px', fontSize: '11px', textDecoration: 'underline', background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer' }, title: "Underline" }, "U"),
            React.createElement("button", { onMouseDown: (e) => { e.preventDefault(); promptLink(); }, style: { padding: '4px 8px', fontSize: '11px', background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center' }, title: "Link" }, "\uD83D\uDD17 Link")),
        React.createElement(Tag, { ref: elementRef, contentEditable: true, suppressContentEditableWarning: true, onInput: handleInput, onBlur: onBlur, style: {
                outline: 'none',
                border: '1px dashed transparent',
                minWidth: '20px',
                ...style
            }, className: `${className} focus:border-indigo-500/50 focus:bg-indigo-950/10 rounded` })));
};
