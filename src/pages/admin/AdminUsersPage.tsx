import React, { useMemo, useState } from 'react';
import {
  Shield,
  User as UserIcon,
  Search,
  Building2,
  Ticket,
  Mail,
  Copy,
  Check,
  Eye,
  CheckCircle2,
  Users,
  Briefcase,
  HardHat,
  Phone,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, DataTableSkeleton, type DataTableColumn } from '../../components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Button } from '../../components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useAdminUsers, useUpdateUserRole } from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

const ROLE_CONFIG: Record<
  string,
  { label: string; badge: string; border: string; icon: React.ElementType }
> = {
  ADMIN: {
    label: 'Admin',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    border: 'border-rose-500',
    icon: Shield,
  },
  ORGANIZER: {
    label: 'Organizer',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    border: 'border-purple-500',
    icon: Briefcase,
  },
  VENDOR: {
    label: 'Vendor',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    border: 'border-blue-500',
    icon: Building2,
  },
  USER: {
    label: 'Member',
    badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
    border: 'border-neutral-400',
    icon: UserIcon,
  },
};

const AdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data: users = [], isLoading } = useAdminUsers({
    search: debouncedSearch || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
  });

  const updateRole = useUpdateUserRole();

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  const stats = useMemo(() => {
    const admins = users.filter((u: any) => u.role === 'ADMIN').length;
    const organizers = users.filter(
      (u: any) => u.role === 'ORGANIZER' || u.isOrganizer || (u.ownedOrganizations?.length || 0) > 0
    ).length;
    const staff = users.filter((u: any) => u.isStaff).length;
    const regular = users.filter((u: any) => u.role === 'USER' && !u.isStaff).length;
    return { total: users.length, admins, organizers, staff, regular };
  }, [users]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateRole.mutateAsync({ id: userId, role: newRole });
      setRoleSuccess(`Role updated to ${newRole}`);
      setTimeout(() => setRoleSuccess(null), 2500);
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, role: newRole }));
      }
    } catch {
      // Handled by react-query
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      id: 'user',
      header: 'User',
      cell: (u) => {
        const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.USER;
        const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || 'U';

        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {u.role === 'ADMIN' ? <Shield className="h-4 w-4" /> : initials}
              </div>
              {u.isStaff && (
                <span
                  title="Staff Member"
                  className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center"
                >
                  <HardHat className="h-2 w-2 text-white" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {u.firstName} {u.lastName}
                </p>
                {u.isStaff && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Staff
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                <span className="truncate">{u.email}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyEmail(u.email);
                  }}
                  title="Copy email"
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  {copiedEmail === u.email ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'role',
      header: 'Role',
      cell: (u) => {
        const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.USER;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={u.role}
              onValueChange={(newRole) => handleRoleChange(u.id, newRole)}
              disabled={updateRole.isPending}
            >
              <SelectTrigger
                className={cn(
                  'h-7 w-[115px] rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-2xs transition-all',
                  cfg.badge
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ORGANIZER">ORGANIZER</SelectItem>
                <SelectItem value="VENDOR">VENDOR</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
    {
      id: 'orgs',
      header: 'Organizations',
      hideOnMobile: true,
      cell: (u) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {u.ownedOrganizations?.length > 0 ? (
            u.ownedOrganizations.map((o: any) => (
              <span
                key={o.id}
                className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg border',
                  o.isVerified
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                )}
              >
                <Building2 className="h-2.5 w-2.5" />
                <span className="truncate max-w-[120px]">{o.name}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-neutral-400">—</span>
          )}
        </div>
      ),
    },
    {
      id: 'tickets',
      header: 'Tickets',
      cell: (u) => (
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 inline-flex items-center gap-1.5">
          <Ticket className="h-3 w-3 text-rose-500" />
          {u._count?.tickets ?? 0}
        </span>
      ),
    },
    {
      id: 'joined',
      header: 'Joined',
      hideOnMobile: true,
      cell: (u) => (
        <span className="text-[11px] text-neutral-400">
          {new Date(u.createdAt).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (u) => (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg text-xs h-7 px-2 font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(u);
            }}
          >
            <Eye className="h-3 w-3 mr-1 text-neutral-400" />
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="py-3 px-2 sm:px-3 max-w-7xl mx-auto pb-8 text-neutral-900 dark:text-neutral-100">
      <PageHeader
        title="User"
        accent="Directory"
        description="Inspect registered member profiles, manage role authorizations, and audit activity."
      />

      {roleSuccess && (
        <div className="mb-3 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{roleSuccess}</span>
        </div>
      )}

      {/* Responsive Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <p className="text-base sm:text-xl font-black tracking-tight">{stats.total}</p>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Hosts / Orgs</span>
            <Building2 className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <p className="text-base sm:text-xl font-black tracking-tight">{stats.organizers}</p>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gate Staff</span>
            <HardHat className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="text-base sm:text-xl font-black tracking-tight">{stats.staff}</p>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Admins</span>
            <Shield className="h-3.5 w-3.5 text-sky-500" />
          </div>
          <p className="text-base sm:text-xl font-black tracking-tight">{stats.admins}</p>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton rows={8} columns={5} />
      ) : (
        <DataTable
          columns={columns}
          rows={users}
          getRowId={(u) => u.id}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search users by name or email…"
          pageSize={12}
          onRowClick={(u) => setSelectedUser(u)}
          toolbar={
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {(['all', 'ADMIN', 'ORGANIZER', 'VENDOR', 'USER'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize',
                    roleFilter === r
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-bold'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  )}
                >
                  {r === 'all' ? 'All Roles' : r.toLowerCase()}
                </button>
              ))}
            </div>
          }
          emptyTitle="No users found"
          emptyDescription="Try another search or role filter."
        />
      )}

      {/* User Inspection Modal */}
      <Dialog open={Boolean(selectedUser)} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md w-full max-h-[85vh] overflow-y-auto p-4 sm:p-5 rounded-2xl">
          {selectedUser && (
            <>
              <DialogHeader className="border-b border-neutral-150 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-rose-500/20 shrink-0">
                    {selectedUser.role === 'ADMIN' ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      `${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogTitle className="text-base font-extrabold truncate">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </DialogTitle>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                          (ROLE_CONFIG[selectedUser.role] || ROLE_CONFIG.USER).badge
                        )}
                      >
                        {selectedUser.role}
                      </span>
                    </div>
                    <DialogDescription className="text-xs text-neutral-400 mt-0.5 truncate">
                      User ID #{selectedUser.id}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 mt-3 text-xs">
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 space-y-2 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </span>
                    <div className="flex items-center gap-1 font-bold text-neutral-900 dark:text-white">
                      <span>{selectedUser.email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(selectedUser.email)}
                        className="text-neutral-400 hover:text-neutral-600 ml-1"
                      >
                        {copiedEmail === selectedUser.email ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {selectedUser.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> Phone
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {selectedUser.phone}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Registered
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {new Date(selectedUser.createdAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5" /> Total Tickets
                    </span>
                    <span className="font-bold text-rose-500">
                      {selectedUser._count?.tickets ?? 0}
                    </span>
                  </div>
                </div>

                {/* Organizations */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Owned Organizations ({selectedUser.ownedOrganizations?.length || 0})
                  </p>
                  {(selectedUser.ownedOrganizations || []).length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No organizations owned.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedUser.ownedOrganizations.map((o: any) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-purple-500" />
                            <span className="font-bold text-xs">{o.name}</span>
                          </div>
                          <span
                            className={cn(
                              'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                              o.isVerified
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            )}
                          >
                            {o.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Role Switcher in modal */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Update System Role
                  </p>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(newRole) => handleRoleChange(selectedUser.id, newRole)}
                    disabled={updateRole.isPending}
                  >
                    <SelectTrigger className="w-full h-9 rounded-xl text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER (Regular Guest)</SelectItem>
                      <SelectItem value="ORGANIZER">ORGANIZER (Event Host)</SelectItem>
                      <SelectItem value="VENDOR">VENDOR (Stall / Booth Host)</SelectItem>
                      <SelectItem value="ADMIN">ADMIN (Full Superadmin Access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  size="sm"
                  className="w-full rounded-xl text-xs font-bold"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
