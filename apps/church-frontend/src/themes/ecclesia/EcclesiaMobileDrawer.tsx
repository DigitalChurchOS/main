/* ── Ecclesia Mobile Drawer ─────────────────────────── */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Home, Info, PlaySquare, CalendarDays, UsersRound, HeartHandshake, Mail, Radio, HandCoins, UserCircle, Clock, MapPin, ClipboardList } from 'lucide-react';
import { useEcclesia } from './EcclesiaContext';
import { isUrlEntitled } from '../../entitlements';
import { loadMemberSession, MEMBER_AUTH_CHANGE_EVENT, type MemberSession } from '../../memberAccount';
import { withLocalChurchBase } from '../../routing';

const navIcons: Record<string, React.ComponentType<{ size?: number | string }>> = {
  '/': Home, '/home': Home,
  '/about': Info,
  '/service-times': Clock,
  '/campuses': MapPin,
  '/new-visitor': ClipboardList,
  '/sermons': PlaySquare,
  '/events': CalendarDays,
  '/ministries': UsersRound,
  '/prayer': HeartHandshake,
  '/contact': Mail,
  '/account': UserCircle,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EcclesiaMobileDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { tenant, navigation, moduleEntitlements } = useEcclesia();
  const items = (navigation?.items || []).filter(item => isUrlEntitled(item.url, moduleEntitlements));
  const showLiveAction = isUrlEntitled('/livestream', moduleEntitlements);
  const showGivingAction = isUrlEntitled('/giving', moduleEntitlements);
  const showMemberPortal = isUrlEntitled('/account', moduleEntitlements);
  const [memberSession, setMemberSession] = useState<MemberSession | null>(() => loadMemberSession());
  const activeMemberSession = memberSession?.tenantId === tenant.id ? memberSession : null;
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const refreshSession = () => setMemberSession(loadMemberSession());
    window.addEventListener(MEMBER_AUTH_CHANGE_EVENT, refreshSession);
    window.addEventListener('storage', refreshSession);
    return () => {
      window.removeEventListener(MEMBER_AUTH_CHANGE_EVENT, refreshSession);
      window.removeEventListener('storage', refreshSession);
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="drawer-backdrop" onClick={onClose} />}

      <aside className={`mobile-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} ref={drawerRef}>
        <div className="drawer-close-row">
          <button className="drawer-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="drawer-nav">
          {items.map((item) => {
            const url = item.url === '/home' ? '/' : item.url;
            const Icon = navIcons[url] || navIcons[item.url];
            return (
              <Link key={item.url} to={withLocalChurchBase(url)} onClick={onClose}>
                {Icon && <Icon size={18} />} {item.label}
              </Link>
            );
          })}
        </nav>

        {(showLiveAction || showGivingAction || showMemberPortal) && (
          <div className="drawer-actions">
            {showMemberPortal && (
              <Link to={withLocalChurchBase(activeMemberSession ? '/account' : '/login')} className="btn btn-soft btn-full" onClick={onClose}>
                <UserCircle size={16} /> {activeMemberSession ? 'My Account' : 'Log In'}
              </Link>
            )}
            {showLiveAction && (
              <Link to={withLocalChurchBase('/livestream')} className="btn btn-light btn-full" onClick={onClose}>
                <Radio size={16} /> Watch Live
              </Link>
            )}
            {showGivingAction && (
              <Link to={withLocalChurchBase('/giving')} className="btn btn-primary btn-full" onClick={onClose}>
                <HandCoins size={16} /> Give
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default EcclesiaMobileDrawer;
