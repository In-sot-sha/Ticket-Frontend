import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ChevronRight,
  Clock,
  Wallet,
  MessageSquare,
  Sparkles,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminStats, useHostApplications } from '../../hooks/queries/useAdmin';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/skeleton';
import { formatNaira } from '../../lib/eventOrganizer';

const STAT_META = [
  { label: 'Platform earnings', icon: Wallet, color: 'text-rose-500' },
  { label: 'Total Users', icon: Users, color: 'text-blue-500' },
  { label: 'Pending Hosts', icon: Clock, color: 'text-amber-500' },
  { label: 'Ops requests', icon: FolderKanban, color: 'text-amber-500' },
  { label: 'Open Support', icon: MessageSquare, color: 'text-rose-500' },
] as const;

function AdminDashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {STAT_META.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-3 sm:p-5 bg-white dark:bg-neutral-900 shadow-sm"
            >
              <div className="flex justify-between items-center text-neutral-400 dark:text-neutral-500 mb-1.5 sm:mb-2">
                <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
                  {stat.label}
                </span>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-neutral-150 dark:border-neutral-900 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-lg font-extrabold tracking-tight">Pending Host Applications</h2>
            <Link
              to="/admin/organizations"
              className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="border border-neutral-150 dark:border-neutral-900 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm p-5">
          <h2 className="text-lg font-extrabold tracking-tight mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {(
              [
                {
                  to: '/admin/ops?status=REQUESTED',
                  icon: FolderKanban,
                  wrap: 'bg-amber-50 dark:bg-amber-950/30',
                  iconColor: 'text-amber-600',
                  title: 'Ops request inbox',
                },
                {
                  to: '/admin/organizations',
                  icon: Building2,
                  wrap: 'bg-amber-50 dark:bg-amber-950/30',
                  iconColor: 'text-amber-600',
                  title: 'Review Host Applications',
                },
                {
                  to: '/admin/staff',
                  icon: Users,
                  wrap: 'bg-blue-50 dark:bg-blue-950/30',
                  iconColor: 'text-blue-600',
                  title: 'Staff roster',
                  sub: 'Create or promote staff',
                },
                {
                  to: '/admin/support',
                  icon: MessageSquare,
                  wrap: 'bg-rose-50 dark:bg-rose-950/30',
                  iconColor: 'text-rose-600',
                  title: 'Help & Support',
                },
                {
                  to: '/admin/events',
                  icon: Sparkles,
                  wrap: 'bg-amber-50 dark:bg-amber-950/30',
                  iconColor: 'text-amber-600',
                  title: 'Events & promotions',
                  sub: 'Promote carousel · transfer orgs',
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.wrap}`}
                    >
                      <Icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{item.title}</p>
                      {'sub' in item && item.sub ? (
                        <p className="text-xs text-neutral-500">{item.sub}</p>
                      ) : (
                        <Skeleton className="h-3 w-28 mt-1 rounded-md" />
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
                </Link>
              );
            })}
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

  const pendingOps = stats?.pendingOpsRequests ?? 0;

  const statCards = [
    { label: 'Platform earnings', value: formatNaira(stats?.platformRevenue ?? 0), icon: Wallet, color: 'text-rose-500' },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Pending Hosts', value: stats?.pendingHosts ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Ops requests', value: pendingOps, icon: FolderKanban, color: 'text-amber-500' },
    { label: 'Open Support', value: stats?.openSupportTickets ?? 0, icon: MessageSquare, color: 'text-rose-500' },
  ];

  return (
    <div className="py-4 px-2 sm:py-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <PageHeader
        title="Admin"
        accent="Dashboard"
        description={`Welcome, ${user?.firstName}. Review host applications, ops requests, and manage the platform.`}
      />

      {isLoading ? (
        <AdminDashboardSkeleton />
      ) : (
        <>
          {pendingOps > 0 && (
            <Link
              to="/admin/ops?status=REQUESTED"
              className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <FolderKanban className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    {pendingOps} ops request{pendingOps === 1 ? '' : 's'} waiting
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                    Organizers asked for PartyStorm gate coverage — review and assign staff.
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-500 shrink-0" />
            </Link>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-3 sm:p-5 bg-white dark:bg-neutral-900 shadow-sm"
                >
                  <div className="flex justify-between items-center text-neutral-400 dark:text-neutral-500 mb-1.5 sm:mb-2">
                    <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
                      {stat.label}
                    </span>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-neutral-150 dark:border-neutral-900 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-lg font-extrabold tracking-tight">Pending Host Applications</h2>
                <Link
                  to="/admin/organizations"
                  className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {pendingHosts.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-neutral-500 text-center">No pending applications</p>
                ) : (
                  pendingHosts.slice(0, 5).map((org: any) => (
                    <div key={org.id} className="px-5 py-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{org.name}</p>
                        <p className="text-xs text-neutral-500 truncate">
                          {org.owner?.firstName} {org.owner?.lastName} · {org.owner?.email}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600">
                        Pending
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-neutral-150 dark:border-neutral-900 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm p-5">
              <h2 className="text-lg font-extrabold tracking-tight mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/admin/ops?status=REQUESTED"
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Ops request inbox</p>
                      <p className="text-xs text-neutral-500">{pendingOps} waiting for review</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </Link>
                <Link
                  to="/admin/organizations"
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Review Host Applications</p>
                      <p className="text-xs text-neutral-500">{stats?.pendingHosts ?? 0} waiting for approval</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </Link>
                <Link
                  to="/admin/staff"
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Staff roster</p>
                      <p className="text-xs text-neutral-500">Create or promote staff</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </Link>
                <Link
                  to="/admin/support"
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Help & Support</p>
                      <p className="text-xs text-neutral-500">{stats?.openSupportTickets ?? 0} open tickets</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </Link>
                <Link
                  to="/admin/events"
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Events & promotions</p>
                      <p className="text-xs text-neutral-500">Promote carousel · transfer orgs</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
