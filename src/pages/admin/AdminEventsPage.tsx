import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, ArrowRightLeft, Calendar } from 'lucide-react';
import { api } from '../../services/api';
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
import { useHostApplications } from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

interface EventAdminInfo {
  id: number;
  title: string;
  startDate: string;
  isPromoted: boolean;
  promotedUntil: string | null;
  organization?: { id: number; name: string };
  opsProjects?: Array<{ id: number; title: string; status: string }>;
}

const AdminEventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventAdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [promoFilter, setPromoFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transferFor, setTransferFor] = useState<EventAdminInfo | null>(null);
  const [targetOrgId, setTargetOrgId] = useState('');
  const [saving, setSaving] = useState(false);
  const [promoteFor, setPromoteFor] = useState<EventAdminInfo | null>(null);
  const [durationMode, setDurationMode] = useState<'1' | '7' | '30' | 'indefinite' | 'custom'>('7');
  const [customDate, setCustomDate] = useState('');

  const { data: orgs = [] } = useHostApplications('verified');

  const fetchEvents = () => {
    setLoading(true);
    api.admin
      .getEvents({ search: search || undefined })
      .then((res) => setEvents(res.data || []))
      .catch(() => setError('Failed to load events.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(fetchEvents, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (promoFilter === 'promoted') return ev.isPromoted;
      if (promoFilter === 'standard') return !ev.isPromoted;
      return true;
    });
  }, [events, promoFilter]);

  const handlePromote = async (isPromoted: boolean) => {
    if (!promoteFor) return;
    setSaving(true);
    setError(null);
    try {
      let promotedUntil: string | null = null;
      if (isPromoted) {
        if (durationMode === 'custom') {
          if (!customDate) {
            setError('Pick a custom end date.');
            setSaving(false);
            return;
          }
          promotedUntil = new Date(customDate).toISOString();
        } else if (durationMode !== 'indefinite') {
          const d = new Date();
          d.setDate(d.getDate() + Number(durationMode));
          promotedUntil = d.toISOString();
        }
      }
      await api.admin.promoteEvent(promoteFor.id, { isPromoted, promotedUntil });
      setSuccess(isPromoted ? 'Event promoted to homepage carousel.' : 'Promotion removed.');
      setPromoteFor(null);
      fetchEvents();
    } catch {
      setError('Failed to update promotion.');
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferFor || !targetOrgId) return;
    setSaving(true);
    setError(null);
    try {
      await api.admin.transferEvent(transferFor.id, Number(targetOrgId));
      setSuccess('Event transferred.');
      setTransferFor(null);
      setTargetOrgId('');
      fetchEvents();
    } catch {
      setError('Failed to transfer event.');
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<EventAdminInfo>[] = [
    {
      id: 'event',
      header: 'Event',
      cell: (ev) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm truncate">{ev.title}</p>
            {ev.isPromoted && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Promoted
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : 'No date'}
            {ev.organization ? ` · ${ev.organization.name}` : ''}
          </p>
          {(ev.opsProjects || []).length > 0 && (
            <p className="text-[11px] text-rose-500 mt-1">
              Ops: {ev.opsProjects!.map((p) => `${p.title} (${p.status})`).join(', ')}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      hideOnMobile: true,
      cell: (ev) => (
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs"
            onClick={() => {
              setPromoteFor(ev);
              setDurationMode('7');
              setCustomDate(
                ev.promotedUntil
                  ? new Date(ev.promotedUntil).toISOString().slice(0, 10)
                  : ''
              );
            }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {ev.isPromoted ? 'Edit promo' : 'Promote'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs"
            onClick={() => {
              setTransferFor(ev);
              setTargetOrgId('');
            }}
          >
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            Transfer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="py-4 px-2 max-w-7xl mx-auto pb-8">
      <PageHeader
        title="Events"
        accent="ops"
        description="Promote homepage carousel listings, transfer ownership between organizations, and see linked ops projects."
      />

      {(error || success) && (
        <div
          className={cn(
            'mb-4 px-4 py-3 rounded-xl text-sm',
            error
              ? 'bg-red-50 text-red-600 dark:bg-red-950/30'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
          )}
        >
          {error || success}
        </div>
      )}

      {loading ? (
        <DataTableSkeleton rows={6} columns={4} />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(ev) => ev.id}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search events…"
          pageSize={12}
          toolbar={
            <Select value={promoFilter} onValueChange={setPromoFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl">
                <SelectValue placeholder="Promotion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value="promoted">Promoted</SelectItem>
                <SelectItem value="standard">Not promoted</SelectItem>
              </SelectContent>
            </Select>
          }
          emptyTitle="No events found"
          emptyDescription="Try another search or filter."
        />
      )}

      {promoteFor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-5 space-y-4 shadow-xl">
            <h3 className="font-bold">Promote — {promoteFor.title}</h3>
            <p className="text-xs text-neutral-500">
              Featured events appear in the homepage carousel until the promotion ends.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['1', '7', '30', 'indefinite', 'custom'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMode(m)}
                  className={cn(
                    'text-xs font-bold py-2 rounded-xl border',
                    durationMode === m
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'border-neutral-200 dark:border-neutral-700'
                  )}
                >
                  {m === 'indefinite' ? 'Ongoing' : m === 'custom' ? 'Custom' : `${m}d`}
                </button>
              ))}
            </div>
            {durationMode === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
              />
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl"
                disabled={saving}
                onClick={() => handlePromote(true)}
              >
                Promote
              </Button>
              {promoteFor.isPromoted && (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={saving}
                  onClick={() => handlePromote(false)}
                >
                  Remove
                </Button>
              )}
              <Button variant="ghost" className="rounded-xl" onClick={() => setPromoteFor(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {transferFor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-5 space-y-4 shadow-xl">
            <h3 className="font-bold">Transfer — {transferFor.title}</h3>
            <p className="text-xs text-neutral-500">
              Current org: {transferFor.organization?.name || 'None'}
            </p>
            <Select value={targetOrgId || 'none'} onValueChange={(v) => setTargetOrgId(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-full h-10 rounded-xl">
                <SelectValue placeholder="Destination organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select destination…</SelectItem>
                {(orgs as any[])
                  .filter((o) => o.id !== transferFor.organization?.id)
                  .map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-xl"
                disabled={!targetOrgId || saving}
                onClick={handleTransfer}
              >
                Transfer
              </Button>
              <Button variant="ghost" className="rounded-xl" onClick={() => setTransferFor(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;
