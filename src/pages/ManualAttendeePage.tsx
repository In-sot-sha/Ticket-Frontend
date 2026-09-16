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
  UserCheck,
  CreditCard,
  User,
  Ticket,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/Switch';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { isValidEmail, isValidPhone } from '../lib/phone';

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
  startDate?: string;
  location?: string;
  ticketTypes: TicketType[];
}

type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER' | 'COMPLIMENTARY';

const PAYMENTS: { id: PaymentMethod; label: string }[] = [
  { id: 'CASH', label: 'Cash' },
  { id: 'POS', label: 'POS' },
  { id: 'TRANSFER', label: 'Transfer' },
  { id: 'COMPLIMENTARY', label: 'Complimentary' },
];

const hasValidContact = (email: string, phone: string) => {
  const e = email.trim();
  const p = phone.trim();
  if (e && !isValidEmail(e)) return false;
  if (p && !isValidPhone(p)) return false;
  return (!!e && isValidEmail(e)) || (!!p && isValidPhone(p));
};

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
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
        const sellable = (data.ticketTypes || []).filter((tt: TicketType) => !tt.isPaused);
        if (sellable.length > 0) {
          setTicketTypeId(String(sellable[0].id));
        }
      })
      .catch(() => setError('Could not load event.'))
      .finally(() => setLoadingEvent(false));
  }, [id, isStaffMode]);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const selectedTicketType = event?.ticketTypes.find((tt) => String(tt.id) === ticketTypeId);
  const total =
    paymentMethod === 'COMPLIMENTARY'
      ? 0
      : selectedTicketType && !Number.isNaN(selectedTicketType.price)
      ? selectedTicketType.price * qty
      : 0;

  const guestsToValidate = useSameDetails ? [attendees[0]] : attendees;

  const canSubmit =
    !!ticketTypeId &&
    guestsToValidate.every(
      (a) => a.name.trim() && hasValidContact(a.email, a.phone)
    );

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!ticketTypeId) return setError('Select a ticket type.');
    for (const a of guestsToValidate) {
      if (!a.name.trim()) return setError('Enter a guest name.');
      if (!a.email.trim() && !a.phone.trim()) {
        return setError('Email or phone number is required.');
      }
      if (a.email.trim() && !isValidEmail(a.email)) {
        return setError('Enter a valid email address.');
      }
      if (a.phone.trim() && !isValidPhone(a.phone)) {
        return setError('Enter a valid Nigerian phone number (e.g. 0803… or +234…).');
      }
    }

    setSaving(true);
    try {
      const payloadAttendees = useSameDetails
        ? Array.from({ length: qty }, () => ({
            name: attendees[0].name.trim(),
            email: attendees[0].email.trim().toLowerCase() || undefined,
            phone: attendees[0].phone.trim() || undefined,
          }))
        : attendees.map((a) => ({
            name: a.name.trim(),
            email: a.email.trim().toLowerCase() || undefined,
            phone: a.phone.trim() || undefined,
          }));

      await api.post('/tickets/manual', {
        eventId: event!.id,
        ticketTypeId: Number(ticketTypeId),
        quantity: qty,
        buyerName: attendees[0].name.trim(),
        buyerEmail: attendees[0].email.trim().toLowerCase() || undefined,
        buyerPhone: attendees[0].phone.trim() || undefined,
        attendees: payloadAttendees,
        paymentMethod: paymentMethod === 'COMPLIMENTARY' ? 'CASH' : paymentMethod,
        checkInNow,
      });

      const guestName = attendees[0].name.trim() || 'Guest';
      setToastMsg(`✓ ${qty} ${selectedTicketType?.name || 'Ticket'} issued for ${guestName}${checkInNow ? ' (Checked in ✓)' : ''}`);
      // Rapid reset: keep ticket type, clear guest fields & refocus for continuous rapid creation
      setAttendees([{ name: '', email: '', phone: '' }]);
      setQty(1);
      setTimeout(() => nameRef.current?.focus(), 60);
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
    setError(null);
    setCheckInNow(true);
    setQty(1);
    setAttendees([{ name: '', email: '', phone: '' }]);
    setUseSameDetails(true);
    setTimeout(() => nameRef.current?.focus(), 60);
  };

  const inputClass =
    'w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors';

  return (
    <div className={cn('relative max-w-5xl mx-auto px-3 sm:px-6 pb-20 sm:pb-8 pt-2')}>
      {/* Rapid Creation Success Toast */}
      {toastMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="p-1 hover:bg-emerald-700 rounded-md cursor-pointer transition-colors text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {/* Ultra-compact top bar */}
      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-2.5 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to={backPath}
            className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 shrink-0 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white truncate leading-tight">
              Add Attendee
            </h1>
            <p className="text-[11px] text-neutral-500 truncate leading-none mt-0.5">
              {event?.title || 'Walk-in Registration'}
            </p>
          </div>
        </div>

        <Link to={scanPath}>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500">
            <ScanLine className="h-3.5 w-3.5 text-rose-500" />
            <span className="hidden sm:inline">Scan Gate</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 font-medium">{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Compact Attendee Inputs */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Ticket Type Selection */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-rose-500" /> 1. Select Ticket
              </span>
              <span className="text-[11px] text-neutral-400">
                {qty} ticket{qty > 1 ? 's' : ''} selected
              </span>
            </div>

            {loadingEvent ? (
              <Skeleton className="h-10 w-full rounded-xl" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {event?.ticketTypes.filter((tt) => !tt.isPaused).map((tt) => {
                  const selected = String(tt.id) === ticketTypeId;
                  return (
                    <button
                      key={tt.id}
                      type="button"
                      onClick={() => setTicketTypeId(String(tt.id))}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all cursor-pointer min-w-0',
                        selected
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300 bg-neutral-50/50 dark:bg-neutral-850/40'
                      )}
                    >
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {tt.name}
                      </p>
                      <p className={cn('text-[11px] font-semibold mt-0.5', selected ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500')}>
                        {tt.price === 0 ? 'Free' : `₦${tt.price.toLocaleString()}`}
                      </p>
                    </button>
                  );
                })}
                {event && event.ticketTypes.filter((tt) => !tt.isPaused).length === 0 && (
                  <p className="col-span-full text-xs text-neutral-500 py-3 text-center">
                    No ticket types are on sale. Resume a paused type in event settings.
                  </p>
                )}
              </div>
            )}

            {/* Compact Quantity Control */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Quantity</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => syncQty(preset)}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors',
                      qty === preset
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:border-rose-300'
                    )}
                  >
                    {preset}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-1.5">
                  <button
                    type="button"
                    onClick={() => syncQty(qty - 1)}
                    disabled={qty <= 1}
                    className="h-7 w-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs disabled:opacity-30"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => syncQty(qty + 1)}
                    disabled={qty >= 20}
                    className="h-7 w-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Attendee Guest Details */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-rose-500" /> 2. Guest Information
              </span>
              {qty > 1 && (
                <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
                  Same details for all
                  <Switch checked={useSameDetails} onCheckedChange={setUseSameDetails} />
                </label>
              )}
            </div>

            {(useSameDetails ? [attendees[0]] : attendees).map((attendee, index) => (
              <div key={index} className={cn(index > 0 && 'pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5', 'space-y-2.5')}>
                {qty > 1 && !useSameDetails && (
                  <p className="text-[10px] font-bold text-rose-500 uppercase">Attendee {index + 1}</p>
                )}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={index === 0 ? nameRef : undefined}
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Tunde Adeleke"
                    value={attendee.name}
                    onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="tunde@gmail.com"
                      value={attendee.email}
                      onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className={inputClass}
                      placeholder="0803 000 0000"
                      value={attendee.phone}
                      onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Payment & Check-In */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-rose-500" /> 3. Payment & Gate Check-in
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaymentMethod(p.id)}
                  className={cn(
                    'py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center',
                    paymentMethod === p.id
                      ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 ring-1 ring-rose-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/40 text-neutral-600 dark:text-neutral-300 hover:border-rose-300'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <label className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 cursor-pointer">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">Check-in immediately</p>
                  <p className="text-[10px] text-neutral-400">Mark attendee as entered at the gate</p>
                </div>
              </div>
              <Switch checked={checkInNow} onCheckedChange={setCheckInNow} />
            </label>
          </div>
        </div>

        {/* Right Column: Live Summary & Action */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Order Summary</h3>

            <div className="space-y-2">
              <p className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">{event?.title}</p>
              {event?.startDate && (
                <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Calendar className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  {new Date(event.startDate).toLocaleDateString('en-NG', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-2">
              <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-300">
                <span>{selectedTicketType?.name || 'Ticket'} × {qty}</span>
                <span className="font-bold">{total === 0 ? 'Free' : `₦${total.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Payment</span>
                <span className="font-medium">{PAYMENTS.find((p) => p.id === paymentMethod)?.label}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Gate status</span>
                <span className={cn('font-medium', checkInNow ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500')}>
                  {checkInNow ? 'Check-in on issue' : 'Unchecked'}
                </span>
              </div>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-900 dark:text-white">Total</span>
              <span className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tabular-nums">
                {total === 0 ? 'Free' : `₦${total.toLocaleString()}`}
              </span>
            </div>

            <Button
              type="button"
              disabled={saving || !canSubmit || loadingEvent}
              onClick={() => handleSubmit()}
              className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0 text-xs sm:text-sm font-bold shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Processing…' : checkInNow ? 'Issue Ticket & Check In' : 'Issue Ticket'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ManualAttendeePage;
