import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Ticket,
  ListPlus,
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

const paymentLabel = (method: PaymentMethod) => {
  if (method === 'CASH') return 'Cash';
  if (method === 'POS') return 'POS';
  if (method === 'TRANSFER') return 'Transfer';
  return 'Free';
};

type GuestDraft = {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentMethod: PaymentMethod;
};

type FieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
  contact?: string;
};

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

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyGuest = (payment: PaymentMethod = 'CASH'): GuestDraft => ({
  id: newId(),
  name: '',
  email: '',
  phone: '',
  paymentMethod: payment,
});

const draftKey = (eventKey: string) => `gate_walkin_${eventKey}`;

const phoneError = (phone: string): string | undefined => {
  const raw = phone.trim();
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return 'Phone is too short. Use 0803… or +234…';
  if (digits.startsWith('0') && digits.length > 11) return 'Phone is too long. Nigerian numbers are 11 digits.';
  if (digits.startsWith('234') && digits.length > 13) return 'Phone is too long.';
  if (digits.length > 15) return 'Phone is too long.';
  if (!isValidPhone(raw)) return 'This phone number is not valid. Try 0803… or +234…';
  return undefined;
};

const emailError = (email: string): string | undefined => {
  const raw = email.trim();
  if (!raw) return undefined;
  if (!raw.includes('@')) return 'Email is missing @';
  const [local, domain = ''] = raw.split('@');
  if (!local) return 'Enter the part before @';
  if (!domain.includes('.')) return 'Email is incomplete. Add a domain like gmail.com';
  if (!isValidEmail(raw)) return 'Enter a complete email, like name@email.com';
  return undefined;
};

const guestErrors = (guest: GuestDraft): FieldErrors => {
  const errors: FieldErrors = {};
  if (!guest.name.trim()) errors.name = 'Name is required';
  const pErr = phoneError(guest.phone);
  const eErr = emailError(guest.email);
  if (pErr) errors.phone = pErr;
  if (eErr) errors.email = eErr;
  if (!guest.phone.trim() && !guest.email.trim()) {
    errors.contact = 'Add a phone number or email';
  } else if (pErr && !guest.email.trim()) {
    errors.contact = 'Fix the phone number, or add a valid email';
  } else if (eErr && !guest.phone.trim()) {
    errors.contact = 'Fix the email, or add a valid phone number';
  }
  return errors;
};

const guestIsValid = (guest: GuestDraft) => {
  const errors = guestErrors(guest);
  return !errors.name && !errors.phone && !errors.email && !errors.contact;
};

const resizeGuests = (current: GuestDraft[], count: number, payment: PaymentMethod) => {
  const next = current.slice(0, count);
  while (next.length < count) next.push(emptyGuest(payment));
  return next;
};

