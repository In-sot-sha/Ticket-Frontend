import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  X,
  Shield,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  exact: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Overview',          icon: LayoutDashboard, href: '/admin',                   exact: true  },
  { title: 'Transactions',      icon: CreditCard,      href: '/admin/transactions',      exact: true  },
  { title: 'Host Applications', icon: Building2,       href: '/admin/host-applications', exact: true  },
  { title: 'Help & Support',    icon: MessageSquare,   href: '/admin/support',           exact: true  },
  { title: 'Users',             icon: Users,           href: '/admin/users',             exact: true  },
];

const AdminSidebar: React.FC<{ isOpen: boolean; toggleSidebar: () => void }> = ({
  isOpen,
  toggleSidebar,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'A'
    : 'A';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col',
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
          'transform transition-transform duration-300 ease-in-out',
          'md:sticky md:top-0 md:h-full md:translate-x-0 md:z-auto md:shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 dark:border-gray-700/80">
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/50 transition-colors">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">PartyStorm</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">System Admin</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={toggleSidebar}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={() => window.innerWidth < 768 && toggleSidebar()}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        active
                          ? 'bg-rose-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.title}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-700/80">
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">System Admin</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default AdminSidebar;
