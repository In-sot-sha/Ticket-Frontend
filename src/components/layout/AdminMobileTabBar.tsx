import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, CreditCard, MessageSquare } from 'lucide-react';

const AdminMobileTabBar: React.FC = () => {
  const location = useLocation();

  const tabs = [
    { label: 'Overview', icon: LayoutDashboard, path: '/admin', exact: true },
    { label: 'Transactions', icon: CreditCard, path: '/admin/transactions', exact: true },
    { label: 'Support', icon: MessageSquare, path: '/admin/support', exact: true },
    { label: 'Users', icon: Users, path: '/admin/users', exact: true },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-3 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact
            ? location.pathname === tab.path
            : location.pathname.startsWith(tab.path);

          return (
            <NavLink
              key={tab.label}
              to={tab.path}
              end={tab.exact}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 min-w-0 flex-1 relative transition-all active:scale-95"
            >
              {isActive && (
                <span className="absolute top-1.5 w-1 h-1 rounded-full bg-rose-500" />
              )}
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? 'text-rose-500' : 'text-neutral-400 dark:text-neutral-500'
                }`}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span
                className={`text-[10px] leading-none tracking-wide font-medium transition-colors truncate max-w-full ${
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

export default AdminMobileTabBar;
