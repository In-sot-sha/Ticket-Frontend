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
  Percent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  useHostApplications,
  useVerifyHost,
  useRejectHost,
  useUpdateOrganizationFee,
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
    className: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-250',
    icon: CheckCircle,
    iconClass: 'text-emerald-500',
  },
  pending: {
    label: 'Pending Review',
    className: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-250',
    icon: Clock,
    iconClass: 'text-amber-500',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-250',
    icon: XCircle,
    iconClass: 'text-red-500',
  },
};

const MaskedField: React.FC<{ value: string; label: string; icon: React.ElementType }> = ({ value, label, icon: Icon }) => {
  const [hovered, setHovered] = useState(false);

  const getMaskedValue = (val: string) => {
    if (!val) return '—';
    if (val.includes('@')) {
      const [local, domain] = val.split('@');
      if (local.length <= 2) return `${local[0]}*@${domain}`;
      return `${local.substring(0, 2)}***${local.substring(local.length - 1)}@${domain}`;
    }
    if (val.length <= 4) return '****';
    return `${val.substring(0, 3)}******${val.substring(val.length - 3)}`;
  };

  return (
    <div 
      className="flex items-start gap-3 cursor-help group select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Hover to reveal contact detail"
    >
      <div className="h-8 w-8 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center shrink-0 transition-colors group-hover:bg-rose-50 dark:group-hover:bg-rose-950/20">
        <Icon className="h-4 w-4 text-neutral-400 group-hover:text-rose-500 transition-colors" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</p>
        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 truncate">
          {hovered ? value : getMaskedValue(value)}
        </p>
      </div>
    </div>
  );
};

