import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

const toPascal = (name: string) =>
  name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export const Icon: React.FC<IconProps> = ({ name, className = '' }) => {
  const lucide = (window as any).lucide;
  const iconName = toPascal(name);
  const iconNode = lucide?.icons?.[iconName] || lucide?.[iconName];

  if (!iconNode) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }

  const children = Array.isArray(iconNode)
    ? iconNode.map(([tag, attrs]: [string, Record<string, string>], idx: number) =>
        React.createElement(tag, { ...attrs, key: idx })
      )
    : null;

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
};
