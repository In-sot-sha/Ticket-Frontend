import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Minus,
  Plus,
  UserCheck,
  X,
  Trash2,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/Switch';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { isValidEmail, isValidPhone, normalizePhone } from '../lib/phone';
import { formatNaira } from '../lib/eventOrganizer';

interface TicketType {
  id: number;
  name: string;
  price: number;
  quantity: number;
  maxPerPerson?: number | null;
  isPaused?: boolean;
}

interface EventInfo {
  id: number;
  title: string;
  ticketTypes: TicketType[];
}

type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER' | 'FREE';

const PAID_PAYMENTS: { id: Exclude<PaymentMethod, 'FREE'>; label: string }[] = [
  { id: 'CASH', label: 'Cash' },
  { id: 'POS', label: 'POS' },
  { id: 'TRANSFER', label: 'Transfer' },
];

type QueueItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  ticketTypeId: string;
  ticketTypeName: string;
  qty: number;
  paymentMethod: PaymentMethod;
  checkInNow: boolean;
  unitPrice: number;
  status: 'pending' | 'issuing' | 'error';
  error?: string;
};

type ExistingMatch = {
  userId: number;
  name: string;
  email: string;
  phone: string;
  existingTickets: Array<{ ticketTypeId: number; ticketTypeName: string; qty: number }>;
};