const OrganizationsPage = () => {
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
  
  // Custom fee states
  const [editingFee, setEditingFee] = useState(false);
  const [feePercent, setFeePercent] = useState<number>(5.0);
  const [absorbFee, setAbsorbFee] = useState<boolean>(false);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { data: applications = [], isLoading, isFetching, refetch } = useHostApplications(filter);
  const verifyMutation = useVerifyHost();
  const rejectMutation = useRejectHost();
  const updateFeeMutation = useUpdateOrganizationFee();

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

  // Sync fee inputs when organization selection changes
  useEffect(() => {
    if (selected) {
      setFeePercent(selected.serviceFeePercent ?? 5.0);
      setAbsorbFee(selected.absorbFee ?? false);
      setEditingFee(false);
    }
  }, [selectedId, selected]);

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
    setSelectedId(null);

    try {
      await rejectMutation.mutateAsync({ id: processedId, reason });
      const fresh = await refreshList();
      setSelectedId(fresh[0]?.id ?? null);
      setActionSuccess('Application rejected. The applicant has been notified.');
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
        serviceFeePercent: Number(feePercent),
        absorbFee,
      });
      await refreshList();
      setEditingFee(false);
      setActionSuccess('Organization service fee settings updated successfully.');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update fee settings.');
    }
  };

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All Hosts' },
    { key: 'pending', label: 'Pending Review' },
    { key: 'verified', label: 'Verified / Active' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const isBusy = verifyMutation.isPending || rejectMutation.isPending || updateFeeMutation.isPending;

  return (
    <div className="py-4 px-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <PageHeader
        title="Organization"
        accent="Management"
        description="Verify host organizations, manage variable ticket fees, and audit details."
        actions={
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v as FilterStatus);
              setSelectedId(null);
              setActionError('');
              setActionSuccess('');
            }}
          >
            <SelectTrigger className="w-[180px] h-10 rounded-xl">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {filters.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

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

      {isLoading || (isFetching && applications.length === 0) ? (
        <OrganizationsBodySkeleton />
      ) : applications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/20 dark:bg-neutral-900/5">
          <Building2 className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-500">No organizations match this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Organization list */}
          <div className="lg:col-span-2 space-y-2 max-h-[60vh] lg:max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {isFetching && (
              <p className="text-[10px] text-neutral-400 font-medium px-1 animate-pulse">Refreshing…</p>
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
                    'w-full text-left p-4 rounded-xl border transition-all cursor-pointer',
                    selected?.id === org.id
                      ? 'border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/10 shadow-sm'
                      : 'border-neutral-150 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-250 dark:hover:border-neutral-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {org.logo ? (
                        <img src={org.logo} alt="" className="h-10 w-10 rounded-lg object-cover border border-neutral-100 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-neutral-105 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-neutral-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-neutral-900 dark:text-white leading-snug">{org.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5 truncate font-medium">
                          {org.owner?.firstName} {org.owner?.lastName}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 mt-0.5 shrink-0 text-[10px] font-bold text-neutral-450 uppercase">
                      Fee: {org.serviceFeePercent ?? 5}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-850 text-[10px] text-neutral-400">
                    <span>Applied {new Date(org.createdAt).toLocaleDateString('en-NG')}</span>
                    <span className={cn('px-2 py-0.5 rounded-full font-bold', cfg.className)}>
                      {cfg.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Details Panel */}
          {selected ? (
            <div
              key={`${selected.id}-${selected.isVerified}-${selected.rejectedAt}`}
              className="lg:col-span-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-950/20">
                <div className="flex items-center gap-3">
                  {selected.logo ? (
                    <img src={selected.logo} alt="" className="h-12 w-12 rounded-xl object-cover border border-neutral-100" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-extrabold text-neutral-950 dark:text-white leading-tight">{selected.name}</h2>
                    {selectedStatus && (
                      <span className={cn('inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', STATUS_CONFIG[selectedStatus].className)}>
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
                  </div>
                )}

                {/* VARIABLE SERVICE CHARGES BLOCK FOR VERIFIED ORGANIZATIONS */}
                {selectedStatus === 'verified' && (
                  <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 border-b border-neutral-150 dark:border-neutral-805 pb-2">
                      <Percent className="h-4 w-4 text-rose-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        Variable Service Charges
                      </h4>
                    </div>

                    {editingFee ? (
                      <div className="space-y-4 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-neutral-450 uppercase tracking-wider mb-1.5">
                            Ticket Service Charge Fee (%)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={feePercent}
                              onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
                              className="w-24 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                            />
                            <span className="text-xs text-neutral-500">% of ticket price</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="absorbFeeInput"
                            checked={absorbFee}
                            onChange={(e) => setAbsorbFee(e.target.checked)}
                            className="rounded text-rose-500 focus:ring-rose-500 h-4 w-4"
                          />
                          <label htmlFor="absorbFeeInput" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 cursor-pointer">
                            Absorb Service Fee (Host pays instead of the buyer)
                          </label>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleSaveFeeSettings}
                            disabled={isBusy}
                            className="px-3 py-1.5 text-xs font-bold bg-rose-500 text-white rounded-lg hover:bg-rose-600 cursor-pointer disabled:opacity-40"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setFeePercent(selected.serviceFeePercent ?? 5.0);
                              setAbsorbFee(selected.absorbFee ?? false);
                              setEditingFee(false);
                            }}
                            className="px-3 py-1.5 text-xs font-bold border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">
                            {selected.serviceFeePercent ?? 5.0}% Service Fee
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {selected.absorbFee ? 'Absorbed by organizer' : 'Paid by buyer at checkout'}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingFee(true)}
                          className="px-3 py-1.5 text-xs font-bold border border-neutral-250 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                        >
                          Modify Rates
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selected.description && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">About</p>
                    <p className="text-xs text-neutral-750 dark:text-neutral-300 leading-relaxed">
                      {selected.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50/30 dark:bg-neutral-905/30 p-4 rounded-xl border border-neutral-100 dark:border-neutral-850">
                  <MaskedField icon={User} label="Applicant Owner" value={`${selected.owner?.firstName} ${selected.owner?.lastName}`} />
                  <MaskedField icon={Mail} label="Email Address" value={selected.owner?.email} />
                  <MaskedField icon={Phone} label="Phone Number" value={selected.owner?.phone || '—'} />
                  {selected.website && (
                    <DetailRow
                      icon={Globe}
                      label="Website"
                      value={selected.website}
                      link={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`}
                    />
                  )}
                  {selected.socials && (() => {
                    const links = parseOrgSocials(selected.socials);
                    if (!hasAnySocial(links)) {
                      return (
                        <DetailRow icon={ExternalLink} label="Social Channels" value={selected.socials} />
                      );
                    }
                    return (
                      <>
                        {links.instagram && (
                          <DetailRow icon={ExternalLink} label="Instagram" value={links.instagram} link={buildSocialUrl('instagram', links.instagram)} />
                        )}
                        {links.twitter && (
                          <DetailRow icon={ExternalLink} label="X (Twitter)" value={links.twitter} link={buildSocialUrl('twitter', links.twitter)} />
                        )}
                        {links.facebook && (
                          <DetailRow icon={ExternalLink} label="Facebook" value={links.facebook} link={buildSocialUrl('facebook', links.facebook)} />
                        )}
                        {links.tiktok && (
                          <DetailRow icon={ExternalLink} label="TikTok" value={links.tiktok} link={buildSocialUrl('tiktok', links.tiktok)} />
                        )}
                      </>
                    );
                  })()}
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
                  <div className="pt-4 border-t border-neutral-150 dark:border-neutral-850 text-xs text-neutral-500">
                    <p className="flex items-center gap-1.5 font-medium text-emerald-600">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      Host status is Verified. They have full access to create events.
                    </p>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-neutral-150 dark:border-neutral-850 text-xs text-neutral-500">
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-neutral-400 shrink-0" />
                      Rejection feedback has been sent. Waiting for resubmission.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 hidden lg:flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl min-h-[300px]">
              <p className="text-sm text-neutral-400">Select an organization to review and configure settings</p>
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
              Provide clear feedback so the applicant knows what to fix. They can update and resubmit.
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
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-rose-500 hover:underline truncate block">
            {value}
          </a>
        ) : (
          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

function OrganizationsBodySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
      <div className="lg:col-span-2 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3.5 space-y-2"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4 min-h-[50vh]">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
    </div>
  );
}

export default OrganizationsPage;
