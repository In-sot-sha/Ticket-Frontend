import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { CustomAlertDialog } from '../../components/ui/CustomAlertDialog';
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
} from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

type FilterStatus = 'all' | 'pending' | 'rejected' | 'verified';

function getApplicationStatus(org: { isVerified: boolean; rejectedAt?: string | null }) {
  if (org.isVerified) return 'verified';
  if (org.rejectedAt) return 'rejected';
  return 'pending';
}

const STATUS_CONFIG = {
  verified: {
    label: 'Verified',
    className: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
    icon: CheckCircle,
    iconClass: 'text-emerald-500',
  },
  pending: {
    label: 'Pending Review',
    className: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
    icon: Clock,
    iconClass: 'text-amber-500',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 dark:bg-red-950/30 text-red-600',
    icon: XCircle,
    iconClass: 'text-red-500',
  },
};

const HostApplicationsPage = () => {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { data: applications = [], isLoading, isFetching, refetch } = useHostApplications(filter);
  const verifyMutation = useVerifyHost();
  const rejectMutation = useRejectHost();

  const selected =
    selectedId != null
      ? applications.find((a: { id: number }) => a.id === selectedId) ?? null
      : null;

  const selectedStatus = selected ? getApplicationStatus(selected) : null;

  useEffect(() => {
    if (applications.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillInList =
      selectedId != null && applications.some((a: { id: number }) => a.id === selectedId);
    if (!stillInList) {
      setSelectedId(applications[0].id);
    }
  }, [applications]);

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
    setSelectedId(null);

    try {
      await verifyMutation.mutateAsync(processedId);
      const fresh = await refreshList();
      if (filter === 'pending') {
        const next = fresh.find((a: { id: number }) => a.id !== processedId);
        setSelectedId(next?.id ?? fresh[0]?.id ?? null);
      } else {
        setSelectedId(fresh.find((a: { id: number }) => a.id === processedId)?.id ?? fresh[0]?.id ?? null);
      }
      setActionSuccess('Host application approved successfully.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to approve application.';
      setActionError(message);
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
    setSelectedId(null);

    try {
      await rejectMutation.mutateAsync({ id: processedId, reason });
      const fresh = await refreshList();
      setSelectedId(fresh[0]?.id ?? null);
      setActionSuccess('Application rejected. The applicant can update and resubmit.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reject application.';
      setActionError(message);
      await refreshList();
    }
  };

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'verified', label: 'Verified' },
  ];

  const isBusy = verifyMutation.isPending || rejectMutation.isPending;

  return (
    <div className="py-4 px-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <div className="mb-6 border-b border-neutral-100 dark:border-neutral-900 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Host <span className="text-rose-500">Applications</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Review applications, approve hosts, or send feedback for resubmission.
        </p>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm font-medium">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-sm font-medium">
          {actionSuccess}
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setSelectedId(null);
              setActionError('');
              setActionSuccess('');
            }}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors',
              filter === f.key
                ? 'bg-rose-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading || (isFetching && applications.length === 0) ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Spinner />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <Building2 className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-500">No applications in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-2 max-h-[60vh] lg:max-h-[calc(100vh-220px)] overflow-y-auto">
            {isFetching && (
              <p className="text-[10px] text-neutral-400 font-medium px-1">Refreshing…</p>
            )}
            {applications.map((org: any) => {
              const status = getApplicationStatus(org);
              const cfg = STATUS_CONFIG[status];
              const StatusIcon = cfg.icon;
              return (
                <button
                  key={org.id}
                  onClick={() => setSelectedId(org.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all',
                    selected?.id === org.id
                      ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/20 shadow-sm'
                      : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-200 dark:hover:border-neutral-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {org.logo ? (
                        <img src={org.logo} alt="" className="h-10 w-10 rounded-lg object-cover border border-neutral-100 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-neutral-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{org.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5 truncate">
                          {org.owner?.firstName} {org.owner?.lastName}
                        </p>
                      </div>
                    </div>
                    <StatusIcon className={cn('h-4 w-4 shrink-0', cfg.iconClass)} />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2">
                    Applied {new Date(org.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </button>
              );
            })}
          </div>

          {selected ? (
            <div
              key={`${selected.id}-${selected.isVerified}-${selected.rejectedAt}`}
              className="lg:col-span-3 border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  {selected.logo ? (
                    <img src={selected.logo} alt="" className="h-14 w-14 rounded-xl object-cover border border-neutral-100" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-extrabold">{selected.name}</h2>
                    {selectedStatus && (
                      <span
                        className={cn(
                          'inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                          STATUS_CONFIG[selectedStatus].className
                        )}
                      >
                        {STATUS_CONFIG[selectedStatus].label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {selectedStatus === 'rejected' && selected.rejectionReason && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-red-500" />
                      <p className="text-xs font-bold uppercase tracking-wider text-red-600">Rejection reason</p>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                      {selected.rejectionReason}
                    </p>
                    {selected.rejectedAt && (
                      <p className="text-[10px] text-neutral-400 mt-2">
                        Rejected {new Date(selected.rejectedAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500 mt-3">
                      The applicant can update their application and resubmit for review.
                    </p>
                  </div>
                )}

                {selected.description && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">About</p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {selected.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailRow icon={User} label="Applicant" value={`${selected.owner?.firstName} ${selected.owner?.lastName}`} />
                  <DetailRow icon={Mail} label="Email" value={selected.owner?.email} />
                  {selected.owner?.phone && (
                    <DetailRow icon={Phone} label="Phone" value={selected.owner.phone} />
                  )}
                  {selected.website && (
                    <DetailRow
                      icon={Globe}
                      label="Website"
                      value={selected.website}
                      link={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`}
                    />
                  )}
                  {selected.socials && (
                    <DetailRow icon={ExternalLink} label="Social" value={selected.socials} />
                  )}
                </div>

                {selectedStatus === 'pending' ? (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setApproveDialog({ open: true, id: selected.id })}
                      disabled={isBusy}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve Host
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setRejectReason('');
                        setRejectDialog({ open: true, id: selected.id });
                      }}
                      disabled={isBusy}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject with Feedback
                    </Button>
                  </div>
                ) : selectedStatus === 'verified' ? (
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-sm text-emerald-600 font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      This host has been verified and can access the host dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-sm text-neutral-500 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-neutral-400" />
                      Waiting for the applicant to update and resubmit their application.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 hidden lg:flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl min-h-[200px]">
              <p className="text-sm text-neutral-400">Select an application to review</p>
            </div>
          )}
        </div>
      )}

      <CustomAlertDialog
        isOpen={approveDialog.open}
        onClose={() => setApproveDialog({ open: false, id: null })}
        title="Approve host application?"
        description="This will verify the organization and allow the user to access the host dashboard and create events."
        onConfirm={handleApprove}
        confirmText="Approve"
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
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Provide clear feedback so the applicant knows what to fix. They can update and resubmit — the application won't be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Rejection reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please provide a valid business website or social media profile with event history…"
              rows={4}
              className="mt-2 w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
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
              {rejectMutation.isPending ? 'Rejecting…' : 'Send rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function DetailRow({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  link?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-neutral-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</p>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-rose-500 hover:underline truncate block">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

export default HostApplicationsPage;
