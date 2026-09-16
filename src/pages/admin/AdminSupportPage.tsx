import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Inbox,
  Mail,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  useAdminSupportTickets,
  useAdminSupportTicket,
  useAdminReplySupport,
  useAdminUpdateSupportTicket,
} from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

function SupportInboxSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
      <div className="lg:col-span-4">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Queue</p>
            <Skeleton className="h-3 w-6 rounded-md" />
          </div>
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="px-4 py-3.5 space-y-2">
                <Skeleton className="h-3 w-14 rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="lg:col-span-8">
        <TicketDetailSkeleton />
      </div>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 min-h-[40vh] bg-white dark:bg-neutral-900">
      <Skeleton className="h-6 w-2/3 rounded-lg" />
      <Skeleton className="h-3 w-1/2 rounded-md" />
      <div className="space-y-3 pt-6">
        <Skeleton className="h-16 w-[80%] rounded-2xl" />
        <Skeleton className="h-16 w-[70%] rounded-2xl ml-auto" />
        <Skeleton className="h-16 w-[75%] rounded-2xl" />
      </div>
    </div>
  );
}

const STATUS_FILTERS = ['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const STATUS_META: Record<
  string,
  { label: string; className: string; hint: string }
> = {
  OPEN: {
    label: 'Open',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    hint: 'New or waiting on the team',
  },
  IN_PROGRESS: {
    label: 'In progress',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    hint: 'Actively working / waiting on the user',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    hint: 'Emails the user that the issue is resolved',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
    hint: 'Archives the ticket and emails the user',
  },
};

type StatusModalMode = 'change' | 'resolve' | 'need_info' | null;

const AdminSupportPage = () => {
  const location = useLocation();
  const source = location.pathname.startsWith('/staff') ? 'staff' : 'admin';
  const [filter, setFilter] = useState<string>('OPEN');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<StatusModalMode>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('IN_PROGRESS');
  const [notifyNote, setNotifyNote] = useState('');

  const { data: tickets = [], isLoading, isFetching } = useAdminSupportTickets(filter, source);
  const { data: ticket, isLoading: detailLoading } = useAdminSupportTicket(selectedId, source);
  const replyMutation = useAdminReplySupport(source);
  const updateMutation = useAdminUpdateSupportTicket(source);

  React.useEffect(() => {
    if (tickets.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId == null || !tickets.some((t: any) => t.id === selectedId)) {
      setSelectedId(tickets[0].id);
    }
  }, [tickets, selectedId]);

  const openStatusModal = () => {
    setPendingStatus(ticket?.status || 'IN_PROGRESS');
    setNotifyNote('');
    setStatusModal('change');
  };

  const openResolveModal = () => {
    setNotifyNote(reply.trim());
    setStatusModal('resolve');
  };

  const openNeedInfoModal = () => {
    setNotifyNote(reply.trim());
    setStatusModal('need_info');
  };

  const closeModal = () => {
    setStatusModal(null);
    setNotifyNote('');
  };

  const handleConfirmStatus = async () => {
    if (!selectedId) return;
    setActionMsg(null);
    try {
      if (statusModal === 'need_info') {
        if (!notifyNote.trim()) return;
        const res = await replyMutation.mutateAsync({
          id: selectedId,
          body: notifyNote.trim(),
          status: 'IN_PROGRESS',
          needsMoreInfo: true,
        });
        setReply('');
        setActionMsg(
          res.data?.emailSent
            ? 'Asked for more info — email sent.'
            : 'Saved (check SMTP if email didn’t send).'
        );
      } else if (statusModal === 'resolve') {
        const body =
          notifyNote.trim() ||
          'We’ve resolved your request. Reply here if you still need help.';
        const res = await replyMutation.mutateAsync({
          id: selectedId,
          body,
          status: 'RESOLVED',
        });
        setReply('');
        setActionMsg(
          res.data?.emailSent
            ? 'Resolved — email sent to the user.'
            : 'Marked resolved (check SMTP if email didn’t send).'
        );
      } else if (statusModal === 'change') {
        if (
          (pendingStatus === 'RESOLVED' || pendingStatus === 'CLOSED') &&
          notifyNote.trim()
        ) {
          const res = await replyMutation.mutateAsync({
            id: selectedId,
            body: notifyNote.trim(),
            status: pendingStatus,
          });
          setActionMsg(
            res.data?.emailSent
              ? `Status → ${STATUS_META[pendingStatus].label}. User emailed.`
              : `Status → ${STATUS_META[pendingStatus].label}.`
          );
        } else {
          const res = await updateMutation.mutateAsync({
            id: selectedId,
            status: pendingStatus,
            notifyMessage: notifyNote.trim() || undefined,
          });
          setActionMsg(
            pendingStatus === 'RESOLVED' || pendingStatus === 'CLOSED'
              ? res.data?.emailSent
                ? `Status → ${STATUS_META[pendingStatus].label}. User emailed.`
                : `Status → ${STATUS_META[pendingStatus].label}.`
              : `Status → ${STATUS_META[pendingStatus]?.label || pendingStatus}.`
          );
        }
      }
      closeModal();
    } catch {
      setActionMsg('Could not update ticket. Try again.');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setActionMsg(null);
    const body = reply.trim();
    setReply('');
    try {
      const res = await replyMutation.mutateAsync({
        id: selectedId,
        body,
        status: 'IN_PROGRESS',
      });
      setActionMsg(
        res.data?.emailSent
          ? 'Reply sent — user emailed.'
          : 'Reply saved (check SMTP if email didn’t send).'
      );
    } catch {
      setActionMsg('Failed to send reply.');
      setReply(body);
    }
  };

  const busy = replyMutation.isPending || updateMutation.isPending;

  return (
    <div className="py-2 md:py-4 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <PageHeader
        title={source === 'staff' ? 'Support' : 'Help &'}
        accent={source === 'staff' ? 'inbox' : 'Support'}
        description={
          source === 'staff'
            ? 'Reply to guests and members, ask for details, and resolve tickets — they get email updates.'
            : 'Team inbox for guest and signed-in requests. Status changes and replies notify by email.'
        }
        actions={
          <Select value={filter} onValueChange={(v) => { setFilter(v); setSelectedId(null); }}>
            <SelectTrigger className="w-[160px] h-10 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f === 'all' ? 'All statuses' : STATUS_META[f]?.label || f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading || (isFetching && tickets.length === 0) ? (
        <SupportInboxSkeleton />
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
          <Inbox className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            {filter === 'OPEN' ? 'No open tickets' : 'No tickets in this filter'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            New requests from Contact / Support land here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Ticket list */}
          <div className="lg:col-span-4 xl:col-span-4">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Queue
                </p>
                <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">
                  {tickets.length}
                </span>
              </div>
              <ul className="max-h-[62vh] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                {tickets.map((t: any) => {
                  const active = selectedId === t.id;
                  const meta = STATUS_META[t.status] || STATUS_META.OPEN;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(t.id);
                          setActionMsg(null);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-3.5 transition-colors',
                          active
                            ? 'bg-rose-50/80 dark:bg-rose-950/25'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={cn(
                                  'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md',
                                  meta.className
                                )}
                              >
                                {meta.label}
                              </span>
                              {!t.userId && (
                                <span className="text-[9px] font-bold uppercase text-neutral-400">
                                  Guest
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold truncate text-neutral-900 dark:text-white">
                              {t.subject}
                            </p>
                            <p className="text-xs text-neutral-500 truncate mt-0.5">
                              {t.contactName || t.user?.firstName || 'Guest'} · {t.contactEmail}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-1.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(t.updatedAt).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                              <span className="mx-1">·</span>
                              {t._count?.messages ?? 0} msg
                            </p>
                          </div>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 shrink-0 mt-1',
                              active ? 'text-rose-500' : 'text-neutral-300'
                            )}
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-8 xl:col-span-8">
            {!selectedId ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 py-20 text-center">
                <MessageSquare className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Select a ticket</p>
              </div>
            ) : detailLoading || !ticket ? (
              <TicketDetailSkeleton />
            ) : (
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col max-h-[72vh] overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-extrabold tracking-tight text-balance">
                        {ticket.subject}
                      </h2>
                      <p className="text-xs text-neutral-500 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {ticket.contactEmail}
                        </span>
                        <span>·</span>
                        <span>{ticket.contactName || 'Guest'}</span>
                        <span>·</span>
                        <span>{ticket.category}</span>
                        {!ticket.userId && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-amber-600">No account</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-9 shrink-0"
                      onClick={openStatusModal}
                      disabled={busy}
                    >
                      <span
                        className={cn(
                          'mr-2 inline-block h-2 w-2 rounded-full',
                          ticket.status === 'OPEN' && 'bg-amber-500',
                          ticket.status === 'IN_PROGRESS' && 'bg-blue-500',
                          ticket.status === 'RESOLVED' && 'bg-emerald-500',
                          ticket.status === 'CLOSED' && 'bg-neutral-400'
                        )}
                      />
                      {STATUS_META[ticket.status]?.label || ticket.status}
                    </Button>
                  </div>
                  {actionMsg && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {actionMsg}
                    </p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-neutral-50/60 dark:bg-neutral-950/40">
                  {ticket.messages?.map((msg: any) => {
                    const isTeam = msg.authorRole === 'ADMIN';
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'max-w-[92%] rounded-2xl px-4 py-3 text-sm',
                          isTeam
                            ? 'ml-auto bg-rose-500 text-white'
                            : 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800'
                        )}
                      >
                        <p className="text-[10px] font-bold opacity-70 mb-1">
                          {isTeam
                            ? source === 'staff'
                              ? 'Staff'
                              : 'Support'
                            : msg.author
                              ? `${msg.author.firstName} ${msg.author.lastName}`
                              : msg.authorRole === 'GUEST'
                                ? 'Guest'
                                : 'User'}
                          {' · '}
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    );
                  })}
                </div>

                {ticket.status !== 'CLOSED' && (
                  <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3 bg-white dark:bg-neutral-900">
                    <form onSubmit={handleReply} className="flex gap-2">
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write a reply — emailed to the user…"
                        rows={2}
                        className="flex-1 resize-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500"
                      />
                      <Button
                        type="submit"
                        disabled={busy || !reply.trim()}
                        className="shrink-0 self-end rounded-full h-11 px-4"
                      >
                        {replyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs h-9"
                        disabled={busy}
                        onClick={openNeedInfoModal}
                      >
                        <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                        Need more info
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                        disabled={busy}
                        onClick={openResolveModal}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status / action modal */}
      <Dialog open={!!statusModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusModal === 'resolve'
                ? 'Resolve ticket'
                : statusModal === 'need_info'
                  ? 'Ask for more information'
                  : 'Change status'}
            </DialogTitle>
            <DialogDescription>
              {statusModal === 'resolve'
                ? 'Marks the ticket resolved and emails the user.'
                : statusModal === 'need_info'
                  ? 'Sends your question by email and sets status to In progress.'
                  : 'Update the ticket status. Resolved and Closed notify the user by email.'}
            </DialogDescription>
          </DialogHeader>

          {statusModal === 'change' && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                New status
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPendingStatus(st)}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-left transition-colors',
                      pendingStatus === st
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                    )}
                  >
                    <p className="text-xs font-bold">{STATUS_META[st].label}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5 leading-snug">
                      {STATUS_META[st].hint}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(statusModal === 'resolve' ||
            statusModal === 'need_info' ||
            (statusModal === 'change' &&
              (pendingStatus === 'RESOLVED' || pendingStatus === 'CLOSED'))) && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {statusModal === 'need_info'
                  ? 'What do you need?'
                  : 'Message to user (optional for status-only)'}
              </label>
              <textarea
                value={notifyNote}
                onChange={(e) => setNotifyNote(e.target.value)}
                rows={4}
                className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                placeholder={
                  statusModal === 'need_info'
                    ? 'e.g. Please share your booking reference and the event date…'
                    : 'Optional note included in the email…'
                }
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="rounded-xl" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              className={cn(
                'rounded-xl border-0 text-white',
                statusModal === 'resolve' || pendingStatus === 'RESOLVED'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-500 hover:bg-rose-600'
              )}
              disabled={
                busy ||
                (statusModal === 'need_info' && !notifyNote.trim())
              }
              onClick={handleConfirmStatus}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : statusModal === 'resolve' ? (
                'Resolve & email'
              ) : statusModal === 'need_info' ? (
                'Send request'
              ) : (
                'Update status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupportPage;
