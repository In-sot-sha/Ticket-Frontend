import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Minus,
  Plus,
  ScanLine,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/Switch';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface TicketType {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface EventInfo {
  id: number;
  title: string;
  startDate?: string;
  location?: string;
  ticketTypes: TicketType[];
}

type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER';

const PAYMENTS: { id: PaymentMethod; label: string }[] = [
  { id: 'CASH', label: 'Cash' },
  { id: 'POS', label: 'POS' },
  { id: 'TRANSFER', label: 'Transfer' },
];

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const ManualAttendeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isStaffMode = location.pathname.startsWith('/staff/');
  const backPath = isStaffMode ? '/staff' : `/organizer/events/${id}`;
  const scanPath = isStaffMode ? '/staff/scan' : '/organizer/scan';
  const nameRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<{
    count: number;
    checkedIn: boolean;
    ticketName: string;
    total: number;
    email: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ticketTypeId, setTicketTypeId] = useState('');
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [checkInNow, setCheckInNow] = useState(true);
  const [useSameDetails, setUseSameDetails] = useState(true);

  const [attendees, setAttendees] = useState([{ name: '', email: '', phone: '' }]);

  const syncQty = (newQty: number) => {
    if (newQty < 1 || newQty > 20) return;
    setQty(newQty);
    setAttendees((prev) => {
      const updated = [...prev];
      while (updated.length < newQty) updated.push({ name: '', email: '', phone: '' });
      return updated.slice(0, newQty);
    });
  };

  const updateAttendee = (index: number, field: 'name' | 'email' | 'phone', value: string) => {
    setAttendees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

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
          startDate: data.startDate,
          location: data.location,
          ticketTypes: data.ticketTypes || [],
        });
        if (data.ticketTypes?.length > 0) {
          setTicketTypeId(String(data.ticketTypes[0].id));
        }
      })
      .catch(() => setError('Could not load event.'))
      .finally(() => setLoadingEvent(false));
  }, [id, isStaffMode]);

  useEffect(() => {
    if (!success) nameRef.current?.focus();
  }, [success]);

  const selectedTicketType = event?.ticketTypes.find((tt) => String(tt.id) === ticketTypeId);
  const total =
    selectedTicketType && !Number.isNaN(selectedTicketType.price)
      ? selectedTicketType.price * qty
      : 0;

  const guestsToValidate = useSameDetails ? [attendees[0]] : attendees;

  const canSubmit =
    !!ticketTypeId &&
    guestsToValidate.every(
      (a) => a.name.trim() && isValidEmail(a.email)
    );

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!ticketTypeId) return setError('Select a ticket type.');
    for (const a of guestsToValidate) {
      if (!a.name.trim()) return setError('Enter a guest name.');
      if (!a.email.trim()) return setError('Email is required so the ticket links to a guest account.');
      if (!isValidEmail(a.email)) return setError('Enter a valid email address.');
    }

    setSaving(true);
    try {
      const payloadAttendees = useSameDetails
        ? Array.from({ length: qty }, () => ({
            name: attendees[0].name.trim(),
            email: attendees[0].email.trim().toLowerCase(),
            phone: attendees[0].phone.trim() || undefined,
          }))
        : attendees.map((a) => ({
            name: a.name.trim(),
            email: a.email.trim().toLowerCase(),
            phone: a.phone.trim() || undefined,
          }));

      await api.post('/tickets/manual', {
        eventId: event!.id,
        ticketTypeId: Number(ticketTypeId),
        quantity: qty,
        buyerName: attendees[0].name.trim(),
        buyerEmail: attendees[0].email.trim().toLowerCase(),
        buyerPhone: attendees[0].phone.trim() || undefined,
        attendees: payloadAttendees,
        paymentMethod,
        checkInNow,
      });

      setSuccess({
        count: qty,
        checkedIn: checkInNow,
        ticketName: selectedTicketType?.name || 'Ticket',
        total,
        email: attendees[0].email.trim().toLowerCase(),
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to register guest.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSuccess(null);
    setError(null);
    setCheckInNow(true);
    setQty(1);
    setAttendees([{ name: '', email: '', phone: '' }]);
    setUseSameDetails(true);
  };

  const inputClass =
    'w-full px-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-base sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-colors';

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {success.count} guest{success.count > 1 ? 's' : ''} added
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {success.ticketName}
            {success.total > 0 ? ` · ₦${success.total.toLocaleString()}` : ' · Free'}
            {success.checkedIn ? ' · Checked in' : ' · Ticket issued'}
          </p>
          <p className="mt-3 text-xs text-neutral-500">
            Confirmation sent to <span className="font-semibold text-neutral-700 dark:text-neutral-300">{success.email}</span>
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button
              onClick={handleReset}
              className="h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0 text-base font-bold"
            >
              Add next guest
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(backPath)}
              className="h-12 rounded-full border-neutral-200 dark:border-neutral-700 font-semibold"
            >
              {isStaffMode ? 'Back to staff home' : 'Back to event'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const ticketSection = (
    <section>
      <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-neutral-500">1 · Ticket</h2>
      {loadingEvent ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : event?.ticketTypes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 px-4 py-6 text-center text-sm text-neutral-500">
          No ticket types on this event yet.
        </p>
      ) : (
        <div className="grid gap-2">
          {event?.ticketTypes.map((tt) => {
            const selected = String(tt.id) === ticketTypeId;
            return (
              <button
                key={tt.id}
                type="button"
                onClick={() => setTicketTypeId(String(tt.id))}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-colors',
                  selected
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/25'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-300'
                )}
              >
                <div className="min-w-0">
                  <p className="font-bold text-neutral-900 dark:text-white truncate">{tt.name}</p>
                  <p className={cn('text-sm font-semibold mt-0.5', selected ? 'text-rose-600' : 'text-neutral-500')}>
                    {tt.price === 0 ? 'Free' : `₦${tt.price.toLocaleString()}`}
                  </p>
                </div>
                <span
                  className={cn(
                    'h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center',
                    selected ? 'border-rose-500 bg-rose-500' : 'border-neutral-300 dark:border-neutral-600'
                  )}
                >
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Quantity</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => syncQty(qty - 1)}
            disabled={qty <= 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2ch] text-center text-lg font-extrabold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => syncQty(qty + 1)}
            disabled={qty >= 20}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );

  const guestSection = (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">2 · Guest</h2>
        {qty > 1 && (
          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            Same details for all
            <Switch checked={useSameDetails} onCheckedChange={setUseSameDetails} />
          </label>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        {(useSameDetails ? [attendees[0]] : attendees).map((attendee, index) => (
          <div
            key={index}
            className={cn(index > 0 && 'pt-4 border-t border-neutral-100 dark:border-neutral-800')}
          >
            {!useSameDetails && (
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Guest {index + 1}
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-neutral-600 dark:text-neutral-400">
                Full name <span className="text-rose-500">*</span>
              </span>
              <input
                ref={index === 0 ? nameRef : undefined}
                type="text"
                autoComplete="name"
                className={inputClass}
                placeholder="Guest full name"
                value={attendee.name}
                onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                required
              />
            </label>
            <label className="mt-3 block">
              <span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                <Mail className="h-3 w-3" /> Email <span className="text-rose-500">*</span>
              </span>
              <input
                type="email"
                autoComplete="email"
                className={inputClass}
                placeholder="guest@email.com"
                value={attendee.email}
                onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                required
              />
              <p className="mt-1 text-[10px] text-neutral-400">
                Required — links the ticket to a guest account and sends the pass.
              </p>
            </label>
            <label className="mt-3 block">
              <span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                <Phone className="h-3 w-3" /> Phone
                <span className="font-normal text-neutral-400">(optional)</span>
              </span>
              <input
                type="tel"
                autoComplete="tel"
                className={inputClass}
                placeholder="080…"
                value={attendee.phone}
                onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
              />
            </label>
          </div>
        ))}
      </div>
    </section>
  );

  const paymentControls = (
    <>
      <div className="grid grid-cols-3 gap-2">
        {PAYMENTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPaymentMethod(p.id)}
            className={cn(
              'h-12 rounded-xl text-sm font-bold border-2 transition-colors',
              paymentMethod === p.id
                ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3.5 cursor-pointer">
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white">Check in now</p>
          <p className="text-xs text-neutral-500 mt-0.5">Mark as entered at the gate</p>
        </div>
        <Switch checked={checkInNow} onCheckedChange={setCheckInNow} />
      </label>
    </>
  );

  const summaryBlock = (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Summary</h3>
      {loadingEvent ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <>
          <div>
            <p className="font-extrabold text-neutral-900 dark:text-white leading-snug">{event?.title}</p>
            {event?.startDate && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(event.startDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            )}
            {event?.location && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">{event.location}</span>
              </p>
            )}
          </div>
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex justify-between text-sm">
            <span className="text-neutral-500">
              {selectedTicketType?.name || 'Ticket'} × {qty}
            </span>
            <span className="font-bold tabular-nums">
              {total === 0 ? 'Free' : `₦${total.toLocaleString()}`}
            </span>
          </div>
        </>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Payment</p>
        {paymentControls}
      </div>

      <Button
        type="button"
        disabled={saving || !canSubmit || loadingEvent}
        onClick={() => handleSubmit()}
        className="hidden lg:flex w-full h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0 font-bold disabled:opacity-50"
      >
        {saving ? 'Saving…' : checkInNow ? 'Register & check in' : 'Register'}
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        'relative bg-neutral-50 dark:bg-neutral-950',
        isStaffMode
          ? 'min-h-0 pb-28 lg:pb-6'
          : 'min-h-screen pb-28 lg:pb-10'
      )}
    >
      {!isStaffMode && (
        <header className="sticky top-0 z-20 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <Link
              to={backPath}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900"
              aria-label="Back to event"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                Walk-in · Gate
              </p>
              {loadingEvent ? (
                <Skeleton className="mt-1 h-4 w-40" />
              ) : (
                <h1 className="truncate text-sm font-extrabold text-neutral-900 dark:text-white">
                  {event?.title || 'Event'}
                </h1>
              )}
            </div>
            <Link
              to={scanPath}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700"
              aria-label="Open scanner"
            >
              <ScanLine className="h-4 w-4" />
            </Link>
          </div>
        </header>
      )}

      {isStaffMode && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
              Walk-in registration
            </p>
            {loadingEvent ? (
              <Skeleton className="mt-1 h-5 w-48" />
            ) : (
              <h1 className="text-lg font-extrabold text-neutral-900 dark:text-white truncate">
                {event?.title || 'Event'}
              </h1>
            )}
          </div>
          <Link
            to={scanPath}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            aria-label="Open scanner"
          >
            <ScanLine className="h-4 w-4" />
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(isStaffMode ? 'pt-0' : 'mx-auto max-w-5xl px-4 pt-5')}
      >
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-3 text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm font-medium flex-1">{error}</p>
            <button type="button" onClick={() => setError(null)} className="text-xs font-bold underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-7 space-y-6">
            {ticketSection}
            {guestSection}
            <section className="lg:hidden">
              <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-neutral-500">
                3 · Payment
              </h2>
              {paymentControls}
            </section>
          </div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">{summaryBlock}</div>
          </div>
        </div>
      </form>

      {/* Mobile CTA — sit above staff tab bar when in staff shell */}
      <div
        className={cn(
          'z-30 lg:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm',
          isStaffMode
            ? 'fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom))] inset-x-0 md:bottom-0 md:absolute'
            : 'absolute bottom-0 inset-x-0 pb-safe'
        )}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total</p>
            <p className="text-lg font-extrabold tabular-nums leading-tight">
              {total === 0 ? 'Free' : `₦${total.toLocaleString()}`}
              <span className="ml-1.5 text-xs font-semibold text-neutral-500">· {qty}×</span>
            </p>
          </div>
          <Button
            type="button"
            disabled={saving || !canSubmit || loadingEvent}
            onClick={() => handleSubmit()}
            className="h-12 shrink-0 rounded-full px-5 bg-rose-500 hover:bg-rose-600 text-white border-0 font-bold disabled:opacity-50"
          >
            {saving ? 'Saving…' : checkInNow ? 'Register & check in' : 'Register'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendeePage;
