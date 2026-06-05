import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Search, 
  Heart, 
  Ticket, 
  UserCircle,
  Calendar,
  PlusCircle,
  BarChart3,
  Home,
  MessageSquare
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';

const MobileTabBar: React.FC = () => {
  const { currentRole } = useRole();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // If the path starts with /login or /register, don't show the bottom bar
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const isOrganizer = location.pathname.startsWith('/organizer') || currentRole === 'ORGANIZER';

  const userTabs = [
    {
      label: 'Explore',
      icon: <Search className="h-6 w-6" />,
      path: '/'
    },
    {
      label: 'Wishlists',
      icon: <Heart className="h-6 w-6" />,
      path: '/events?wishlist=true'
    },
    {
      label: 'Tickets',
      icon: <Ticket className="h-6 w-6" />,
      path: isAuthenticated ? '/user/tickets' : '/login'
    },
    {
      label: 'Vendor',
      icon: <MessageSquare className="h-6 w-6" />,
      path: isAuthenticated ? '/user/vendors' : '/login'
    },
    {
      label: 'Profile',
      icon: <UserCircle className="h-6 w-6" />,
      path: isAuthenticated ? '/profile' : '/login'
    }
  ];

  const organizerTabs = [
    {
      label: 'Today',
      icon: <Home className="h-6 w-6" />,
      path: '/organizer'
    },
    {
      label: 'Calendar',
      icon: <Calendar className="h-6 w-6" />,
      path: '/organizer/events'
    },
    {
      label: 'Create',
      icon: <PlusCircle className="h-6 w-6" />,
      path: '/organizer/events/create'
    },
    {
      label: 'Analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      path: '/organizer/analytics'
    },
    {
      label: 'Profile',
      icon: <UserCircle className="h-6 w-6" />,
      path: '/profile'
    }
  ];

  const activeTabs = isOrganizer ? organizerTabs : userTabs;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 px-3 py-2 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {activeTabs.map((tab) => {
        const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
        
        return (
          <NavLink
            key={tab.label}
            to={tab.path}
            className={({ isActive: linkActive }) => `flex flex-col items-center justify-center gap-1 min-w-[60px] text-center transition-all ${
              linkActive || isActive
                ? 'text-rose-500 font-semibold scale-105'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <div className={`p-1 rounded-full transition-colors ${
              isActive ? 'text-rose-500' : ''
            }`}>
              {tab.icon}
            </div>
            <span className="text-[10px] leading-none tracking-wide">{tab.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default MobileTabBar;
