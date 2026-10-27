import React, { useMemo, useState } from 'react';
import { Ticket, Mail, Copy, Check, CheckCircle2, Phone, Calendar } from 'lucide-react';
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

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  ORGANIZER: 'Organizer',
  VENDOR: 'Vendor',
  USER: 'Member',
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
        const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || 'U';

        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                {u.firstName} {u.lastName}
                {u.isStaff ? (
                  <span className="ml-1.5 text-[11px] font-medium text-neutral-500">Staff</span>
                ) : null}
              </p>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-neutral-500">
                <span className="truncate">{u.email}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyEmail(u.email);
                  }}
                  title="Copy email"
                  className="shrink-0 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  {copiedEmail === u.email ? (
                    <Check className="h-3 w-3 text-emerald-600" />
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
      cell: (u) => (
        <span className="text-xs text-neutral-700 dark:text-neutral-300">
          {ROLE_LABEL[u.role] || u.role}
        </span>
      ),
    },
    {
      id: 'orgs',
      header: 'Organizations',
      hideOnMobile: true,
      cell: (u) => (
        <span className="block max-w-[220px] truncate text-xs text-neutral-600 dark:text-neutral-400">
          {u.ownedOrganizations?.length
            ? u.ownedOrganizations.map((o: any) => o.name).join(' · ')
            : '—'}
        </span>
      ),
    },
    {
      id: 'tickets',
      header: 'Tickets',
      cell: (u) => (
        <span className="text-xs tabular-nums text-neutral-700 dark:text-neutral-300">
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
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-950/40"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(u);
            }}
          >
            View
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="py-3 px-2 sm:px-3 max-w-7xl mx-auto pb-8 text-neutral-900 dark:text-neutral-100">
      <PageHeader
        title="User"
        accent="Directory"
        description="Accounts on PartyStorm. Open a person to change their role."
      />

      {roleSuccess && (
        <div className="mb-3 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{roleSuccess}</span>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 divide-x divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 sm:mb-4 sm:grid-cols-4 sm:divide-y-0">
        {[
          { label: 'Total users', value: stats.total, blurb: 'In this list', tone: 'text-rose-600 dark:text-rose-400' },
          { label: 'Hosts', value: stats.organizers, blurb: 'Organizer accounts' },
          { label: 'Gate staff', value: stats.staff, blurb: 'Can work the gate' },
          { label: 'Admins', value: stats.admins, blurb: 'Platform admins' },
        ].map((stat) => (
          <div key={stat.label} className="flex min-w-0 items-baseline justify-between gap-2 px-2.5 py-1.5 sm:block sm:px-4 sm:py-3">
            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {stat.label}
            </p>
            <p className={`text-sm font-bold tabular-nums tracking-tight sm:mt-0.5 sm:text-xl ${stat.tone ?? 'text-neutral-900 dark:text-white'}`}>
              {stat.value}
            </p>
            <p className="mt-0.5 hidden truncate text-[10px] text-neutral-500 sm:block">{stat.blurb}</p>
          </div>
        ))}
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 w-[140px] rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ORGANIZER">Organizer</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="USER">Member</SelectItem>
              </SelectContent>
            </Select>
          }
          emptyTitle="No users found"
          emptyDescription="Try another search or role filter."
        />
      )}

      {/* User Inspection Modal */}
      <Dialog open={Boolean(selectedUser)} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md min-w-0 max-h-[85vh] overflow-x-hidden overflow-y-auto p-4 sm:p-5">
          {selectedUser && (
            <>
              <DialogHeader className="border-b border-neutral-200 pb-3 dark:border-neutral-800">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {`${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="truncate text-base font-semibold">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 truncate text-xs text-neutral-500">
                      {ROLE_LABEL[selectedUser.role] || selectedUser.role}
                      {selectedUser.isStaff ? ' · Staff' : ''} · #{selectedUser.id}
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
                    <p className="text-xs text-neutral-500">None</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedUser.ownedOrganizations.map((o: any) => (
                        <div
                          key={o.id}
                          className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-neutral-200 px-2.5 py-2 dark:border-neutral-800"
                        >
                          <span className="truncate text-xs font-medium text-neutral-900 dark:text-white">
                            {o.name}
                          </span>
                          <span className="shrink-0 text-[11px] text-neutral-500">
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
                      <SelectItem value="USER">Member</SelectItem>
                      <SelectItem value="ORGANIZER">Organizer</SelectItem>
                      <SelectItem value="VENDOR">Vendor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
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
