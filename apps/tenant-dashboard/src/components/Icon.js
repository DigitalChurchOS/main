import React from 'react';
const toPascal = (name) => name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
export const Icon = ({ name, className = '' }) => {
    const lucide = window.lucide;
    const iconName = toPascal(name);
    const iconNode = lucide?.icons?.[iconName] || lucide?.[iconName];
    if (!iconNode) {
        return (React.createElement("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
            React.createElement("circle", { cx: "12", cy: "12", r: "9" })));
    }
    const children = Array.isArray(iconNode)
        ? iconNode.map(([tag, attrs], idx) => React.createElement(tag, { ...attrs, key: idx }))
        : null;
    return (React.createElement("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, children));
};
