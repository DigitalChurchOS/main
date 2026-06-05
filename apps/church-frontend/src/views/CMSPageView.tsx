import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchPage, fetchPreviewPage } from '../data/cms-client';
import { CMSPageResponse } from '../data/types';
import {
  RenderSlot,
  DefaultLoadingState,
  DefaultNotFoundPage,
  DefaultErrorState,
  PluginInjectionRenderer
} from '../rendering';
import { updatePageSEO, resetPageSEO } from '../utils/seo';

export const CMSPageView: React.FC = () => {
  const { slug = '' } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<CMSPageResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPreview = searchParams.get('preview') === 'true';
  const previewToken = searchParams.get('token');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const loadPage = async () => {
      try {
        let res: CMSPageResponse;
        if (isPreview && previewToken) {
          res = await fetchPreviewPage(slug, previewToken);
        } else {
          res = await fetchPage(slug);
        }

        if (active) {
          setPageData(res.data);
          updatePageSEO({
            title: res.data.seoTitle || res.data.title,
            description: res.data.seoDescription,
            keywords: res.data.seoKeywords
          });
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          console.error(err);
          setError(err.message || 'Page not found');
          setLoading(false);
          resetPageSEO();
        }
      }
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [slug, isPreview, previewToken]);

  if (loading) {
    return React.createElement(DefaultLoadingState);
  }

  if (error || !pageData) {
    if (error?.includes('404') || error?.includes('not found')) {
      return React.createElement(DefaultNotFoundPage);
    }
    return React.createElement(DefaultErrorState, { message: error || 'An error occurred loading the page' });
  }

  return React.createElement(
    'div',
    { className: 'space-y-12' },
    React.createElement(PluginInjectionRenderer, { point: 'page.content.before' }),
    pageData.contentBlocks.map((block: any, index: number) => {
      const isFirst = index === 0;
      return React.createElement(
        React.Fragment,
        { key: block.id || index },
        React.createElement(PluginInjectionRenderer, { point: 'page.section.before', parentData: block.data }),
        isFirst && React.createElement(PluginInjectionRenderer, { point: 'page.hero.before' }),
        React.createElement(RenderSlot, {
          slotKey: block.slotKey,
          contractData: block.data,
          moduleKey: block.moduleKey
        }),
        isFirst && React.createElement(PluginInjectionRenderer, { point: 'page.hero.after' }),
        React.createElement(PluginInjectionRenderer, { point: 'page.section.after', parentData: block.data })
      );
    }),
    React.createElement(PluginInjectionRenderer, { point: 'page.cta.before' }),
    React.createElement(PluginInjectionRenderer, { point: 'page.cta.after' }),
    React.createElement(PluginInjectionRenderer, { point: 'page.content.after' })
  );
};
