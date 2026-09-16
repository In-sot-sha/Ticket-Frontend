import { NavLink, useLocation } from 'react-router-dom';
import {
  Search,
  Ticket,
  UserCircle,
  Calendar,
  PlusCircle,
  BarChart3,
  Home,
  HomeIcon,
  ScanLine,
  FolderKanban,
  LifeBuoy,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';

const MobileTabBar: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { currentRole } = useRole();
  const location = useLocation();

  const hiddenPaths = ['/login', '/register', '/become-organizer'];
  // Public PIN gate only — staff scan keeps the tab bar
  if (location.pathname.startsWith('/scan-gate')) {
    return null;
  }
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  const onStaffPath = location.pathname.startsWith('/staff');
  const onOrganizerPath = location.pathname.startsWith('/organizer');
  const canUseStaffTabs =
    Boolean(user?.isStaff) || user?.role === 'ADMIN' || currentRole === 'STAFF';
  const showStaffTabs =
    canUseStaffTabs &&
    (onStaffPath || (currentRole === 'STAFF' && !onOrganizerPath));
  const showOrganizerTabs =
    !showStaffTabs && (onOrganizerPath || currentRole === 'ORGANIZER');

  const userTabs = [
    { label: 'Home', icon: HomeIcon, path: '/', exact: true },
    { label: 'Explore', icon: Search, path: '/events' },
    { label: 'Tickets', icon: Ticket, path: '/my-tickets' },
    {
      label: 'Profile',
      icon: UserCircle,
      path: '/profile',
      profile: true as const,
    },
  ];

  const organizerTabs = [
    { label: 'Dashboard', icon: Home, path: '/organizer', exact: true },
    { label: 'Events', icon: Calendar, path: '/organizer/events', exact: true },
    { label: 'Create', icon: PlusCircle, path: '/organizer/events/create', exact: false },
    { label: 'Analytics', icon: BarChart3, path: '/organizer/analytics', exact: false },
  ];

  const staffTabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/staff', exact: true },
    { label: 'Scan', icon: ScanLine, path: '/staff/scan', exact: false },
    { label: 'Projects', icon: FolderKanban, path: '/staff/projects', exact: false },
    { label: 'Support', icon: LifeBuoy, path: '/staff/support', exact: false },
  ];

  const activeTabs = showStaffTabs
    ? staffTabs
    : showOrganizerTabs
      ? organizerTabs
      : userTabs;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around px-2 py-1 gap-1">
        {activeTabs.map((tab) => {
          const Icon = tab.icon;
          const path = location.pathname;
          let isActive = false;
          if (tab.path === '/staff/scan' || tab.path.startsWith('/scan-gate')) {
            isActive = path.startsWith('/staff/scan') || path.startsWith('/scan-gate');
          } else if (tab.path === '/organizer/events') {
            isActive =
              path === '/organizer/events' ||
              (path.startsWith('/organizer/events/') &&
                !path.startsWith('/organizer/events/create'));
          } else if (tab.path === '/organizer/events/create') {
            isActive =
              path === '/organizer/events/create' ||
              path.startsWith('/organizer/events/create/');
          } else if (tab.exact) {
            isActive = path === tab.path;
          } else {
            isActive = path === tab.path || (tab.path !== '/' && path.startsWith(tab.path));
          }

          return (
            <NavLink
              key={tab.label}
              to={tab.path}
              end={tab.exact}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 min-w-0 flex-1 relative transition-all active:scale-95"
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? 'text-rose-500' : 'text-neutral-400 dark:text-neutral-500'
                }`}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span
                className={`text-[9px] leading-tight tracking-wide font-medium transition-colors truncate max-w-full ${
                  isActive
                    ? 'text-rose-500 font-bold'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabBar;
