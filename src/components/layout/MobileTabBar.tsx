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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';

const MobileTabBar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { currentRole } = useRole();
  const location = useLocation();

  // Hide on auth pages and the scanner itself (scanner is full-screen)
  const hiddenPaths = ['/login', '/register','/become-organizer' ];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  // Show organizer tabs when actively in organizer section OR role is set to ORGANIZER
  const isOrganizerSection = location.pathname.startsWith('/organizer');
  const showOrganizerTabs = isOrganizerSection || currentRole === 'ORGANIZER';

  const userTabs = [
    {
      label: 'Home',
      icon: HomeIcon,
      path: '/',
      exact: true,
    },
    {
      label: 'Explore',
      icon: Search,
      path: '/events',
    },
    {
      label: 'Tickets',
      icon: Ticket,
      path: '/my-tickets',
    },
    {
      label: 'Profile',
      icon: UserCircle,
      path: isAuthenticated ? '/profile' : '/login',
    },
  ];

  // ── Organizer tabs ────────────────────────────────────────────────────────
  const organizerTabs = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/organizer',
      exact: true,
    },
    {
      label: 'Events',
      icon: Calendar,
      path: '/organizer/events',
      exact: true,            // exact — must NOT match /organizer/events/create
    },
    {
      label: 'Create',
      icon: PlusCircle,
      path: '/organizer/events/create',
      exact: false,
    },
    // {
    //   label: 'Scanner',
    //   icon: ScanLine,
    //   path: '/organizer/scan',
    //   exact: false,
    // },
    {
      label: 'Analytics',
      icon: BarChart3,
      path: '/organizer/analytics',
      exact: false,
    },
  ];

  const activeTabs = showOrganizerTabs ? organizerTabs : userTabs;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around px-2 py-1 gap-1">
        {activeTabs.map((tab) => {
          const Icon = tab.icon;
          // Active logic: exact match for "/" and "/organizer", startsWith for everything else
          const isActive = tab.exact
            ? location.pathname === tab.path
            : location.pathname === tab.path ||
              (tab.path !== '/' && location.pathname.startsWith(tab.path));

          return (
            <NavLink
              key={tab.label}
              to={tab.path}
              end={tab.exact}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 min-w-0 flex-1 relative transition-all active:scale-95"
            >
              {/* Active dot indicator */}
              {/* {isActive && (
                <span className="absolute top-0.5 w-1 h-1 rounded-full bg-rose-500" />
              )} */}
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive
                    ? 'text-rose-500'
                    : 'text-neutral-400 dark:text-neutral-500'
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
