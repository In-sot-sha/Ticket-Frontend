import React, { useState } from 'react';
import { Shield, User as UserIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, DataTableSkeleton, type DataTableColumn } from '../../components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useAdminUsers, useUpdateUserRole } from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600',
  ORGANIZER: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600',
  VENDOR: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
  USER: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600',
};

const MaskedText: React.FC<{ value: string }> = ({ value }) => {
  const [hovered, setHovered] = useState(false);

  const getMaskedValue = (val: string) => {
    if (!val) return '';
    if (val.includes('@')) {
      const [local, domain] = val.split('@');
      if (local.length <= 2) return `${local[0]}*@${domain}`;
      return `${local.substring(0, 2)}***${local.substring(local.length - 1)}@${domain}`;
    }
    return val;
  };

  return (
    <span
      className="cursor-help font-medium text-neutral-500"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Hover to reveal email"
    >
      {hovered ? value : getMaskedValue(value)}
    </span>
  );
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

  const columns: DataTableColumn<any>[] = [
    {
      id: 'user',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-3 min-w-0">
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
            <p className="text-xs text-neutral-500 truncate">
              <MaskedText value={u.email} />
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: (u) => (
        <Select
          value={u.role}
          onValueChange={(role) => updateRole.mutate({ id: u.id, role })}
          disabled={updateRole.isPending}
        >
          <SelectTrigger
            className={cn(
              'h-8 w-[130px] rounded-full border-0 text-xs font-bold uppercase tracking-wider',
              roleBadgeClass[u.role] || roleBadgeClass.USER
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
      ),
    },
    {
      id: 'orgs',
      header: 'Organizations',
      cell: (u) => (
        <span className="text-xs text-neutral-500">
          {u.ownedOrganizations?.length > 0
            ? u.ownedOrganizations.map((o: any) => `${o.name}${o.isVerified ? '' : ' (pending)'}`).join(', ')
            : '—'}
        </span>
      ),
    },
    {
      id: 'tickets',
      header: 'Tickets',
      cell: (u) => (
        <span className="text-xs text-neutral-500 inline-flex items-center gap-1">
          <UserIcon className="h-3.5 w-3.5" />
          {u._count?.tickets ?? 0}
        </span>
      ),
    },
    {
      id: 'joined',
      header: 'Joined',
      cell: (u) => (
        <span className="text-xs text-neutral-400">
          {new Date(u.createdAt).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="py-4 px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <PageHeader
        title="User"
        accent="Management"
        description="View registered users and manage their roles."
      />

      {isLoading ? (
        <DataTableSkeleton rows={8} columns={4} />
      ) : (
        <DataTable
          columns={columns}
          rows={users}
          getRowId={(u) => u.id}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or email…"
          pageSize={12}
          toolbar={
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px] h-10 rounded-xl">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ORGANIZER">ORGANIZER</SelectItem>
                <SelectItem value="VENDOR">VENDOR</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          }
          emptyTitle="No users found"
          emptyDescription="Try another search or role filter."
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