const inputClass =
  'w-full px-3 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500';

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
  const [attempted, setAttempted] = useState(false);

  const [ticketTypeId, setTicketTypeId] = useState('');
  const [qty, setQty] = useState(1);
  const [splitPeople, setSplitPeople] = useState(false);
  const [checkInNow, setCheckInNow] = useState(true);
  const [guests, setGuests] = useState<GuestDraft[]>([emptyGuest()]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [matches, setMatches] = useState<Record<string, ExistingMatch | null>>({});
  const [lookingUpId, setLookingUpId] = useState<string | null>(null);
  const [sessionCollected, setSessionCollected] = useState({ CASH: 0, POS: 0, TRANSFER: 0, tickets: 0 });

  const storageId = event ? String(event.id) : '';
  const split = splitPeople && qty > 1;

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
          const nextQty = saved.qty || 1;
          const nextSplit = Boolean(saved.splitPeople) && nextQty > 1;
          setQty(nextQty);
          setSplitPeople(nextSplit);
          setCheckInNow(saved.checkInNow !== false);
          setQueue((saved.queue || []).map((item) => ({ ...item, status: 'pending', error: undefined })));
          const stillValid = sellable.some((tt: TicketType) => String(tt.id) === saved.ticketTypeId);
          setTicketTypeId(stillValid ? saved.ticketTypeId : sellable[0] ? String(sellable[0].id) : '');
          if (saved.guests?.length) {
            setGuests(nextSplit ? resizeGuests(saved.guests, nextQty, saved.guests[0]?.paymentMethod || 'CASH') : [saved.guests[0]]);
          } else {
            setGuests([
              {
                id: newId(),
                name: saved.name || '',
                email: saved.email || '',
                phone: saved.phone || '',
                paymentMethod: saved.paymentMethod || 'CASH',
              },
            ]);
          }
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
      ticketTypeId,
      qty,
      splitPeople,
      checkInNow,
      guests,
      queue,
    });
  }, [storageId, ticketTypeId, qty, splitPeople, checkInNow, guests, queue]);

  useEffect(() => {
    if (!event?.id) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    guests.forEach((guest) => {
      const query = guest.phone.trim() || guest.email.trim();
      const ready =
        (guest.phone.trim() && (isValidPhone(guest.phone) || guest.phone.replace(/\D/g, '').length >= 8)) ||
        isValidEmail(guest.email);
      if (!ready) {
        setMatches((prev) => (prev[guest.id] ? { ...prev, [guest.id]: null } : prev));
        return;
      }
      const timer = setTimeout(() => {
        setLookingUpId(guest.id);
        api.tickets
          .lookupAttendee(event.id, query)
          .then((res) => {
            if (cancelled) return;
            const found = res.data?.matches?.[0] || null;
            setMatches((prev) => ({ ...prev, [guest.id]: found }));
            if (found) {
              setGuests((prev) =>
                prev.map((row) =>
                  row.id === guest.id
                    ? {
                        ...row,
                        name: row.name.trim() ? row.name : found.name,
                        email: row.email.trim() ? row.email : found.email,
                        phone: row.phone.trim() ? row.phone : found.phone,
                      }
                    : row
                )
              );
            }
          })
          .catch(() => {
            if (!cancelled) setMatches((prev) => ({ ...prev, [guest.id]: null }));
          })
          .finally(() => {
            if (!cancelled) setLookingUpId((current) => (current === guest.id ? null : current));
          });
      }, 280);
      timers.push(timer);
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [event?.id, guests.map((g) => `${g.id}:${g.phone}:${g.email}`).join('|')]);

  const selectedTicketType = event?.ticketTypes.find((tt) => String(tt.id) === ticketTypeId);
  const isPaid = (selectedTicketType?.price || 0) > 0;
  const unitPrice = selectedTicketType?.price || 0;

  const formGuests = split ? guests : guests.slice(0, 1);
  const blockers = useMemo(() => {
    const notes: string[] = [];
    if (!ticketTypeId) notes.push('Choose a ticket type');
    formGuests.forEach((guest, index) => {
      const label = split ? `Person ${index + 1}` : 'This guest';
      const errors = guestErrors(guest);
      if (errors.name) notes.push(`${label}: ${errors.name.toLowerCase()}`);
      if (errors.phone) notes.push(`${label}: ${errors.phone}`);
      if (errors.email) notes.push(`${label}: ${errors.email}`);
      if (errors.contact && !errors.phone && !errors.email) notes.push(`${label}: ${errors.contact.toLowerCase()}`);
    });
    return notes;
  }, [formGuests, split, ticketTypeId]);

  const formValid = !!ticketTypeId && formGuests.every(guestIsValid);

  const queueTotal = queue.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const queueQty = queue.reduce((sum, item) => sum + item.qty, 0);
  const orderTypeLines = Object.values(
    queue.reduce<Record<string, { name: string; qty: number; total: number }>>((acc, item) => {
      const key = item.ticketTypeName;
      if (!acc[key]) acc[key] = { name: key, qty: 0, total: 0 };
      acc[key].qty += item.qty;
      acc[key].total += item.unitPrice * item.qty;
      return acc;
    }, {})
  );
  const orderPayLines = Object.values(
    queue.reduce<Record<string, { method: PaymentMethod; total: number }>>((acc, item) => {
      if (item.unitPrice <= 0) return acc;
      if (!acc[item.paymentMethod]) acc[item.paymentMethod] = { method: item.paymentMethod, total: 0 };
      acc[item.paymentMethod].total += item.unitPrice * item.qty;
      return acc;
    }, {})
  );
  const sessionHasTakings =
    sessionCollected.tickets > 0 ||
    sessionCollected.CASH > 0 ||
    sessionCollected.POS > 0 ||
    sessionCollected.TRANSFER > 0;

  const updateGuest = (guestId: string, patch: Partial<GuestDraft>) => {
    setGuests((prev) => prev.map((row) => (row.id === guestId ? { ...row, ...patch } : row)));
  };

  const setQtyAndPeople = (nextQty: number) => {
    const qtyNext = Math.max(1, Math.min(20, nextQty));
    setQty(qtyNext);
    if (qtyNext === 1) {
      setSplitPeople(false);
      setGuests((prev) => [prev[0] || emptyGuest()]);
      return;
    }
    if (splitPeople) {
      setGuests((prev) => resizeGuests(prev, qtyNext, prev[0]?.paymentMethod || 'CASH'));
    }
  };

  const toggleSplit = (nextSplit: boolean) => {
    setSplitPeople(nextSplit);
    setAttempted(false);
    if (nextSplit) {
      setGuests((prev) => resizeGuests(prev, Math.max(qty, 2), prev[0]?.paymentMethod || 'CASH'));
      if (qty < 2) setQty(2);
    } else {
      setGuests((prev) => [prev[0] || emptyGuest()]);
    }
  };

  const resetGuestFields = () => {
    setGuests(split ? Array.from({ length: qty }, () => emptyGuest()) : [emptyGuest(guests[0]?.paymentMethod)]);
    setMatches({});
    setAttempted(false);
    setTimeout(() => phoneRef.current?.focus(), 40);
  };

  const addToQueue = () => {
    setError(null);
    if (!formValid || !selectedTicketType) {
      setAttempted(true);
      return;
    }

    const items: QueueItem[] = formGuests.map((guest) => ({
      id: newId(),
      name: guest.name.trim(),
      email: guest.email.trim().toLowerCase(),
      phone: guest.phone.trim(),
      ticketTypeId,
      ticketTypeName: selectedTicketType.name,
      qty: split ? 1 : qty,
      paymentMethod: isPaid ? guest.paymentMethod : 'FREE',
      checkInNow,
      unitPrice,
      status: 'pending',
    }));

    setQueue((prev) => {
      if (split) return [...prev, ...items];
      const item = items[0];
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

  const updateQueueQty = (itemId: string, nextQty: number) => {
    const qtyNext = Math.max(1, Math.min(20, nextQty));
    setQueue((prev) => prev.map((row) => (row.id === itemId ? { ...row, qty: qtyNext } : row)));
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
    const working = [...queue];
    if (working.length === 0) {
      setError('Add people to the order first, then issue them together.');
      return;
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
      if (remaining.length === 0) resetGuestFields();
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

  const renderPersonCard = (guest: GuestDraft, index: number, isFirst: boolean) => {
    const errors = guestErrors(guest);
    const show = (field: keyof FieldErrors) => {
      if (field === 'name' || field === 'contact') return attempted && Boolean(errors[field]);
      const value = field === 'phone' ? guest.phone : guest.email;
      return Boolean(errors[field]) && (attempted || value.trim().length > 0);
    };
    const match = matches[guest.id];
    const lookingUp = lookingUpId === guest.id;
    return (
      <div key={guest.id} className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            {split ? `Person ${index + 1}` : 'Person'}
          </span>
          {lookingUp && (
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <Search className="h-3 w-3" /> Looking up…
            </span>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
            Phone <span className="text-rose-500">*</span>
          </label>
          <input
            ref={isFirst ? phoneRef : undefined}
            type="tel"
            inputMode="tel"
            className={cn(inputClass, show('phone') && 'border-rose-400 focus:border-rose-500')}
            placeholder="0803 000 0000"
            value={guest.phone}
            onChange={(e) => updateGuest(guest.id, { phone: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToQueue();
              }
            }}
          />
          {show('phone') && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.phone}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className={cn(inputClass, show('name') && 'border-rose-400 focus:border-rose-500')}
              placeholder="Tunde Adeleke"
              value={guest.name}
              onChange={(e) => updateGuest(guest.id, { name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addToQueue();
                }
              }}
            />
            {show('name') && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className={cn(inputClass, show('email') && 'border-rose-400 focus:border-rose-500')}
              placeholder="optional if phone is set"
              value={guest.email}
              onChange={(e) => updateGuest(guest.id, { email: e.target.value })}
            />
            {show('email') && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.email}</p>}
          </div>
        </div>
        {show('contact') && !show('phone') && !show('email') && (
          <p className="text-[11px] font-medium text-rose-600">{errors.contact}</p>
        )}
        {match && (
          <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            Known guest
            {match.existingTickets.length > 0
              ? ` · has ${match.existingTickets.map((t) => t.ticketTypeName).join(', ')}`
              : ''}
          </p>
        )}
        {isPaid && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            {PAID_PAYMENTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => updateGuest(guest.id, { paymentMethod: p.id })}
                className={cn(
                  'py-2 rounded-xl text-xs font-bold border',
                  guest.paymentMethod === p.id
                    ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative max-w-5xl mx-auto px-3 sm:px-6 pb-36 md:pb-8 pt-2">
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] w-[min(92vw,24rem)] p-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{toastMsg}</span>
          </div>
          <button type="button" onClick={() => setToastMsg(null)} className="p-1 hover:bg-emerald-700 rounded-md shrink-0">
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Ticket / day</span>
            {loadingEvent ? (
              <Skeleton className="h-10 w-full rounded-xl" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {event?.ticketTypes.filter((tt) => !tt.isPaused).map((tt) => {
                  const selected = String(tt.id) === ticketTypeId;
                  const already = formGuests.some((guest) =>
                    matches[guest.id]?.existingTickets.some((t) => t.ticketTypeId === tt.id)
                  );
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
                        <p className="text-[10px] text-emerald-600 mt-0.5">Has this</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {attempted && !ticketTypeId && (
              <p className="text-[11px] font-medium text-rose-600">Choose a ticket type</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Qty</span>
              <div className="flex items-center gap-1">
                {[1, 2, 5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQtyAndPeople(preset)}
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
                <button
                  type="button"
                  onClick={() => setQtyAndPeople(qty - 1)}
                  className="h-7 w-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQtyAndPeople(qty + 1)}
                  className="h-7 w-7 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {qty > 1 && (
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-[11px] font-bold text-neutral-500 mb-1.5">Tickets are for</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSplit(false)}
                    className={cn(
                      'py-2 px-2 rounded-xl text-xs font-bold border text-left',
                      !splitPeople
                        ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    )}
                  >
                    One person
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSplit(true)}
                    className={cn(
                      'py-2 px-2 rounded-xl text-xs font-bold border text-left',
                      splitPeople
                        ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    )}
                  >
                    Different people
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  {split
                    ? `Fill Person 1–${qty} below. Each can pay cash, POS, or transfer.`
                    : `${qty} tickets on this one guest`}
                </p>
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

          {formGuests.map((guest, index) => renderPersonCard(guest, index, index === 0))}

          {attempted && blockers.length > 0 && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
              <p className="font-bold mb-1">Fix these before adding</p>
              <ul className="space-y-0.5 list-disc pl-4">
                {blockers.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="button"
            disabled={issuing}
            onClick={addToQueue}
            className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0 text-sm font-bold"
          >
            <ListPlus className="h-4 w-4" />
            {split ? `Add ${qty} people` : 'Add to list'}
          </Button>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Order summary</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {queueQty === 0
                    ? 'Add people, then issue this order together'
                    : `${queue.length} ${queue.length === 1 ? 'person' : 'people'} · ${queueQty} ticket${queueQty === 1 ? '' : 's'}`}
                </p>
              </div>
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  className="text-[11px] font-bold text-neutral-400 hover:text-rose-500"
                >
                  Clear
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 px-4 py-6 text-center">
                <Ticket className="h-6 w-6 mx-auto text-neutral-300 dark:text-neutral-600" />
                <p className="mt-2 text-sm font-bold text-neutral-900 dark:text-white">No one on this order yet</p>
                <p className="mt-1 text-xs text-neutral-500 max-w-[16rem] mx-auto">
                  Fill the guest, tap Add to list, keep adding, then issue everyone at once.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-64 overflow-y-auto -mx-1 px-1">
                {queue.map((item) => (
                  <li key={item.id} className="py-2.5 flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs font-extrabold tabular-nums shrink-0">
                          {item.unitPrice === 0 ? 'Free' : formatNaira(item.unitPrice * item.qty)}
                        </p>
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {item.ticketTypeName} × {item.qty}
                        {item.unitPrice > 0 ? ` · ${paymentLabel(item.paymentMethod)}` : ''}
                        {item.checkInNow ? ' · Check in' : ''}
                      </p>
                      {item.error && <p className="text-[11px] text-rose-500 mt-0.5">{item.error}</p>}
                      <div className="mt-1.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQueueQty(item.id, item.qty - 1)}
                          className="h-6 w-6 rounded-md border border-neutral-200 dark:border-neutral-700 flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold tabular-nums">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQueueQty(item.id, item.qty + 1)}
                          className="h-6 w-6 rounded-md border border-neutral-200 dark:border-neutral-700 flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
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

            {queue.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Price details</h4>
                {orderTypeLines.map((line) => (
                  <div key={line.name} className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                    <span>
                      {line.name} × {line.qty}
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white tabular-nums">
                      {line.total === 0 ? 'Free' : formatNaira(line.total)}
                    </span>
                  </div>
                ))}
                {orderPayLines.map((line) => (
                  <div key={line.method} className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                    <span>{paymentLabel(line.method)}</span>
                    <span className="font-bold text-neutral-900 dark:text-white tabular-nums">{formatNaira(line.total)}</span>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-between text-sm font-extrabold text-neutral-900 dark:text-white">
                  <span>Total (NGN)</span>
                  <span className="tabular-nums">{queueTotal === 0 ? 'Free' : formatNaira(queueTotal)}</span>
                </div>
              </div>
            )}

            <Button
              type="button"
              disabled={issuing || loadingEvent || queue.length === 0}
              onClick={issueQueue}
              className="hidden md:inline-flex w-full h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-white border-0 text-sm font-bold"
            >
              {issuing
                ? 'Issuing…'
                : queue.length === 0
                  ? 'Add people to issue'
                  : checkInNow
                    ? `Issue ${queueQty} & check in`
                    : `Issue ${queueQty} ticket${queueQty === 1 ? '' : 's'}`}
            </Button>
            {sessionHasTakings && (
              <p className="text-[10px] text-neutral-400 text-center">
                Issued on this phone today · {sessionCollected.tickets} ticket{sessionCollected.tickets === 1 ? '' : 's'}
                {sessionCollected.CASH > 0 ? ` · Cash ${formatNaira(sessionCollected.CASH)}` : ''}
                {sessionCollected.POS > 0 ? ` · POS ${formatNaira(sessionCollected.POS)}` : ''}
                {sessionCollected.TRANSFER > 0 ? ` · Transfer ${formatNaira(sessionCollected.TRANSFER)}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur px-3 py-2.5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-2">
          <Button
            type="button"
            disabled={issuing}
            onClick={addToQueue}
            className="h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0 text-sm font-bold"
          >
            <ListPlus className="h-4 w-4" />
            {split ? `Add ${qty}` : 'Add to list'}
          </Button>
          <Button
            type="button"
            disabled={issuing || loadingEvent || queue.length === 0}
            onClick={issueQueue}
            className="h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 text-white border-0 text-sm font-bold"
          >
            {issuing
              ? 'Issuing…'
              : queue.length === 0
                ? 'Issue'
                : `Issue ${queueQty}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

function readDraft(eventKey: string): {
  name?: string;
  email?: string;
  phone?: string;
  ticketTypeId: string;
  qty: number;
  splitPeople?: boolean;
  paymentMethod?: PaymentMethod;
  checkInNow: boolean;
  guests?: GuestDraft[];
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
    ticketTypeId: string;
    qty: number;
    splitPeople: boolean;
    checkInNow: boolean;
    guests: GuestDraft[];
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
