import React from 'react';
import { Outlet } from 'react-router-dom';
import { useRendererContext } from '../rendering';
import { DefaultPublicShell } from '../rendering/default-renderers/layout/DefaultPublicShell';

export const LayoutShell: React.FC = () => {
  const context = useRendererContext() as any;

  return React.createElement(
    DefaultPublicShell,
    {
      announcementData: context.announcement,
      navigationData: context.navigation,
      footerData: context.footer,
      themeSettings: context.appearanceSettings,
      children: React.createElement(Outlet, null)
    }
  );
};
