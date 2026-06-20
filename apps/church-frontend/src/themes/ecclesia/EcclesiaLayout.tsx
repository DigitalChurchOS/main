import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEcclesia } from './EcclesiaContext';
import { injectEcclesiaCSS, removeEcclesiaCSS, applyEcclesiaCSSVars } from './cssVarBridge';
import EcclesiaHeader from './EcclesiaHeader';
import EcclesiaFooter from './EcclesiaFooter';
import EcclesiaMobileDrawer from './EcclesiaMobileDrawer';
import EcclesiaLeftRail from './EcclesiaLeftRail';
import EcclesiaMobileTabRail from './EcclesiaMobileTabRail';
import TopNotice from './sections/TopNotice';
import EcclesiaGlobalUI from './blueprint/EcclesiaGlobalUI';

interface Props {
  children: React.ReactNode;
  useStaticLayout?: boolean;
}

const EcclesiaLayout: React.FC<Props> = ({ children, useStaticLayout = false }) => {
  const { themeSettings } = useEcclesia();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const normalizedPath = location.pathname.startsWith('/church')
    ? location.pathname.substring('/church'.length) || '/'
    : location.pathname;
  const isLivestream = normalizedPath.startsWith('/livestream');

  // Toggle cinema-mode class on body for livestream page
  useEffect(() => {
    if (isLivestream) {
      document.body.classList.add('cinema-mode');
    } else {
      document.body.classList.remove('cinema-mode');
    }
    return () => {
      document.body.classList.remove('cinema-mode');
    };
  }, [isLivestream]);

  // Inject CSS styles when this theme layout mounts, cleanup on unmount
  useEffect(() => {
    injectEcclesiaCSS();
    return () => {
      removeEcclesiaCSS();
    };
  }, []);

  // Re-apply CSS custom properties whenever theme customizer settings change
  useEffect(() => {
    applyEcclesiaCSSVars(themeSettings);
  }, [themeSettings]);

  // Sync body class drawer-open
  useEffect(() => {
    document.body.classList.toggle('drawer-open', drawerOpen);
    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [drawerOpen]);

  if (useStaticLayout) {
    return (
      <div className="ecclesia-theme-root">
        {children}
      </div>
    );
  }

  if (isLivestream) {
    return (
      <div className="ecclesia-theme-root">
        <main className="content-wrap content-wrap--livestream" id="content-outlet" style={{ padding: 0, height: '100vh', width: '100vw', maxWidth: '100vw', overflow: 'hidden' }}>
          {children}
        </main>
        <EcclesiaGlobalUI />
      </div>
    );
  }

  return (
    <div className="ecclesia-theme-root">
      <div className="shell-wrapper">
        <TopNotice />
        <EcclesiaHeader onOpenDrawer={() => setDrawerOpen(true)} />
        <div className="main-shell-body">
          <EcclesiaLeftRail />
          <main className="content-wrap" id="content-outlet">
            {children}
          </main>
        </div>
        <EcclesiaFooter />
      </div>
      <EcclesiaMobileTabRail />
      <EcclesiaMobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <EcclesiaGlobalUI />
    </div>
  );
};

export default EcclesiaLayout;
