import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Store,
  Clock,
  Search,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useUpdateVendorStatus } from '../../hooks/queries/useVendors';
import { downloadCSV } from '../../lib/exportCSV';
import { useIsMobile } from '../../hooks/use-mobile';
import { formatNaira } from '../../lib/eventOrganizer';

interface VendorsTabProps {
  eventId: number;
  event: any;
}

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

const normalizeStatus = (status: any): 'PENDING' | 'APPROVED' | 'REJECTED' => {
  if (status === 'APPROVED' || status === true) return 'APPROVED';
  if (status === 'REJECTED' || status === false) return 'REJECTED';
  return 'PENDING';
};

const STATUS_RANK: Record<'PENDING' | 'APPROVED' | 'REJECTED', number> = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
};

const getAppFields = (app: any) => ({
  name:
    app.businessName ||
    app.vendor?.businessName ||
    `${app.user?.firstName || ''} ${app.user?.lastName || ''}`.trim() ||
    'Vendor',
  email: app.businessEmail || app.vendor?.contactEmail || app.user?.email || '',
  phone: app.businessPhone || app.vendor?.contactPhone || app.user?.phone || '',
  category: app.category || app.vendor?.category || '',
  description: app.description || app.vendor?.description || '',
  stallName: app.vendorType?.name || 'General stall',
  stallFee: app.vendorType?.fee ?? app.paymentAmount,
  stallNumber: app.stallNumber as string | null | undefined,
  paymentStatus: app.paymentStatus as string | undefined,
  paymentAmount: app.paymentAmount as number | undefined,
  appliedAt: app.appliedAt || app.createdAt,
  status: normalizeStatus(app.applicationStatus),
});

const statusClass = (status: 'PENDING' | 'APPROVED' | 'REJECTED') =>
  status === 'PENDING'
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    : status === 'APPROVED'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';

