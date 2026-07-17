import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, FolderKanban, Shield } from 'lucide-react';
import api from '../services/api';
import { queryKeys } from '../lib/queryKeys';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/ui/skeleton';

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  LINKED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  CLOSED: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800',
};

function StaffOrgsSkeleton() {
  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-1">
          Coverage
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Org coverage
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Standing access to every event under these organisations — you keep coverage as new
          events go live, without a new assignment each time.
        </p>
      </header>
      <ul className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <Skeleton className="h-4 w-2/3 max-w-[200px] rounded-md" />
            </div>
            <Skeleton className="h-3 w-12 rounded-md shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StaffProjectsSkeleton() {
  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-1">
          Assignments
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Ops projects
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Jobs where PartyStorm is running gate ops for an organiser.
        </p>
      </header>

      <div className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 px-4 py-3.5">
        <p className="text-sm font-bold text-neutral-900 dark:text-white">What is an ops project?</p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
          An ops project is a PartyStorm coverage job for an organisation (and often a specific
          event). Admins accept organizer requests, assign you, and link the event when it exists.
          Status flow:{' '}
          <span className="font-semibold">REQUESTED</span> →{' '}
          <span className="font-semibold">ACTIVE</span> →{' '}
          <span className="font-semibold">LINKED</span> →{' '}
          <span className="font-semibold">CLOSED</span>. You can also get standing{' '}
          <Link to="/staff/orgs" className="text-rose-500 font-semibold hover:underline">
            org coverage
          </Link>{' '}
          so you keep gate access across that org’s events without a new project each time.
        </p>
      </div>

      <ul className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-4">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
              <Skeleton className="h-3 w-1/3 rounded-md" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const StaffOrgsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.staff.home(),
    queryFn: async () => (await api.staff.getHome()).data,
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });

  if (isLoading) {
    return <StaffOrgsSkeleton />;
  }

  if (error || !data?.profile) {
    return (
      <div className="text-center py-16">
        <Shield className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
        <p className="text-sm text-neutral-500 mb-4">Staff access required.</p>
        <Link to="/">
          <Button variant="outline" className="rounded-full">
            Home
          </Button>
        </Link>
      </div>
    );
  }

  const orgs = data.orgCoverage || [];

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-1">
          Coverage
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Org coverage
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Standing access to every event under these organisations — you keep coverage as new
          events go live, without a new assignment each time.
        </p>
      </header>

      {orgs.length === 0 ? (
        <p className="text-sm text-neutral-500 py-10 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
          No standing org coverage yet. Ask an admin to assign you, or get placed on an ops
          project.
        </p>
      ) : (
        <ul className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
          {orgs.map((o: any) => (
            <li
              key={o.organizationId}
              className="flex items-center justify-between gap-3 px-4 py-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 shrink-0">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="text-sm font-bold truncate">{o.organizationName}</span>
              </div>
              <span className="text-xs text-neutral-400 shrink-0 tabular-nums">
                {o.gatePinCount || 0} PIN{(o.gatePinCount || 0) === 1 ? '' : 's'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const StaffProjectsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.staff.home(),
    queryFn: async () => (await api.staff.getHome()).data,
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });

  if (isLoading) {
    return <StaffProjectsSkeleton />;
  }

  if (error || !data?.profile) {
    return (
      <div className="text-center py-16">
        <Shield className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
        <p className="text-sm text-neutral-500 mb-4">Staff access required.</p>
        <Link to="/">
          <Button variant="outline" className="rounded-full">
            Home
          </Button>
        </Link>
      </div>
    );
  }

  const projects = data.projects || [];

  return (
    <div className="space-y-5 pb-4">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-1">
          Assignments
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Ops projects
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Jobs where PartyStorm is running gate ops for an organiser.
        </p>
      </header>

      <div className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 px-4 py-3.5">
        <p className="text-sm font-bold text-neutral-900 dark:text-white">What is an ops project?</p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
          An ops project is a PartyStorm coverage job for an organisation (and often a specific
          event). Admins accept organizer requests, assign you, and link the event when it exists.
          Status flow:{' '}
          <span className="font-semibold">REQUESTED</span> →{' '}
          <span className="font-semibold">ACTIVE</span> →{' '}
          <span className="font-semibold">LINKED</span> →{' '}
          <span className="font-semibold">CLOSED</span>. You can also get standing{' '}
          <Link to="/staff/orgs" className="text-rose-500 font-semibold hover:underline">
            org coverage
          </Link>{' '}
          so you keep gate access across that org’s events without a new project each time.
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-neutral-500 py-10 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
          No ops projects assigned yet. You’ll see ACTIVE and LINKED jobs here when an admin puts
          you on them.
        </p>
      ) : (
        <ul className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
          {projects.map((p: any) => (
            <li key={p.id} className="flex items-start gap-3 px-4 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 shrink-0">
                <FolderKanban className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">{p.title}</p>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md',
                      STATUS_STYLE[p.status] || STATUS_STYLE.CLOSED
                    )}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {p.organizationName || 'No org'}
                  {p.eventTitle ? ` · ${p.eventTitle}` : ' · event not linked yet'}
                </p>
                {(p.assignedStaff || []).length > 0 && (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Team: {(p.assignedStaff as any[]).map((s) => s.name).join(', ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
