import React, { useEffect, useState } from 'react';
import { useRendererContext, RenderSlot, DefaultLoadingState, DefaultDisabledState, DefaultEmptyState, PluginInjectionRenderer } from '../rendering';
import { fetchModuleList } from '../data/module-client';

interface ModuleListingViewProps {
  moduleKey: string;
  slotPrefix: string;
}

export const ModuleListingView: React.FC<ModuleListingViewProps> = ({ moduleKey, slotPrefix }) => {
  const context = useRendererContext();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const isEntitled = context.moduleEntitlements.includes(moduleKey) || context.isPreviewMode;

  useEffect(() => {
    if (!isEntitled) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchModuleList(moduleKey)
      .then((data) => {
        if (active) {
          setItems(data);
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
  }, [moduleKey, isEntitled]);

  if (!isEntitled) {
    return React.createElement(DefaultDisabledState, {
      message: `The "${moduleKey}" module is not activated or entitled on this tenant plan.`
    });
  }

  if (loading) {
    return React.createElement(DefaultLoadingState);
  }

  if (items.length === 0) {
    return React.createElement(DefaultEmptyState, {
      message: 'No items found in this section.'
    });
  }

  const slotKey = `${slotPrefix}.card` as any;

  return React.createElement(
    'div',
    { className: 'space-y-6' },
    React.createElement('h2', { className: 'text-2xl font-bold tracking-tight text-slate-800 capitalize' }, slotPrefix + 's'),
    React.createElement(PluginInjectionRenderer, { point: `${slotPrefix}.list.before` as any }),
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
      items.map((item, index) => {
        return React.createElement(
          'div',
          { key: item.id || index, className: 'relative' },
          React.createElement(PluginInjectionRenderer, { point: `${slotPrefix}.card.badge` as any, parentData: item }),
          React.createElement(RenderSlot, {
            slotKey,
            contractData: item,
            moduleKey
          })
        );
      })
    ),
    React.createElement(PluginInjectionRenderer, { point: `${slotPrefix}.list.after` as any })
  );
};
