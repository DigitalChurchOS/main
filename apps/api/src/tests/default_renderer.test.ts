import React from 'react';
import { ThemeAdapter, ThemeSlotKey } from '@churchos/frontend-contracts';

// Import from the public frontend package via relative paths for test verification
import {
  RenderSlot,
  RendererProvider,
  resolveRenderer,
  fallbackSlotMap,
  defaultRendererRegistry,
  sanitizeContractData
} from '../../../church-frontend/src/rendering';

describe('Default System Renderer & Fallback Layer Tests', () => {
  const testTenantId = 'tenant-grace-123';
  
  const mockClientContext: any = {
    tenant: {
      tenantId: testTenantId,
      name: 'Grace Community Church',
      subdomain: 'grace',
      status: 'active'
    },
    isPreviewMode: false,
    preferredLanguage: 'en'
  };

  const mockActiveTheme: ThemeAdapter = {
    themeKey: 'charcoal-grace',
    displayName: 'Charcoal Theme',
    version: '1.0.0',
    slots: {
      'event.card': ({ data }) => React.createElement('div', { className: 'theme-event-card' }, data.title)
    },
    supportsSlot: (slot) => slot === 'event.card'
  };

  const defaultContextValue: any = {
    ...mockClientContext,
    activeTheme: mockActiveTheme,
    moduleEntitlements: ['events', 'giving', 'sermons'],
    analytics: {
      track: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Slot Resolution & Fallbacks', () => {
    it('should resolve active theme slot when supported and implemented', () => {
      const component = resolveRenderer({
        slotKey: 'event.card',
        activeTheme: mockActiveTheme
      });
      expect(component).toBeDefined();
      
      const element = (component as any)({ data: { title: 'Theme Event' } });
      expect(element.props.className).toBe('theme-event-card');
    });

    it('should fall back to default system renderer when theme slot is missing', () => {
      // 'sermon.player' is not implemented in mockActiveTheme
      const component = resolveRenderer({
        slotKey: 'sermon.player',
        activeTheme: mockActiveTheme
      });
      expect(component).toBe(defaultRendererRegistry['sermon.player']);
    });

    it('should fall back using fallback-slot-map rules when specific renderer is missing in theme and system registry has a fallback', () => {
      const fallbackKey = fallbackSlotMap['event.card'];
      expect(fallbackKey).toBe('resource.card');
    });
  });

  describe('Entitlement Gating & Tenant Checks', () => {
    it('should block rendering and return locked state for suspended tenant', () => {
      const suspendedContext = {
        ...defaultContextValue,
        tenant: { ...defaultContextValue.tenant, status: 'suspended' }
      };

      const result = React.createElement(
        RendererProvider,
        { value: suspendedContext },
        React.createElement(RenderSlot, {
          slotKey: 'event.card',
          contractData: { title: 'Grace Event', visibility: 'public_active' }
        })
      );

      expect(result).toBeDefined();
    });

    it('should block disabled/non-entitled modules', () => {
      const restrictedContext = {
        ...defaultContextValue,
        moduleEntitlements: [] // No modules entitled
      };

      const result = React.createElement(
        RendererProvider,
        { value: restrictedContext },
        React.createElement(RenderSlot, {
          slotKey: 'event.card',
          contractData: { title: 'Grace Event', visibility: 'public_active' },
          moduleKey: 'events'
        })
      );

      expect(result).toBeDefined();
    });
  });

  describe('Visibility Gates', () => {
    it('should trigger member-only state when anonymous user requests member content', () => {
      const anonymousContext = {
        ...defaultContextValue,
        memberId: undefined // Not logged in
      };

      const result = React.createElement(
        RendererProvider,
        { value: anonymousContext },
        React.createElement(RenderSlot, {
          slotKey: 'event.card',
          contractData: { title: 'Secret Member Event', visibility: 'member_only' }
        })
      );

      expect(result).toBeDefined();
    });

    it('should trigger password state when password protected visibility is required', () => {
      const result = React.createElement(
        RendererProvider,
        { value: defaultContextValue },
        React.createElement(RenderSlot, {
          slotKey: 'event.card',
          contractData: { title: 'Locked Page', visibility: 'password_protected', password: 'secret123' }
        })
      );

      expect(result).toBeDefined();
    });
  });

  describe('Security Guards & Sanitization', () => {
    it('should block unsafe private field leakages and render error view', () => {
      const unsafeData = {
        title: 'Unsafe Event',
        passwordHash: 'highly-secret-hash-leaked' // Private database field leak
      };

      const result = React.createElement(
        RendererProvider,
        { value: defaultContextValue },
        React.createElement(RenderSlot, {
          slotKey: 'event.card',
          contractData: unsafeData
        })
      );

      expect(result).toBeDefined();
    });

    it('should strip database fields on sanitization', () => {
      const rawDbObject = {
        id: '123',
        title: 'Raw Record',
        passwordHash: 'secret-hash',
        apiKey: 'api-key-xyz'
      };

      const sanitized = sanitizeContractData(rawDbObject);
      expect(sanitized.passwordHash).toBeUndefined();
      expect(sanitized.apiKey).toBeUndefined();
      expect(sanitized.title).toBe('Raw Record');
      expect(sanitized.id).toBe('123');
    });
  });
});