const hasValidContact = (email: string, phone: string) => {
  const e = email.trim();
  const p = phone.trim();
  if (e && !isValidEmail(e)) return false;
  if (p && !isValidPhone(p)) return false;
  return (!!e && isValidEmail(e)) || (!!p && isValidPhone(p));
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const draftKey = (eventKey: string) => `gate_walkin_${eventKey}`;

const ManualAttendeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isStaffMode = location.pathname.startsWith('/staff/');
  const backPath = isStaffMode ? '/staff' : `/organizer/events/${id}`;
  const scanPath = isStaffMode ? '/staff/scan' : '/organizer/scan';
  const phoneRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ticketTypeId, setTicketTypeId] = useState('');
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [checkInNow, setCheckInNow] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [match, setMatch] = useState<ExistingMatch | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [sessionCollected, setSessionCollected] = useState({ CASH: 0, POS: 0, TRANSFER: 0, tickets: 0 });

  const storageId = event ? String(event.id) : '';

  useEffect(() => {
    if (!id) return;
    setLoadingEvent(true);
    const load = isStaffMode
      ? api.events.getByIdentifier(id)
      : api.events.getOrganizerEventById(id);

    load
      .then((res) => {
        const data = res.data;
        setEvent({
          id: data.id,
          title: data.title,
          ticketTypes: data.ticketTypes || [],
        });
        const sellable = (data.ticketTypes || []).filter((tt: TicketType) => !tt.isPaused);
        const saved = readDraft(String(data.id));
        if (saved) {
          setName(saved.name);
          setEmail(saved.email);
          setPhone(saved.phone);
          setQty(saved.qty || 1);
          setPaymentMethod(saved.paymentMethod || 'CASH');
          setCheckInNow(saved.checkInNow !== false);
          setQueue((saved.queue || []).map((item) => ({ ...item, status: 'pending', error: undefined })));
          const stillValid = sellable.some((tt: TicketType) => String(tt.id) === saved.ticketTypeId);
          setTicketTypeId(stillValid ? saved.ticketTypeId : sellable[0] ? String(sellable[0].id) : '');
        } else if (sellable.length > 0) {
          setTicketTypeId(String(sellable[0].id));
        }
        setSessionCollected(readSession(String(data.id)));
      })
      .catch(() => setError('Could not load event. Your list is still saved on this phone.'))
      .finally(() => setLoadingEvent(false));
  }, [id, isStaffMode]);

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    if (!storageId) return;
    writeDraft(storageId, {
      name,
      email,
      phone,
      ticketTypeId,
      qty,
      paymentMethod,
      checkInNow,
      queue,
    });
  }, [storageId, name, email, phone, ticketTypeId, qty, paymentMethod, checkInNow, queue]);

  useEffect(() => {
    if (!event?.id) return;
    const query = phone.trim() || email.trim();
    const ready = (phone.trim() && (isValidPhone(phone) || phone.replace(/\D/g, '').length >= 8)) || isValidEmail(email);
    if (!ready) {
      setMatch(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLookingUp(true);
      api.tickets
        .lookupAttendee(event.id, query)
        .then((res) => {
          if (cancelled) return;
          const found = res.data?.matches?.[0] || null;
          setMatch(found);
          if (found) {
            setName((prev) => prev.trim() ? prev : found.name);
            setEmail((prev) => prev.trim() ? prev : found.email);
            setPhone((prev) => prev.trim() ? prev : found.phone);
          }
        })
        .catch(() => {
          if (!cancelled) setMatch(null);
        })
        .finally(() => {
          if (!cancelled) setLookingUp(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [event?.id, phone, email]);

  const selectedTicketType = event?.ticketTypes.find((tt) => String(tt.id) === ticketTypeId);
  const isPaid = (selectedTicketType?.price || 0) > 0;
  const unitPrice = selectedTicketType?.price || 0;
  const resolvedPayment: PaymentMethod = isPaid ? (paymentMethod === 'FREE' ? 'CASH' : paymentMethod) : 'FREE';

  const formValid = !!ticketTypeId && !!name.trim() && hasValidContact(email, phone);

  const queueTotal = queue.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const queueQty = queue.reduce((sum, item) => sum + item.qty, 0);

  const resetGuestFields = () => {
    setName('');
    setEmail('');
    setPhone('');
    setQty(1);
    setMatch(null);
    setTimeout(() => phoneRef.current?.focus(), 40);
  };

  const buildQueueItem = (): QueueItem | null => {
    if (!formValid || !selectedTicketType) return null;
    return {
      id: newId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      ticketTypeId,
      ticketTypeName: selectedTicketType.name,
      qty,
      paymentMethod: resolvedPayment,
      checkInNow,
      unitPrice,
      status: 'pending',
    };
  };

  const addToQueue = () => {
    setError(null);
    if (!formValid) {
      setError('Name plus a valid phone or email is required.');
      return;
    }
    const item = buildQueueItem();
    if (!item) return;

    setQueue((prev) => {
      const same = prev.find(
        (row) =>
          row.status !== 'error' &&
          row.ticketTypeId === item.ticketTypeId &&
          row.paymentMethod === item.paymentMethod &&
          (normalizePhone(row.phone) || row.email) &&
          (normalizePhone(row.phone) === normalizePhone(item.phone) ||
            (row.email && item.email && row.email === item.email))
      );
      if (same) {
        return prev.map((row) => (row.id === same.id ? { ...row, qty: row.qty + item.qty, name: item.name } : row));
      }
      return [...prev, item];
    });
    resetGuestFields();
  };

  const removeFromQueue = (itemId: string) => {
    setQueue((prev) => prev.filter((row) => row.id !== itemId));
  };

  const issueOne = async (item: QueueItem) => {
    const attendees = Array.from({ length: item.qty }, () => ({
      name: item.name,
      email: item.email || undefined,
      phone: item.phone || undefined,
    }));
    await api.tickets.issueManual({
      eventId: event!.id,
      ticketTypeId: Number(item.ticketTypeId),
      quantity: item.qty,
      buyerName: item.name,
      buyerEmail: item.email || undefined,
      buyerPhone: item.phone || undefined,
      attendees,
      paymentMethod: item.paymentMethod,
      checkInNow: item.checkInNow,
    });
  };

  const issueQueue = async () => {
    if (!event) return;
    let working = [...queue];
    if (working.length === 0) {
      const current = buildQueueItem();
      if (!current) {
        setError('Add someone to the list, or fill the form first.');
        return;
      }
      working = [current];
    }

    setError(null);
    setIssuing(true);
    const remaining: QueueItem[] = [];
    let issuedCount = 0;
    let issuedQty = 0;

    for (const item of working) {
      setQueue((prev) => {
        const exists = prev.some((row) => row.id === item.id);
        const next = exists ? prev : [...prev, item];
        return next.map((row) => (row.id === item.id ? { ...row, status: 'issuing', error: undefined } : row));
      });
      try {
        await issueOne(item);
        issuedCount += 1;
        issuedQty += item.qty;
        setSessionCollected((prev) => {
          const next = { ...prev, tickets: prev.tickets + item.qty };
          if (item.paymentMethod === 'CASH' || item.paymentMethod === 'POS' || item.paymentMethod === 'TRANSFER') {
            next[item.paymentMethod] += item.unitPrice * item.qty;
          }
          if (event) writeSession(String(event.id), next);
          return next;
        });
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Could not issue. Person kept on the list.';
        remaining.push({ ...item, status: 'error', error: msg });
      }
    }

    setQueue(remaining);
    if (issuedCount > 0) {
      setToastMsg(`Issued ${issuedQty} ticket${issuedQty === 1 ? '' : 's'}`);
      if (working.length === 1 && remaining.length === 0) resetGuestFields();
    }
    if (remaining.length > 0) {
      setError(
        remaining.length === working.length
          ? remaining[0].error || 'Server error. Nobody was removed from the list.'
          : `${remaining.length} left on the list after a server error. Issued tickets are saved.`
      );
    }
    setIssuing(false);
  };

  const inputClass =
    'w-full px-3 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500';

  return (
    <div className="relative max-w-5xl mx-auto px-3 sm:px-6 pb-28 sm:pb-8 pt-2">
      {toastMsg && (
        <div className="mb-3 p-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button type="button" onClick={() => setToastMsg(null)} className="p-1 hover:bg-emerald-700 rounded-md">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-2.5 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to={backPath}
            className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white truncate leading-tight">
              Gate sale
            </h1>
            <p className="text-[11px] text-neutral-500 truncate leading-none mt-0.5">
              {event?.title || 'Walk-in'}
            </p>
          </div>
        </div>
        <Link to={scanPath}>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1 border-neutral-200 dark:border-neutral-700">
            <ScanLine className="h-3.5 w-3.5 text-rose-500" />
            <span className="hidden sm:inline">Scan</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1 font-medium">{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-3">
          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Person</span>
              {lookingUp && <span className="text-[10px] text-neutral-400 flex items-center gap-1"><Search className="h-3 w-3" /> Looking up…</span>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Phone <span className="text-rose-500">*</span>
              </label>
              <input
                ref={phoneRef}
                type="tel"
                inputMode="tel"
                className={inputClass}
                placeholder="0803 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToQueue();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Tunde Adeleke"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToQueue();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="optional if phone is set"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            {match && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-bold">Returning: {match.name}</p>
                {match.existingTickets.length > 0 ? (
                  <p className="mt-0.5">
                    Already has {match.existingTickets.map((t) => `${t.ticketTypeName} × ${t.qty}`).join(', ')}. Pick another day if needed.
                  </p>
                ) : (
                  <p className="mt-0.5">Known guest — details filled. Add the day they are buying now.</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Ticket / day</span>
            {loadingEvent ? (
              <Skeleton className="h-10 w-full rounded-xl" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {event?.ticketTypes.filter((tt) => !tt.isPaused).map((tt) => {
                  const selected = String(tt.id) === ticketTypeId;
                  const already = match?.existingTickets.find((t) => t.ticketTypeId === tt.id);
                  return (
                    <button
                      key={tt.id}
                      type="button"
                      onClick={() => setTicketTypeId(String(tt.id))}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all cursor-pointer min-w-0',
                        selected
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300'
                      )}
                    >
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{tt.name}</p>
                      <p className={cn('text-[11px] font-semibold mt-0.5', selected ? 'text-rose-600' : 'text-neutral-500')}>
                        {tt.price === 0 ? 'Free' : formatNaira(tt.price)}
                      </p>
                      {already && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">Has ×{already.qty}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Qty</span>
              <div className="flex items-center gap-1">
                {[1, 2, 5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQty(preset)}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-semibold border',
                      qty === preset
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600'
                    )}
                  >
                    {preset}
                  </button>
                ))}
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="h-7 w-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold tabular-nums">{qty}</span>
                <button type="button" onClick={() => setQty(Math.min(20, qty + 1))} className="h-7 w-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {isPaid && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {PAID_PAYMENTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentMethod(p.id)}
                    className={cn(
                      'py-2 rounded-xl text-xs font-bold border',
                      resolvedPayment === p.id
                        ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <label className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 cursor-pointer">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-bold text-neutral-900 dark:text-white">Check in now</p>
              </div>
              <Switch checked={checkInNow} onCheckedChange={setCheckInNow} />
            </label>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={!formValid || issuing}
            onClick={addToQueue}
            className="w-full h-11 rounded-xl text-sm font-bold border-neutral-200"
          >
            Add to list
          </Button>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Issue list</h3>
              <span className="text-xs font-bold text-neutral-500">{queueQty} ticket{queueQty === 1 ? '' : 's'}</span>
            </div>

            {queue.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">
                Add people as they come. Issue them together when the line pauses.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-72 overflow-y-auto">
                {queue.map((item) => (
                  <li key={item.id} className="py-2.5 flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {item.ticketTypeName} × {item.qty}
                        {item.unitPrice > 0 ? ` · ${item.paymentMethod === 'CASH' ? 'Cash' : item.paymentMethod === 'POS' ? 'POS' : 'Transfer'} · ${formatNaira(item.unitPrice * item.qty)}` : ' · Free'}
                      </p>
                      {item.error && <p className="text-[11px] text-rose-500 mt-0.5">{item.error}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromQueue(item.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/60 p-2">
                <p className="text-[10px] font-bold uppercase text-neutral-400">Cash</p>
                <p className="text-xs font-extrabold tabular-nums">{formatNaira(sessionCollected.CASH)}</p>
              </div>
              <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/60 p-2">
                <p className="text-[10px] font-bold uppercase text-neutral-400">POS</p>
                <p className="text-xs font-extrabold tabular-nums">{formatNaira(sessionCollected.POS)}</p>
              </div>
              <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/60 p-2">
                <p className="text-[10px] font-bold uppercase text-neutral-400">Transfer</p>
                <p className="text-xs font-extrabold tabular-nums">{formatNaira(sessionCollected.TRANSFER)}</p>
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 text-center -mt-1">Collected on this phone today · {sessionCollected.tickets} ticket{sessionCollected.tickets === 1 ? '' : 's'}</p>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-bold">List total</span>
              <span className="text-base font-extrabold tabular-nums">{queueTotal === 0 ? 'Free' : formatNaira(queueTotal)}</span>
            </div>

            <Button
              type="button"
              disabled={issuing || loadingEvent || (queue.length === 0 && !formValid)}
              onClick={issueQueue}
              className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0 text-sm font-bold"
            >
              {issuing
                ? 'Issuing…'
                : queue.length > 0
                  ? `Issue ${queueQty} ticket${queueQty === 1 ? '' : 's'}`
                  : checkInNow
                    ? 'Issue & check in'
                    : 'Issue ticket'}
            </Button>
            <p className="text-[10px] text-neutral-400 text-center">
              If the server fails, this list stays on this phone. Nothing is wiped.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function readDraft(eventKey: string): {
  name: string;
  email: string;
  phone: string;
  ticketTypeId: string;
  qty: number;
  paymentMethod: PaymentMethod;
  checkInNow: boolean;
  queue: QueueItem[];
} | null {
  try {
    const raw = localStorage.getItem(draftKey(eventKey));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeDraft(
  eventKey: string,
  draft: {
    name: string;
    email: string;
    phone: string;
    ticketTypeId: string;
    qty: number;
    paymentMethod: PaymentMethod;
    checkInNow: boolean;
    queue: QueueItem[];
  }
) {
  try {
    localStorage.setItem(draftKey(eventKey), JSON.stringify(draft));
  } catch {
    // quota / private mode — keep working in memory
  }
}

function sessionKey(eventKey: string) {
  return `gate_collected_${eventKey}_${new Date().toISOString().slice(0, 10)}`;
}

function readSession(eventKey: string) {
  try {
    const raw = localStorage.getItem(sessionKey(eventKey));
    if (!raw) return { CASH: 0, POS: 0, TRANSFER: 0, tickets: 0 };
    const parsed = JSON.parse(raw);
    return {
      CASH: Number(parsed.CASH) || 0,
      POS: Number(parsed.POS) || 0,
      TRANSFER: Number(parsed.TRANSFER) || 0,
      tickets: Number(parsed.tickets) || 0,
    };
  } catch {
    return { CASH: 0, POS: 0, TRANSFER: 0, tickets: 0 };
  }
}

function writeSession(
  eventKey: string,
  value: { CASH: number; POS: number; TRANSFER: number; tickets: number }
) {
  try {
    localStorage.setItem(sessionKey(eventKey), JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default ManualAttendeePage;
