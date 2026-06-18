import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  ArrowLeft,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import {
  useMySupportTickets,
  useSupportTicket,
  useCreateSupportTicket,
  useReplySupportTicket,
} from '../hooks/queries/useSupport';
import { cn } from '../lib/utils';

const CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'BILLING', label: 'Billing & payments' },
  { value: 'TICKETS', label: 'Tickets & bookings' },
  { value: 'HOSTING', label: 'Hosting events' },
  { value: 'TECHNICAL', label: 'Technical issue' },
  { value: 'OTHER', label: 'Other' },
];

const statusStyle: Record<string, string> = {
  OPEN: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
  IN_PROGRESS: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
  RESOLVED: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
  CLOSED: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
};

const SupportPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const { data: tickets = [], isLoading } = useMySupportTickets();
  const { data: ticket, isLoading: detailLoading } = useSupportTicket(selectedId);
  const createMutation = useCreateSupportTicket();
  const replyMutation = useReplySupportTicket();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setView('create');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await createMutation.mutateAsync({ subject, body, category });
      setSubject('');
      setBody('');
      setCategory('GENERAL');
      if (res.data?.ticket?.id) {
        setSelectedId(res.data.ticket.id);
        setView('detail');
      } else {
        setView('list');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not submit your request. Please try again.');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setError('');
    try {
      const body = reply.trim();
      setReply('');
      await replyMutation.mutateAsync({ id: selectedId, body });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not send reply.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 pb-24">
      <div className="mb-8">
        <Link to="/help" className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-rose-500 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Help Center
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="h-5 w-5 text-rose-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Help & Support</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My <span className="text-rose-500">Support</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Hi {user?.firstName}, submit a request and our team will get back to you here.
            </p>
          </div>
          {view === 'list' && (
            <Button onClick={() => setView('create')} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> New request
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {view === 'create' ? (
        <form onSubmit={handleCreate} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-extrabold">Submit a support request</h2>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Subject</label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              placeholder="e.g. Missing ticket, refund request, host verification"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Message</label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              placeholder="Tell us what happened and include any order or event details..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setView('list')}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit request'}
            </Button>
          </div>
        </form>
      ) : view === 'detail' && selectedId ? (
        <div
          key={`${selectedId}-${ticket?.messages?.length ?? 0}-${ticket?.status}`}
          className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden shadow-sm"
        >
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
            <button onClick={() => { setView('list'); setSelectedId(null); }} className="text-neutral-400 hover:text-rose-500">
              <ArrowLeft className="h-4 w-4" />
            </button>
            {detailLoading || !ticket ? (
              <Spinner />
            ) : (
              <div className="flex-1 min-w-0">
                <h2 className="font-extrabold truncate">{ticket.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', statusStyle[ticket.status] || statusStyle.OPEN)}>
                    {ticket.status?.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-neutral-500">{ticket.category}</span>
                </div>
              </div>
            )}
          </div>
          {ticket && (
            <>
              <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto bg-neutral-50/50 dark:bg-neutral-950/30">
                {ticket.messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                      msg.authorRole === 'ADMIN'
                        ? 'ml-auto bg-rose-500 text-white'
                        : 'bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700'
                    )}
                  >
                    <p className="text-[10px] font-bold opacity-70 mb-1">
                      {msg.authorRole === 'ADMIN' ? 'PartyStorm Support' : 'You'}
                      {' · '}
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                  </div>
                ))}
              </div>
              {ticket.status !== 'CLOSED' && (
                <form onSubmit={handleReply} className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2 bg-white dark:bg-neutral-900">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <Button type="submit" disabled={replyMutation.isPending || !reply.trim()}>
                    {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
              <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No support requests yet</p>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Need help with tickets, payments, or hosting?</p>
              <Button onClick={() => setView('create')} className="gap-2">
                <Plus className="h-4 w-4" /> Contact support
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedId(t.id); setView('detail'); }}
                  className="w-full text-left p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-200 dark:hover:border-rose-800 transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{t.subject}</p>
                      <p className="text-xs text-neutral-500 mt-1">{t.category}</p>
                    </div>
                    <span className={cn('text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0', statusStyle[t.status] || statusStyle.OPEN)}>
                      {t.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {new Date(t.updatedAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Before you wait</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  Check the <Link to="/help" className="text-rose-500 font-semibold hover:underline">Help Center</Link> for instant answers on tickets, refunds, and becoming a host.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupportPage;