export const VendorsTab: React.FC<VendorsTabProps> = ({ eventId, event }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('PENDING');
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [didInitFilter, setDidInitFilter] = useState(false);
  const [approveApp, setApproveApp] = useState<any | null>(null);
  const [stallNumber, setStallNumber] = useState('');
  const [markPaid, setMarkPaid] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const updateStatusMutation = useUpdateVendorStatus();

  const stallTypes: any[] =
    event?.vendorTypes?.length > 0
      ? event.vendorTypes
      : event?.vendorSettings?.stallTypes || [];

  const stallChips = useMemo(() => {
    return stallTypes.map((vt) => {
      const related = applications.filter((a) => {
        const typeId = a.vendorTypeId ?? a.vendorType?.id;
        return typeId === vt.id || a.vendorType?.name === vt.name;
      });
      const approved = related.filter((a) => normalizeStatus(a.applicationStatus) === 'APPROVED').length;
      const max = vt.maxVendors ?? vt.maxStalls ?? null;
      const fee = typeof vt.fee === 'number' ? vt.fee : typeof vt.price === 'number' ? vt.price : null;
      return {
        id: vt.id,
        name: vt.name,
        fee,
        approved,
        max,
        available: max != null ? Math.max(max - approved, 0) : null,
      };
    });
  }, [stallTypes, applications]);

  const usedStallNumbers = useMemo(() => {
    return new Set(
      applications
        .filter((a) => normalizeStatus(a.applicationStatus) === 'APPROVED' && a.stallNumber)
        .map((a) => String(a.stallNumber).trim().toLowerCase())
    );
  }, [applications]);

  const fetchApplications = async () => {
    try {
      const res = await api.get<any[]>(`/vendors/applications?eventId=${eventId}`);
      const data = res.data || [];
      setApplications(data);
      setLoadError(null);
      if (!didInitFilter) {
        const hasPending = data.some((a) => normalizeStatus(a.applicationStatus) === 'PENDING');
        setFilter(hasPending ? 'PENDING' : 'all');
        setDidInitFilter(true);
      }
    } catch (err) {
      console.error('Failed to load vendor applications:', err);
      setLoadError('Could not load vendor applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchApplications();
  }, [eventId]);

  const openApproveModal = (app: any) => {
    const fee = app.vendorType?.fee ?? app.paymentAmount ?? 0;
    setApproveApp(app);
    setStallNumber(app.stallNumber || '');
    setMarkPaid(fee === 0 || fee == null || app.paymentStatus === 'PAID');
    setApproveError(null);
  };

  const closeApproveModal = () => {
    if (updatingId) return;
    setApproveApp(null);
    setStallNumber('');
    setApproveError(null);
  };

  const confirmApprove = () => {
    if (!approveApp) return;
    const trimmed = stallNumber.trim();
    if (!trimmed) {
      setApproveError('Enter a stall number before approving.');
      return;
    }
    if (usedStallNumbers.has(trimmed.toLowerCase())) {
      setApproveError(`Stall "${trimmed}" is already assigned. Pick another number.`);
      return;
    }

    setActionError(null);
    setApproveError(null);
    setUpdatingId(approveApp.id);
    updateStatusMutation.mutate(
      {
        id: approveApp.id,
        applicationStatus: 'APPROVED',
        paymentStatus: markPaid ? 'PAID' : 'PENDING',
        stallNumber: trimmed,
      },
      {
        onSuccess: () => {
          setApplications((prev) =>
            prev.map((a) =>
              a.id === approveApp.id
                ? {
                    ...a,
                    applicationStatus: 'APPROVED',
                    stallNumber: trimmed,
                    paymentStatus: markPaid ? 'PAID' : 'PENDING',
                  }
                : a
            )
          );
          setUpdatingId(null);
          setApproveApp(null);
          setStallNumber('');
        },
        onError: () => {
          setApproveError('Failed to approve. Try again.');
          setUpdatingId(null);
        },
      }
    );
  };

  const handleReject = (id: number) => {
    setActionError(null);
    setUpdatingId(id);
    updateStatusMutation.mutate(
      { id, applicationStatus: 'REJECTED' },
      {
        onSuccess: () => {
          setApplications((prev) =>
            prev.map((a) => (a.id === id ? { ...a, applicationStatus: 'REJECTED' } : a))
          );
          setUpdatingId(null);
        },
        onError: () => {
          setActionError('Failed to reject application. Try again.');
          setUpdatingId(null);
        },
      }
    );
  };

  const pending = applications.filter((v) => normalizeStatus(v.applicationStatus) === 'PENDING');
  const approved = applications.filter((v) => normalizeStatus(v.applicationStatus) === 'APPROVED');
  const rejected = applications.filter((v) => normalizeStatus(v.applicationStatus) === 'REJECTED');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications
      .filter((a) => {
        const status = normalizeStatus(a.applicationStatus);
        if (filter !== 'all' && status !== filter) return false;
        if (!q) return true;
        const f = getAppFields(a);
        return (
          f.name.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q) ||
          f.phone.toLowerCase().includes(q) ||
          f.stallName.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          (f.stallNumber && String(f.stallNumber).toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const sa = normalizeStatus(a.applicationStatus);
        const sb = normalizeStatus(b.applicationStatus);
        if (STATUS_RANK[sa] !== STATUS_RANK[sb]) return STATUS_RANK[sa] - STATUS_RANK[sb];
        return (
          new Date(b.appliedAt || b.createdAt).getTime() -
          new Date(a.appliedAt || a.createdAt).getTime()
        );
      });
  }, [applications, filter, query]);

  if (loading) {
    return (
      <div className="space-y-3 px-4 sm:px-0 py-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-4 sm:mx-0 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchApplications();
          }}
          className="mt-3 text-xs font-bold text-rose-500 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const filters: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'PENDING', label: 'Pending', count: pending.length },
    { id: 'APPROVED', label: 'Approved', count: approved.length },
    { id: 'REJECTED', label: 'Rejected', count: rejected.length },
    { id: 'all', label: 'All', count: applications.length },
  ];

  const exportCsv = () => {
    const rows = filtered.map((a) => {
      const f = getAppFields(a);
      return [
        f.name,
        f.email || 'N/A',
        f.phone || 'N/A',
        f.category || 'N/A',
        f.stallName,
        f.stallNumber || 'N/A',
        f.status,
        f.paymentStatus || 'N/A',
        f.appliedAt ? new Date(f.appliedAt).toLocaleDateString('en-NG') : 'N/A',
      ];
    });
    downloadCSV(
      [
        'Business Name',
        'Contact Email',
        'Contact Phone',
        'Category',
        'Stall Type',
        'Stall Number',
        'Status',
        'Payment',
        'Applied At',
      ],
      rows,
      `vendors_${eventId}.csv`
    );
  };

  const approveFields = approveApp ? getAppFields(approveApp) : null;

  return (
    <div className="space-y-3 px-4 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Store className="h-4 w-4 text-rose-500 shrink-0" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
            Applications{' '}
            <span
              className={
                event?.allowVendors
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-400'
              }
            >
              {event?.allowVendors ? 'open' : 'closed'}
            </span>
          </p>
          {event?.vendorDeadline && (
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due{' '}
              {new Date(event.vendorDeadline).toLocaleDateString('en-NG', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
        {applications.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-full text-xs font-bold gap-1.5 h-7 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-2.5 flex items-center shrink-0 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        )}
      </div>

      {/* Stalls — designed but compact */}
      {stallChips.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Stalls</p>
            <span className="text-[10px] text-neutral-400">{stallChips.length} types</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
            {stallChips.map((stall) => {
              const isFull = stall.available != null && stall.available === 0;
              return (
                <div
                  key={stall.id}
                  className="shrink-0 min-w-[118px] rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40 px-2.5 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[90px]">
                      {stall.name}
                    </p>
                    {isFull && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">
                        Full
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
                    {stall.fee == null || stall.fee === 0 ? 'Free' : formatNaira(stall.fee)}
                    <span className="text-neutral-300 dark:text-neutral-600 mx-1">·</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {stall.approved}
                      {stall.max != null ? `/${stall.max}` : ''}
                    </span>
                    {stall.available != null && !isFull && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {' '}
                        · {stall.available} left
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length > 0 && filter !== 'PENDING' && (
        <button
          type="button"
          onClick={() => setFilter('PENDING')}
          className="w-full text-left rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 px-3.5 py-2 text-sm text-amber-800 dark:text-amber-200"
        >
          <span className="font-semibold">{pending.length}</span> application
          {pending.length === 1 ? '' : 's'} waiting for review — tap to view
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search business, email, stall…"
            className="w-full h-9 pl-9 pr-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400"
          />
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value as StatusFilter)}>
          <SelectTrigger className="h-9 w-full sm:w-[170px] rounded-full border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold shadow-none focus:ring-rose-500/30">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {filters.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label} ({f.count})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {actionError && (
        <p className="text-xs text-red-600 dark:text-red-400 px-0.5">{actionError}</p>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
          <Store className="h-9 w-9 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-900 dark:text-white">No applications yet</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Vendors who apply for stalls will appear here for you to approve or reject.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">No matches</p>
          <p className="text-xs text-neutral-500 mt-1">Try another filter or search.</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-2.5">
          {filtered.map((app) => (
            <VendorApplicationCard
              key={app.id}
              app={app}
              onApprove={() => openApproveModal(app)}
              onReject={
                getAppFields(app).status === 'PENDING' ? () => handleReject(app.id) : undefined
              }
              isUpdating={updatingId === app.id}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
          <div className="px-3.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Applications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/40">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-3.5 py-2.5 text-left">Business</th>
                  <th className="px-3.5 py-2.5 text-left">Contact</th>
                  <th className="px-3.5 py-2.5 text-left">Stall</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filtered.map((app) => {
                  const f = getAppFields(app);
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/20 transition-colors"
                    >
                      <td className="px-3.5 py-3 align-middle">
                        <p className="font-semibold text-neutral-900 dark:text-white">{f.name}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          {f.category && (
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                              {f.category}
                            </span>
                          )}
                          {f.appliedAt && (
                            <span className="text-[10px] text-neutral-400">
                              {new Date(f.appliedAt).toLocaleDateString('en-NG')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 align-middle text-xs">
                        {f.email ? (
                          <a
                            href={`mailto:${f.email}`}
                            className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-rose-500 truncate max-w-[200px]"
                          >
                            <Mail className="h-3 w-3 shrink-0 text-neutral-400" />
                            {f.email}
                          </a>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                        {f.phone && (
                          <a
                            href={`tel:${f.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-rose-500 mt-0.5"
                          >
                            <Phone className="h-3 w-3 shrink-0 text-neutral-400" />
                            {f.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-3.5 py-3 align-middle">
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {f.stallName}
                          {f.stallNumber && (
                            <span className="text-rose-500"> · #{f.stallNumber}</span>
                          )}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {f.stallFee == null || f.stallFee === 0
                            ? 'Free'
                            : formatNaira(f.stallFee)}
                          {f.status === 'APPROVED' && f.paymentStatus && (
                            <span
                              className={`ml-1.5 font-bold ${
                                f.paymentStatus === 'PAID'
                                  ? 'text-emerald-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              · {f.paymentStatus}
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-3.5 py-3 align-middle text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusClass(f.status)}`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 align-middle text-right">
                        {f.status === 'PENDING' ? (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleReject(app.id)}
                              disabled={updatingId === app.id}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-40"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => openApproveModal(app)}
                              disabled={updatingId === app.id}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40"
                            >
                              Approve
                            </button>
                          </div>
                        ) : f.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="h-3.5 w-3.5" /> Done
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
                            <XCircle className="h-3.5 w-3.5" /> Done
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {applications.length > 0 && (
        <p className="text-[11px] text-neutral-400">
          Showing {filtered.length} of {applications.length}
        </p>
      )}

      {/* Approve modal */}
      <Dialog open={!!approveApp} onOpenChange={(open) => !open && closeApproveModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve vendor</DialogTitle>
            <DialogDescription>
              Assign a stall number and confirm details before approving.
            </DialogDescription>
          </DialogHeader>

          {approveFields && (
            <div className="space-y-4">
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-3 space-y-1.5">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">
                  {approveFields.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {approveFields.stallName}
                  {' · '}
                  {approveFields.stallFee == null || approveFields.stallFee === 0
                    ? 'Free'
                    : formatNaira(approveFields.stallFee)}
                </p>
                {approveFields.email && (
                  <p className="text-xs text-neutral-500">{approveFields.email}</p>
                )}
                {approveFields.phone && (
                  <p className="text-xs text-neutral-500">{approveFields.phone}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="stall-number"
                  className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5"
                >
                  Stall number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="stall-number"
                  value={stallNumber}
                  onChange={(e) => {
                    setStallNumber(e.target.value);
                    setApproveError(null);
                  }}
                  placeholder="e.g. A12 or 7"
                  autoFocus
                  className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400"
                />
              </div>

              {(approveFields.stallFee ?? 0) > 0 && (
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markPaid}
                    onChange={(e) => setMarkPaid(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-rose-500 focus:ring-rose-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Mark stall fee as paid
                    <span className="block text-xs text-neutral-500 mt-0.5">
                      Leave unchecked if the vendor still needs to pay.
                    </span>
                  </span>
                </label>
              )}

              {approveError && (
                <p className="text-xs text-red-600 dark:text-red-400">{approveError}</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeApproveModal}
              disabled={updatingId === approveApp?.id}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmApprove}
              disabled={updatingId === approveApp?.id}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              {updatingId === approveApp?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Approving…
                </>
              ) : (
                'Confirm approve'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const VendorApplicationCard: React.FC<{
  app: any;
  onApprove?: () => void;
  onReject?: () => void;
  isUpdating?: boolean;
}> = ({ app, onApprove, onReject, isUpdating }) => {
  const f = getAppFields(app);

  return (
    <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">{f.name}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {f.stallName}
            {f.stallNumber && <span className="text-rose-500"> · #{f.stallNumber}</span>}
            {' · '}
            {f.stallFee == null || f.stallFee === 0 ? 'Free' : formatNaira(f.stallFee)}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusClass(f.status)}`}>
          {f.status}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-400">
        {f.email && (
          <a
            href={`mailto:${f.email}`}
            className="inline-flex items-center gap-1.5 hover:text-rose-500 truncate"
          >
            <Mail className="h-3 w-3 shrink-0" />
            {f.email}
          </a>
        )}
        {f.phone && (
          <a href={`tel:${f.phone}`} className="inline-flex items-center gap-1.5 hover:text-rose-500">
            <Phone className="h-3 w-3 shrink-0" />
            {f.phone}
          </a>
        )}
      </div>

      {f.status === 'APPROVED' && f.paymentStatus && (
        <p
          className={`text-[10px] font-bold ${
            f.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          Payment: {f.paymentStatus}
        </p>
      )}

      {f.status === 'PENDING' && onApprove && onReject && (
        <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onReject}
            disabled={isUpdating}
            className="flex-1 py-2 rounded-lg text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-40"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={isUpdating}
            className="flex-1 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
};
