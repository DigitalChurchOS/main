import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRendererContext, RenderSlot, DefaultLoadingState, DefaultDisabledState, DefaultErrorState, PluginInjectionRenderer } from '../rendering';
import { fetchModuleDetail } from '../data/module-client';

interface ModuleDetailViewProps {
  moduleKey: string;
  slotPrefix?: string;
  customSlotKey?: string;
}

export const ModuleDetailView: React.FC<ModuleDetailViewProps> = ({ moduleKey, slotPrefix, customSlotKey }) => {
  const { id = '' } = useParams<{ id?: string }>();
  const context = useRendererContext();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);

  const isEntitled = context.moduleEntitlements.includes(moduleKey) || context.isPreviewMode;

  useEffect(() => {
    if (!isEntitled) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchModuleDetail(moduleKey, id)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [moduleKey, id, isEntitled]);

  if (!isEntitled) {
    return React.createElement(DefaultDisabledState, {
      message: `The "${moduleKey}" module is not activated or entitled on this tenant plan.`
    });
  }

  if (loading) {
    return React.createElement(DefaultLoadingState);
  }

  if (!data) {
    return React.createElement(DefaultErrorState, {
      message: 'Item details could not be found.'
    });
  }

  // Custom dual-slot layout for livestream (Player + Chat side-by-side)
  if (moduleKey === 'livestream-broadcasting') {
    const isLive = data.status === 'live';
    const playerSlot = isLive ? 'livestream.player' : 'livestream.countdown';

    return React.createElement(
      'div',
      { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto py-4 font-sans' },
      // Left: Player Column
      React.createElement(
        'div',
        { className: 'lg:col-span-2' },
        React.createElement(PluginInjectionRenderer, { point: 'livestream.player.overlay', parentData: data }),
        React.createElement(RenderSlot, {
          slotKey: playerSlot,
          contractData: data,
          moduleKey
        }),
        React.createElement(PluginInjectionRenderer, { point: 'livestream.afterPlayer', parentData: data })
      ),
      // Right: Chat/Sidebar Column
      React.createElement(
        'div',
        { className: 'lg:col-span-1 space-y-4' },
        React.createElement(RenderSlot, {
          slotKey: 'livestream.chatSlot',
          contractData: { chatUrl: data.chatUrl, chatEnabled: data.chatEnabled },
          moduleKey
        }),
        React.createElement(PluginInjectionRenderer, { point: 'livestream.sidebar', parentData: data })
      )
    );
  }

  const slotKey = (customSlotKey || `${slotPrefix}.detail`) as any;
  const isCourseOrGroup = slotPrefix === 'course' || slotPrefix === 'group';

  return React.createElement(
    'div',
    { className: 'max-w-4xl mx-auto py-6 space-y-4' },
    React.createElement(PluginInjectionRenderer, { point: `${slotPrefix}.detail.before` as any, parentData: data }),
    isCourseOrGroup && React.createElement(PluginInjectionRenderer, { point: `${slotPrefix}.detail.sidebar` as any, parentData: data }),
    React.createElement(RenderSlot, {
      slotKey,
      contractData: data,
      moduleKey
    }),
    slotPrefix === 'sermon' && React.createElement(PluginInjectionRenderer, { point: 'sermon.player.below', parentData: data }),
    slotPrefix === 'store' && React.createElement(PluginInjectionRenderer, { point: 'product.detail.afterPurchase', parentData: data }),
    React.createElement(PluginInjectionRenderer, { point: `${slotPrefix}.detail.after` as any, parentData: data })
  );
};
