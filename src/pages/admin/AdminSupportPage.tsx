import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  useAdminSupportTickets,
  useAdminSupportTicket,
  useAdminReplySupport,
  useAdminUpdateSupportTicket,
} from '../../hooks/queries/useAdmin';
import { cn } from '../../lib/utils';

const STATUS_FILTERS = ['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const statusStyle: Record<string, string> = {
  OPEN: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
  IN_PROGRESS: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
  RESOLVED: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
  CLOSED: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
};

const AdminSupportPage = () => {
  const [filter, setFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState('');

  const { data: tickets = [], isLoading, isFetching } = useAdminSupportTickets(filter);
  const { data: ticket, isLoading: detailLoading } = useAdminSupportTicket(selectedId);
  const replyMutation = useAdminReplySupport();
  const updateMutation = useAdminUpdateSupportTicket();

  React.useEffect(() => {
    if (tickets.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId == null || !tickets.some((t: any) => t.id === selectedId)) {
      setSelectedId(tickets[0].id);
    }
  }, [tickets, selectedId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    const body = reply.trim();
    setReply('');
    await replyMutation.mutateAsync({ id: selectedId, body, status: 'IN_PROGRESS' });
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedId) return;
    await updateMutation.mutateAsync({ id: selectedId, status });
  };

  return (
    <div className="py-4 px-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <div className="mb-6 border-b border-neutral-100 dark:border-neutral-900 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Help & <span className="text-rose-500">Support</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          View user requests and reply to support tickets.
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedId(null); }}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors',
              filter === f ? 'bg-rose-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
            )}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading || (isFetching && tickets.length === 0) ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-500">No support tickets yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-2 max-h-[65vh] overflow-y-auto">
            {tickets.map((t: any) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all',
                  selectedId === t.id
                    ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/20'
                    : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                )}
              >
                <div className="flex justify-between gap-2 mb-1">
                  <p className="text-sm font-bold truncate">{t.subject}</p>
                  <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0', statusStyle[t.status])}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate">
                  {t.contactName || t.user?.firstName} · {t.contactEmail}
                </p>
                <p className="text-[10px] text-neutral-400 mt-2">
                  {t._count?.messages ?? 0} message(s) · {new Date(t.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>

          {selectedId && (
            <div
              key={`${selectedId}-${ticket?.status}-${ticket?.messages?.length ?? 0}`}
              className="lg:col-span-3 border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 flex flex-col max-h-[70vh]"
            >
              {detailLoading || !ticket ? (
                <div className="flex justify-center py-16"><Spinner /></div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-extrabold">{ticket.subject}</h2>
                        <p className="text-xs text-neutral-500 mt-1">
                          {ticket.contactName} · {ticket.contactEmail} · {ticket.category}
                        </p>
                      </div>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updateMutation.isPending}
                        className="text-xs font-bold border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {ticket.messages?.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'max-w-[90%] rounded-2xl px-4 py-3 text-sm',
                          msg.authorRole === 'ADMIN'
                            ? 'ml-auto bg-rose-500 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                        )}
                      >
                        <p className="text-[10px] font-bold opacity-70 mb-1">
                          {msg.authorRole === 'ADMIN'
                            ? 'Support Team'
                            : msg.author
                              ? `${msg.author.firstName} ${msg.author.lastName}`
                              : 'User'}
                        </p>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        <p className="text-[10px] opacity-60 mt-2">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {ticket.status !== 'CLOSED' && (
                    <form onSubmit={handleReply} className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your reply..."
                        rows={2}
                        className="flex-1 resize-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                      />
                      <Button type="submit" disabled={replyMutation.isPending || !reply.trim()} className="shrink-0 self-end">
                        {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSupportPage;
