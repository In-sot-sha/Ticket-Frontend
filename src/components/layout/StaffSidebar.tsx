import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  Building2,
  FolderKanban,
  LifeBuoy,
  X,
  Shield,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Staff home', icon: LayoutDashboard, href: '/staff', exact: true },
  { title: 'Gate scan', icon: ScanLine, href: '/staff/scan' },
  { title: 'Org coverage', icon: Building2, href: '/staff/orgs' },
  { title: 'Ops projects', icon: FolderKanban, href: '/staff/projects' },
  { title: 'Support', icon: LifeBuoy, href: '/staff/support' },
];

const StaffSidebar: React.FC<{ isOpen: boolean; toggleSidebar: () => void }> = ({
  isOpen,
  toggleSidebar,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (item: NavItem) => {
    const path = location.pathname;
    if (item.href === '/staff/scan') return path.startsWith('/staff/scan');
    if (item.exact) return path === item.href;
    return path === item.href || path.startsWith(`${item.href}/`);
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'S'
    : 'S';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={toggleSidebar} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col',
          'bg-white dark:bg-gray-900 border-r border-rose-100 dark:border-neutral-800',
          'transform transition-transform duration-300 ease-in-out',
          'md:sticky md:top-0 md:h-full md:translate-x-0 md:z-auto md:shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-rose-100 dark:border-neutral-800">
          <Link to="/staff" className="flex items-center gap-2.5" onClick={() => window.innerWidth < 768 && toggleSidebar()}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">PartyStorm</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Staff</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={toggleSidebar}>
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
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      active
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-rose-50/60 dark:hover:bg-neutral-800'
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-rose-500" />
                    )}
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        active
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-50 dark:bg-neutral-800 text-rose-400 dark:text-neutral-400'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user && (
          <div className="p-3 border-t border-rose-100 dark:border-neutral-800">
            <div className="flex items-center gap-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[11px] text-rose-500/80 truncate">Staff</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default StaffSidebar;
