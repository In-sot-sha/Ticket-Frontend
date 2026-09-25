import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  X,
  Copy,
  Check,
  Search,
  Users,
  Building2,
  Key,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShoppingCart,
  UserCheck,
  ClipboardList,
  Headphones,
  UserPlus,
  Phone,
  Shield,
} from 'lucide-react';
import api from '../../services/api';
import { queryKeys } from '../../lib/queryKeys';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useHostApplications } from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

const CAPS = ['SCAN', 'WALK_IN_SALE', 'CHECK_IN', 'GATE_MANAGE', 'SUPPORT'] as const;

const CAP_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; desc: string }
> = {
  SCAN: {
    label: 'Scan QR',
    icon: QrCode,
    color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    desc: 'Scan and validate tickets at event gates',
  },
  WALK_IN_SALE: {
    label: 'Walk-in Sale',
    icon: ShoppingCart,
    color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    desc: 'Sell and issue gate tickets in real time',
  },
  CHECK_IN: {
    label: 'Manual Check-in',
    icon: UserCheck,
    color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    desc: 'Manual guest check-in without scanning QR',
  },
  GATE_MANAGE: {
    label: 'Gate Manager',
    icon: ClipboardList,
    color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    desc: 'Gate-day oversight and operational coordination',
  },
  SUPPORT: {
    label: 'Field Support',
    icon: Headphones,
    color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    desc: 'Handle field issues and escalate to admins',
  },
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [manageId, setManageId] = useState<number | null>(null);
  const [manageTab, setManageTab] = useState<'caps' | 'coverage' | 'access'>('caps');

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
    const t = setTimeout(() => setDebouncedUserSearch(userSearch.trim()), 250);
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

  const activeStaffCount = useMemo(
    () => staff.filter((s: any) => s.staffProfile?.active !== false).length,
    [staff]
  );
  const coveredOrgsCount = useMemo(() => {
    const orgSet = new Set<number>();
    staff.forEach((s: any) => {
      (s.staffOrgCoverages || []).forEach((c: any) => orgSet.add(c.organizationId));
    });
    return orgSet.size;
  }, [staff]);

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
        setManageId(null);
        return;
      }
      setManageMsg({
        type: 'ok',
        text: vars.active === false ? 'Staff account disabled.' : 'Staff permissions updated.',
      });
      setTimeout(() => setManageMsg(null), 3000);
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
      setManageMsg({ type: 'ok', text: 'Organization coverage added.' });
      setTimeout(() => setManageMsg(null), 3000);
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
      setManageMsg({ type: 'ok', text: 'Organization coverage removed.' });
      setTimeout(() => setManageMsg(null), 3000);
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

  const openManage = (s: any) => {
    setManageId(s.id);
    setEditingCaps(parseCaps(s.staffProfile?.capabilities));
    setCoverageOrgId('');
    setManageMsg(null);
    setManageTab('caps');
  };

  const getInitials = (first?: string, last?: string) => {
    return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'ST';
  };

  return (
    <div className="py-3 px-2 sm:px-3 max-w-7xl mx-auto pb-10 text-neutral-900 dark:text-neutral-100">
      <PageHeader
        title="Staff"
        accent="Roster"
        description="Ground personnel, gate ticket scanners, walk-in sellers, and organization assignments."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 text-xs font-semibold"
              onClick={() => {
                setUserSearch('');
                setDebouncedUserSearch('');
                setSelectedUserId(null);
                setPromoteCaps([...CAPS.slice(0, 3)]);
                setPromoteOrgId('');
                setPromoteOpen(true);
              }}
            >
              <Search className="h-3.5 w-3.5 mr-1 text-neutral-400" />
              Promote User
            </Button>
            <Button
              size="sm"
              className="bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl h-9 text-xs font-bold shadow-sm shadow-rose-500/20"
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Staff
            </Button>
          </div>
        }
      />

      {/* Compact Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 mb-4">
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Staff</span>
            <Users className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-lg sm:text-xl font-black tracking-tight">{staff.length}</p>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Staff</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-black tracking-tight">{activeStaffCount}</p>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Covered Orgs</span>
            <Building2 className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <p className="text-lg sm:text-xl font-black tracking-tight">{coveredOrgsCount}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name or email…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 text-xs font-semibold self-start sm:self-auto">
          {(['all', 'active', 'disabled'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setStatusFilter(mode)}
              className={cn(
                'px-3 py-1.5 rounded-lg capitalize transition-all',
                statusFilter === mode
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/4 rounded" />
                  <Skeleton className="h-2.5 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="h-8 w-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              No staff members found
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Try adjusting your search or add a new staff account above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {filtered.map((s: any) => {
              const active = s.staffProfile?.active !== false;
              const caps = parseCaps(s.staffProfile?.capabilities);
              const orgCoverages = s.staffOrgCoverages || [];

              return (
                <div
                  key={s.id}
                  onClick={() => openManage(s)}
                  className="px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                >
                  {/* Left: Avatar + Names */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs">
                      {getInitials(s.firstName, s.lastName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-rose-500 transition-colors">
                          {s.firstName} {s.lastName}
                        </p>
                        <span
                          className={cn(
                            'inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider',
                            active
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                          )}
                        >
                          {active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {s.email}
                        {s.phone ? ` · ${s.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Capabilities */}
                  <div className="hidden md:flex flex-wrap items-center gap-1 max-w-[280px]">
                    {caps.slice(0, 3).map((c) => {
                      const cfg = CAP_CONFIG[c];
                      return (
                        <span
                          key={c}
                          className={cn(
                            'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border',
                            cfg ? cfg.color : 'bg-neutral-100 text-neutral-500'
                          )}
                        >
                          {cfg ? cfg.label : c}
                        </span>
                      );
                    })}
                    {caps.length > 3 && (
                      <span className="text-[10px] text-neutral-400 font-semibold px-1">
                        +{caps.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Middle: Org Coverage */}
                  <div className="hidden lg:flex items-center gap-1 max-w-[200px] truncate text-xs text-neutral-400">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {orgCoverages.length > 0 ? (
                      <span className="truncate">
                        {orgCoverages.map((c: any) => c.organization?.name || `#${c.organizationId}`).join(', ')}
                      </span>
                    ) : (
                      <span className="text-[11px] italic text-neutral-400">All / Unrestricted</span>
                    )}
                  </div>

                  {/* Right: Manage Button */}
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-7 px-2.5 text-[11px] font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        openManage(s);
                      }}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manage Staff Modal */}
      <Dialog open={Boolean(manageStaff)} onOpenChange={(o) => !o && setManageId(null)}>
        <DialogContent className="sm:max-w-lg w-full max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          {manageStaff && (
            <>
              <DialogHeader className="border-b border-neutral-150 dark:border-neutral-800 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-rose-500/20 shrink-0">
                      {getInitials(manageStaff.firstName, manageStaff.lastName)}
                    </div>
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-neutral-900',
                        manageStaff.staffProfile?.active !== false ? 'bg-emerald-500' : 'bg-neutral-400'
                      )}
                      title={manageStaff.staffProfile?.active !== false ? 'Active' : 'Disabled'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogTitle className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white truncate">
                        {manageStaff.firstName} {manageStaff.lastName}
                      </DialogTitle>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                          manageStaff.staffProfile?.active !== false
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                        )}
                      >
                        {manageStaff.staffProfile?.active !== false ? 'Active Staff' : 'Disabled'}
                      </span>
                    </div>
                    <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{manageStaff.email}</span>
                      {manageStaff.phone && <span>· {manageStaff.phone}</span>}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {manageMsg && (
                <div
                  className={cn(
                    'mt-2.5 px-3 py-2 rounded-xl text-xs flex items-center gap-2',
                    manageMsg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                  )}
                >
                  {manageMsg.type === 'ok' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {manageMsg.text}
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/70 p-1 rounded-xl mt-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setManageTab('caps')}
                  className={cn(
                    'flex-1 py-1.5 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5',
                    manageTab === 'caps'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  <Shield className="h-3.5 w-3.5 text-rose-500" />
                  <span>Capabilities ({editingCaps.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManageTab('coverage')}
                  className={cn(
                    'flex-1 py-1.5 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5',
                    manageTab === 'coverage'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  <Building2 className="h-3.5 w-3.5 text-purple-500" />
                  <span>Coverage ({(manageStaff.staffOrgCoverages || []).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManageTab('access')}
                  className={cn(
                    'flex-1 py-1.5 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5',
                    manageTab === 'access'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  <Key className="h-3.5 w-3.5 text-amber-500" />
                  <span>Security</span>
                </button>
              </div>

              {/* Tab 1: Capabilities */}
              {manageTab === 'caps' && (
                <div className="space-y-3 pt-2">
                  <p className="text-[11px] text-neutral-500">
                    Select the operations this staff member is authorized to perform on mobile / gate:
                  </p>
                  <div className="space-y-2">
                    {CAPS.map((cap) => {
                      const cfg = CAP_CONFIG[cap];
                      const Icon = cfg.icon;
                      const isSelected = editingCaps.includes(cap);

                      return (
                        <div
                          key={cap}
                          onClick={() => toggleCap(cap, editingCaps, setEditingCaps)}
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none',
                            isSelected
                              ? 'border-rose-400/50 bg-rose-50/20 dark:bg-rose-950/20'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border',
                                cfg.color
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-neutral-900 dark:text-white">
                                {cfg.label}
                              </p>
                              <p className="text-[10px] text-neutral-400">{cfg.desc}</p>
                            </div>
                          </div>
                          <div
                            className={cn(
                              'h-4 w-4 rounded-md border flex items-center justify-center transition-colors',
                              isSelected
                                ? 'bg-rose-500 border-rose-500 text-white'
                                : 'border-neutral-300 dark:border-neutral-700'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8"
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
                      {manageStaff.staffProfile?.active !== false ? 'Disable Staff' : 'Enable Staff'}
                    </Button>

                    <Button
                      size="sm"
                      className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs h-8 font-semibold shadow-xs"
                      disabled={upsert.isPending}
                      onClick={() =>
                        upsert.mutate({
                          userId: manageStaff.id,
                          isStaff: true,
                          capabilities: editingCaps,
                          active: manageStaff.staffProfile?.active !== false,
                        })
                      }
                    >
                      {upsert.isPending ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 2: Org Coverage */}
              {manageTab === 'coverage' && (
                <div className="space-y-3 pt-2">
                  <p className="text-[11px] text-neutral-500">
                    Assign organization coverage to grant this staff member access to all events hosted by these organizers:
                  </p>

                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                    {(manageStaff.staffOrgCoverages || []).length === 0 ? (
                      <p className="text-xs text-neutral-400 p-1">
                        No org-specific restrictions. Staff can operate on all events when assigned.
                      </p>
                    ) : (
                      (manageStaff.staffOrgCoverages || []).map((c: any) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs"
                        >
                          <Building2 className="h-3 w-3 text-purple-500" />
                          {c.organization?.name || `Org #${c.organizationId}`}
                          <button
                            type="button"
                            onClick={() =>
                              removeCoverage.mutate({
                                userId: manageStaff.id,
                                organizationId: c.organizationId,
                              })
                            }
                            className="text-neutral-400 hover:text-red-500 transition-colors ml-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Select
                      value={coverageOrgId || 'none'}
                      onValueChange={(v) => setCoverageOrgId(v === 'none' ? '' : v)}
                    >
                      <SelectTrigger className="flex-1 h-9 rounded-xl text-xs">
                        <SelectValue placeholder="Add organization coverage…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Choose an organization…</SelectItem>
                        {(orgs as any[]).map((o: any) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="rounded-xl h-9 text-xs font-bold"
                      disabled={!coverageOrgId || coverageOrgId === 'none' || addCoverage.isPending}
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
                </div>
              )}

              {/* Tab 3: Access & Security */}
              {manageTab === 'access' && (
                <div className="space-y-3 pt-2">
                  <p className="text-[11px] text-neutral-500">
                    Manage login credentials, password resets, and staff role assignment:
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-neutral-400" /> Resend Welcome Invite
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Send staff invite link to {manageStaff.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-7 px-2 text-xs"
                        disabled={resendInvite.isPending}
                        onClick={() =>
                          resendInvite.mutate({ userId: manageStaff.id, resetPassword: false })
                        }
                      >
                        {resendInvite.isPending ? 'Sending…' : 'Send'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Key className="h-3.5 w-3.5 text-neutral-400" /> Reset Password & Invite
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Generate a temporary password and email it
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-7 px-2 text-xs"
                        disabled={resendInvite.isPending}
                        onClick={() =>
                          resendInvite.mutate({ userId: manageStaff.id, resetPassword: true })
                        }
                      >
                        {resendInvite.isPending ? 'Generating…' : 'Reset'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-red-200/50 dark:border-red-950/40 bg-red-50/10">
                      <div>
                        <p className="text-xs font-bold text-red-600 dark:text-red-400">
                          Revoke Staff Access
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Demote user to normal guest status
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                        disabled={upsert.isPending}
                        onClick={() => {
                          if (window.confirm(`Revoke staff privileges for ${manageStaff.firstName} ${manageStaff.lastName}?`)) {
                            upsert.mutate(
                              {
                                userId: manageStaff.id,
                                isStaff: false,
                                capabilities: editingCaps,
                                active: false,
                              },
                              { onSuccess: () => setManageId(null) }
                            );
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>

                  {resendInvite.isSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
                      <p className="font-semibold">{resendInvite.data?.data?.message || 'Invite sent.'}</p>
                      {resendInvite.data?.data?.temporaryPassword && (
                        <p className="font-mono mt-1 font-bold">
                          Temp Password: {resendInvite.data.data.temporaryPassword}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Promote Existing User Dialog */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent className="sm:max-w-lg w-full max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="border-b border-neutral-150 dark:border-neutral-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-500 shrink-0 shadow-xs">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">
                  Promote Member to Staff
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Grant an existing user gate scanning, box office, or coordinator permissions.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            {/* Candidate Picker / Selected Candidate Card */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Select Platform User
              </p>

              {selectedUser ? (
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </p>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          {selectedUser.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs h-8 shrink-0 hover:border-rose-400"
                    onClick={() => setSelectedUserId(null)}
                  >
                    Change User
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      autoFocus
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setSelectedUserId(null);
                      }}
                      placeholder="Search user by name or email…"
                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                    {userSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearch('');
                          setDebouncedUserSearch('');
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 max-h-44 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 bg-neutral-50/30 dark:bg-neutral-900/30">
                    {debouncedUserSearch.length < 2 ? (
                      <div className="p-4 text-center">
                        <Search className="h-4 w-4 text-neutral-300 mx-auto mb-1" />
                        <p className="text-xs text-neutral-400">
                          Type at least 2 characters to search users
                        </p>
                      </div>
                    ) : usersLoading ? (
                      <div className="p-4 text-center text-xs text-neutral-400">Searching platform users…</div>
                    ) : promoteCandidates.length === 0 ? (
                      <div className="p-4 text-center text-xs text-neutral-400">
                        No eligible non-staff users found matching &ldquo;{debouncedUserSearch}&rdquo;
                      </div>
                    ) : (
                      promoteCandidates.slice(0, 10).map((u: any) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUserId(u.id)}
                          className="w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-neutral-100/80 dark:hover:bg-neutral-800 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-300 shrink-0">
                              {getInitials(u.firstName, u.lastName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-neutral-900 dark:text-white truncate">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-[10px] text-neutral-400 truncate">{u.email}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            Select →
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Capabilities */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Assign Operations Capabilities
                </p>
                <span className="text-[10px] text-neutral-400 font-semibold">
                  {promoteCaps.length} of {CAPS.length} selected
                </span>
              </div>
              <div className="space-y-1.5">
                {CAPS.map((cap) => {
                  const cfg = CAP_CONFIG[cap];
                  const Icon = cfg.icon;
                  const isChecked = promoteCaps.includes(cap);
                  return (
                    <div
                      key={cap}
                      onClick={() => toggleCap(cap, promoteCaps, setPromoteCaps)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none',
                        isChecked
                          ? 'border-rose-400/60 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border',
                            cfg.color
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white">
                            {cfg.label}
                          </p>
                          <p className="text-[10px] text-neutral-400">{cfg.desc}</p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'h-4 w-4 rounded-md border flex items-center justify-center transition-colors',
                          isChecked
                            ? 'bg-rose-500 border-rose-500 text-white'
                            : 'border-neutral-300 dark:border-neutral-700'
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Organization Scope */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Organization Restriction (Optional)
              </p>
              <Select
                value={promoteOrgId || 'none'}
                onValueChange={(v) => setPromoteOrgId(v === 'none' ? '' : v)}
              >
                <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Universal Platform Access (No Restrictions)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Universal platform access (No restrictions)</SelectItem>
                  {(orgs as any[]).map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between sm:justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setPromoteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selectedUserId || promoteCaps.length === 0 || promote.isPending}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold h-9 px-4 shadow-sm"
              onClick={() => promote.mutate()}
            >
              {promote.isPending ? 'Promoting…' : 'Promote to Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Staff Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg w-full max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="border-b border-neutral-150 dark:border-neutral-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-500 shrink-0 shadow-xs">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">
                  {createdCred ? 'Staff Account Created' : 'Create Staff Member'}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {createdCred
                    ? 'Staff login credentials have been generated and dispatched.'
                    : 'Issue new login credentials and configure operations access.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {createdCred ? (
            <div className="space-y-4 mt-3">
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/80 p-4 space-y-2.5 text-xs bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Account Credentials Ready
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                    <span className="text-neutral-400 font-medium">Email:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{createdCred.email}</span>
                  </p>
                  {createdCred.password && (
                    <p className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                      <span className="text-neutral-400 font-medium">Temp Password:</span>
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm tracking-wide bg-rose-100/60 dark:bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                        {createdCred.password}
                      </span>
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-100 dark:border-emerald-900/40">
                  {createdCred.inviteSent
                    ? '✓ An invitation email with these credentials has been sent to the staff member.'
                    : 'Manual sharing: Copy these credentials and share them with the staff member.'}
                </p>
              </div>

              {createdCred.password && (
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    'w-full rounded-xl text-xs h-10 font-bold transition-all',
                    copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'hover:border-neutral-400'
                  )}
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `PartyStorm Staff Login\nEmail: ${createdCred.email}\nTemporary Password: ${createdCred.password}\nLogin URL: ${window.location.origin}/login`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="h-4 w-4 mr-1.5 text-emerald-600" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  {copied ? 'Credentials Copied to Clipboard!' : 'Copy Login Details'}
                </Button>
              )}

              <DialogFooter className="pt-2">
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold h-9"
                  onClick={() => setCreateOpen(false)}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3.5 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    First Name
                  </label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="e.g. John"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs mt-1 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Last Name
                  </label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="e.g. Doe"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs mt-1 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="staff@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs mt-1 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone Number (Optional)
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="08012345678"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs mt-1 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* Capabilities */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Operations Capabilities
                  </p>
                  <span className="text-[10px] text-neutral-400 font-semibold">
                    {form.capabilities.length} of {CAPS.length} selected
                  </span>
                </div>
                <div className="space-y-1.5">
                  {CAPS.map((cap) => {
                    const cfg = CAP_CONFIG[cap];
                    const Icon = cfg.icon;
                    const isChecked = form.capabilities.includes(cap);
                    return (
                      <div
                        key={cap}
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            capabilities: isChecked
                              ? p.capabilities.filter((c) => c !== cap)
                              : [...p.capabilities, cap],
                          }))
                        }
                        className={cn(
                          'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none',
                          isChecked
                            ? 'border-rose-400/60 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border',
                              cfg.color
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-900 dark:text-white">
                              {cfg.label}
                            </p>
                            <p className="text-[10px] text-neutral-400">{cfg.desc}</p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'h-4 w-4 rounded-md border flex items-center justify-center transition-colors',
                            isChecked
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'border-neutral-300 dark:border-neutral-700'
                          )}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Organization Assignment */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Assign Organization Coverage (Optional)
                </label>
                <Select
                  value={form.organizationId || 'none'}
                  onValueChange={(v) => setForm((p) => ({ ...p, organizationId: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger className="w-full h-9 rounded-xl text-xs mt-1">
                    <SelectValue placeholder="Universal Platform Access (All Organizations)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">Universal platform access (No restriction)</SelectItem>
                    {(orgs as any[]).map((o: any) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between sm:justify-end gap-2">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!form.email.trim() || !form.firstName.trim() || create.isPending}
                  className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold h-9 px-4 shadow-sm"
                  onClick={() => create.mutate()}
                >
                  {create.isPending ? 'Creating…' : 'Create & Send Invite'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffPage;
