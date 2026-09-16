import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/skeleton';
import {
  useAdminSupportTickets,
  useAdminSupportTicket,
  useAdminReplySupport,
  useAdminUpdateSupportTicket,
} from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

const FILTERS = [
  { id: 'OPEN', label: 'Open' },
  { id: 'IN_PROGRESS', label: 'Working' },
  { id: 'RESOLVED', label: 'Done' },
  { id: 'CLOSED', label: 'Closed' },
  { id: 'all', label: 'All' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'Working',
  RESOLVED: 'Done',
  CLOSED: 'Closed',
};

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const AdminSupportPage = () => {
  const location = useLocation();
  const source = location.pathname.startsWith('/staff') ? 'staff' : 'admin';
  const [filter, setFilter] = useState<string>('OPEN');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [note, setNote] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const { data: tickets = [], isLoading, isFetching } = useAdminSupportTickets(filter, source);
  const { data: ticket, isLoading: detailLoading } = useAdminSupportTicket(selectedId, source);
  const replyMutation = useAdminReplySupport(source);
  const updateMutation = useAdminUpdateSupportTicket(source);
  const busy = replyMutation.isPending || updateMutation.isPending;

  React.useEffect(() => {
    if (tickets.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId == null || !tickets.some((t: any) => t.id === selectedId)) {
      setSelectedId(tickets[0].id);
    }
  }, [tickets, selectedId]);

  const pickRequest = (id: number) => {
    setSelectedId(id);
    setNote('');
    setActionMsg(null);
    setShowListOnMobile(false);
  };

  const emailUser = async (body: string, status: string, needsMoreInfo = false) => {
    if (!selectedId) return;
    setActionMsg(null);
    const res = await replyMutation.mutateAsync({
      id: selectedId,
      body,
      status,
      needsMoreInfo,
    });
    setNote('');
    setActionMsg(res.data?.emailSent ? 'Email sent.' : 'Saved. Check email settings if it did not send.');
  };

  const sendEmail = async () => {
    if (!note.trim()) return;
    try {
      await emailUser(note.trim(), 'IN_PROGRESS');
    } catch {
      setActionMsg('Could not send the email.');
    }
  };

  const askForMore = async () => {
    if (!note.trim()) {
      setActionMsg('Write what you need from them first.');
      return;
    }
    try {
      await emailUser(note.trim(), 'IN_PROGRESS', true);
    } catch {
      setActionMsg('Could not send the email.');
    }
  };

  const markDone = async () => {
    try {
      await emailUser(
        note.trim() || 'This request is done. Email us again if you still need help.',
        'RESOLVED'
      );
    } catch {
      setActionMsg('Could not update this request.');
    }
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
      setActionMsg(
        res.data?.emailSent
          ? `Marked ${STATUS_LABEL[status] || status}. Email sent.`
          : `Marked ${STATUS_LABEL[status] || status}.`
      );
    } catch {
      setActionMsg('Could not update this request.');
    }
  };

  const incoming = (ticket?.messages || []).filter((msg: any) => msg.authorRole !== 'ADMIN');
  const sent = (ticket?.messages || []).filter((msg: any) => msg.authorRole === 'ADMIN');

  return (
    <div className="mx-auto max-w-5xl pb-8 pt-2 text-neutral-900 dark:text-neutral-100 md:pt-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Read what they sent. Email them, then mark it done.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setFilter(item.id);
              setSelectedId(null);
              setShowListOnMobile(true);
            }}
            className={cn(
              'h-9 rounded-full px-3 text-sm font-semibold',
              filter === item.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading || (isFetching && tickets.length === 0) ? (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-16 text-center text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          {filter === 'OPEN' ? 'No open requests.' : 'Nothing in this list.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <ul className={cn('overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900', !showListOnMobile && 'hidden lg:block')}>
            {tickets.map((item: any) => {
              const active = selectedId === item.id;
              return (
                <li key={item.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => pickRequest(item.id)}
                    className={cn(
                      'w-full px-4 py-3 text-left',
                      active
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                        : 'text-neutral-900 hover:bg-neutral-50 dark:text-white dark:hover:bg-neutral-800/60'
                    )}
                  >
                    <p className="truncate text-sm font-semibold">{item.subject}</p>
                    <p className="mt-0.5 truncate text-xs text-neutral-600 dark:text-neutral-400">
                      {item.contactName || item.user?.firstName || 'Guest'} · {STATUS_LABEL[item.status] || item.status}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          <section className={cn('rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900', showListOnMobile && 'hidden lg:block')}>
            <button
              type="button"
              onClick={() => setShowListOnMobile(true)}
              className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 lg:hidden dark:text-neutral-300"
            >
              <ArrowLeft className="h-4 w-4" />
              All requests
            </button>

            {!selectedId || detailLoading || !ticket ? (
              <Skeleton className="h-40 w-full rounded-lg" />
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-balance">{ticket.subject}</h2>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                    {ticket.contactName || 'Guest'} · {ticket.contactEmail}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">{formatWhen(ticket.createdAt || ticket.updatedAt)}</p>
                </div>

                <div className="space-y-3">
                  {incoming.map((msg: any) => (
                    <div
                      key={msg.id}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                        {msg.body}
                      </p>
                    </div>
                  ))}
                </div>

                {sent.length > 0 && (
                  <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
                    <p className="text-sm font-semibold">Emails you sent</p>
                    <ul className="mt-2 space-y-3">
                      {sent.map((msg: any) => (
                        <li key={msg.id}>
                          <p className="text-xs text-neutral-500">{formatWhen(msg.createdAt)}</p>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                            {msg.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ticket.status !== 'CLOSED' && (
                  <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
                    <label htmlFor="support-note" className="text-sm font-semibold">
                      Note to email them
                    </label>
                    <textarea
                      id="support-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      placeholder="Write what you did, or what you still need."
                      className="mt-2 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={sendEmail}
                        disabled={busy || !note.trim()}
                        className="h-10 rounded-full bg-rose-500 px-4 text-sm font-semibold text-white hover:bg-rose-600"
                      >
                        {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                        Send email
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={askForMore}
                        disabled={busy}
                        className="h-10 rounded-full px-4 text-sm font-semibold"
                      >
                        Ask for more info
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={markDone}
                        disabled={busy}
                        className="h-10 rounded-full px-4 text-sm font-semibold"
                      >
                        Mark done
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Status</span>
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={busy}
                      onClick={() => changeStatus(status)}
                      className={cn(
                        'h-8 rounded-full px-3 text-xs font-semibold disabled:opacity-50',
                        ticket.status === status
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                      )}
                    >
                      {STATUS_LABEL[status]}
                    </button>
                  ))}
                </div>

                {actionMsg && (
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{actionMsg}</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminSupportPage;
