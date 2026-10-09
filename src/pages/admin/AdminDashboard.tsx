import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  LifeBuoy,
  Sparkles,
  CreditCard,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminStats, useHostApplications } from '../../hooks/queries/useAdmin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/skeleton';

const STAT_LABELS = ['Total events', 'Total users', 'Pending hosts', 'Open support'] as const;

function AdminDashboardSkeleton() {
  return (
    <>
      <div className="mb-5 grid grid-cols-2 divide-x divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 lg:grid-cols-4 lg:divide-y-0">
        {STAT_LABELS.map((label) => (
          <div key={label} className="min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</p>
            <Skeleton className="mt-1.5 h-6 w-16" />
          </div>
        ))}
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
      label: 'Total events',
      value: stats?.totalEvents ?? 0,
      blurb: 'Platform catalog',
    },
    {
      label: 'Total users',
      value: stats?.totalUsers ?? 0,
      blurb: 'Registered accounts',
    },
    {
      label: 'Pending hosts',
      value: stats?.pendingHosts ?? 0,
      blurb: `${stats?.verifiedHosts ?? 0} verified`,
      tone: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Open support',
      value: stats?.openSupportTickets ?? 0,
      blurb: 'Awaiting a reply',
    },
  ];

  const quickActions = [
    {
      to: '/admin/organizations',
      icon: Building2,
      wrap: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40',
      hover: 'hover:border-amber-400 dark:hover:border-amber-700',
      chevron: 'group-hover:text-amber-500',
      title: 'Review hosts',
      sub: `${stats?.pendingHosts ?? 0} waiting for approval`,
    },
    {
      to: '/admin/staff',
      icon: UserCog,
      wrap: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40',
      hover: 'hover:border-blue-400 dark:hover:border-blue-700',
      chevron: 'group-hover:text-blue-500',
      title: 'Staff roster',
      sub: 'Ground staff and permissions',
    },
    {
      to: '/admin/events',
      icon: Sparkles,
      wrap: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40',
      hover: 'hover:border-purple-400 dark:hover:border-purple-700',
      chevron: 'group-hover:text-purple-500',
      title: 'Events',
      sub: 'Listings, tiers, and promotions',
    },
    {
      to: '/admin/transactions',
      icon: CreditCard,
      wrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40',
      hover: 'hover:border-emerald-400 dark:hover:border-emerald-700',
      chevron: 'group-hover:text-emerald-500',
      title: 'Payments',
      sub: 'Orders, payouts, and references',
    },
    {
      to: '/admin/support',
      icon: LifeBuoy,
      wrap: 'bg-rose-50 text-rose-500 dark:bg-rose-950/40',
      hover: 'hover:border-rose-400 dark:hover:border-rose-700',
      chevron: 'group-hover:text-rose-500',
      title: 'Support',
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
          <div className="mb-5 grid grid-cols-2 divide-x divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 lg:grid-cols-4 lg:divide-y-0">
            {statCards.map((stat) => (
              <div key={stat.label} className="min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  {stat.label}
                </p>
                <p className={`mt-0.5 text-lg font-bold tabular-nums tracking-tight sm:text-xl ${stat.tone ?? 'text-neutral-900 dark:text-white'}`}>
                  {stat.value}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-neutral-500">{stat.blurb}</p>
              </div>
            ))}
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

            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-1">
                {quickActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-2xs transition-all dark:border-neutral-800 dark:bg-neutral-900 sm:p-4 ${item.hover}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`shrink-0 rounded-xl p-2 sm:p-2.5 ${item.wrap}`}>
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-neutral-900 dark:text-white sm:text-sm">
                            {item.title}
                          </p>
                          <p className="truncate text-[11px] text-neutral-400 sm:text-xs">{item.sub}</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 ${item.chevron}`} />
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
