import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  UserPlus,
  Calendar,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/skeleton';
import { useStaffAccess } from '../hooks/useStaffAccess';

function formatWhen(iso?: string) {
  if (!iso) return 'Date TBD';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const StaffWalkInPage: React.FC = () => {
  const { canWalkIn, todayGates, events, isLoading } = useStaffAccess();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 pb-12">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
        <div className="grid gap-3 pt-2">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!canWalkIn) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-extrabold text-neutral-900 dark:text-white">
          Walk-in Sale Access Not Assigned
        </h1>
        <p className="mt-2 text-xs text-neutral-500">
          Your staff account does not currently have permission to issue gate walk-in tickets.
          Please contact an event manager or administrator if you require this capability.
        </p>
        <Link to="/staff" className="mt-5 inline-block">
          <Button variant="outline" className="rounded-xl text-xs">
            Back to Staff Home
          </Button>
        </Link>
      </div>
    );
  }

  const todayWalkInEvents = todayGates.filter((e: any) => e.canWalkIn !== false);
  const otherWalkInEvents = events.filter((e: any) => !e.isToday && e.canWalkIn !== false);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12 text-neutral-900 dark:text-neutral-100">
      <PageHeader
        title="Gate"
        accent="Walk-in Sales"
        description="Select an event on your gate coverage to issue tickets and register walk-in attendees live."
      />

      {/* Today's Gate Coverage */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Active Events Today
            </h2>
          </div>
          {todayWalkInEvents.length > 0 && (
            <span className="rounded-full bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              {todayWalkInEvents.length} Ready
            </span>
          )}
        </div>

        {todayWalkInEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 p-6 text-center text-xs text-neutral-500">
            No events scheduled for gate walk-in duty today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {todayWalkInEvents.map((ev: any) => (
              <div
                key={ev.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-neutral-900 p-4 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      Today
                    </span>
                    {ev.organizationName && (
                      <span className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                        {ev.organizationName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white leading-snug">
                    {ev.title}
                  </h3>

                  <div className="space-y-1 text-xs text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span>{formatWhen(ev.startDate)}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Link
                    to={`/staff/events/${ev.id}/walk-in`}
                    className="flex w-full items-center justify-between rounded-xl bg-rose-500 hover:bg-rose-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-2xs transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Start Walk-in Sale
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Assigned Events */}
      {otherWalkInEvents.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Upcoming Assigned Events
            </h2>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {otherWalkInEvents.map((ev: any) => (
                <li
                  key={ev.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {formatWhen(ev.startDate)}
                      {ev.organizationName ? ` · ${ev.organizationName}` : ''}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>

                  <Link to={`/staff/events/${ev.id}/walk-in`} className="shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs font-semibold gap-1.5 border-neutral-200 dark:border-neutral-700 hover:border-rose-400"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-rose-500" />
                      Open Gate Sale
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
};

export default StaffWalkInPage;
