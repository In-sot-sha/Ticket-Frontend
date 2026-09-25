import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  User,
  Check,
  X,
  Clock,
  CheckCircle,
  ExternalLink,
  XCircle,
  MessageSquare,
  Percent,
  Search,
  Copy,
  ArrowLeft,
  Share2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/skeleton';
import { CustomAlertDialog } from '../../components/ui/CustomAlertDialog';
import { buildSocialUrl, hasAnySocial, parseOrgSocials } from '../../lib/orgSocials';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  useHostApplications,
  useVerifyHost,
  useRejectHost,
  useUpdateOrganizationFee,
} from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

type FilterStatus = 'all' | 'pending' | 'rejected' | 'verified';

function getApplicationStatus(org: { isVerified: boolean; rejectedAt?: string | null }): 'verified' | 'pending' | 'rejected' {
  if (org.isVerified) return 'verified';
  if (org.rejectedAt) return 'rejected';
  return 'pending';
}

const STATUS_CONFIG = {
  verified: {
    label: 'Verified',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending Review',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60',
    dot: 'bg-red-500',
    icon: XCircle,
  },
};

const OrganizationsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });

  // Fee absorb toggle
  const [editingFee, setEditingFee] = useState(false);
  const [absorbFee, setAbsorbFee] = useState<boolean>(false);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Queries
  const { data: allApplications = [] } = useHostApplications('all');
  const { data: applications = [], isLoading, isFetching, refetch } = useHostApplications(filter);
  const verifyMutation = useVerifyHost();
  const rejectMutation = useRejectHost();
  const updateFeeMutation = useUpdateOrganizationFee();

  // Summary counts
  const counts = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let rejected = 0;
    allApplications.forEach((org: any) => {
      const s = getApplicationStatus(org);
      if (s === 'pending') pending++;
      else if (s === 'verified') verified++;
      else if (s === 'rejected') rejected++;
    });
    return { all: allApplications.length, pending, verified, rejected };
  }, [allApplications]);

  // Filter & Search
  const filteredList = useMemo(() => {
    let list = applications;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((org: any) => {
        const name = (org.name || '').toLowerCase();
        const owner = `${org.owner?.firstName || ''} ${org.owner?.lastName || ''}`.toLowerCase();
        const email = (org.owner?.email || '').toLowerCase();
        const website = (org.website || '').toLowerCase();
        const id = `#${org.id}`;
        return name.includes(q) || owner.includes(q) || email.includes(q) || website.includes(q) || id.includes(q);
      });
    }
    return list;
  }, [applications, searchQuery]);

  const selected = useMemo(() => {
    if (selectedId == null) return null;
    return applications.find((a: any) => a.id === selectedId) ?? null;
  }, [selectedId, applications]);

  const selectedStatus = selected ? getApplicationStatus(selected) : null;

  useEffect(() => {
    if (filteredList.length === 0) {
      if (!searchQuery) setSelectedId(null);
      return;
    }
    const stillInList = selectedId != null && filteredList.some((a: any) => a.id === selectedId);
    if (!stillInList) {
      setSelectedId(filteredList[0].id);
    }
  }, [filteredList, selectedId, searchQuery]);

  useEffect(() => {
    if (selected) {
      setAbsorbFee(selected.absorbFee ?? false);
      setEditingFee(false);
    }
  }, [selectedId, selected]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const refreshList = useCallback(async () => {
    const { data } = await refetch();
    return data ?? [];
  }, [refetch]);

  const handleApprove = async () => {
    if (!approveDialog.id) return;
    const processedId = approveDialog.id;
    setActionError('');
    setActionSuccess('');
    setApproveDialog({ open: false, id: null });

    try {
      await verifyMutation.mutateAsync(processedId);
      const fresh = await refreshList();
      if (filter === 'pending') {
        const next = fresh.find((a: any) => a.id !== processedId);
        setSelectedId(next?.id ?? fresh[0]?.id ?? null);
      } else {
        setSelectedId(fresh.find((a: any) => a.id === processedId)?.id ?? fresh[0]?.id ?? null);
      }
      setActionSuccess('Host application verified and approved successfully.');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to approve application.');
      await refreshList();
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.id || !rejectReason.trim()) return;
    const processedId = rejectDialog.id;
    const reason = rejectReason.trim();
    setActionError('');
    setActionSuccess('');
    setRejectDialog({ open: false, id: null });
    setRejectReason('');

    try {
      await rejectMutation.mutateAsync({ id: processedId, reason });
      const fresh = await refreshList();
      setSelectedId(fresh[0]?.id ?? null);
      setActionSuccess('Application rejected. Feedback sent to applicant.');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to reject application.');
      await refreshList();
    }
  };

  const handleSaveFeeSettings = async () => {
    if (!selected) return;
    setActionError('');
    setActionSuccess('');
    try {
      await updateFeeMutation.mutateAsync({
        id: selected.id,
        absorbFee,
      });
      await refreshList();
      setEditingFee(false);
      setActionSuccess('Organization checkout fee settings updated successfully.');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update fee settings.');
    }
  };

  const isBusy = verifyMutation.isPending || rejectMutation.isPending || updateFeeMutation.isPending;

  const filtersList: { key: FilterStatus; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'All Organizers', count: counts.all, color: 'text-neutral-500' },
    { key: 'pending', label: 'Pending Review', count: counts.pending, color: 'text-amber-500' },
    { key: 'verified', label: 'Verified Active', count: counts.verified, color: 'text-emerald-500' },
    { key: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-red-500' },
  ];

  return (
    <div className="mx-auto max-w-7xl pb-12 pt-2 text-neutral-900 dark:text-neutral-100 md:pt-4">
      {/* Page Header */}
      <PageHeader
        title="Host"
        accent="Organizers"
        description="Verify host applications, review business credentials, and configure fee absorb settings."
        actions={
          counts.pending > 0 ? (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              {counts.pending} pending review
            </span>
          ) : null
        }
      />

      {/* Compact Status KPI Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filtersList.map((item) => {
          const isActive = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setFilter(item.key);
                setSelectedId(null);
                setShowListOnMobile(true);
                setActionError('');
                setActionSuccess('');
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                isActive
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-200/80 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', item.color.replace('text-', 'bg-'))} />
              <span>{item.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  isActive
                    ? 'bg-neutral-700 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                )}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Messages */}
      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError('')} className="text-xs opacity-70 hover:opacity-100 font-bold">
            Dismiss
          </button>
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess('')} className="text-xs opacity-70 hover:opacity-100 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split-Pane Container */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] min-h-[640px]">
          {/* LEFT COLUMN: Organization List */}
          <div
            className={cn(
              'flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50',
              !showListOnMobile && 'hidden lg:flex'
            )}
          >
            {/* Search Input Box */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search organizer, owner, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:bg-neutral-900"
                />
              </div>
            </div>

            {/* Organizations List */}
            <div className="flex-1 overflow-y-auto max-h-[680px] divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {isLoading || (isFetching && applications.length === 0) ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500 dark:text-neutral-400">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <Building2 className="h-5 w-5 text-neutral-400" />
                  </div>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {searchQuery ? 'No organizers match your search' : 'No organizers in this category'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    {searchQuery ? 'Try adjusting your search terms' : 'New applications will appear here automatically'}
                  </p>
                </div>
              ) : (
                filteredList.map((org: any) => {
                  const active = selectedId === org.id;
                  const status = getApplicationStatus(org);
                  const cfg = STATUS_CONFIG[status];
                  const ownerName = `${org.owner?.firstName || ''} ${org.owner?.lastName || ''}`.trim() || 'Owner';

                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(org.id);
                        setShowListOnMobile(false);
                      }}
                      className={cn(
                        'w-full p-3.5 text-left transition-all relative flex flex-col gap-1.5 cursor-pointer',
                        active
                          ? 'bg-rose-50/70 border-l-4 border-l-rose-500 dark:bg-rose-950/20'
                          : 'border-l-4 border-l-transparent hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {org.logo ? (
                          <img
                            src={org.logo}
                            alt=""
                            className="h-10 w-10 rounded-xl object-cover border border-neutral-200/80 dark:border-neutral-700 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-500 font-bold text-sm">
                            {org.name?.charAt(0)?.toUpperCase() || 'O'}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                              {org.name}
                            </p>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.2 text-[9px] font-semibold shrink-0',
                                cfg.badge
                              )}
                            >
                              <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {ownerName} · {org.owner?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/60">
                        <span>Applied {new Date(org.createdAt).toLocaleDateString()}</span>
                        <span className="font-semibold text-neutral-500 dark:text-neutral-400">
                          {org.absorbFee ? 'Absorbs Fee' : 'Buyer Pays Fee'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Detail Inspector & Actions */}
          <div
            className={cn(
              'flex flex-col bg-white dark:bg-neutral-900 min-h-[640px]',
              showListOnMobile && 'hidden lg:flex'
            )}
          >
            {/* Mobile Back Button */}
            <div className="border-b border-neutral-200 p-3 lg:hidden dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowListOnMobile(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to organizer list
              </button>
            </div>

            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
                <div className="max-w-xs space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    No organizer selected
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Select a host organizer from the left list to review credentials, set fees, and approve or reject.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  {/* Hero Header */}
                  <div className="border-b border-neutral-200 p-4 sm:p-5 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {selected.logo ? (
                          <img
                            src={selected.logo}
                            alt=""
                            className="h-14 w-14 rounded-2xl object-cover border border-neutral-200 dark:border-neutral-700 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-extrabold text-xl shadow-2xs shrink-0">
                            {selected.name?.charAt(0)?.toUpperCase() || 'O'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white truncate">
                              {selected.name}
                            </h2>
                            {selectedStatus && (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                  STATUS_CONFIG[selectedStatus].badge
                                )}
                              >
                                <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_CONFIG[selectedStatus].dot)} />
                                {STATUS_CONFIG[selectedStatus].label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            ID: #{selected.id} · Applied {new Date(selected.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Header Quick Actions for Pending */}
                      {selectedStatus === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            onClick={() => setApproveDialog({ open: true, id: selected.id })}
                            disabled={isBusy}
                            className="h-8.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              setRejectReason('');
                              setRejectDialog({ open: true, id: selected.id });
                            }}
                            disabled={isBusy}
                            className="h-8.5 rounded-lg px-3 text-xs font-semibold shadow-xs"
                          >
                            <X className="mr-1.5 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-6 space-y-5">
                    {/* Rejection notice if rejected */}
                    {selectedStatus === 'rejected' && selected.rejectionReason && (
                      <div className="rounded-xl border border-red-200/80 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                        <div className="flex items-center gap-2 mb-1.5">
                          <MessageSquare className="h-4 w-4 text-red-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                            Rejection Feedback
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                          {selected.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Pending alert banner */}
                    {selectedStatus === 'pending' && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Awaiting Verification Review</p>
                          <p className="text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                            Verify the business credentials, contact identity, and social links before approving access to create live public events.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Fee Absorb Settings Card */}
                    <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/40 p-4 dark:border-neutral-800 dark:bg-neutral-850/40 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-200/70 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-rose-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                            Ticket Checkout Fees
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-neutral-500">
                          Fixed: 6% · ₦100–₦2,000
                        </span>
                      </div>

                      {editingFee ? (
                        <div className="space-y-3 pt-1">
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            Choose who absorbs the platform & processing fee at checkout for this organizer's ticket sales:
                          </p>
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={absorbFee}
                              onChange={(e) => setAbsorbFee(e.target.checked)}
                              className="h-4 w-4 rounded border-neutral-300 text-rose-500 focus:ring-rose-500"
                            />
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                              Organizer absorbs fee (attendees pay face ticket price only)
                            </span>
                          </label>

                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              type="button"
                              onClick={handleSaveFeeSettings}
                              disabled={isBusy}
                              className="h-8 rounded-lg bg-rose-500 px-3 text-xs font-semibold text-white hover:bg-rose-600 shadow-xs"
                            >
                              Save Settings
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setAbsorbFee(selected.absorbFee ?? false);
                                setEditingFee(false);
                              }}
                              className="h-8 rounded-lg px-3 text-xs font-semibold"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-0.5">
                          <div>
                            <p className="text-xs font-bold text-neutral-900 dark:text-white">
                              {selected.absorbFee ? 'Organizer Absorbs Fees' : 'Buyer Pays Checkout Fee'}
                            </p>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              {selected.absorbFee
                                ? 'Attendees pay nominal face ticket price; fee deducted from host payout.'
                                : 'A bundled platform & processing fee is added to buyer checkout.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingFee(true)}
                            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 shadow-2xs"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* About Description */}
                    {selected.description && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                          About the Organizer
                        </h4>
                        <p className="rounded-xl border border-neutral-200/80 bg-white p-3 text-xs sm:text-sm leading-relaxed text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 whitespace-pre-wrap">
                          {selected.description}
                        </p>
                      </div>
                    )}

                    {/* Contact Credentials Cards */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                        Account & Contact Credentials
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Owner Name */}
                        <div className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Applicant Owner
                            </p>
                            <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                              {selected.owner?.firstName} {selected.owner?.lastName}
                            </p>
                          </div>
                        </div>

                        {/* Owner Email */}
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                              <Mail className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Email Address
                              </p>
                              <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                                {selected.owner?.email || '—'}
                              </p>
                            </div>
                          </div>
                          {selected.owner?.email && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selected.owner.email, 'email')}
                              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white shrink-0 p-1"
                              title="Copy email"
                            >
                              {copiedItem === 'email' ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Owner Phone */}
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Phone Number
                              </p>
                              <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                                {selected.owner?.phone || 'Not provided'}
                              </p>
                            </div>
                          </div>
                          {selected.owner?.phone && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selected.owner.phone, 'phone')}
                              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white shrink-0 p-1"
                              title="Copy phone"
                            >
                              {copiedItem === 'phone' ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Website */}
                        <div className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-2xs">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            <Globe className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Website
                            </p>
                            {selected.website ? (
                              <a
                                href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:underline truncate"
                              >
                                {selected.website}
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            ) : (
                              <p className="text-xs text-neutral-400">Not provided</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Media Channels */}
                    {selected.socials && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                          Social Channels & Links
                        </h4>
                        {(() => {
                          const links = parseOrgSocials(selected.socials);
                          if (!hasAnySocial(links)) {
                            return (
                              <div className="rounded-xl border border-neutral-200/80 bg-white p-3 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                                {selected.socials}
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-wrap gap-2">
                              {links.instagram && (
                                <a
                                  href={buildSocialUrl('instagram', links.instagram)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 shadow-2xs"
                                >
                                  <ExternalLink className="h-3 w-3 text-pink-500" />
                                  <span>Instagram: @{links.instagram}</span>
                                </a>
                              )}
                              {links.twitter && (
                                <a
                                  href={buildSocialUrl('twitter', links.twitter)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 shadow-2xs"
                                >
                                  <ExternalLink className="h-3 w-3 text-sky-500" />
                                  <span>X: @{links.twitter}</span>
                                </a>
                              )}
                              {links.facebook && (
                                <a
                                  href={buildSocialUrl('facebook', links.facebook)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 shadow-2xs"
                                >
                                  <ExternalLink className="h-3 w-3 text-blue-600" />
                                  <span>Facebook: {links.facebook}</span>
                                </a>
                              )}
                              {links.tiktok && (
                                <a
                                  href={buildSocialUrl('tiktok', links.tiktok)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 shadow-2xs"
                                >
                                  <ExternalLink className="h-3 w-3 text-neutral-900 dark:text-white" />
                                  <span>TikTok: @{links.tiktok}</span>
                                </a>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer for Non-Pending */}
                {selectedStatus === 'verified' ? (
                  <div className="border-t border-neutral-200 bg-emerald-50/30 p-4 text-xs font-medium text-emerald-700 dark:border-neutral-800 dark:bg-emerald-950/10 dark:text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>This organization is active and verified. The organizer has full privileges to publish events.</span>
                  </div>
                ) : selectedStatus === 'rejected' ? (
                  <div className="border-t border-neutral-200 bg-neutral-50/60 p-4 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-neutral-400 shrink-0" />
                    <span>Rejection feedback has been dispatched. Awaiting profile update and re-submission from applicant.</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation & Rejection Modals */}
      <CustomAlertDialog
        isOpen={approveDialog.open}
        onClose={() => setApproveDialog({ open: false, id: null })}
        title="Approve Host Application?"
        description="This will verify the organization profile and grant the user full permissions to create and publish events."
        onConfirm={handleApprove}
        confirmText="Approve Host"
        cancelText="Cancel"
      />

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, id: null });
            setRejectReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Host Application</DialogTitle>
            <DialogDescription>
              Provide specific feedback so the applicant understands what information or verification is missing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Feedback Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please link a valid business website or an active social media profile with event history..."
              rows={4}
              className="mt-2 w-full px-3.5 py-2.5 text-xs sm:text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              autoFocus
            />
            <p className="text-[10px] text-neutral-400 mt-1.5">{rejectReason.length}/500 characters</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, id: null });
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting…' : 'Send Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationsPage;
