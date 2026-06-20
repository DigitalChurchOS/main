import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tv, Mic, Newspaper, Calendar, BookOpen, GraduationCap, Music, UserCircle, ShoppingBag, UsersRound } from 'lucide-react';
import { useEcclesia } from './EcclesiaContext';
import { isUrlEntitled } from '../../entitlements';
import { withLocalChurchBase } from '../../routing';

const TAB_ITEMS = [
  { label: 'Media', path: '/media', icon: Tv },
  { label: 'Services', path: '/services', icon: Calendar },
  { label: 'Articles', path: '/blog', icon: Newspaper },
  { label: 'Library', path: '/library', icon: BookOpen },
  { label: 'Podcast', path: '/podcast', icon: Mic },
  { label: 'Store', path: '/store', icon: ShoppingBag },
  { label: 'Cells', path: '/cells', icon: UsersRound },
  { label: 'LMS', path: '/courses', icon: GraduationCap },
  { label: 'Worship', path: '/worship', icon: Music },
  { label: 'Account', path: '/account', icon: UserCircle },
];

interface Props {
  embedded?: boolean;
}

const EcclesiaMobileTabRail: React.FC<Props> = ({ embedded = false }) => {
  const { moduleEntitlements } = useEcclesia();
  const location = useLocation();
  const activePath = location.pathname.startsWith('/church')
    ? location.pathname.substring('/church'.length) || '/'
    : location.pathname;

  // Filter items based on active module entitlements for the tenant
  const entitledItems = TAB_ITEMS.filter(item => isUrlEntitled(item.path, moduleEntitlements));

  if (entitledItems.length === 0) return null;

  const tabs = (
    <>
      {entitledItems.map(item => {
        const Icon = item.icon;
        const isActive = activePath === item.path || activePath.startsWith(item.path + '/');
        return (
          <Link
            key={item.path}
            to={withLocalChurchBase(item.path)}
            className={`mobile-tab-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  if (embedded) return tabs;

  return <div className="mobile-tab-rail">{tabs}</div>;
};

export default EcclesiaMobileTabRail;
