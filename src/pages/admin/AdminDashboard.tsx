import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ChevronRight,
  Clock,
  Wallet,
  LifeBuoy,
  Sparkles,
  CreditCard,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminStats, useHostApplications } from '../../hooks/queries/useAdmin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/skeleton';
import { formatNaira } from '../../lib/eventOrganizer';

const STAT_META = [
  { label: 'Platform earnings', icon: Wallet, color: 'text-rose-500' },
  { label: 'Total Events', icon: Sparkles, color: 'text-purple-500' },
  { label: 'Total Users', icon: Users, color: 'text-blue-500' },
  { label: 'Pending Hosts', icon: Clock, color: 'text-amber-500' },
  { label: 'Open Support', icon: LifeBuoy, color: 'text-rose-500' },
] as const;

function AdminDashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 mb-6">
        {STAT_META.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 bg-white dark:bg-neutral-900 shadow-sm"
            >
              <div className="flex justify-between items-center text-neutral-400 dark:text-neutral-500 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">
                  {stat.label}
                </span>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden p-4">
          <Skeleton className="h-6 w-1/3 mb-4 rounded-md" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm p-4">
          <Skeleton className="h-6 w-1/3 mb-4 rounded-md" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useAdminStats();
  const { data: pendingHosts = [] } = useHostApplications('pending');

  const statCards = [
    {
      label: 'Platform earnings',
      value: formatNaira(stats?.platformRevenue ?? 0),
      sub: `${stats?.totalOrders ?? 0} paid orders`,
      icon: Wallet,
      color: 'text-rose-500',
    },
    {
      label: 'Total Events',
      value: stats?.totalEvents ?? 0,
      sub: 'Platform catalog',
      icon: Sparkles,
      color: 'text-purple-500',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      sub: 'Registered accounts',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      label: 'Pending Hosts',
      value: stats?.pendingHosts ?? 0,
      sub: `${stats?.verifiedHosts ?? 0} verified`,
      icon: Clock,
      color: 'text-amber-500',
    },
    {
      label: 'Open Support',
      value: stats?.openSupportTickets ?? 0,
      sub: 'Awaiting resolution',
      icon: LifeBuoy,
      color: 'text-rose-500',
    },
  ];

  const quickActions = [
    {
      to: '/admin/organizations',
      icon: Building2,
      wrap: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
      title: 'Review Host Applications',
      sub: `${stats?.pendingHosts ?? 0} waiting for approval`,
    },
    {
      to: '/admin/staff',
      icon: UserCog,
      wrap: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
      title: 'Staff Roster',
      sub: 'Manage ground staff and permissions',
    },
    {
      to: '/admin/events',
      icon: Sparkles,
      wrap: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600',
      title: 'Events & Promotions',
      sub: 'View events, ticket tiers & carousel',
    },
    {
      to: '/admin/transactions',
      icon: CreditCard,
      wrap: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
      title: 'Transactions & Revenue',
      sub: 'Order history, payouts & references',
    },
    {
      to: '/admin/support',
      icon: LifeBuoy,
      wrap: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600',
      title: 'Customer Support',
      sub: `${stats?.openSupportTickets ?? 0} open tickets`,
    },
  ];

  return (
    <div className="py-3 px-2 sm:px-3 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-8">
      <PageHeader
        title="Admin"
        accent="Dashboard"
        description={`Welcome, ${user?.firstName}. Overview of platform activity, host approvals, and system controls.`}
      />

      {isLoading ? (
        <AdminDashboardSkeleton />
      ) : (
        <>
          {/* Compact Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 mb-5">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-4 bg-white dark:bg-neutral-900 shadow-sm transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                >
                  <div className="flex justify-between items-center text-neutral-400 dark:text-neutral-500 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                      {stat.label}
                    </span>
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${stat.color}`} />
                  </div>
                  <p className="text-lg sm:text-xl font-black tracking-tight">{stat.value}</p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                    {stat.sub}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Pending Host Applications */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-extrabold tracking-tight">Pending Host Applications</h2>
                  {pendingHosts.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-600">
                      {pendingHosts.length}
                    </span>
                  )}
                </div>
                <Link
                  to="/admin/organizations"
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-0.5 transition-colors"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 flex-1">
                {pendingHosts.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-neutral-400">All host applications have been reviewed</p>
                  </div>
                ) : (
                  pendingHosts.slice(0, 5).map((org: any) => (
                    <div
                      key={org.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-neutral-800 dark:text-neutral-100">
                          {org.name}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {org.owner?.firstName} {org.owner?.lastName} · {org.owner?.email}
                        </p>
                      </div>
                      <Link
                        to="/admin/organizations"
                        className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-600 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm p-4">
              <h2 className="text-sm font-extrabold tracking-tight mb-3">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:border-neutral-200 dark:hover:border-neutral-700 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.wrap}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-rose-500 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate">{item.sub}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
