import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, X, Copy, Check, Search } from 'lucide-react';
import api from '../../services/api';
import { queryKeys } from '../../lib/queryKeys';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/skeleton';
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
import { useHostApplications } from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

const CAPS = ['SCAN', 'WALK_IN_SALE', 'CHECK_IN', 'GATE_MANAGE', 'SUPPORT'] as const;

const CAP_HELP: Record<string, string> = {
  SCAN: 'Open gate scanner and validate QR tickets',
  WALK_IN_SALE: 'Register / sell walk-in tickets at the gate',
  CHECK_IN: 'Manual check-in for guests already ticketed',
  GATE_MANAGE: 'Gate-day checklist and ops coordination',
  SUPPORT: 'Field issues escalate via staff support to admins',
};

function parseCaps(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

const AdminStaffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [manageId, setManageId] = useState<number | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    capabilities: [...CAPS.slice(0, 3)] as string[],
    organizationId: '',
  });
  const [createdCred, setCreatedCred] = useState<{
    email: string;
    password: string | null;
    inviteSent: boolean;
    promoted: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingCaps, setEditingCaps] = useState<string[]>([]);
  const [coverageOrgId, setCoverageOrgId] = useState('');
  const [manageMsg, setManageMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [promoteCaps, setPromoteCaps] = useState<string[]>([...CAPS.slice(0, 3)]);
  const [promoteOrgId, setPromoteOrgId] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const { data: staffRes, isLoading } = useQuery({
    queryKey: queryKeys.admin.staff(),
    queryFn: async () => {
      const res = await api.admin.getStaff();
      return res.data?.staff || [];
    },
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });

  const { data: orgs = [] } = useHostApplications('all');
  const staff = staffRes || [];
  const staffIds = useMemo(() => new Set(staff.map((s: any) => s.id)), [staff]);

  const { data: searchedUsers = [], isFetching: usersLoading } = useQuery({
    queryKey: queryKeys.admin.users({ search: debouncedUserSearch }),
    queryFn: async () => {
      const res = await api.admin.getUsers({ search: debouncedUserSearch });
      return res.data || [];
    },
    enabled: promoteOpen && debouncedUserSearch.length >= 2,
    staleTime: 0,
  });

  const promoteCandidates = useMemo(() => {
    if (!debouncedUserSearch || debouncedUserSearch.length < 2) return [];
    return (searchedUsers as any[]).filter((u) => !u.isStaff && !staffIds.has(u.id));
  }, [searchedUsers, staffIds, debouncedUserSearch]);

  const selectedUser = (searchedUsers as any[]).find((u) => u.id === selectedUserId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staff.filter((s: any) => {
      const name = `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase();
      const matchesSearch = !q || name.includes(q);
      const active = s.staffProfile?.active !== false;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && active) ||
        (statusFilter === 'disabled' && !active);
      return matchesSearch && matchesStatus;
    });
  }, [staff, search, statusFilter]);

  const manageStaff = staff.find((s: any) => s.id === manageId);

  const upsert = useMutation({
    mutationFn: (data: {
      userId: number;
      isStaff?: boolean;
      capabilities?: string[];
      active?: boolean;
    }) => api.admin.upsertStaff(data.userId, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.staff() });
      if (vars.isStaff === false) {
        setManageMsg(null);
        return;
      }
      setManageMsg({
        type: 'ok',
        text: vars.active === false ? 'Staff disabled.' : 'Capabilities and access saved.',
      });
    },
    onError: (err: any) => {
      setManageMsg({
        type: 'err',
        text: err?.response?.data?.message || 'Failed to save staff changes.',
      });
    },
  });

  const addCoverage = useMutation({
    mutationFn: ({ userId, organizationId }: { userId: number; organizationId: number }) =>
      api.admin.addStaffOrgCoverage(userId, { organizationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.staff() });
      setManageMsg({ type: 'ok', text: 'Org coverage added.' });
    },
    onError: (err: any) => {
      setManageMsg({
        type: 'err',
        text: err?.response?.data?.message || 'Failed to add org coverage.',
      });
    },
  });

  const removeCoverage = useMutation({
    mutationFn: ({ userId, organizationId }: { userId: number; organizationId: number }) =>
      api.admin.removeStaffOrgCoverage(userId, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.staff() });
      setManageMsg({ type: 'ok', text: 'Org coverage removed.' });
    },
    onError: (err: any) => {
      setManageMsg({
        type: 'err',
        text: err?.response?.data?.message || 'Failed to remove org coverage.',
      });
    },
  });

  const promote = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error('Select a user');
      await api.admin.upsertStaff(selectedUserId, {
        isStaff: true,
        capabilities: promoteCaps,
        active: true,
      });
      if (promoteOrgId) {
        await api.admin.addStaffOrgCoverage(selectedUserId, {
          organizationId: Number(promoteOrgId),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.staff() });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.all, 'users'] });
      setPromoteOpen(false);
      setUserSearch('');
      setDebouncedUserSearch('');
      setSelectedUserId(null);
      setPromoteCaps([...CAPS.slice(0, 3)]);
      setPromoteOrgId('');
    },
  });

  const create = useMutation({
    mutationFn: () =>
      api.admin.createStaff({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password.trim() || undefined,
        capabilities: form.capabilities,
        organizationIds: form.organizationId ? [Number(form.organizationId)] : undefined,
        sendInvite: true,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.staff() });
      setCreatedCred({
        email: form.email.trim().toLowerCase(),
        password: res.data?.temporaryPassword || null,
        inviteSent: Boolean(res.data?.inviteSent),
        promoted: Boolean(res.data?.promoted),
      });
    },
  });

  const resendInvite = useMutation({
    mutationFn: ({ userId, resetPassword }: { userId: number; resetPassword?: boolean }) =>
      api.admin.resendStaffInvite(userId, { resetPassword }),
  });

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      capabilities: [...CAPS.slice(0, 3)],
      organizationId: '',
    });
    setCreatedCred(null);
  };

  const toggleCap = (cap: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(cap) ? list.filter((c) => c !== cap) : [...list, cap]);
  };

  const columns: DataTableColumn<any>[] = [
    {
      id: 'person',
      header: 'Staff',
      cell: (s) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">
              {s.firstName} {s.lastName}
            </p>
            <p className="text-xs text-neutral-500 truncate">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (s) => {
        const active = s.staffProfile?.active !== false;
        return (
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full',
              active
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
            )}
          >
            {active ? 'Active' : 'Disabled'}
          </span>
        );
      },
    },
    {
      id: 'caps',
      header: 'Capabilities',
      cell: (s) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {parseCaps(s.staffProfile?.capabilities)
            .slice(0, 3)
            .map((c) => (
              <span
                key={c}
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-600"
              >
                {c.replace(/_/g, ' ')}
              </span>
            ))}
          {parseCaps(s.staffProfile?.capabilities).length > 3 && (
            <span className="text-[9px] text-neutral-400">
              +{parseCaps(s.staffProfile?.capabilities).length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'coverage',
      header: 'Org coverage',
      cell: (s) => (
        <span className="text-xs text-neutral-500">
          {(s.staffOrgCoverages || []).length
            ? (s.staffOrgCoverages || [])
                .map((c: any) => c.organization?.name || `#${c.organizationId}`)
                .join(', ')
            : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      hideOnMobile: true,
      cell: (s) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            setManageId(s.id);
            setEditingCaps(parseCaps(s.staffProfile?.capabilities));
            setCoverageOrgId('');
            setManageMsg(null);
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  const openManage = (s: any) => {
    setManageId(s.id);
    setEditingCaps(parseCaps(s.staffProfile?.capabilities));
    setCoverageOrgId('');
    setManageMsg(null);
  };

  return (
    <div className="py-4 px-2 max-w-7xl mx-auto pb-8">
      <PageHeader
        title="Staff"
        accent="roster"
        description="Create PartyStorm staff accounts, promote existing users, and assign org coverage."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setUserSearch('');
                setDebouncedUserSearch('');
                setSelectedUserId(null);
                setPromoteCaps([...CAPS.slice(0, 3)]);
                setPromoteOrgId('');
                setPromoteOpen(true);
              }}
            >
              <Search className="h-4 w-4 mr-1" />
              Promote user
            </Button>
            <Button
              className="bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl"
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create staff
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <DataTableSkeleton
          rows={6}
          columns={5}
          toolbar={
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(s) => s.id}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search staff by name or email…"
          pageSize={10}
          onRowClick={openManage}
          toolbar={
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          }
          emptyTitle="No staff yet"
          emptyDescription="Create a staff account or promote an existing user."
        />
      )}

      {/* Promote existing user */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Promote existing user</DialogTitle>
            <DialogDescription>
              Search by name or email, then mark them as PartyStorm staff with capabilities.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <input
              autoFocus
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setSelectedUserId(null);
              }}
              placeholder="Search users by name or email…"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
            />

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 max-h-48 overflow-y-auto">
              {debouncedUserSearch.length < 2 ? (
                <p className="px-3 py-6 text-xs text-neutral-500 text-center">
                  Type at least 2 characters to search.
                </p>
              ) : usersLoading ? (
                <div className="px-3 py-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-2/3 rounded-md" />
                        <Skeleton className="h-2.5 w-1/2 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : promoteCandidates.length === 0 ? (
                <p className="px-3 py-6 text-xs text-neutral-500 text-center">
                  No matching non-staff users. Try create-by-email if they don&apos;t have an
                  account yet.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {promoteCandidates.slice(0, 12).map((u: any) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(u.id)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
                          selectedUserId === u.id && 'bg-rose-50 dark:bg-rose-950/20'
                        )}
                      >
                        <p className="text-sm font-bold">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {u.email}
                          {u.role ? ` · ${u.role}` : ''}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedUser && (
              <p className="text-xs text-emerald-600 font-medium">
                Selected: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
              </p>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Capabilities
              </p>
              <div className="flex flex-wrap gap-2">
                {CAPS.map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleCap(cap, promoteCaps, setPromoteCaps)}
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border',
                      promoteCaps.includes(cap)
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                    )}
                  >
                    {cap.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <Select
              value={promoteOrgId || 'none'}
              onValueChange={(v) => setPromoteOrgId(v === 'none' ? '' : v)}
            >
              <SelectTrigger className="w-full h-10 rounded-xl">
                <SelectValue placeholder="Org coverage (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No org coverage yet</SelectItem>
                {(orgs as any[]).map((o: any) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {promote.isError && (
              <p className="text-xs text-red-500">
                {(promote.error as any)?.response?.data?.message || 'Failed to promote user'}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setPromoteOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedUserId || promoteCaps.length === 0 || promote.isPending}
              className="bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl"
              onClick={() => promote.mutate()}
            >
              {promote.isPending ? 'Promoting…' : 'Mark as staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create staff dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{createdCred ? 'Staff ready' : 'Create staff'}</DialogTitle>
            <DialogDescription>
              {createdCred
                ? createdCred.promoted
                  ? 'Existing account promoted to staff. An invite email was sent if SMTP is configured.'
                  : 'Account created. Credentials are below — invite email also sent when SMTP is configured.'
                : 'Creates a new PartyStorm staff account (or promotes an existing email) and emails an invite. Prefer “Promote user” when they already have an account.'}
            </DialogDescription>
          </DialogHeader>

          {createdCred ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-2 text-sm">
                <p>
                  <span className="text-neutral-500">Email:</span>{' '}
                  <span className="font-semibold">{createdCred.email}</span>
                </p>
                {createdCred.password ? (
                  <p>
                    <span className="text-neutral-500">Temp password:</span>{' '}
                    <span className="font-mono font-semibold">{createdCred.password}</span>
                  </p>
                ) : (
                  <p className="text-neutral-500 text-xs">
                    No new password — they sign in with their existing account.
                  </p>
                )}
                <p
                  className={
                    createdCred.inviteSent
                      ? 'text-xs text-emerald-600 font-medium'
                      : 'text-xs text-amber-600 font-medium'
                  }
                >
                  {createdCred.inviteSent
                    ? 'Invite email sent.'
                    : 'Invite email not sent (check EMAIL_USER / EMAIL_PASS). Share credentials manually.'}
                </p>
              </div>
              {createdCred.password && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `${createdCred.email} / ${createdCred.password}`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? 'Copied' : 'Copy credentials'}
                </Button>
              )}
              <DialogFooter>
                <Button
                  className="bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl"
                  onClick={() => {
                    setCreateOpen(false);
                    resetForm();
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
                />
                <input
                  required
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
                />
              </div>
              <input
                required
                type="email"
                placeholder="Work email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
              />
              <input
                type="text"
                placeholder="Password (optional — we generate one)"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Capabilities
                </p>
                <div className="flex flex-wrap gap-2">
                  {CAPS.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() =>
                        toggleCap(cap, form.capabilities, (capabilities) =>
                          setForm((f) => ({ ...f, capabilities }))
                        )
                      }
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border',
                        form.capabilities.includes(cap)
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                      )}
                    >
                      {cap.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <Select
                value={form.organizationId || 'none'}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, organizationId: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger className="w-full h-10 rounded-xl">
                  <SelectValue placeholder="Org coverage (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No org coverage yet</SelectItem>
                  {(orgs as any[]).map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {create.isError && (
                <p className="text-xs text-red-500">
                  {(create.error as any)?.response?.data?.message || 'Failed to create staff'}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={create.isPending}
                  className="bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl"
                >
                  {create.isPending ? 'Creating…' : 'Create staff'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage staff dialog */}
      <Dialog
        open={!!manageStaff}
        onOpenChange={(open) => {
          if (!open) {
            setManageId(null);
            setManageMsg(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {manageStaff && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {manageStaff.firstName} {manageStaff.lastName}
                </DialogTitle>
                <DialogDescription>
                  Edit capabilities, org coverage, and account access for this staff member.
                </DialogDescription>
              </DialogHeader>

              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Capabilities
              </p>
              <p className="text-[11px] text-neutral-500 mb-2">
                These control what this person can do on covered events (scan, walk-in, etc.).
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {CAPS.map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    title={CAP_HELP[cap]}
                    onClick={() => {
                      setManageMsg(null);
                      toggleCap(cap, editingCaps, setEditingCaps);
                    }}
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border',
                      editingCaps.includes(cap)
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                    )}
                  >
                    {cap.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <ul className="mb-3 space-y-1">
                {editingCaps.map((cap) => (
                  <li key={cap} className="text-[11px] text-neutral-500">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {cap.replace(/_/g, ' ')}
                    </span>
                    {CAP_HELP[cap] ? ` — ${CAP_HELP[cap]}` : ''}
                  </li>
                ))}
              </ul>
              {manageMsg && (
                <p
                  className={cn(
                    'text-xs mb-3 font-medium',
                    manageMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'
                  )}
                >
                  {manageMsg.text}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  size="sm"
                  className="rounded-full text-xs bg-rose-500 hover:bg-rose-600 text-white border-0"
                  disabled={upsert.isPending || editingCaps.length === 0}
                  onClick={() =>
                    upsert.mutate({
                      userId: manageStaff.id,
                      isStaff: true,
                      capabilities: editingCaps,
                      active: manageStaff.staffProfile?.active !== false,
                    })
                  }
                >
                  {upsert.isPending ? 'Saving…' : 'Save capabilities'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs"
                  disabled={upsert.isPending}
                  onClick={() =>
                    upsert.mutate({
                      userId: manageStaff.id,
                      isStaff: true,
                      capabilities: editingCaps,
                      active: !(manageStaff.staffProfile?.active !== false),
                    })
                  }
                >
                  {manageStaff.staffProfile?.active !== false ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs text-red-500"
                  disabled={upsert.isPending}
                  onClick={() => {
                    upsert.mutate(
                      {
                        userId: manageStaff.id,
                        isStaff: false,
                        capabilities: editingCaps,
                        active: false,
                      },
                      { onSuccess: () => setManageId(null) }
                    );
                  }}
                >
                  Revoke staff
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs"
                  disabled={resendInvite.isPending}
                  onClick={() =>
                    resendInvite.mutate({ userId: manageStaff.id, resetPassword: false })
                  }
                >
                  {resendInvite.isPending ? 'Sending…' : 'Resend invite'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs"
                  disabled={resendInvite.isPending}
                  onClick={() =>
                    resendInvite.mutate({ userId: manageStaff.id, resetPassword: true })
                  }
                >
                  Reset pwd + invite
                </Button>
              </div>
              {resendInvite.isSuccess && (
                <p className="text-xs text-emerald-600 mb-3">
                  {resendInvite.data?.data?.message || 'Invite sent.'}
                  {resendInvite.data?.data?.temporaryPassword
                    ? ` New temp password: ${resendInvite.data.data.temporaryPassword}`
                    : ''}
                </p>
              )}
              {resendInvite.isError && (
                <p className="text-xs text-red-500 mb-3">Failed to send invite.</p>
              )}

              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Org coverage
              </p>
              <p className="text-[11px] text-neutral-500 mb-2">
                Standing access to every event under these organisations — no need to reassign per
                event. Assign ops projects separately for one-off jobs.
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {(manageStaff.staffOrgCoverages || []).map((c: any) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800"
                  >
                    {c.organization?.name || `Org #${c.organizationId}`}
                    <button
                      type="button"
                      onClick={() =>
                        removeCoverage.mutate({
                          userId: manageStaff.id,
                          organizationId: c.organizationId,
                        })
                      }
                    >
                      <X className="h-3 w-3 text-neutral-400 hover:text-red-500" />
                    </button>
                  </span>
                ))}
                {(manageStaff.staffOrgCoverages || []).length === 0 && (
                  <span className="text-xs text-neutral-400">No org coverage yet</span>
                )}
              </div>
              <div className="flex gap-2">
                <Select
                  value={coverageOrgId || 'none'}
                  onValueChange={(v) => setCoverageOrgId(v === 'none' ? '' : v)}
                >
                  <SelectTrigger className="flex-1 h-10 rounded-xl">
                    <SelectValue placeholder="Add organization…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Add organization…</SelectItem>
                    {(orgs as any[]).map((o: any) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                        {o.isVerified === false ? ' (unverified)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-10"
                  disabled={!coverageOrgId || addCoverage.isPending}
                  onClick={() => {
                    addCoverage.mutate({
                      userId: manageStaff.id,
                      organizationId: Number(coverageOrgId),
                    });
                    setCoverageOrgId('');
                  }}
                >
                  {addCoverage.isPending ? 'Adding…' : 'Add'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffPage;
