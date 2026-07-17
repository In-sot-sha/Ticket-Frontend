import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
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
  Mail,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import {
  useMySupportTickets,
  useSupportTicket,
  useCreateSupportTicket,
  useReplySupportTicket,
} from '../hooks/queries/useSupport';
import { api } from '../services/api';
import { cn } from '../lib/utils';

const USER_CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'BILLING', label: 'Billing & payments' },
  { value: 'TICKETS', label: 'Tickets & bookings' },
  { value: 'HOSTING', label: 'Hosting events' },
  { value: 'TECHNICAL', label: 'Technical issue' },
  { value: 'OTHER', label: 'Other' },
];

const STAFF_CATEGORIES = [
  { value: 'OPS', label: 'Ops / gate coverage' },
  { value: 'ACCESS', label: 'Staff access & capabilities' },
  { value: 'SCAN', label: 'Scanning / walk-in tools' },
  { value: 'TECHNICAL', label: 'Technical issue' },
  { value: 'GENERAL', label: 'General' },
  { value: 'OTHER', label: 'Other' },
];

const statusStyle: Record<string, string> = {
  OPEN: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
  IN_PROGRESS: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
  RESOLVED: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
  CLOSED: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const SupportPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isStaffMode = location.pathname.startsWith('/staff');
  const categories = isStaffMode ? STAFF_CATEGORIES : USER_CATEGORIES;
  const backHref = isStaffMode ? '/staff' : '/help';
  const backLabel = isStaffMode ? 'Back to staff home' : 'Back to Help Center';

  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(isStaffMode ? 'OPS' : 'GENERAL');
  const [body, setBody] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [guestSubmitted, setGuestSubmitted] = useState<{
    email: string;
    ticketId?: number;
  } | null>(null);
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  const { data: tickets = [], isLoading } = useMySupportTickets(isAuthenticated);
  const { data: ticket, isLoading: detailLoading } = useSupportTicket(
    isAuthenticated ? selectedId : null
  );
  const createMutation = useCreateSupportTicket();
  const replyMutation = useReplySupportTicket();

  useEffect(() => {
    if (user) {
      setContactName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setContactEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setView('create');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setCategory(isStaffMode ? 'OPS' : 'GENERAL');
  }, [isStaffMode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      if (!contactName.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (!isValidEmail(contactEmail)) {
        setError('Please enter a valid email so we can reply to you.');
        return;
      }
    }

    try {
      if (isAuthenticated) {
        const res = await createMutation.mutateAsync({
          subject,
          body,
          category,
          contactEmail: contactEmail || undefined,
          contactName: contactName || undefined,
        });
        setSubject('');
        setBody('');
        setCategory(isStaffMode ? 'OPS' : 'GENERAL');
        if (res.data?.ticket?.id) {
          setSelectedId(res.data.ticket.id);
          setView('detail');
        } else {
          setView('list');
        }
      } else {
        setGuestSubmitting(true);
        const res = await api.support.createContact({
          subject,
          body,
          category,
          contactEmail: contactEmail.trim().toLowerCase(),
          contactName: contactName.trim(),
        });
        setGuestSubmitted({
          email: contactEmail.trim().toLowerCase(),
          ticketId: res.data?.ticket?.id,
        });
        setSubject('');
        setBody('');
        setCategory('GENERAL');
        setView('list');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not submit your request. Please try again.');
    } finally {
      setGuestSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setError('');
    try {
      const message = reply.trim();
      setReply('');
      await replyMutation.mutateAsync({ id: selectedId, body: message });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not send reply.');
    }
  };

  const submitting = createMutation.isPending || guestSubmitting;

  if (guestSubmitted) {
    return (
      <div
        className={cn(
          'text-center',
          isStaffMode ? 'py-10' : 'max-w-md mx-auto py-16 px-4'
        )}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">Request sent</h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-2">
          We emailed a confirmation to{' '}
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            {guestSubmitted.email}
          </span>
          {guestSubmitted.ticketId ? ` (ticket #${guestSubmitted.ticketId})` : ''}. Our team will
          reply to that inbox.
        </p>
        <p className="text-xs text-neutral-400 mb-8">
          No account needed — keep an eye on your email for updates and if we need more details.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setGuestSubmitted(null);
              setView('create');
            }}
          >
            Send another
          </Button>
          <Link to="/">
            <Button className="rounded-full w-full sm:w-auto">Back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(isStaffMode ? 'pb-2' : 'max-w-4xl mx-auto py-8 px-4 pb-24')}>
      <div className={cn(isStaffMode ? 'mb-6' : 'mb-8')}>
        {!isStaffMode && (
          <Link
            to={backHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-rose-500 mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
          </Link>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="h-5 w-5 text-rose-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                {isStaffMode ? 'Staff support' : 'Help & Support'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isStaffMode ? (
                <>
                  Ops <span className="text-rose-500">helpdesk</span>
                </>
              ) : (
                <>
                  My <span className="text-rose-500">Support</span>
                </>
              )}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {isStaffMode
                ? `Hi ${user?.firstName}, report gate issues or access problems — admins reply here and by email.`
                : isAuthenticated
                  ? `Hi ${user?.firstName}, submit a request and track replies here. We’ll also email you.`
                  : 'No login needed — leave your email and we’ll reply there with updates.'}
            </p>
          </div>
          {view === 'list' && (
            <Button onClick={() => setView('create')} className="gap-2 shrink-0 rounded-full">
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
        <form
          onSubmit={handleCreate}
          className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 p-5 sm:p-6 space-y-5 shadow-sm"
        >
          <h2 className="text-lg font-extrabold">
            {isStaffMode ? 'Report to PartyStorm admin' : 'Submit a support request'}
          </h2>

          {!isAuthenticated && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Your name
                </label>
                <input
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </label>
                <input
                  required
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  placeholder="you@email.com"
                />
                <p className="mt-1 text-[10px] text-neutral-400">
                  We’ll send confirmation and replies to this address.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Subject
            </label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              placeholder={
                isStaffMode
                  ? 'e.g. Missing org coverage, walk-in blocked'
                  : 'e.g. Missing ticket, refund request'
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Message
            </label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              placeholder="Tell us what happened…"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setView('list')}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit request'}
            </Button>
          </div>
        </form>
      ) : view === 'detail' && selectedId && isAuthenticated ? (
        <div
          key={`${selectedId}-${ticket?.messages?.length ?? 0}-${ticket?.status}`}
          className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden shadow-sm"
        >
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setView('list');
                setSelectedId(null);
              }}
              className="text-neutral-400 hover:text-rose-500"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {detailLoading || !ticket ? (
              <Spinner />
            ) : (
              <div className="flex-1 min-w-0">
                <h2 className="font-extrabold truncate">{ticket.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                      statusStyle[ticket.status] || statusStyle.OPEN
                    )}
                  >
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
                <form
                  onSubmit={handleReply}
                  className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2 bg-white dark:bg-neutral-900"
                >
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={replyMutation.isPending || !reply.trim()}
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {!isAuthenticated ? (
            <div className="text-center py-14 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 px-4">
              <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Contact support without an account
              </p>
              <p className="text-xs text-neutral-500 mt-1 mb-4 max-w-sm mx-auto">
                Submit a request with your email — we confirm by mail and reply there. Sign in to
                track a full ticket history in-app.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => setView('create')} className="gap-2 rounded-full">
                  <Plus className="h-4 w-4" /> New request
                </Button>
                <Link to={`/login?redirect=${encodeURIComponent('/support')}`}>
                  <Button variant="outline" className="rounded-full w-full sm:w-auto">
                    Sign in to track tickets
                  </Button>
                </Link>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
              <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                No support requests yet
              </p>
              <p className="text-xs text-neutral-500 mt-1 mb-4 px-4">
                {isStaffMode
                  ? 'Need coverage, scan access, or help with an ops project?'
                  : 'Need help with tickets, payments, or hosting?'}
              </p>
              <Button onClick={() => setView('create')} className="gap-2 rounded-full">
                <Plus className="h-4 w-4" /> Contact support
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t: any) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(t.id);
                    setView('detail');
                  }}
                  className="w-full text-left p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-200 dark:hover:border-rose-800 transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{t.subject}</p>
                      <p className="text-xs text-neutral-500 mt-1">{t.category}</p>
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0',
                        statusStyle[t.status] || statusStyle.OPEN
                      )}
                    >
                      {t.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated{' '}
                    {new Date(t.updatedAt).toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  {isAuthenticated ? 'We email you too' : 'Email-first support'}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  {isStaffMode ? (
                    <>
                      Tickets land in the admin inbox. You’ll get email when they reply, need more
                      info, or resolve the request.
                    </>
                  ) : (
                    <>
                      Confirmation and status updates go to your email. Check the{' '}
                      <Link to="/help" className="text-rose-500 font-semibold hover:underline">
                        Help Center
                      </Link>{' '}
                      for instant answers while you wait.
                    </>
                  )}
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
