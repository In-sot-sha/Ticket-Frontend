import React, { useState } from 'react';
import { Search, Shield, User as UserIcon } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { useAdminUsers, useUpdateUserRole } from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

const ROLES = ['all', 'USER', 'ORGANIZER', 'VENDOR', 'ADMIN'] as const;

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600',
  ORGANIZER: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600',
  VENDOR: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
  USER: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600',
};

const AdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: users = [], isLoading } = useAdminUsers({
    search: debouncedSearch || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
  });
  const updateRole = useUpdateUserRole();

  return (
    <div className="py-4 px-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <div className="mb-6 border-b border-neutral-100 dark:border-neutral-900 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          User <span className="text-rose-500">Management</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          View registered users and manage their roles.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={cn(
                'px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors',
                roleFilter === role
                  ? 'bg-rose-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              )}
            >
              {role === 'all' ? 'All' : role}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Spinner />
        </div>
      ) : (
        <div className="border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <div className="col-span-4">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Organizations</div>
            <div className="col-span-2">Tickets</div>
            <div className="col-span-2">Joined</div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {users.length === 0 ? (
              <p className="px-5 py-12 text-sm text-neutral-500 text-center">No users found</p>
            ) : (
              users.map((u: any) => (
                <div
                  key={u.id}
                  className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 md:items-center"
                >
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {u.role === 'ADMIN' ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                      disabled={updateRole.isPending}
                      className={cn(
                        'text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/30',
                        roleBadgeClass[u.role] || roleBadgeClass.USER
                      )}
                    >
                      <option value="USER">USER</option>
                      <option value="ORGANIZER">ORGANIZER</option>
                      <option value="VENDOR">VENDOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 text-xs text-neutral-500">
                    {u.ownedOrganizations?.length > 0
                      ? u.ownedOrganizations.map((o: any) => (
                          <span key={o.id} className="block truncate">
                            {o.name} {o.isVerified ? '✓' : '(pending)'}
                          </span>
                        ))
                      : '—'}
                  </div>

                  <div className="md:col-span-2 text-xs text-neutral-500 flex items-center gap-1">
                    <UserIcon className="h-3.5 w-3.5" />
                    {u._count?.tickets ?? 0} tickets
                  </div>

                  <div className="md:col-span-2 text-xs text-neutral-400">
                    {new Date(u.createdAt).toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
