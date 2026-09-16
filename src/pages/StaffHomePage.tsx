import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Building2,
  FolderKanban,
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
} from 'lucide-react';
import api from '../services/api';
import { queryKeys } from '../lib/queryKeys';
import { Button } from '../components/ui/Button';
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

/** Keeps static chrome; skeletons only dynamic lists/cards. */
function StaffHomeSkeleton({ firstName }: { firstName?: string }) {
  return (
    <div className="space-y-8 pb-4">
      <header className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-1">
            Gate ops
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance">
            Hi, {firstName}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Today’s checklist, walk-ins, and scan tools for your coverage.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-14 rounded-md" />
        </div>
      </header>

      <Link
        to="/staff/scan"
        className="flex items-center gap-3 w-full rounded-2xl bg-rose-500 text-white px-4 py-4 active:scale-[0.99] transition-transform"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shrink-0">
          <ScanLine className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-base font-extrabold leading-tight">Open gate scanner</span>
          <span className="block text-xs text-rose-100 mt-0.5">
            No PIN needed while signed in as staff
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 opacity-80" />
      </Link>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-rose-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Today’s gate
          </h2>
        </div>
        <ul className="space-y-3">
          {[1, 2].map((i) => (
            <li
              key={i}
              className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-white dark:bg-neutral-900 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-4/6 rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-100 dark:border-neutral-800">
                <Skeleton className="h-12 rounded-none" />
                <Skeleton className="h-12 rounded-none" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-rose-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Upcoming covered
          </h2>
        </div>
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <li key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-3 w-2/3 rounded-md" />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Org coverage
              </h2>
            </div>
            <Link to="/staff/orgs" className="text-[11px] font-bold text-rose-500">
              View all
            </Link>
          </div>
          <ul className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <li key={i} className="px-3.5 py-3 flex justify-between gap-2">
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md" />
              </li>
            ))}
          </ul>
        </section>
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-rose-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Ops projects
              </h2>
            </div>
            <Link to="/staff/projects" className="text-[11px] font-bold text-rose-500">
              View all
            </Link>
          </div>
          <ul className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <li key={i} className="px-3.5 py-3 space-y-1.5">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </li>
            ))}
          </ul>
        </section>
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

  const projects = data?.projects || [];
  const orgs = data?.orgCoverage || [];

  if (isLoading) {
    return <StaffHomeSkeleton firstName={user?.firstName} />;
  }

  if (error || !data?.profile) {
    return (
      <div className="py-16 text-center">
        <Shield className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Staff access required</h1>
        <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
          Your account is not marked as active PartyStorm staff, or your profile is disabled.
        </p>
        <Link to="/">
          <Button variant="outline" className="rounded-full">
            Back home
          </Button>
        </Link>
      </div>
    );
  }

  const caps = (data.profile.capabilities || []) as string[];

  return (
    <div className="space-y-8 pb-4">
      <header className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-1">
            Gate ops
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white text-balance">
            Hi, {user?.firstName}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Today’s checklist, walk-ins, and scan tools for your coverage.
          </p>
        </div>
        {caps.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {caps.map((cap) => (
              <span
                key={cap}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
              >
                {cap.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </header>

      <Link
        to="/staff/scan"
        className="flex items-center gap-3 w-full rounded-2xl bg-rose-500 text-white px-4 py-4 active:scale-[0.99] transition-transform"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shrink-0">
          <ScanLine className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-base font-extrabold leading-tight">Open gate scanner</span>
          <span className="block text-xs text-rose-100 mt-0.5">
            No PIN needed while signed in as staff
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 opacity-80" />
      </Link>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-rose-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Today’s gate
          </h2>
        </div>

        {todayGates.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
            No events covering today. Upcoming covered events are listed below.
          </p>
        ) : (
          <ul className="space-y-3">
            {todayGates.map((ev: any) => (
              <li
                key={ev.id}
                className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-white dark:bg-neutral-900 overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-extrabold text-base text-neutral-900 dark:text-white leading-snug">
                        {ev.title}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500 text-white shrink-0">
                        Today
                      </span>
                      {ev.checklistReady ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Ready
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          Needs attention
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                      {formatWhen(ev.startDate)}
                      {ev.organizationName ? ` · ${ev.organizationName}` : ''}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {(ev.checklist || []).map((item: any) => (
                      <li key={item.id} className="flex items-center gap-2 text-sm">
                        {item.done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-amber-400 shrink-0" />
                        )}
                        <span
                          className={cn(
                            item.done
                              ? 'text-neutral-700 dark:text-neutral-200'
                              : 'text-amber-700 dark:text-amber-300'
                          )}
                        >
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <KeyRound className="h-3.5 w-3.5" />
                      {ev.gatePinCount || 0} org PIN{ev.gatePinCount === 1 ? '' : 's'}
                    </span>
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {(ev.assignedStaff || []).length
                          ? (ev.assignedStaff as any[]).map((s) => s.name).join(', ')
                          : 'No ops team listed'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-100 dark:border-neutral-800">
                  {ev.canWalkIn !== false ? (
                    <Link
                      to={`/staff/events/${ev.id}/walk-in`}
                      className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 py-3.5 text-sm font-bold text-neutral-800 dark:text-neutral-100 active:bg-neutral-50 dark:active:bg-neutral-800"
                    >
                      <UserPlus className="h-4 w-4 text-rose-500" />
                      Walk-in
                    </Link>
                  ) : (
                    <span className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 py-3.5 text-sm font-medium text-neutral-300">
                      Walk-in
                    </span>
                  )}
                  {ev.canScan !== false ? (
                    <Link
                      to="/staff/scan"
                      className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 py-3.5 text-sm font-bold text-rose-600 dark:text-rose-400 active:bg-rose-50 dark:active:bg-rose-950/20"
                    >
                      <ScanLine className="h-4 w-4" />
                      Scan
                    </Link>
                  ) : (
                    <span className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 py-3.5 text-sm font-medium text-neutral-300">
                      Scan
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Upcoming covered
            </h2>
          </div>
          {upcoming.length > 0 && (
            <span className="text-[11px] text-neutral-400 tabular-nums">{upcoming.length}</span>
          )}
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
            No other upcoming covered events.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
              {upcomingSlice.map((ev: any) => (
                <li key={ev.id} className="p-4 space-y-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-neutral-900 dark:text-white leading-snug">
                      {ev.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatWhen(ev.startDate)}
                      {ev.organizationName ? ` · ${ev.organizationName}` : ''}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(ev.canWalkIn !== false) && (
                      <Link to={`/staff/events/${ev.id}/walk-in`} className="flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-full text-xs h-10 border-neutral-200 dark:border-neutral-700"
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                          Walk-in
                        </Button>
                      </Link>
                    )}
                    {(ev.canScan !== false) && (
                      <Link to="/staff/scan" className="flex-1">
                        <Button
                          size="sm"
                          className="w-full rounded-full text-xs h-10 bg-rose-500 hover:bg-rose-600 text-white border-0"
                        >
                          <ScanLine className="h-3.5 w-3.5 mr-1.5" />
                          Scan
                        </Button>
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {upcomingTotalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs h-9"
                  disabled={upcomingPage <= 1}
                  onClick={() => setUpcomingPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Prev
                </Button>
                <span className="text-xs text-neutral-500 tabular-nums">
                  {Math.min(upcomingPage, upcomingTotalPages)} / {upcomingTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs h-9"
                  disabled={upcomingPage >= upcomingTotalPages}
                  onClick={() =>
                    setUpcomingPage((p) => Math.min(upcomingTotalPages, p + 1))
                  }
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Org coverage
              </h2>
            </div>
            <Link to="/staff/orgs" className="text-[11px] font-bold text-rose-500">
              View all
            </Link>
          </div>
          {orgs.length === 0 ? (
            <p className="text-sm text-neutral-500">No standing org coverage.</p>
          ) : (
            <ul className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
              {orgs.slice(0, 4).map((o: any) => (
                <li
                  key={o.organizationId}
                  className="flex justify-between gap-2 px-3.5 py-3 text-sm font-medium"
                >
                  <span className="truncate">{o.organizationName}</span>
                  <span className="text-xs text-neutral-400 font-normal shrink-0">
                    {o.gatePinCount || 0} PIN{(o.gatePinCount || 0) === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-rose-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Ops projects
              </h2>
            </div>
            <Link to="/staff/projects" className="text-[11px] font-bold text-rose-500">
              View all
            </Link>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-neutral-500">No active projects assigned.</p>
          ) : (
            <ul className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
              {projects.slice(0, 4).map((p: any) => (
                <li key={p.id} className="px-3.5 py-3">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                    {p.status}
                    {p.organizationName ? ` · ${p.organizationName}` : ''}
                    {p.eventTitle ? ` · ${p.eventTitle}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default StaffHomePage;
