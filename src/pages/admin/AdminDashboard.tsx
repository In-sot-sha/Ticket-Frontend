import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Calendar,
  Ticket,
  ChevronRight,
  Clock,
  Shield,
  Wallet,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminStats, useHostApplications } from '../../hooks/queries/useAdmin';
import { Spinner } from '../../components/ui/Spinner';
import { formatNaira } from '../../lib/eventOrganizer';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useAdminStats();
  const { data: pendingHosts = [] } = useHostApplications('pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner />
      </div>
    );
  }

  const statCards = [
    { label: 'Platform earnings', value: formatNaira(stats?.platformRevenue ?? 0), icon: Wallet, color: 'text-rose-500' },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Pending Hosts', value: stats?.pendingHosts ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Open Support', value: stats?.openSupportTickets ?? 0, icon: MessageSquare, color: 'text-rose-500' },
    { label: 'Paid Orders', value: stats?.totalOrders ?? 0, icon: Ticket, color: 'text-emerald-500' },
  ];

  return (
    <div className="py-4 px-2 sm:py-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <div className="mb-6 border-b border-neutral-100 dark:border-neutral-900 pb-4 sm:pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-rose-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500">System Admin</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Admin <span className="text-rose-500">Dashboard</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Welcome, {user?.firstName}. Review host applications and manage the platform.
        </p>
      </div>

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
              to="/admin/host-applications"
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
              to="/admin/host-applications"
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
              to="/admin/users"
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">Manage Users</p>
                  <p className="text-xs text-neutral-500">{stats?.totalUsers ?? 0} registered users</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </Link>
            <Link
              to="/admin/transactions"
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">Transactions & Revenue</p>
                  <p className="text-xs text-neutral-500">{stats?.platformFeePercent ?? 5}% platform fee · {formatNaira(stats?.platformRevenue ?? 0)} earned</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
