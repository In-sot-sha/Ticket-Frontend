import React, { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Shield, ScanLine, Search, KeyRound } from 'lucide-react';
import api from '../services/api';
import { queryKeys } from '../lib/queryKeys';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/skeleton';

function StaffOrgsSkeleton() {
  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 pb-3">
        <div className="space-y-1">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-3.5 w-64 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export const StaffOrgsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.staff.home(),
    queryFn: async () => (await api.staff.getHome()).data,
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });

  const orgs = (data?.orgCoverage || []) as any[];

  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) return orgs;
    const q = searchQuery.toLowerCase().trim();
    return orgs.filter((o) => (o.organizationName || '').toLowerCase().includes(q));
  }, [orgs, searchQuery]);

  if (isLoading) {
    return <StaffOrgsSkeleton />;
  }

  if (error || !data?.profile) {
    return (
      <div className="text-center py-16">
        <Shield className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-1">
          Staff Access Required
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          You need an active staff profile to view organization coverage.
        </p>
        <Link to="/">
          <Button variant="outline" className="rounded-full text-xs">
            Back Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 pt-1 text-neutral-900 dark:text-neutral-100">
      <PageHeader
        title="Organization"
        accent="Coverage"
        description="Standing gate scan permissions across all events hosted by these organizations."
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              {orgs.length} Covered {orgs.length === 1 ? 'Organization' : 'Organizations'}
            </span>
            <Link to="/staff/scan">
              <Button className="h-8.5 rounded-lg bg-rose-500 px-3 text-xs font-semibold text-white hover:bg-rose-600 shadow-xs">
                <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                Scanner
              </Button>
            </Link>
          </div>
        }
      />

      {/* Search Bar */}
      {orgs.length > 3 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search covered organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
        </div>
      )}

      {orgs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/20 p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-2" />
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            No Standing Coverage Assigned
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            You do not currently have standing organization coverage. Contact an administrator to grant you access to host organizations.
          </p>
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-500">
          No organizations match "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOrgs.map((o: any) => (
            <div
              key={o.organizationId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-bold text-sm shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                    {o.organizationName}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Standing Gate Access
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 rounded-lg bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                <KeyRound className="h-3 w-3 text-neutral-400" />
                <span>{o.gatePinCount || 0} PIN{(o.gatePinCount || 0) === 1 ? '' : 's'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const StaffProjectsPage: React.FC = () => {
  return <Navigate to="/staff" replace />;
};
