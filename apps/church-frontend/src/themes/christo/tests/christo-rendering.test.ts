import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { RendererProvider, RenderSlot } from '../../../rendering';
import { christoTheme } from '../christo.adapter';

const testRender = (element: any) => {
  return ReactDOMServer.renderToString(element);
};

describe('Christo Theme Slot Rendering tests', () => {
  const baseContext: any = {
    tenant: { tenantId: 'tenant-1', name: 'Grace Fellowship', subdomain: 'grace-fellowship', status: 'active' },
    moduleEntitlements: ['events-management', 'giving-tithes', 'sermons-media', 'livestream-broadcasting', 'prayer-testimony', 'lms-courses', 'member-portal'],
    activeTheme: christoTheme,
    themeSettings: {
      accentPreset: 'deep-purple',
      edgeStyle: 'soft'
    },
    requestUrl: 'http://localhost/church',
    isPreviewMode: false
  };

  it('should render Christo Event Card cleanly without crashing', () => {
    const eventCardData = {
      id: 'event-1',
      title: 'Sunday Worship Service',
      description: 'Join us for corporate worship',
      startDate: '2026-06-07T09:00:00Z',
      location: 'Main Chapel',
      cta: { label: 'Register', url: '/events/1' }
    };

    const rendered = testRender(
      React.createElement(
        RendererProvider,
        {
          value: baseContext,
          children: React.createElement(RenderSlot, {
            slotKey: 'event.card',
            contractData: eventCardData,
            moduleKey: 'events-management'
          })
        }
      )
    );

    expect(rendered).toContain('Sunday Worship Service');
    expect(rendered).toContain('Main Chapel');
    expect(rendered).toContain('Register');
  });

  it('should render Christo Giving Form cleanly', () => {
    const rendered = testRender(
      React.createElement(
        RendererProvider,
        {
          value: baseContext,
          children: React.createElement(RenderSlot, {
            slotKey: 'giving.form',
            contractData: {},
            moduleKey: 'giving-tithes'
          })
        }
      )
    );

    expect(rendered).toContain('Giving Fund Destination');
    expect(rendered).toContain('Confirm Donation');
  });

  it('should render plugin slots using Christo plugin wrappers', () => {
    const pluginCardData = {
      title: 'Giving Booster Extension',
      summary: 'Increase your tithing efficiency.',
      cta: { label: 'Activate', url: '/boost' }
    };

    // RenderPluginSlot is resolved dynamically in resolvePluginRenderer.ts which checks activeTheme.slots
    const Component = (christoTheme.slots as any)['mock-plugin.card'];
    expect(Component).toBeDefined();

    const rendered = testRender(
      React.createElement(Component, {
        data: pluginCardData,
        context: baseContext
      })
    );

    expect(rendered).toContain('Giving Booster Extension');
    expect(rendered).toContain('Activate');
  });
});
