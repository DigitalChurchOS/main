import React from 'react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import { LayoutShell } from './views/LayoutShell';
import { CMSPageView } from './views/CMSPageView';
import { ModuleListingView } from './views/ModuleListingView';
import { ModuleDetailView } from './views/ModuleDetailView';
import { MemberPortalView } from './views/MemberPortalView';
import { SearchPageView } from './views/SearchPageView';
import { NotFoundView } from './views/NotFoundView';

export const getRouter = (onSimulateLogin?: () => void) => {
  return createBrowserRouter(
    createRoutesFromElements(
      React.createElement(
        Route,
        { path: '/', element: React.createElement(LayoutShell) },
        
        // Pages
        React.createElement(Route, { index: true, element: React.createElement(CMSPageView) }),
        React.createElement(Route, { path: ':slug', element: React.createElement(CMSPageView) }),

        // Events Module
        React.createElement(Route, { path: 'events', element: React.createElement(ModuleListingView, { moduleKey: 'events-management', slotPrefix: 'event' }) }),
        React.createElement(Route, { path: 'events/:id', element: React.createElement(ModuleDetailView, { moduleKey: 'events-management', slotPrefix: 'event' }) }),

        // Sermons Module
        React.createElement(Route, { path: 'sermons', element: React.createElement(ModuleListingView, { moduleKey: 'sermons-media', slotPrefix: 'sermon' }) }),
        React.createElement(Route, { path: 'sermons/:id', element: React.createElement(ModuleDetailView, { moduleKey: 'sermons-media', slotPrefix: 'sermon' }) }),

        // Giving Module
        React.createElement(Route, { path: 'giving', element: React.createElement(ModuleListingView, { moduleKey: 'giving-tithes', slotPrefix: 'giving' }) }),

        // Small Groups Module
        React.createElement(Route, { path: 'groups', element: React.createElement(ModuleListingView, { moduleKey: 'groups-community', slotPrefix: 'group' }) }),
        React.createElement(Route, { path: 'groups/:id', element: React.createElement(ModuleDetailView, { moduleKey: 'groups-community', slotPrefix: 'group' }) }),

        // Courses / LMS Module
        React.createElement(Route, { path: 'courses', element: React.createElement(ModuleListingView, { moduleKey: 'lms-courses', slotPrefix: 'course' }) }),
        React.createElement(Route, { path: 'courses/:id', element: React.createElement(ModuleDetailView, { moduleKey: 'lms-courses', slotPrefix: 'course' }) }),

        // Prayer & Testimony Module
        React.createElement(Route, { path: 'prayer', element: React.createElement(ModuleListingView, { moduleKey: 'prayer-testimony', slotPrefix: 'prayer' }) }),

        // Blog Module
        React.createElement(Route, { path: 'blog', element: React.createElement(ModuleListingView, { moduleKey: 'blog', slotPrefix: 'blog' }) }),
        React.createElement(Route, { path: 'blog/:slug', element: React.createElement(ModuleDetailView, { moduleKey: 'blog', slotPrefix: 'blog' }) }),

        // Store Module
        React.createElement(Route, { path: 'store', element: React.createElement(ModuleListingView, { moduleKey: 'store', slotPrefix: 'store' }) }),
        React.createElement(Route, { path: 'store/:id', element: React.createElement(ModuleDetailView, { moduleKey: 'store', slotPrefix: 'store' }) }),

        // Livestream Module
        React.createElement(Route, { path: 'live', element: React.createElement(ModuleDetailView, { moduleKey: 'livestream-broadcasting', customSlotKey: 'livestream.player' }) }),

        // Member Portal Module
        React.createElement(Route, { path: 'members', element: React.createElement(MemberPortalView, { onSimulateLogin }) }),
        React.createElement(Route, { path: 'members/profile', element: React.createElement(MemberPortalView, { onSimulateLogin }) }),

        // Search Page
        React.createElement(Route, { path: 'search', element: React.createElement(SearchPageView) }),

        // Not Found Page
        React.createElement(Route, { path: '*', element: React.createElement(NotFoundView) })
      )
    ),
    {
      basename: '/church'
    }
  );
};
