import React, { useState } from 'react';
import { ThemeSlotKey, ClientContextContract } from '@churchos/frontend-contracts';
import { useRendererContext } from './renderer-context';
import { resolveRenderer } from './resolve-renderer';
import { runSecurityAudit, sanitizeContractData } from './renderer-guards';
import { RenderErrorBoundary } from './renderer-errors';
import { DefaultMemberOnlyState } from '../default-renderers/states/DefaultMemberOnlyState';
import { DefaultPasswordState } from '../default-renderers/states/DefaultPasswordState';
import { DefaultLockedState } from '../default-renderers/states/DefaultLockedState';
import { DefaultErrorState } from '../default-renderers/states/DefaultErrorState';
import { DefaultDisabledState } from '../default-renderers/states/DefaultDisabledState';
import { DefaultPreviewOnlyState } from '../default-renderers/states/DefaultPreviewOnlyState';

export interface RenderSlotProps {
  slotKey: ThemeSlotKey;
  contractData: any;
  moduleKey?: string;
  fallbackComponent?: React.ComponentType<any>;
  clientContext?: ClientContextContract;
}

export const RenderSlot: React.FC<RenderSlotProps> = ({
  slotKey,
  contractData,
  moduleKey,
  fallbackComponent,
  clientContext: propClientContext
}) => {
  const context = useRendererContext();
  const clientContext = propClientContext || (context as ClientContextContract);
  
  const [authorizedPassword, setAuthorizedPassword] = useState(false);
  const [failedPasswordAttempt, setFailedPasswordAttempt] = useState(false);

  // 1. Check Tenant Status (Block suspended tenants)
  const tenantStatus = clientContext?.tenant?.status;
  if (tenantStatus === 'suspended') {
    return React.createElement(DefaultLockedState, {
      message: 'This church portal accounts subscription is suspended.'
    });
  }

  // 2. Check Module Entitlements
  if (moduleKey && context?.moduleEntitlements) {
    const isEntitled = context.moduleEntitlements.includes(moduleKey);
    if (!isEntitled && !clientContext.isPreviewMode) {
      return React.createElement(DefaultDisabledState, {
        message: `The "${moduleKey}" module is not activated or entitled on this tenant plan.`
      });
    }
  }

  // 3. Visibility Rule Gating
  const visibility = contractData?.visibility;
  
  // A. Draft Preview Lock
  if (visibility === 'preview_only' && !clientContext.isPreviewMode) {
    return React.createElement(DefaultDisabledState, {
      message: 'This block contains unpublished draft details.'
    });
  }

  // B. Member Only Gate
  const isMemberOnly = visibility === 'member_only' || slotKey.startsWith('member.');
  const isUserAuthenticated = !!clientContext?.memberId;
  if (isMemberOnly && !isUserAuthenticated) {
    return React.createElement(DefaultMemberOnlyState, {
      message: 'This section is restricted to registered members only.'
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

  // 4. Run Security Audit
  const audit = runSecurityAudit(slotKey, contractData);
  if (!audit.isSafe) {
    console.error(`Security Guard violation blocked slot "${slotKey}":`, audit.errors);
    return React.createElement(DefaultErrorState, {
      message: `Security audit failed: ${audit.errors.join(', ')}`
    });
  }

  // 5. Sanitize Data (Strips DB raw passwords or identifiers)
  const sanitizedData = sanitizeContractData(contractData);

  // 6. Resolve Renderer Component
  const Component = resolveRenderer({
    slotKey,
    activeTheme: context.activeTheme,
    fallbackComponent
  });

  if (!Component) {
    return React.createElement(DefaultErrorState, {
      message: `Renderer not found for slot Key: ${slotKey}`
    });
  }

  // 7. Track Analytics View Event
  if (context.analytics?.track) {
    context.analytics.track('component_view', { slotKey, moduleKey });
  }

  // 8. Output UI wrapped in Error boundary
  return React.createElement(
    RenderErrorBoundary,
    null,
    React.createElement(
      React.Fragment,
      null,
      clientContext.isPreviewMode && React.createElement(DefaultPreviewOnlyState),
      React.createElement(Component, {
        data: sanitizedData,
        context: clientContext
      })
    )
  );
};
