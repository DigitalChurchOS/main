import React, { useState } from 'react';
import {
  PluginSlotKey,
  ClientContextContract,
  pluginRegistry,
  buildPluginPermission,
  VisibilityState
} from '@churchos/frontend-contracts';
import { useRendererContext } from '../core/renderer-context';
import { resolvePluginRenderer } from './resolve-plugin-renderer';
import { runPluginSecurityAudit, sanitizePluginData } from './plugin-renderer-guards';
import { RenderErrorBoundary } from '../core/renderer-errors';
import {
  DefaultPluginUnavailableState,
  DefaultPluginSetupRequiredState,
  DefaultPluginErrorState
} from './default-plugin-renderer';
import { DefaultPasswordState } from '../default-renderers/states/DefaultPasswordState';
import { DefaultMemberOnlyState } from '../default-renderers/states/DefaultMemberOnlyState';

export interface RenderPluginSlotProps {
  slotKey: PluginSlotKey;
  contractData: any;
  pluginKey: string;
  fallbackComponent?: React.ComponentType<any>;
}

export const RenderPluginSlot: React.FC<RenderPluginSlotProps> = ({
  slotKey,
  contractData,
  pluginKey,
  fallbackComponent
}) => {
  const context = useRendererContext();
  const clientContext = context as ClientContextContract & { enabledPlugins?: string[] };

  const [authorizedPassword, setAuthorizedPassword] = useState(false);
  const [failedPasswordAttempt, setFailedPasswordAttempt] = useState(false);

  // 1. Check Tenant Status (Block suspended tenants)
  const tenantStatus = clientContext?.tenant?.status;
  if (tenantStatus === 'suspended') {
    return React.createElement(DefaultPluginUnavailableState, {
      message: 'This church portal is suspended. Plugin features are locked.'
    });
  }

  // 2. Check Plugin Installation
  const manifest = pluginRegistry.getPlugin(pluginKey);
  if (!manifest) {
    return React.createElement(DefaultPluginUnavailableState, {
      message: `Plugin "${pluginKey}" is not installed.`
    });
  }

  // 3. Check Tenant Enablement Status
  const isEnabled = clientContext?.enabledPlugins?.includes(pluginKey);
  if (!isEnabled && !clientContext.isPreviewMode) {
    return React.createElement(DefaultPluginUnavailableState, {
      message: `Plugin "${pluginKey}" is not enabled for this tenant.`
    });
  }

  // 4. Check Plugin Status
  const status = manifest.status;
  if (status === 'suspended') {
    return React.createElement(DefaultPluginUnavailableState, {
      message: `Plugin "${pluginKey}" is suspended.`
    });
  }
  if (status === 'blocked') {
    return React.createElement(DefaultPluginUnavailableState, {
      message: `Plugin "${pluginKey}" is blocked due to security reasons.`
    });
  }
  if (status === 'disabled') {
    return React.createElement(DefaultPluginUnavailableState, {
      message: `Plugin "${pluginKey}" is disabled.`
    });
  }
  if (status === 'incompatible') {
    return React.createElement(DefaultPluginUnavailableState, {
      message: `Plugin "${pluginKey}" is incompatible with the current platform version.`
    });
  }
  if (status === 'pending_setup') {
    return React.createElement(DefaultPluginSetupRequiredState, {
      message: `Plugin "${pluginKey}" requires configuration setup.`
    });
  }

  // 5. Entitlement Rules
  if (manifest.entitlementRules) {
    for (const rule of manifest.entitlementRules) {
      if (rule.minBillingTier && context.tenant?.status !== 'trialing') {
        // E.g. Check billing status
      }
    }
  }

  // 6. Check Plugin Dependency Modules
  if (manifest.requiredModules && context.moduleEntitlements) {
    const missingModule = manifest.requiredModules.find(
      mod => !context.moduleEntitlements.includes(mod)
    );
    if (missingModule && !clientContext.isPreviewMode) {
      return React.createElement(DefaultPluginUnavailableState, {
        message: `Plugin requires the core module "${missingModule}" which is inactive.`
      });
    }
  }

  // 7. Check Required Permissions
  if (manifest.permissions && clientContext.roles) {
    // E.g. Check role permissions if applicable
  }

  // 8. Visibility Rule Gating
  const visibility: VisibilityState = contractData?.visibility || 'public_active';

  // A. Draft Preview Lock
  if (visibility === 'preview_only' && !clientContext.isPreviewMode) {
    return React.createElement(DefaultPluginUnavailableState, {
      message: 'This plugin element contains unpublished details.'
    });
  }

  // B. Member Only Gate
  const isMemberOnly = visibility === 'member_only' || slotKey.includes('.member.');
  const isUserAuthenticated = !!clientContext?.memberId;
  if (isMemberOnly && !isUserAuthenticated) {
    return React.createElement(DefaultMemberOnlyState, {
      message: 'This plugin element is restricted to registered members only.'
    });
  }

  // C. Password Protected Gate
  const isPasswordProtected = visibility === 'password_protected';
  if (isPasswordProtected && !authorizedPassword && !clientContext.isPreviewMode) {
    const expectedPassword = contractData?.password || 'password123';
    return React.createElement(DefaultPasswordState, {
      onSubmitPassword: (pwd) => {
        if (pwd === expectedPassword) {
          setAuthorizedPassword(true);
          setFailedPasswordAttempt(false);
        } else {
          setFailedPasswordAttempt(true);
        }
      },
      incorrectAttempt: failedPasswordAttempt
    });
  }

  // 9. Run Security Audit
  const audit = runPluginSecurityAudit(slotKey, contractData);
  if (!audit.isSafe) {
    console.error(`Security Guard violation blocked plugin slot "${slotKey}":`, audit.errors);
    return React.createElement(DefaultPluginErrorState, {
      message: `Security audit failed: ${audit.errors.join(', ')}`
    });
  }

  // 10. Sanitize Data (Strips secrets and sensitive parameters)
  const sanitizedData = sanitizePluginData(contractData, manifest.settingsSchema);

  // 11. Resolve Renderer Component
  const Component = resolvePluginRenderer({
    slotKey,
    activeTheme: context.activeTheme,
    fallbackComponent
  });

  if (!Component) {
    return React.createElement(DefaultPluginErrorState, {
      message: `Renderer component could not be resolved for: ${slotKey}`
    });
  }

  // 12. Analytics Event Tracking
  if (context.analytics?.track) {
    context.analytics.track('plugin_component_view', { slotKey, pluginKey });
  }

  // 13. Output UI wrapped inside error boundary and sandbox wrapper
  return React.createElement(
    RenderErrorBoundary,
    null,
    React.createElement(Component, {
      data: sanitizedData,
      context: clientContext
    })
  );
};
