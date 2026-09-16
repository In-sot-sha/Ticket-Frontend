import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Link2, UserPlus, Inbox, Check } from 'lucide-react';
import api from '../../services/api';
import { queryKeys } from '../../lib/queryKeys';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, DataTableSkeleton, type DataTableColumn } from '../../components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useAdminStats, useHostApplications } from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

const STATUSES = ['all', 'REQUESTED', 'ACTIVE', 'LINKED', 'CLOSED'] as const;

const AdminOpsProjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = searchParams.get('status');
  const initialStatus =
    statusFromUrl && STATUSES.includes(statusFromUrl as (typeof STATUSES)[number])
      ? statusFromUrl
      : 'REQUESTED';

  const [status, setStatus] = useState<string>(initialStatus);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [notes, setNotes] = useState('');
  const [manageId, setManageId] = useState<number | null>(null);
  const [linkEventId, setLinkEventId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [search, setSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  useEffect(() => {
    if (statusFromUrl && STATUSES.includes(statusFromUrl as (typeof STATUSES)[number])) {
      setStatus(statusFromUrl);
    }
  }, [statusFromUrl]);

  const setStatusFilter = (next: string) => {
    setStatus(next);
    if (next === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ status: next }, { replace: true });
    }
  };

  const { data: stats } = useAdminStats();
  const pendingOps = stats?.pendingOpsRequests ?? 0;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: queryKeys.admin.opsProjects(status),
    queryFn: async () => {
      const res = await api.admin.getOpsProjects(status === 'all' ? undefined : status);
      return res.data?.projects || [];
    },
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });

  /** Keep manage dialog alive after Accept moves a project out of the REQUESTED filter */
  const { data: managedProject } = useQuery({
    queryKey: [...queryKeys.admin.opsProjects('all'), 'manage', manageId],
    queryFn: async () => {
      const res = await api.admin.getOpsProjects();
      return (res.data?.projects || []).find((p: any) => p.id === manageId) || null;
    },
    enabled: manageId != null,
    staleTime: 0,
  });

  const { data: orgs = [] } = useHostApplications('all');
  const { data: staffRes } = useQuery({
    queryKey: queryKeys.admin.staff(),
    queryFn: async () => {
      const res = await api.admin.getStaff();
      return res.data?.staff || [];
    },
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: queryKeys.admin.events(eventSearch),
    queryFn: async () => {
      const res = await api.admin.getEvents({ search: eventSearch || undefined });
      return res.data || [];
    },
    staleTime: 30_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.all, 'ops-projects'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
  };

  const create = useMutation({
    mutationFn: () =>
      api.admin.createOpsProject({
        title,
        organizationId: organizationId ? Number(organizationId) : null,
        notes: notes || undefined,
        status: 'REQUESTED',
        services: ['GATE', 'SCAN', 'WALK_IN'],
      }),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setTitle('');
      setOrganizationId('');
      setNotes('');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: number; [k: string]: any }) =>
      api.admin.updateOpsProject(id, data),
    onSuccess: (_res, vars) => {
      invalidate();
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.opsProjects('all'), 'manage', vars.id],
      });
      if (vars.status === 'ACTIVE' && manageId === vars.id) {
        setStatusFilter('ACTIVE');
      }
      if (vars.status === 'LINKED' && manageId === vars.id) {
        setStatusFilter('LINKED');
      }
    },
  });

  const assign = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      api.admin.assignOpsStaff(projectId, { userId }),
    onSuccess: (_res, vars) => {
      invalidate();
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.opsProjects('all'), 'manage', vars.projectId],
      });
    },
  });

  const removeStaff = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      api.admin.removeOpsStaff(projectId, userId),
    onSuccess: (_res, vars) => {
      invalidate();
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.opsProjects('all'), 'manage', vars.projectId],
      });
    },
  });

  const filtered = projects.filter((p: any) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      p.title?.toLowerCase().includes(q) ||
      p.organization?.name?.toLowerCase().includes(q) ||
      p.event?.title?.toLowerCase().includes(q)
    );
  });

  const managed =
    managedProject || projects.find((p: any) => p.id === manageId) || null;

  const openManage = (p: any) => {
    setManageId(p.id);
    setLinkEventId(p.eventId ? String(p.eventId) : '');
    setAssignUserId('');
    setEventSearch('');
  };

  const acceptProject = (p: any) => {
    setManageId(p.id);
    setLinkEventId(p.eventId ? String(p.eventId) : '');
    setAssignUserId('');
    setEventSearch('');
    update.mutate({ id: p.id, status: 'ACTIVE' });
  };

  const linkableEvents = React.useMemo(() => {
    if (!managed) return [];
    const orgId = managed.organizationId || managed.organization?.id;
    return (allEvents as any[]).filter((ev) => {
      if (orgId && ev.organization?.id !== orgId && ev.organizationId !== orgId) {
        return false;
      }
      return true;
    });
  }, [allEvents, managed]);

  const columns: DataTableColumn<any>[] = [
    {
      id: 'title',
      header: 'Project',
      cell: (p) => (
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{p.title}</p>
          <p className="text-xs text-neutral-500 truncate">
            {p.organization?.name || 'No org'}
            {p.event ? ` · ${p.event.title}` : ' · no event linked'}
          </p>
          {p.notes ? (
            <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{p.notes}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (p) => (
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full',
            p.status === 'REQUESTED'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
              : 'bg-neutral-100 dark:bg-neutral-800'
          )}
        >
          {p.status}
        </span>
      ),
    },
    {
      id: 'staff',
      header: 'Staff',
      cell: (p) => (
        <span className="text-xs text-neutral-500">
          {(p.assignments || []).length
            ? (p.assignments || [])
                .map((a: any) => `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim())
                .join(', ')
            : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      hideOnMobile: true,
      cell: (p) => (
        <div className="flex items-center gap-2 justify-end">
          {p.status === 'REQUESTED' && (
            <Button
              size="sm"
              className="rounded-full text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              disabled={update.isPending}
              onClick={(e) => {
                e.stopPropagation();
                acceptProject(p);
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Accept
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              openManage(p);
            }}
          >
            Manage
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="py-4 px-2 max-w-7xl mx-auto pb-8">
      <PageHeader
        title="Ops"
        accent="projects"
        description="PartyStorm gate jobs for an org (and optionally an event). Accept requests, assign staff, link the event when it exists."
        actions={
          <Button
            className="bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New project
          </Button>
        }
      />

      <div className="mb-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3.5">
        <p className="text-sm font-bold text-neutral-900 dark:text-white">What is an ops project?</p>
        <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
          A standing PartyStorm coverage job — not a separate staff account type. Organizers request
          gate help (or you create one). Flow:{' '}
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">REQUESTED</span>{' '}
          (inbox) →{' '}
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">ACTIVE</span>{' '}
          (accepted; staff can cover via org match) →{' '}
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">LINKED</span>{' '}
          (event attached) →{' '}
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">CLOSED</span>. Assign
          staff on the project and/or give them standing org coverage so they keep access for future
          events.
        </p>
      </div>

      {pendingOps > 0 && status !== 'REQUESTED' && (
        <button
          type="button"
          onClick={() => setStatusFilter('REQUESTED')}
          className="mb-6 w-full flex items-center justify-between gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 text-left hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Inbox className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                {pendingOps} request{pendingOps === 1 ? '' : 's'} in inbox
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Switch to REQUESTED to accept and assign staff.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 shrink-0">View inbox →</span>
        </button>
      )}

      {status === 'REQUESTED' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/15 px-4 py-3">
          <Inbox className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Request inbox</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Organizers asked for PartyStorm gate coverage. Accept to mark ACTIVE, then assign
              staff and link the event when ready.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <DataTableSkeleton
          rows={6}
          columns={4}
          toolbar={
            <Select value={status} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="REQUESTED">REQUESTED</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="LINKED">LINKED</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(p) => p.id}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search projects…"
          pageSize={10}
          onRowClick={openManage}
          toolbar={
            <Select value={status} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'All statuses' : s === 'REQUESTED' ? 'Inbox (REQUESTED)' : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          emptyTitle={status === 'REQUESTED' ? 'Inbox empty' : 'No ops projects'}
          emptyDescription={
            status === 'REQUESTED'
              ? 'No organizer ops requests waiting.'
              : 'Create a project or wait for organizer requests.'
          }
        />
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New ops project</DialogTitle>
            <DialogDescription>Works before an event exists — link the event later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
            />
            <Select
              value={organizationId || 'none'}
              onValueChange={(v) => setOrganizationId(v === 'none' ? '' : v)}
            >
              <SelectTrigger className="w-full h-10 rounded-xl">
                <SelectValue placeholder="Organization (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No organization</SelectItem>
                {(orgs as any[]).map((o: any) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes — city, date window, services…"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              disabled={!title.trim() || create.isPending}
              className="bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl"
              onClick={() => create.mutate()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!managed} onOpenChange={(open) => !open && setManageId(null)}>
        <DialogContent className="sm:max-w-lg">
          {managed && (
            <>
              <DialogHeader>
                <DialogTitle>{managed.title}</DialogTitle>
                <DialogDescription>
                  {managed.status}
                  {managed.organization ? ` · ${managed.organization.name}` : ''}
                  {managed.event ? ` · ${managed.event.title}` : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(['REQUESTED', 'ACTIVE', 'LINKED', 'CLOSED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={managed.status === st || update.isPending}
                    onClick={() => update.mutate({ id: managed.id, status: st })}
                    className={cn(
                      'text-[10px] font-bold px-2 py-1 rounded-full border',
                      managed.status === st
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'border-neutral-200 dark:border-neutral-700'
                    )}
                  >
                    {st === 'REQUESTED' ? 'Inbox' : st}
                  </button>
                ))}
                {managed.status === 'REQUESTED' && (
                  <Button
                    size="sm"
                    className="rounded-full text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: managed.id, status: 'ACTIVE' })}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Accept request
                  </Button>
                )}
              </div>

              {update.isError && (
                <p className="text-xs text-red-500 mb-3">
                  {(update.error as any)?.response?.data?.message || 'Failed to update project.'}
                </p>
              )}
              {assign.isError && (
                <p className="text-xs text-red-500 mb-3">
                  {(assign.error as any)?.response?.data?.message || 'Failed to assign staff.'}
                </p>
              )}

              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Link event
                </p>
                {managed.event ? (
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    Currently linked: <span className="font-semibold">{managed.event.title}</span>
                  </p>
                ) : null}
                <input
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search events by title…"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
                />
                <div className="flex gap-2">
                  <Select
                    value={linkEventId || 'none'}
                    onValueChange={(v) => setLinkEventId(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="flex-1 h-10 rounded-xl">
                      <SelectValue placeholder="Select event…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="none">Select event…</SelectItem>
                      {linkableEvents.map((ev: any) => (
                        <SelectItem key={ev.id} value={String(ev.id)}>
                          {ev.title}
                          {ev.startDate
                            ? ` · ${new Date(ev.startDate).toLocaleDateString()}`
                            : ''}
                          {ev.organization?.name ? ` · ${ev.organization.name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-10"
                    disabled={!linkEventId || update.isPending}
                    onClick={() =>
                      update.mutate({
                        id: managed.id,
                        eventId: Number(linkEventId),
                        status: 'LINKED',
                      })
                    }
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1" />
                    Link
                  </Button>
                </div>
                {managed.organizationId || managed.organization?.id ? (
                  <p className="text-[11px] text-neutral-400">
                    Showing events for this project&apos;s organization
                    {eventSearch ? ' (filtered by search)' : ''}.
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-400">
                    No org on project — showing all events{eventSearch ? ' matching search' : ''}.
                  </p>
                )}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Assigned staff
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {(managed.assignments || []).map((a: any) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800"
                  >
                    {a.user?.firstName} {a.user?.lastName}
                    <button
                      type="button"
                      className="text-red-400 font-bold"
                      onClick={() =>
                        removeStaff.mutate({ projectId: managed.id, userId: a.userId })
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Select
                  value={assignUserId || 'none'}
                  onValueChange={(v) => setAssignUserId(v === 'none' ? '' : v)}
                >
                  <SelectTrigger className="flex-1 h-10 rounded-xl">
                    <SelectValue placeholder="Assign staff…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Assign staff…</SelectItem>
                    {(staffRes || []).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-10"
                  disabled={!assignUserId || assign.isPending}
                  onClick={() => {
                    assign.mutate({ projectId: managed.id, userId: Number(assignUserId) });
                    setAssignUserId('');
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Assign
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOpsProjectsPage;
