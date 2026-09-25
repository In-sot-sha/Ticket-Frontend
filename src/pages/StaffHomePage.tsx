import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Building2,
  ScanLine,
  UserPlus,
  Shield,
  CheckCircle2,
  Circle,
  KeyRound,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { queryKeys } from '../lib/queryKeys';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/ui/skeleton';

const PAGE_SIZE = 5;

function formatWhen(iso?: string) {
  if (!iso) return 'Date TBD';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function StaffHomeSkeleton({ firstName }: { firstName?: string }) {
  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 pb-3">
        <div className="space-y-1">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-3.5 w-64 rounded-md" />
        </div>
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      <Skeleton className="h-20 w-full rounded-2xl" />

      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}

const StaffHomePage: React.FC = () => {
  const { user } = useAuth();
  const [upcomingPage, setUpcomingPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.staff.home(),
    queryFn: async () => {
      const res = await api.staff.getHome();
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });

  const todayGates = data?.todayGates || [];
  const events = data?.events || [];
  const upcoming = useMemo(
    () => (events as any[]).filter((e: any) => !e.isToday),
    [events]
  );
  const upcomingTotalPages = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE));
  const upcomingSlice = useMemo(() => {
    const page = Math.min(upcomingPage, upcomingTotalPages);
    const start = (page - 1) * PAGE_SIZE;
    return upcoming.slice(start, start + PAGE_SIZE);
  }, [upcoming, upcomingPage, upcomingTotalPages]);

  const orgs = data?.orgCoverage || [];

  if (isLoading) {
    return <StaffHomeSkeleton firstName={user?.firstName} />;
  }

  if (error || !data?.profile) {
    return (
      <div className="py-16 text-center">
        <Shield className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Staff Access Required</h1>
        <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
          Your account is not marked as active PartyStorm staff, or your profile is disabled.
        </p>
        <Link to="/">
          <Button variant="outline" className="rounded-full">
            Back Home
          </Button>
        </Link>
      </div>
    );
  }

  const caps = (data.profile.capabilities || []) as string[];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 pt-1 text-neutral-900 dark:text-neutral-100">
      {/* Compact Page Header */}
      <PageHeader
        title="Staff"
        accent="Workspace"
        description="Gate check-in scanning, live attendee walk-in sales, and standing organization authorizations."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/staff/scan">
              <Button className="h-8.5 rounded-lg bg-rose-500 px-3.5 text-xs font-semibold text-white hover:bg-rose-600 shadow-xs">
                <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                Launch Scanner
              </Button>
            </Link>
          </div>
        }
      />

      {/* Staff Capabilities & Compact Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric: Today's Gates */}
        <div className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Today's Gates</p>
            <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-0.5">
              {todayGates.length}
            </p>
          </div>
          <span className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold',
            todayGates.length > 0
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
          )}>
            <ScanLine className="h-4 w-4" />
          </span>
        </div>

        {/* Metric: Upcoming Covered */}
        <div className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Upcoming Events</p>
            <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-0.5">
              {upcoming.length}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Calendar className="h-4 w-4" />
          </span>
        </div>

        {/* Metric: Org Coverage */}
        <div className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Orgs Covered</p>
            <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-0.5">
              {orgs.length}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Building2 className="h-4 w-4" />
          </span>
        </div>

        {/* Staff Capabilities Badges */}
        <div className="flex flex-col justify-center rounded-xl border border-neutral-200/80 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            Authorizations
          </p>
          <div className="flex flex-wrap gap-1">
            {caps.length > 0 ? (
              caps.map((cap) => (
                <span
                  key={cap}
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30"
                >
                  {cap.replace(/_/g, ' ')}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-semibold text-neutral-500">Gate Scanner</span>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Fast Scanner Card */}
      <Link
        to="/staff/scan"
        className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white p-4 shadow-sm hover:from-rose-600 hover:to-rose-700 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 shrink-0 shadow-inner">
            <ScanLine className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-extrabold leading-tight">Launch Gate Scanner</p>
            <p className="text-xs text-rose-100 mt-0.5">
              Check in attendees instantly with camera or barcode reader · No PIN required for staff
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 opacity-80 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* SECTION: Today's Gate */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Today's Covered Gates
            </h2>
          </div>
          {todayGates.length > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              {todayGates.length} Active Today
            </span>
          )}
        </div>

        {todayGates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/20 p-8 text-center">
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              No events scheduled for gate duty today.
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              Upcoming covered events are shown below. Use the scanner whenever a covered gate opens.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayGates.map((ev: any) => (
              <li
                key={ev.id}
                className="rounded-2xl border border-rose-200/80 bg-white dark:border-rose-900/40 dark:bg-neutral-900 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500 text-white">
                          Today
                        </span>
                        {ev.checklistReady ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Gate Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Setup Needed
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-base text-neutral-900 dark:text-white leading-snug mt-1.5 truncate">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                        {formatWhen(ev.startDate)}
                        {ev.organizationName ? ` · ${ev.organizationName}` : ''}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Checklist */}
                  {ev.checklist && ev.checklist.length > 0 && (
                    <ul className="space-y-1.5 rounded-xl border border-neutral-100 bg-neutral-50/60 p-2.5 dark:border-neutral-800 dark:bg-neutral-950/40 text-xs">
                      {ev.checklist.map((item: any) => (
                        <li key={item.id} className="flex items-center gap-2">
                          {item.done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          )}
                          <span
                            className={cn(
                              item.done
                                ? 'text-neutral-700 dark:text-neutral-200 font-medium'
                                : 'text-amber-700 dark:text-amber-300 font-medium'
                            )}
                          >
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <KeyRound className="h-3.5 w-3.5 text-neutral-400" />
                      {ev.gatePinCount || 0} org PIN{ev.gatePinCount === 1 ? '' : 's'}
                    </span>
                    {(ev.assignedStaff || []).length > 0 && (
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <Users className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">
                          {(ev.assignedStaff as any[]).map((s) => s.name).join(', ')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Door Action Buttons */}
                <div className="grid grid-cols-2 gap-px bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-100 dark:border-neutral-800">
                  {ev.canWalkIn !== false ? (
                    <Link
                      to={`/staff/events/${ev.id}/walk-in`}
                      className="flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-900 py-3 text-xs font-bold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-rose-500" />
                      Issue Walk-in
                    </Link>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-900 py-3 text-xs font-medium text-neutral-400">
                      Walk-in Closed
                    </span>
                  )}
                  {ev.canScan !== false ? (
                    <Link
                      to="/staff/scan"
                      className="flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-900 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <ScanLine className="h-3.5 w-3.5" />
                      Scan Gate
                    </Link>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-900 py-3 text-xs font-medium text-neutral-400">
                      Scan Closed
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION: Upcoming Covered Events */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Upcoming Covered Events
            </h2>
          </div>
          {upcoming.length > 0 && (
            <span className="text-xs text-neutral-400 font-semibold">{upcoming.length} events</span>
          )}
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/20 p-6 text-center text-xs text-neutral-500">
            No other upcoming covered events.
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden shadow-2xs">
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
              {upcomingSlice.map((ev: any) => (
                <li key={ev.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-neutral-900 dark:text-white leading-snug truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {formatWhen(ev.startDate)}
                      {ev.organizationName ? ` · ${ev.organizationName}` : ''}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ev.canWalkIn !== false && (
                      <Link to={`/staff/events/${ev.id}/walk-in`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-xs font-semibold px-2.5 border-neutral-200 dark:border-neutral-700"
                        >
                          <UserPlus className="h-3 w-3 mr-1 text-neutral-500" />
                          Walk-in
                        </Button>
                      </Link>
                    )}
                    {ev.canScan !== false && (
                      <Link to="/staff/scan">
                        <Button
                          size="sm"
                          className="h-8 rounded-lg text-xs font-semibold px-3 bg-rose-500 hover:bg-rose-600 text-white shadow-2xs"
                        >
                          <ScanLine className="h-3 w-3 mr-1" />
                          Scan
                        </Button>
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {upcomingTotalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg text-xs h-7.5 px-2.5"
                  disabled={upcomingPage <= 1}
                  onClick={() => setUpcomingPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>
                <span className="text-xs text-neutral-500 font-medium">
                  Page {upcomingPage} of {upcomingTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg text-xs h-7.5 px-2.5"
                  disabled={upcomingPage >= upcomingTotalPages}
                  onClick={() => setUpcomingPage((p) => Math.min(upcomingTotalPages, p + 1))}
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION: Standing Org Coverage */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Standing Organization Coverage
            </h2>
          </div>
          <Link to="/staff/orgs" className="text-xs font-bold text-rose-500 hover:underline">
            View All ({orgs.length})
          </Link>
        </div>

        {orgs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/20 p-6 text-center text-xs text-neutral-500">
            No standing organization coverage assigned. An admin can grant you coverage for host organizations.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {orgs.slice(0, 6).map((o: any) => (
              <div
                key={o.organizationId}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-bold text-xs shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                      {o.organizationName}
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Standing Gate Access
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 shrink-0">
                  {o.gatePinCount || 0} PIN{(o.gatePinCount || 0) === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StaffHomePage;
