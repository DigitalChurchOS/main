import React from 'react';
import { ChristoSection } from '../components/ChristoSection';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoHero } from '../components/ChristoHero';

export interface ChristoHomePageProps {
  data?: {
    title: string;
    sections: {
      id?: string;
      title?: string;
      blocks: {
        id?: string;
        type: string;
        properties: any;
      }[];
    }[];
  };
}

export const ChristoHomePage: React.FC<ChristoHomePageProps> = ({ data }) => {
  if (!data) return React.createElement('div', { className: 'text-center py-8' }, 'No Page Data');

  // Find a featured or hero block to render at the top
  const heroBlock = data.sections?.[0]?.blocks?.find(b => b.type === 'hero');
  const otherSections = data.sections || [];

  return React.createElement(
    'div',
    { className: 'space-y-10 py-4 animate-fade-in' },
    
    // Top Hero block
    heroBlock ? React.createElement(ChristoHero, {
      heading: heroBlock.properties?.heading || data.title || 'Welcome',
      subheading: heroBlock.properties?.subheading,
      actionCta: heroBlock.properties?.actionCta,
      backgroundImageUrl: heroBlock.properties?.backgroundImageUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1600'
    }) : React.createElement(ChristoHero, {
      heading: data.title || 'Welcome to Our Church',
      subheading: 'A community of grace, fellowship, and love.',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1600'
    }),

    // Sections
    otherSections.map((section, idx) => {
      // If the first section was only a hero, skip rendering duplicate title
      if (idx === 0 && heroBlock && section.blocks.length === 1) return null;

      // Filter out hero blocks from regular section listing
      const displayBlocks = section.blocks.filter(b => b.type !== 'hero');
      if (displayBlocks.length === 0 && !section.title) return null;

      return React.createElement(
        ChristoSection,
        {
          key: section.id || idx,
          title: section.title,
          withBlobs: idx % 2 === 1
        },
        React.createElement(
          'div',
          { className: 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' },
          displayBlocks.map((block, bIdx) => {
            return React.createElement(
              ChristoCard,
              {
                key: block.id || bIdx,
                highlighted: bIdx === 0
              },
              React.createElement('h4', { className: 'text-base font-bold text-[var(--christo-text)] mb-2 capitalize' }, block.properties?.title || block.type),
              React.createElement(
                'p',
                { className: 'text-xs text-[var(--christo-muted)] mb-4' },
                block.properties?.description || block.properties?.story || block.properties?.text || 'Explore this section to learn more.'
              ),
              block.properties?.actionCta && React.createElement(
                'a',
                {
                  href: block.properties.actionCta.url,
                  className: 'text-xs font-bold text-[var(--christo-accent-strong)] hover:underline'
                },
                block.properties.actionCta.label || 'Learn More →'
              )
            );
          })
        )
      );
    })
  );
};
