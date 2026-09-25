import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Inbox,
  Send,
  HelpCircle,
  Search,
  Mail,
  User,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  useAdminSupportTickets,
  useAdminSupportTicket,
  useAdminReplySupport,
  useAdminUpdateSupportTicket,
} from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

const FILTERS = [
  { id: 'OPEN', label: 'Open', icon: AlertCircle, color: 'text-amber-500' },
  { id: 'IN_PROGRESS', label: 'Working', icon: Clock, color: 'text-blue-500' },
  { id: 'RESOLVED', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' },
  { id: 'CLOSED', label: 'Closed', icon: Inbox, color: 'text-neutral-400' },
  { id: 'all', label: 'All Tickets', icon: MessageSquare, color: 'text-neutral-500' },
] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  OPEN: {
    label: 'Open',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dot: 'bg-amber-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'bg-blue-500',
  },
  RESOLVED: {
    label: 'Resolved',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Closed',
    badge: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
    dot: 'bg-neutral-400',
  },
};

function formatWhen(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const AdminSupportPage = () => {
  const location = useLocation();
  const source = location.pathname.startsWith('/staff') ? 'staff' : 'admin';
  const [filter, setFilter] = useState<string>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [note, setNote] = useState('');
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Queries
  const { data: allTickets = [] } = useAdminSupportTickets('all', source);
  const { data: tickets = [], isLoading, isFetching } = useAdminSupportTickets(filter, source);
  const { data: ticket, isLoading: detailLoading } = useAdminSupportTicket(selectedId, source);

  const replyMutation = useAdminReplySupport(source);
  const updateMutation = useAdminUpdateSupportTicket(source);
  const busy = replyMutation.isPending || updateMutation.isPending;

  // Counts summary across all tickets
  const statusCounts = useMemo(() => {
    const c = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0, total: allTickets.length };
    allTickets.forEach((t: any) => {
      if (t.status in c) {
        c[t.status as keyof typeof c]++;
      }
    });
    return c;
  }, [allTickets]);

  // Filter & Search
  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t: any) => {
        const subject = (t.subject || '').toLowerCase();
        const contact = (t.contactName || t.user?.firstName || '').toLowerCase();
        const email = (t.contactEmail || '').toLowerCase();
        const id = `#${t.id}`;
        return subject.includes(q) || contact.includes(q) || email.includes(q) || id.includes(q);
      });
    }
    return list;
  }, [tickets, searchQuery]);

  // Sync selectedId when list changes
  React.useEffect(() => {
    if (filteredTickets.length === 0) {
      if (!searchQuery) setSelectedId(null);
      return;
    }
    if (selectedId == null || !filteredTickets.some((t: any) => t.id === selectedId)) {
      setSelectedId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedId, searchQuery]);

  const pickRequest = (id: number) => {
    setSelectedId(id);
    setNote('');
    setActionMsg(null);
    setShowListOnMobile(false);
  };

  const copyContactEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const emailUser = async (body: string, status: string, needsMoreInfo = false) => {
    if (!selectedId) return;
    setActionMsg(null);
    try {
      const res = await replyMutation.mutateAsync({
        id: selectedId,
        body,
        status,
        needsMoreInfo,
      });
      setNote('');
      setActionMsg({
        text: res.data?.emailSent
          ? 'Email dispatched to customer successfully.'
          : 'Response saved. (Check SMTP settings if email was not delivered).',
      });
    } catch {
      setActionMsg({ text: 'Could not send the email response.', isError: true });
    }
  };

  const sendEmail = async () => {
    if (!note.trim()) return;
    await emailUser(note.trim(), 'IN_PROGRESS');
  };

  const askForMore = async () => {
    if (!note.trim()) {
      setActionMsg({ text: 'Please write what information you need first.', isError: true });
      return;
    }
    await emailUser(note.trim(), 'IN_PROGRESS', true);
  };

  const markDone = async () => {
    await emailUser(
      note.trim() || 'This request has been resolved. Please contact us again if you need any further help.',
      'RESOLVED'
    );
  };

  const changeStatus = async (status: string) => {
    if (!selectedId || status === ticket?.status) return;
    setActionMsg(null);
    try {
      const res = await updateMutation.mutateAsync({
        id: selectedId,
        status,
        notifyMessage: note.trim() || undefined,
      });
      setNote('');
      const label = STATUS_CONFIG[status]?.label || status;
      setActionMsg({
        text: res.data?.emailSent
          ? `Status updated to ${label}. Notification email sent.`
          : `Status updated to ${label}.`,
      });
    } catch {
      setActionMsg({ text: 'Failed to update request status.', isError: true });
    }
  };

  const messages = ticket?.messages || [];
  const customerMessages = messages.filter((msg: any) => msg.authorRole !== 'ADMIN');
  const adminReplies = messages.filter((msg: any) => msg.authorRole === 'ADMIN');

  return (
    <div className="mx-auto max-w-7xl pb-12 pt-2 text-neutral-900 dark:text-neutral-100 md:pt-4">
      {/* Page Header */}
      <PageHeader
        title="Support"
        accent="Desk"
        description="Review customer inquiries, reply directly via email, and manage resolution workflows."
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Inbox
            </span>
          </div>
        }
      />

      {/* Compact Status KPI Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => {
          const Icon = item.icon;
          const count =
            item.id === 'all'
              ? statusCounts.total
              : statusCounts[item.id as keyof typeof statusCounts] ?? 0;
          const isActive = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFilter(item.id);
                setSelectedId(null);
                setShowListOnMobile(true);
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                isActive
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-200/80 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? '' : item.color)} />
              <span>{item.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  isActive
                    ? 'bg-neutral-700 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>


      {/* Notification Banner */}
      {actionMsg && (
        <div
          className={cn(
            'mb-4 flex items-center justify-between rounded-xl border p-3 text-sm font-medium transition-all',
            actionMsg.isError
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
          )}
        >
          <div className="flex items-center gap-2">
            {actionMsg.isError ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMsg(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split-Pane Container */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] min-h-[640px]">
          {/* LEFT COLUMN: Ticket Inbox Queue */}
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
                  placeholder="Search subject, name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:bg-neutral-900"
                />
              </div>
            </div>

            {/* Ticket List Items */}
            <div className="flex-1 overflow-y-auto max-h-[680px] divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {isLoading || (isFetching && tickets.length === 0) ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500 dark:text-neutral-400">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <Inbox className="h-5 w-5 text-neutral-400" />
                  </div>
                  <p className="text-xs font-medium">
                    {searchQuery ? 'No tickets match your search' : 'No tickets in this status'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    {searchQuery ? 'Try modifying your search terms' : 'New inquiries will appear here automatically'}
                  </p>
                </div>
              ) : (
                filteredTickets.map((item: any) => {
                  const active = selectedId === item.id;
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN;
                  const senderName = item.contactName || item.user?.firstName || 'Guest';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => pickRequest(item.id)}
                      className={cn(
                        'w-full p-3.5 text-left transition-all relative flex flex-col gap-1.5',
                        active
                          ? 'bg-rose-50/70 border-l-4 border-l-rose-500 dark:bg-rose-950/20'
                          : 'border-l-4 border-l-transparent hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-neutral-900 dark:text-white">
                          {senderName}
                        </span>
                        <span className="shrink-0 text-[10px] text-neutral-400">
                          {formatRelativeTime(item.createdAt || item.updatedAt)}
                        </span>
                      </div>

                      <p
                        className={cn(
                          'line-clamp-1 text-xs font-medium',
                          active
                            ? 'text-rose-950 dark:text-rose-200'
                            : 'text-neutral-700 dark:text-neutral-300'
                        )}
                      >
                        {item.subject}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                          {item.contactEmail}
                        </span>
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
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Conversation Detail & Actions */}
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
                Back to ticket list
              </button>
            </div>

            {!selectedId || detailLoading || !ticket ? (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
                {detailLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                    <span className="text-xs text-neutral-500">Loading ticket details...</span>
                  </div>
                ) : (
                  <div className="max-w-xs space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      No ticket selected
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Select an incoming request from the left inbox queue to inspect details and send responses.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between">
                {/* Ticket Details Header */}
                <div className="border-b border-neutral-200 p-4 sm:p-5 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">
                          #TKT-{ticket.id}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                            (STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN).badge
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              (STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN).dot
                            )}
                          />
                          {(STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN).label}
                        </span>
                        <span className="text-xs text-neutral-400">
                          Created {formatWhen(ticket.createdAt)}
                        </span>
                      </div>
                      <h2 className="mt-1.5 text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                        {ticket.subject}
                      </h2>
                    </div>

                    {/* Status Changer Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={busy || ticket.status === s}
                          onClick={() => changeStatus(s)}
                          className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50',
                            ticket.status === s
                              ? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900'
                              : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                          )}
                        >
                          {STATUS_CONFIG[s]?.label || s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Contact Bar */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-800/60">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-bold text-xs shrink-0">
                      {(ticket.contactName || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                        {ticket.contactName || 'Guest User'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-neutral-400" />
                        <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {ticket.contactEmail}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyContactEmail(ticket.contactEmail)}
                          className="ml-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                          title="Copy email address"
                        >
                          {copiedEmail ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Conversation Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[420px] bg-neutral-50/30 dark:bg-neutral-950/20">
                  {/* Customer original inquiry */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Customer Message
                      </span>
                    </div>

                    {customerMessages.length === 0 ? (
                      <div className="rounded-xl border border-neutral-200 bg-white p-3.5 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                        No customer notes provided.
                      </div>
                    ) : (
                      customerMessages.map((msg: any) => (
                        <div
                          key={msg.id}
                          className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                              {ticket.contactName || 'Customer'}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {formatWhen(msg.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                            {msg.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Staff Responses / Sent Emails */}
                  {adminReplies.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Sent Responses ({adminReplies.length})
                        </span>
                      </div>

                      {adminReplies.map((msg: any) => (
                        <div
                          key={msg.id}
                          className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-4 shadow-2xs dark:border-rose-900/40 dark:bg-rose-950/20"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-100 dark:border-rose-900/30">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                Support Team
                              </span>
                              <span className="text-xs text-neutral-500">
                                → Sent to {ticket.contactEmail}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400">
                              {formatWhen(msg.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                            {msg.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Reply Composer */}
                {ticket.status !== 'CLOSED' ? (
                  <div className="border-t border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="support-note" className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-rose-500" />
                        Reply to {ticket.contactName || 'Customer'} via Email
                      </label>
                      <span className="text-[11px] text-neutral-400">
                        Dispatched to {ticket.contactEmail}
                      </span>
                    </div>

                    <textarea
                      id="support-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Write your email response here..."
                      className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-white dark:focus:bg-neutral-900"
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          onClick={sendEmail}
                          disabled={busy || !note.trim()}
                          className="h-8.5 rounded-lg bg-rose-500 px-3.5 text-xs font-semibold text-white hover:bg-rose-600 shadow-xs"
                        >
                          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                          Send Reply
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={askForMore}
                          disabled={busy}
                          className="h-8.5 rounded-lg border-neutral-200 px-3 text-xs font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                          Ask for Info
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={markDone}
                        disabled={busy}
                        className="h-8.5 rounded-lg border-emerald-200 bg-emerald-50/60 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Mark Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-neutral-200 bg-neutral-50/60 p-4 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60">
                    This support ticket is closed. Re-open the ticket using the status buttons above to send further email responses.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupportPage;
