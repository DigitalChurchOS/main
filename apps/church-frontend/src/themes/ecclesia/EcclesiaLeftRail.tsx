import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tv, Video, Mic, Newspaper, Calendar, BookOpen, GraduationCap, Music, UserCircle } from 'lucide-react';
import { useEcclesia } from './EcclesiaContext';
import { isUrlEntitled } from '../../entitlements';
import { withLocalChurchBase } from '../../routing';

const RAIL_ITEMS = [
  { label: 'Media', path: '/media', icon: Tv },
  { label: 'Livestream', path: '/livestream', icon: Video },
  { label: 'Podcast', path: '/podcast', icon: Mic },
  { label: 'Articles', path: '/blog', icon: Newspaper },
  { label: 'Services', path: '/services', icon: Calendar },
  { label: 'Library', path: '/library', icon: BookOpen },
  { label: 'LMS', path: '/courses', icon: GraduationCap },
  { label: 'Worship', path: '/worship', icon: Music },
  { label: 'Account', path: '/login', icon: UserCircle },
];

interface Props {
  embedded?: boolean;
}

const EcclesiaLeftRail: React.FC<Props> = ({ embedded = false }) => {
  const { moduleEntitlements } = useEcclesia();
  const location = useLocation();
  const activePath = location.pathname.startsWith('/church')
    ? location.pathname.substring('/church'.length) || '/'
    : location.pathname;

  // Filter items based on active module entitlements for the tenant
  const entitledItems = RAIL_ITEMS.filter(item => isUrlEntitled(item.path, moduleEntitlements));

  if (entitledItems.length === 0) return null;

  const nav = (
    <nav className="rail-nav">
      {entitledItems.map(item => {
        const Icon = item.icon;
        const isActive = activePath === item.path || activePath.startsWith(item.path + '/');
        return (
          <Link
            key={item.path}
            to={withLocalChurchBase(item.path)}
            className={`rail-item ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  if (embedded) return nav;

  return (
    <aside className="left-rail">
      {nav}
    </aside>
  );
};

export default EcclesiaLeftRail;
