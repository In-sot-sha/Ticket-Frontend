import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  UserCheck,
  X,
  Ticket,
  Search,
  Sparkles,
  Share2,
  Copy,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Users,
  Mail,
  User,
  ChevronRight,
  Filter,
  Percent,
  Tag,
  Download,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/skeleton';
import { Switch } from '../../components/ui/Switch';
import { VoiceInputButton } from '../../components/ui/VoiceInputButton';
import { DataTable, DataTableSkeleton, type DataTableColumn } from '../../components/ui/data-table';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { isValidEmail, isValidPhone, normalizePhone } from '../../lib/phone';
import { formatNaira } from '../../lib/eventOrganizer';
import { platformFeeForUnit } from '../../lib/fees';

interface TicketType {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isPaused?: boolean;
  platformFeeNaira?: number | null;
  validOn?: string | null;
  _count?: { tickets: number };
}

interface EventItem {
  id: number;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  organization?: { id: number; name: string };
  ticketTypes: TicketType[];
  _count?: { tickets: number; orders: number };
}

type PaymentMethod = 'TRANSFER' | 'POS' | 'CASH';

interface AttendeeRow {
  name: string;
  email: string;
  phone: string;
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'TRANSFER', label: 'Bank Transfer', icon: ArrowLeftRight },
  { id: 'POS', label: 'POS Terminal', icon: CreditCard },
  { id: 'CASH', label: 'Cash', icon: Banknote },
];

const inputClass =
  'w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500';

function formatEventDate(iso?: string) {
  if (!iso) return 'Date TBD';
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getEventStatus(ev: { startDate?: string; endDate?: string | null }) {
  const now = new Date();
  const start = ev.startDate ? new Date(ev.startDate) : now;
  const end = ev.endDate ? new Date(ev.endDate) : new Date(start.getTime() + 6 * 3600 * 1000);

  if (now > end) {
    return {
      key: 'ended',
      label: 'Past',
      badgeClass:
        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
      dotClass: 'bg-zinc-400',
    };
  }

  if (now >= start && now <= end) {
    return {
      key: 'live',
      label: 'Live Now',
      badgeClass:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dotClass: 'bg-emerald-500 animate-pulse',
    };
  }

  return {
    key: 'upcoming',
    label: 'Upcoming',
    badgeClass:
      'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-500',
  };
}

export const AdminAssistedSalesPage: React.FC = () => {
  const { id: urlParamId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryEventId = searchParams.get('eventId');
  const targetEventId = urlParamId || queryEventId;

  // Events list & selected event
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventSearch, setEventSearch] = useState('');
  const [eventFilterTab, setEventFilterTab] = useState<'upcoming' | 'all'>('upcoming');
  const [selectedEventId, setSelectedEventId] = useState<string>(targetEventId || '');

  // Ticket tier & quantity
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Email delivery mode: "single" (all tickets to 1 email) or "individual" (multiple emails for each ticket)
  const [deliveryMode, setDeliveryMode] = useState<'single' | 'individual'>('single');

  // Single recipient details
  const [primaryName, setPrimaryName] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');

  // Individual attendees list
  const [attendees, setAttendees] = useState<AttendeeRow[]>([
    { name: '', email: '', phone: '' },
  ]);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER');

  // Discount state
  const [discountActive, setDiscountActive] = useState(false);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string>('');

  // Platform cut override
  const [customFeeActive, setCustomFeeActive] = useState(false);
  const [customFee, setCustomFee] = useState<string>('');
  const [checkInNow, setCheckInNow] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Success state
  const [successResult, setSuccessResult] = useState<{
    reference: string;
    orderId?: number;
    originalAmount?: number;
    discountAmount?: number;
    discountReason?: string | null;
    gross: number;
    fee: number;
    net: number;
    count: number;
    tickets: any[];
    buyerName: string;
    buyerEmail?: string;
    buyerPhone?: string;
    eventTitle: string;
    ticketTypeName: string;
    attendeesSummary?: Array<{ name: string; email?: string; phone?: string }>;
  } | null>(null);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingTicketId, setDownloadingTicketId] = useState<number | null>(null);
  const [pdfDownloadError, setPdfDownloadError] = useState<string | null>(null);
  const [downloadTimer, setDownloadTimer] = useState<number>(0);
  const [downloadDuration, setDownloadDuration] = useState<number | null>(null);

  // Quick download modal for past orders
  const [quickOrderRef, setQuickOrderRef] = useState('');
  const [quickFormat, setQuickFormat] = useState<'zip' | 'pdf'>('zip');
  const [quickDownloading, setQuickDownloading] = useState(false);
  const [showQuickDownloadModal, setShowQuickDownloadModal] = useState(false);

  // Session stats tracking
  const [sessionTally, setSessionTally] = useState<{ count: number; gross: number; cut: number; discount: number }>({
    count: 0,
    gross: 0,
    cut: 0,
    discount: 0,
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch all admin events
  useEffect(() => {
    setLoadingEvents(true);
    api.admin
      .getEvents()
      .then((res) => {
        const list = (res.data || []) as EventItem[];
        setEvents(list);
        if (targetEventId && list.some((e) => String(e.id) === String(targetEventId))) {
          setSelectedEventId(String(targetEventId));
        }
      })
      .catch((err) => {
        console.error('Failed to load admin events', err);
        setError('Could not load events list. Please verify admin credentials.');
      })
      .finally(() => setLoadingEvents(false));
  }, [targetEventId]);

  // Keep attendees list length in sync with quantity
  useEffect(() => {
    setAttendees((prev) => {
      const next = prev.slice(0, quantity);
      while (next.length < quantity) {
        next.push({ name: '', email: '', phone: '' });
      }
      return next;
    });
  }, [quantity]);

  const activeEvent = useMemo(
    () => events.find((e) => String(e.id) === String(selectedEventId)) || null,
    [events, selectedEventId]
  );

  const activeTicketType = useMemo(() => {
    if (!activeEvent) return null;
    return activeEvent.ticketTypes.find((t) => String(t.id) === String(selectedTicketTypeId)) || null;
  }, [activeEvent, selectedTicketTypeId]);

  // Default to first active ticket type when event changes
  useEffect(() => {
    if (activeEvent && activeEvent.ticketTypes.length > 0) {
      const sellable = activeEvent.ticketTypes.filter((t) => !t.isPaused);
      if (sellable.length > 0) {
        setSelectedTicketTypeId(String(sellable[0].id));
      } else {
        setSelectedTicketTypeId(String(activeEvent.ticketTypes[0].id));
      }
    } else {
      setSelectedTicketTypeId('');
    }
  }, [activeEvent]);

  // Filter events: Upcoming & Live by default, excluding past events
  const filteredEvents = useMemo(() => {
    let list = events;
    if (eventFilterTab === 'upcoming') {
      list = list.filter((ev) => getEventStatus(ev).key !== 'ended');
    }
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase();
      list = list.filter(
        (ev) =>
          ev.title.toLowerCase().includes(q) ||
          (ev.organization?.name && ev.organization.name.toLowerCase().includes(q)) ||
          (ev.location && ev.location.toLowerCase().includes(q))
      );
    }
    // Sort upcoming events by start date ascending (soonest first)
    return [...list].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [events, eventSearch, eventFilterTab]);

  // Financial calculations
  const unitPrice = activeTicketType ? Number(activeTicketType.price) || 0 : 0;
  const faceSubtotal = unitPrice * quantity;

  // Calculate Discount Amount
  const calculatedDiscount = useMemo(() => {
    if (!discountActive || !discountValue.trim()) return 0;
    const rawVal = Number(discountValue);
    if (!Number.isFinite(rawVal) || rawVal <= 0) return 0;
    if (discountType === 'PERCENTAGE') {
      const pct = Math.min(100, Math.max(0, rawVal));
      return Math.round(faceSubtotal * (pct / 100));
    }
    return Math.min(faceSubtotal, Math.round(rawVal));
  }, [discountActive, discountValue, discountType, faceSubtotal]);

  const grossCollected = Math.max(0, faceSubtotal - calculatedDiscount);
  const effectiveUnitPrice = quantity > 0 ? grossCollected / quantity : unitPrice;

  // Standard fee: tier-level override or default 7.5% + ₦100 flat
  const standardFeePerUnit = useMemo(() => {
    if (!activeTicketType) return 0;
    if (
      activeTicketType.platformFeeNaira !== null &&
      activeTicketType.platformFeeNaira !== undefined &&
      Number(activeTicketType.platformFeeNaira) >= 0
    ) {
      return Number(activeTicketType.platformFeeNaira);
    }
    return platformFeeForUnit(effectiveUnitPrice);
  }, [activeTicketType, effectiveUnitPrice]);

  const standardTotalFee = standardFeePerUnit * quantity;
  const parsedCustomFee = customFee.trim() === '' ? 0 : Math.max(0, Number(customFee) || 0);
  const finalPartyStormCut = Math.min(
    grossCollected,
    customFeeActive ? parsedCustomFee : standardTotalFee
  );
  const organizerNet = Math.max(0, grossCollected - finalPartyStormCut);
  const feeMarginPercent =
    grossCollected > 0 ? ((finalPartyStormCut / grossCollected) * 100).toFixed(1) : '0.0';

  const updateAttendee = (index: number, patch: Partial<AttendeeRow>) => {
    setAttendees((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const validateForm = () => {
    if (!selectedEventId) return 'Please choose an event.';
    if (!selectedTicketTypeId) return 'Please choose a ticket tier.';
    if (quantity < 1) return 'Quantity must be at least 1.';

    if (deliveryMode === 'single') {
      if (!primaryName.trim()) return 'Buyer full name is required.';
      if (primaryEmail.trim() && !isValidEmail(primaryEmail.trim())) {
        return 'Please enter a valid email address.';
      }
      if (primaryPhone.trim() && !isValidPhone(primaryPhone.trim())) {
        return 'Please enter a valid phone number (e.g. 0803 000 0000).';
      }
      if (!primaryEmail.trim() && !primaryPhone.trim()) {
        return 'Provide either an email or phone number to deliver tickets.';
      }
    } else {
      // Individual attendees validation
      for (let i = 0; i < quantity; i++) {
        const att = attendees[i] || { name: '', email: '', phone: '' };
        if (!att.name.trim()) {
          return `Please provide a name for Ticket #${i + 1}.`;
        }
        if (att.email.trim() && !isValidEmail(att.email.trim())) {
          return `Email for Ticket #${i + 1} (${att.email}) is not valid.`;
        }
        if (att.phone.trim() && !isValidPhone(att.phone.trim())) {
          return `Phone for Ticket #${i + 1} (${att.phone}) is not valid.`;
        }
      }
      const hasAnyContact = attendees.some((a) => a.email.trim() || a.phone.trim());
      if (!hasAnyContact) {
        return 'Please provide at least one email or phone number across your attendees.';
      }
    }
    return null;
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    const formError = validateForm();
    if (formError) {
      setError(formError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const buyerDisplayName =
      deliveryMode === 'single'
        ? primaryName.trim()
        : attendees[0]?.name.trim() || 'Attendee';

    const buyerDisplayEmail =
      deliveryMode === 'single'
        ? primaryEmail.trim() || undefined
        : attendees.find((a) => a.email.trim())?.email.trim() || undefined;

    const buyerDisplayPhone =
      deliveryMode === 'single'
        ? primaryPhone.trim() ? normalizePhone(primaryPhone.trim()) || primaryPhone.trim() : undefined
        : attendees.find((a) => a.phone.trim())?.phone.trim() || undefined;

    const payloadAttendees =
      deliveryMode === 'individual'
        ? attendees.map((a, i) => ({
            name: a.name.trim() || `Ticket #${i + 1}`,
            email: a.email.trim() || undefined,
            phone: a.phone.trim() ? normalizePhone(a.phone.trim()) || a.phone.trim() : undefined,
          }))
        : undefined;

    try {
      const res = await api.admin.issueAssistedSale({
        eventId: Number(selectedEventId),
        ticketTypeId: Number(selectedTicketTypeId),
        quantity,
        buyerName: buyerDisplayName,
        buyerEmail: buyerDisplayEmail,
        buyerPhone: buyerDisplayPhone,
        paymentMethod,
        platformFee: customFeeActive ? finalPartyStormCut : undefined,
        checkInNow,
        attendees: payloadAttendees,
        discountAmount: calculatedDiscount > 0 ? calculatedDiscount : undefined,
        discountReason: calculatedDiscount > 0 && discountReason.trim() ? discountReason.trim() : undefined,
      });

      const data = res.data;
      const ref = data?.order?.paymentReference || `AST_${Date.now()}`;
      const actualGross = data?.breakdown?.gross ?? grossCollected;
      const actualFee = data?.breakdown?.platformFee ?? finalPartyStormCut;
      const actualNet = data?.breakdown?.netAmount ?? organizerNet;
      const actualDiscount = data?.breakdown?.discountAmount ?? calculatedDiscount;

      setSuccessResult({
        reference: ref,
        orderId: data?.order?.id,
        originalAmount: data?.breakdown?.originalAmount ?? faceSubtotal,
        discountAmount: actualDiscount,
        discountReason: data?.breakdown?.discountReason ?? discountReason,
        gross: actualGross,
        fee: actualFee,
        net: actualNet,
        count: data?.ticketsCount || quantity,
        tickets: data?.tickets || [],
        buyerName: buyerDisplayName,
        buyerEmail: buyerDisplayEmail,
        buyerPhone: buyerDisplayPhone,
        eventTitle: activeEvent?.title || 'Event',
        ticketTypeName: activeTicketType?.name || 'General Admission',
        attendeesSummary: payloadAttendees,
      });

      // Update session tally
      setSessionTally((prev) => ({
        count: prev.count + (data?.ticketsCount || quantity),
        gross: prev.gross + actualGross,
        cut: prev.cut + actualFee,
        discount: prev.discount + actualDiscount,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to issue assisted ticket sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewSale = () => {
    setSuccessResult(null);
    setPrimaryName('');
    setPrimaryEmail('');
    setPrimaryPhone('');
    setAttendees([{ name: '', email: '', phone: '' }]);
    setQuantity(1);
    setDeliveryMode('single');
    setDiscountActive(false);
    setDiscountValue('');
    setDiscountReason('');
    setCustomFeeActive(false);
    setCustomFee('');
    setAttempted(false);
    setError(null);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const shareViaWhatsApp = (phone?: string, name?: string) => {
    if (!successResult) return;
    const recipientPhone = phone || successResult.buyerPhone || '';
    const cleanNumber = recipientPhone ? recipientPhone.replace(/\D/g, '') : '';
    const recipientName = name || successResult.buyerName;
    const text = encodeURIComponent(
      `🎉 Hello ${recipientName}! Your ticket for "${successResult.eventTitle}" (${successResult.ticketTypeName}) has been issued via PartyStorm.\n\nOrder Ref: ${successResult.reference}\n\nWe look forward to seeing you at the event!`
    );
    const url = cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const copyOrderReference = async () => {
    if (!successResult) return;
    await navigator.clipboard.writeText(successResult.reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadPdf = async (orderIdentifier?: number | string) => {
    const target = orderIdentifier || successResult?.orderId || successResult?.reference;
    if (!target) return;
    setDownloadingPdf(true);
    setPdfDownloadError(null);
    setDownloadDuration(null);
    setDownloadTimer(0);
    const startTime = Date.now();
    const timer = setInterval(() => {
      setDownloadTimer(Number(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);
    try {
      const blob = await api.admin.downloadOrderTicketsPdf(target);
      const finalSec = Number(((Date.now() - startTime) / 1000).toFixed(1));
      setDownloadDuration(finalSec);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const titleSlug = (successResult?.eventTitle || 'event')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 30);
      a.download = `${titleSlug}-tickets-${successResult?.count || 'order'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download tickets PDF', err);
      setPdfDownloadError(err?.message || 'Failed to download tickets PDF. Try again or verify order ID.');
    } finally {
      clearInterval(timer);
      setDownloadingPdf(false);
    }
  };

  const handleDownloadZip = async (orderIdentifier?: number | string) => {
    const target = orderIdentifier || successResult?.orderId || successResult?.reference;
    if (!target) return;
    setDownloadingZip(true);
    setPdfDownloadError(null);
    setDownloadDuration(null);
    setDownloadTimer(0);
    const startTime = Date.now();
    const timer = setInterval(() => {
      setDownloadTimer(Number(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);
    try {
      const blob = await api.admin.downloadOrderTicketsZip(target);
      const finalSec = Number(((Date.now() - startTime) / 1000).toFixed(1));
      setDownloadDuration(finalSec);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const titleSlug = (successResult?.eventTitle || 'event')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 30);
      a.download = `${titleSlug}-tickets-separate-${successResult?.count || 'order'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download tickets zip', err);
      setPdfDownloadError(err?.message || 'Failed to download tickets zip.');
    } finally {
      clearInterval(timer);
      setDownloadingZip(false);
    }
  };

  const handleDownloadSingleTicket = async (ticketId: number, serial?: string) => {
    setDownloadingTicketId(ticketId);
    try {
      const blob = await api.admin.downloadSingleTicketPdf(ticketId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${serial || ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download single ticket PDF');
    } finally {
      setDownloadingTicketId(null);
    }
  };

  const handleQuickDownload = async () => {
    if (!quickOrderRef.trim()) return;
    setQuickDownloading(true);
    setDownloadDuration(null);
    setDownloadTimer(0);
    const startTime = Date.now();
    const timer = setInterval(() => {
      setDownloadTimer(Number(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);
    try {
      const blob =
        quickFormat === 'zip'
          ? await api.admin.downloadOrderTicketsZip(quickOrderRef.trim())
          : await api.admin.downloadOrderTicketsPdf(quickOrderRef.trim());
      const finalSec = Number(((Date.now() - startTime) / 1000).toFixed(1));
      setDownloadDuration(finalSec);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${quickOrderRef.trim()}-tickets.${quickFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setShowQuickDownloadModal(false);
      setQuickOrderRef('');
    } catch (err: any) {
      alert(err.message || 'Could not find or download tickets for this order reference/ID');
    } finally {
      clearInterval(timer);
      setQuickDownloading(false);
    }
  };

  const handleChangeEvent = () => {
    setSelectedEventId('');
    setSelectedTicketTypeId('');
    setSuccessResult(null);
  };

  // DataTable columns for the Event List (matching AdminEventsPage)
  const eventColumns: DataTableColumn<EventItem>[] = [
    {
      id: 'event',
      header: 'Event Details',
      cell: (ev) => {
        return (
          <div className="flex items-center gap-3 min-w-0">
            {ev.imageUrl ? (
              <img
                src={ev.imageUrl}
                alt={ev.title}
                className="h-11 w-11 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-neutral-800 shadow-2xs"
              />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-400">
                <Calendar className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-xs sm:text-sm truncate text-neutral-900 dark:text-white">
                  {ev.title}
                </p>
                {ev.organization?.name && (
                  <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md truncate max-w-[12rem]">
                    {ev.organization.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5 truncate">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{formatEventDate(ev.startDate)}</span>
                {ev.location && (
                  <>
                    <span>·</span>
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'tickets',
      header: 'Tiers & Pricing',
      cell: (ev) => {
        const tiers = ev.ticketTypes || [];
        const minPrice = tiers.length ? Math.min(...tiers.map((t) => Number(t.price) || 0)) : 0;
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <Ticket className="h-3 w-3 text-rose-500" />
              {tiers.length} tier{tiers.length !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">
              From {minPrice === 0 ? 'Free' : formatNaira(minPrice)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (ev) => {
        const st = getEventStatus(ev);
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap',
              st.badgeClass
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', st.dotClass)} />
            {st.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: (ev) => (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            onClick={() => setSelectedEventId(String(ev.id))}
            className="h-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 px-3 shrink-0 shadow-2xs"
          >
            <span>Start Sale</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="py-3 px-2 sm:px-3 max-w-7xl mx-auto pb-8 text-neutral-900 dark:text-neutral-100">
      {/* Standardized PageHeader (Matching Admin Events, Tickets, Transactions) */}
      <PageHeader
        title="Direct"
        accent="Sales"
        description="Issue assisted pre-event tickets with automated PartyStorm fee cut and flexible attendee email delivery."
        actions={
          <div className="flex items-center gap-2">
            {selectedEventId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeEvent}
                className="h-8 rounded-xl text-xs gap-1.5 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Change Event</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickDownloadModal(true)}
              className="h-8 rounded-xl text-xs gap-1.5 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </Button>
            <Link to="/admin/tickets">
              <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs gap-1.5 font-semibold">
                <Ticket className="h-3.5 w-3.5 text-rose-500" />
                <span className="hidden sm:inline">Audit Tickets</span>
              </Button>
            </Link>
            <Link to="/admin/transactions">
              <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs gap-1.5 font-semibold">
                <CreditCard className="h-3.5 w-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Transactions</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Quick Download Tickets PDF Modal */}
      {showQuickDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">Download Tickets (PDF)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickDownloadModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Enter any Order ID or Reference (e.g. <code className="text-neutral-700 dark:text-neutral-300 font-mono">AST_...</code> or Order #) to download all tickets as a consolidated multi-page PDF for manual WhatsApp dispatch.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Order Reference or ID</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. AST_1730000000 or 123"
                value={quickOrderRef}
                onChange={(e) => setQuickOrderRef(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickDownload()}
                className="w-full h-10 px-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Download Format</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setQuickFormat('zip')}
                  className={cn(
                    'p-2 rounded-xl border text-center transition-all',
                    quickFormat === 'zip'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                  )}
                >
                  ZIP (Separate Files)
                  <span className="block text-[10px] font-normal text-neutral-400">1 ticket per PDF for WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFormat('pdf')}
                  className={cn(
                    'p-2 rounded-xl border text-center transition-all',
                    quickFormat === 'pdf'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                  )}
                >
                  Single PDF
                  <span className="block text-[10px] font-normal text-neutral-400">All tickets in 1 booklet</span>
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickDownloadModal(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={quickDownloading || !quickOrderRef.trim()}
                onClick={handleQuickDownload}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
              >
                {quickDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>{quickDownloading ? `Generating... (${downloadTimer}s)` : 'Download'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1 font-medium">{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: EVENT SELECTION VIEW (Table list with images, matching AdminEventsPage) */}
      {!selectedEventId && (
        <div className="space-y-4">
          {/* Search + Filter toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search upcoming events by name, organizer, or location..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setEventFilterTab('upcoming')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all',
                  eventFilterTab === 'upcoming'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                Upcoming & Live Only
              </button>
              <button
                type="button"
                onClick={() => setEventFilterTab('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all',
                  eventFilterTab === 'all'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                All Events ({events.length})
              </button>
            </div>
          </div>

          {/* List Table */}
          {loadingEvents ? (
            <DataTableSkeleton rows={6} columns={4} />
          ) : (
            <DataTable
              columns={eventColumns}
              rows={filteredEvents}
              getRowId={(ev) => ev.id}
              pageSize={10}
              hideSearch
              emptyTitle="No upcoming events found"
              emptyDescription="No events match your current filter. You can switch to All Events or search another keyword."
              onRowClick={(ev) => setSelectedEventId(String(ev.id))}
            />
          )}
        </div>
      )}

      {/* VIEW 2: SUCCESS RECEIPT VIEW */}
      {selectedEventId && successResult && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
              Assisted Sale Confirmed!
            </h2>
            <p className="text-xs text-neutral-500">
              {successResult.count} ticket{successResult.count > 1 ? 's' : ''} issued for{' '}
              <strong className="text-neutral-800 dark:text-neutral-200">
                {successResult.eventTitle}
              </strong>
            </p>
          </div>

          {/* Reference & Snapshot */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-neutral-200/80 dark:border-neutral-800 pb-2.5">
              <span className="text-neutral-500 font-medium">Order Reference</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-900 dark:text-white">
                <span>{successResult.reference}</span>
                <button
                  type="button"
                  onClick={copyOrderReference}
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-500"
                  title="Copy Reference"
                >
                  {copiedRef ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* If discount was applied, show discount pill */}
            {successResult.discountAmount && successResult.discountAmount > 0 ? (
              <div className="flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-2 text-amber-800 dark:text-amber-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Discount Applied {successResult.discountReason ? `(${successResult.discountReason})` : ''}</span>
                </span>
                <span className="font-extrabold tabular-nums">
                  -{formatNaira(successResult.discountAmount)} (Original {formatNaira(successResult.originalAmount || 0)})
                </span>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="rounded-xl bg-white dark:bg-neutral-900 p-2.5 border border-neutral-200 dark:border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Gross Paid</p>
                <p className="text-sm font-extrabold tabular-nums text-neutral-900 dark:text-white mt-0.5">
                  {formatNaira(successResult.gross)}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50/50 dark:bg-rose-950/20 p-2.5 border border-rose-200 dark:border-rose-900/40">
                <p className="text-[10px] uppercase font-bold text-rose-500">PartyStorm Cut</p>
                <p className="text-sm font-extrabold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
                  {formatNaira(successResult.fee)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 border border-emerald-200 dark:border-emerald-900/40">
                <p className="text-[10px] uppercase font-bold text-emerald-600">Host Net</p>
                <p className="text-sm font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatNaira(successResult.net)}
                </p>
              </div>
            </div>

            {/* Recipients Summary */}
            <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
              <p className="font-bold text-neutral-800 dark:text-neutral-200">Delivery Status:</p>
              {successResult.attendeesSummary && successResult.attendeesSummary.length > 0 ? (
                <div className="space-y-1 pl-2">
                  {successResult.attendeesSummary.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] py-1 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0"
                    >
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        #{idx + 1} {att.name}
                      </span>
                      <span className="text-neutral-500">
                        {att.email || 'No email'} {att.phone ? `· ${att.phone}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold text-neutral-900 dark:text-white">Attendee:</span>{' '}
                    {successResult.buyerName}
                  </p>
                  {successResult.buyerEmail && (
                    <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                      <span>Confirmation & QR PDF dispatched to {successResult.buyerEmail}</span>
                    </p>
                  )}
                  {successResult.buyerPhone && (
                    <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                      <span>WhatsApp tickets queued for {successResult.buyerPhone}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Individual Passes List for WhatsApp manual sending */}
            {successResult.tickets && successResult.tickets.length > 0 && (
              <div className="pt-2.5 border-t border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    Individual Tickets ({successResult.tickets.length} total · separate per person):
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">Download each guest's PDF</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {successResult.tickets.map((t, idx) => {
                    const att = successResult.attendeesSummary?.[idx];
                    const displayName = att?.name || (idx === 0 ? successResult.buyerName : `Guest #${idx + 1}`);
                    const serial = `TKT-${String(t.id).padStart(6, '0')}`;
                    const isBusy = downloadingTicketId === t.id;
                    return (
                      <div
                        key={t.id || idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                              {serial}
                            </span>
                            <span className="font-semibold text-neutral-900 dark:text-white truncate max-w-[11rem]">
                              {displayName}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {t.ticketType?.name || successResult.ticketTypeName}
                            {att?.phone ? ` · ${att.phone}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleDownloadSingleTicket(t.id, serial)}
                            className="h-7 px-2 text-[10px] gap-1 rounded-lg border-neutral-200 dark:border-neutral-800 font-bold"
                            title="Download single PDF"
                          >
                            {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                            <span>PDF</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shareViaWhatsApp(att?.phone, displayName)}
                            className="h-7 px-2 text-[10px] gap-1 rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/40 font-bold"
                            title="Send on WhatsApp"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>WA</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {successResult.count > 1 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    disabled={downloadingZip}
                    onClick={() => handleDownloadZip()}
                    className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm gap-2 shadow-sm"
                  >
                    {downloadingZip ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {downloadingZip
                        ? `Generating ZIP... (${downloadTimer}s)`
                        : `Download All (${successResult.count} Separate PDFs .ZIP)`}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    disabled={downloadingPdf}
                    onClick={() => handleDownloadPdf()}
                    variant="outline"
                    className="h-12 rounded-xl border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold text-xs gap-1.5"
                  >
                    {downloadingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {downloadingPdf
                        ? `Generating PDF... (${downloadTimer}s)`
                        : 'Download Combined PDF'}
                    </span>
                  </Button>
                </div>
                {downloadDuration !== null && !downloadingZip && !downloadingPdf && (
                  <p className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 pt-1">
                    <Check className="h-3.5 w-3.5" /> Download ready in {downloadDuration}s
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  type="button"
                  disabled={downloadingPdf}
                  onClick={() => handleDownloadPdf()}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm gap-2 shadow-sm"
                >
                  {downloadingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>
                    {downloadingPdf
                      ? `Generating PDF... (${downloadTimer}s)`
                      : 'Download Ticket (PDF)'}
                  </span>
                </Button>
                {downloadDuration !== null && !downloadingPdf && (
                  <p className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 pt-1">
                    <Check className="h-3.5 w-3.5" /> Download ready in {downloadDuration}s
                  </p>
                )}
              </div>
            )}

            {pdfDownloadError && (
              <p className="text-xs text-rose-500 text-center font-medium">{pdfDownloadError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                type="button"
                onClick={() => shareViaWhatsApp()}
                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Share on WhatsApp</span>
              </Button>
              <Button
                type="button"
                onClick={handleStartNewSale}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Issue Another Ticket</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MAIN POINT OF SALE FORM (For Selected Event) */}
      {selectedEventId && !successResult && activeEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Inputs & Configuration */}
          <div className="lg:col-span-7 space-y-4">
            {/* Event Header Banner with Image & Change Event */}
            <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {activeEvent.imageUrl ? (
                    <img
                      src={activeEvent.imageUrl}
                      alt={activeEvent.title}
                      className="h-12 w-12 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-neutral-800 shadow-2xs"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-400">
                      <Calendar className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {activeEvent.organization?.name && (
                        <span className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                          {activeEvent.organization.name}
                        </span>
                      )}
                      <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Event #{activeEvent.id}
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white leading-snug truncate">
                      {activeEvent.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 pt-0.5">
                      {activeEvent.startDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          <span>{formatEventDate(activeEvent.startDate)}</span>
                        </div>
                      )}
                      {activeEvent.location && (
                        <div className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="truncate">{activeEvent.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleChangeEvent}
                  className="rounded-xl text-xs font-semibold shrink-0"
                >
                  Change
                </Button>
              </div>
            </div>

            {/* Ticket Tier & Quantity Card */}
            <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Ticket Tier & Quantity
              </span>

              {activeEvent.ticketTypes.length === 0 ? (
                <p className="text-xs text-rose-500 font-semibold">No ticket tiers created for this event.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeEvent.ticketTypes.map((tt) => {
                    const selected = String(tt.id) === selectedTicketTypeId;
                    const sold = tt._count?.tickets || 0;
                    const remaining = Math.max(0, tt.quantity - sold);
                    return (
                      <button
                        key={tt.id}
                        type="button"
                        onClick={() => setSelectedTicketTypeId(String(tt.id))}
                        className={cn(
                          'p-3 rounded-xl border text-left transition-all cursor-pointer min-w-0 relative',
                          selected
                            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300'
                        )}
                      >
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {tt.name}
                        </p>
                        <p
                          className={cn(
                            'text-xs font-extrabold mt-0.5 tabular-nums',
                            selected ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-600 dark:text-neutral-300'
                          )}
                        >
                          {tt.price === 0 ? 'Free' : formatNaira(tt.price)}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          {remaining} left ({sold} sold)
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Number of Tickets
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 5, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuantity(preset)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                        quantity === preset
                          ? 'border-rose-500 bg-rose-500 text-white font-bold'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300'
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Discount Card */}
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Percent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      Apply Discount
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Reduce amount collected from buyer for bulk deals, promotions, or host approvals.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {calculatedDiscount > 0 && (
                    <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 tabular-nums bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800">
                      -{formatNaira(calculatedDiscount)} off
                    </span>
                  )}
                  <Switch checked={discountActive} onCheckedChange={setDiscountActive} />
                </div>
              </div>

              {discountActive && (
                <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/40 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Discount Type Toggle */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                        Discount Type
                      </label>
                      <div className="inline-flex w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('PERCENTAGE')}
                          className={cn(
                            'flex-1 py-1.5 rounded-lg text-center transition-all',
                            discountType === 'PERCENTAGE'
                              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                          )}
                        >
                          Percentage (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('FIXED')}
                          className={cn(
                            'flex-1 py-1.5 rounded-lg text-center transition-all',
                            discountType === 'FIXED'
                              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                          )}
                        >
                          Fixed Amount (₦)
                        </button>
                      </div>
                    </div>

                    {/* Discount Value */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                        {discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₦)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={discountType === 'PERCENTAGE' ? '100' : String(faceSubtotal)}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 5000'}
                        className="w-full h-9 px-3 text-xs sm:text-sm font-bold rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 mr-1">Presets:</span>
                    {discountType === 'PERCENTAGE'
                      ? [10, 15, 20, 25, 50].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDiscountValue(String(pct))}
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors',
                              discountValue === String(pct)
                                ? 'bg-amber-500 text-white border-amber-500 font-bold'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-amber-400 text-neutral-600 dark:text-neutral-300'
                            )}
                          >
                            {pct}%
                          </button>
                        ))
                      : [1000, 2000, 5000, 10000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDiscountValue(String(amt))}
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors',
                              discountValue === String(amt)
                                ? 'bg-amber-500 text-white border-amber-500 font-bold'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-amber-400 text-neutral-600 dark:text-neutral-300'
                            )}
                          >
                            {formatNaira(amt)}
                          </button>
                        ))}
                  </div>

                  {/* Discount Reason */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                      Reason / Promo Note <span className="font-normal text-neutral-400">(optional, visible on organizer statement)</span>
                    </label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="e.g. Host approved VIP rate, Promo: SUMMER20, Bulk 5+ order"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Email Dispatch & Attendee Details Card */}
            <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Attendee & Email Dispatch
                </span>

                {/* Delivery Mode Toggle (One email vs Multiple emails) */}
                <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('single')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg transition-all flex items-center gap-1',
                      deliveryMode === 'single'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    )}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>One email ({quantity > 1 ? `all ${quantity}` : '1'})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('individual')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg transition-all flex items-center gap-1',
                      deliveryMode === 'individual'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Multiple emails (each ticket)</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: SINGLE RECIPIENT */}
              {deliveryMode === 'single' ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-neutral-500">
                    All {quantity} ticket{quantity > 1 ? 's' : ''} will be issued to this guest and sent to their email & WhatsApp.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        ref={nameInputRef}
                        type="text"
                        className={cn(
                          inputClass,
                          'pr-10',
                          attempted && !primaryName.trim() && 'border-rose-400 focus:border-rose-500'
                        )}
                        placeholder="e.g. Tunde Adebayo"
                        value={primaryName}
                        onChange={(e) => setPrimaryName(e.target.value)}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                        <VoiceInputButton
                          fieldType="name"
                          fieldLabel="Full Name"
                          onTranscript={(val) => setPrimaryName(val)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Email Address <span className="text-[10px] text-neutral-400 font-normal">(for tickets)</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="email"
                          className={inputClass}
                          placeholder="tunde@example.com"
                          value={primaryEmail}
                          onChange={(e) => setPrimaryEmail(e.target.value)}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                          <VoiceInputButton
                            fieldType="email"
                            fieldLabel="Email"
                            onTranscript={(val) => setPrimaryEmail(val)}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        WhatsApp Phone <span className="text-[10px] text-neutral-400 font-normal">(for delivery)</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="tel"
                          className={inputClass}
                          placeholder="0803 000 0000"
                          value={primaryPhone}
                          onChange={(e) => setPrimaryPhone(e.target.value)}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                          <VoiceInputButton
                            fieldType="phone"
                            fieldLabel="Phone"
                            onTranscript={(val) => setPrimaryPhone(val)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MODE 2: MULTIPLE INDIVIDUAL EMAILS FOR EACH TICKET */
                <div className="space-y-3">
                  <p className="text-[11px] text-neutral-500">
                    Each attendee will receive their own ticket email & QR code directly.
                  </p>

                  <div className="space-y-2.5 max-h-[22rem] overflow-y-auto pr-1">
                    {attendees.map((att, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-950/40 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            Ticket #{index + 1}
                          </span>
                          {index === 0 && (
                            <span className="text-[10px] text-neutral-400 font-semibold">Primary Contact</span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <input
                              type="text"
                              className={cn(inputClass, 'h-9')}
                              placeholder="Attendee Name *"
                              value={att.name}
                              onChange={(e) => updateAttendee(index, { name: e.target.value })}
                            />
                          </div>

                          <div>
                            <input
                              type="email"
                              className={cn(inputClass, 'h-9')}
                              placeholder="Email for this ticket"
                              value={att.email}
                              onChange={(e) => updateAttendee(index, { email: e.target.value })}
                            />
                          </div>

                          <div>
                            <input
                              type="tel"
                              className={cn(inputClass, 'h-9')}
                              placeholder="WhatsApp Phone"
                              value={att.phone}
                              onChange={(e) => updateAttendee(index, { phone: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Payment Method Received
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = paymentMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        className={cn(
                          'py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors',
                          selected
                            ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PartyStorm Cut & Platform Fee Override Card */}
            <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-rose-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300">
                      PartyStorm Platform Cut
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Unlike gate walk-ins (where 100% is kept at the door with ₦0 fee), assisted direct sales
                    account for PartyStorm's platform fee.
                  </p>
                </div>
                <span className="shrink-0 text-xs font-extrabold text-rose-600 dark:text-rose-400 tabular-nums bg-rose-100 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg">
                  {formatNaira(finalPartyStormCut)} ({feeMarginPercent}%)
                </span>
              </div>

              {/* Override Toggle */}
              <div className="pt-2 border-t border-rose-200/40 dark:border-rose-900/40 space-y-2">
                <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                  <span>Custom fee override</span>
                  <Switch checked={customFeeActive} onCheckedChange={setCustomFeeActive} />
                </label>

                {customFeeActive && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-neutral-500">Custom Cut (₦):</span>
                    <input
                      type="number"
                      min="0"
                      value={customFee}
                      onChange={(e) => setCustomFee(e.target.value)}
                      placeholder={String(standardTotalFee)}
                      className="w-36 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-neutral-400">Total cut for {quantity} ticket(s)</span>
                  </div>
                )}
              </div>

              {/* Check-in now option */}
              <div className="pt-2 border-t border-rose-200/40 dark:border-rose-900/40">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Check-in at gate immediately
                    </span>
                  </div>
                  <Switch checked={checkInNow} onCheckedChange={setCheckInNow} />
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary & Settlement */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  Settlement & Order Summary
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Direct sale breakdown credited to organizer and PartyStorm ledger.
                </p>
              </div>

              {/* Order Lines */}
              <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 p-3 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {activeTicketType ? activeTicketType.name : 'Select tier'}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {activeEvent.title} · Qty: {quantity}
                    </p>
                  </div>
                  <p className="font-bold tabular-nums text-neutral-900 dark:text-white">
                    {formatNaira(faceSubtotal)}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 text-[11px] text-neutral-500">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {deliveryMode === 'single' ? 'Primary Buyer:' : `Recipients (${quantity}):`}
                  </span>{' '}
                  {deliveryMode === 'single'
                    ? primaryName.trim() || 'Not specified'
                    : attendees
                        .filter((a) => a.name.trim())
                        .map((a) => a.name.trim())
                        .join(', ') || `${quantity} attendees`}
                </div>
              </div>

              {/* Split Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal (Face Value)</span>
                  <span
                    className={cn(
                      'tabular-nums',
                      calculatedDiscount > 0
                        ? 'line-through text-neutral-400 font-medium'
                        : 'font-bold text-neutral-900 dark:text-white'
                    )}
                  >
                    {formatNaira(faceSubtotal)}
                  </span>
                </div>

                {calculatedDiscount > 0 && (
                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-semibold bg-amber-50/60 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      <span>
                        Discount ({discountType === 'PERCENTAGE' ? `${discountValue}%` : 'Fixed'})
                      </span>
                    </span>
                    <span className="tabular-nums font-extrabold">-{formatNaira(calculatedDiscount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-neutral-900 dark:text-white font-bold pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <span>Gross to Collect</span>
                  <span className="tabular-nums text-sm font-extrabold">{formatNaira(grossCollected)}</span>
                </div>

                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                  <span>PartyStorm Platform Cut</span>
                  <span className="font-bold tabular-nums">-{formatNaira(finalPartyStormCut)}</span>
                </div>

                <div className="flex items-center justify-between text-neutral-500">
                  <span>Payment Gateway Fee</span>
                  <span className="font-semibold tabular-nums">₦0 (Direct Assisted)</span>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  <span>Organizer Net Earnings</span>
                  <span className="tabular-nums">{formatNaira(organizerNet)}</span>
                </div>

                <p className="text-[10px] text-neutral-400 pt-1 leading-relaxed">
                  The organizer will see <strong className="text-neutral-700 dark:text-neutral-300">{formatNaira(organizerNet)}</strong> in their Payments & Finance ledger under Assisted Direct Sales.
                </p>
              </div>

              {/* Submit CTA */}
              <Button
                type="button"
                disabled={submitting || !selectedEventId || !selectedTicketTypeId}
                onClick={handleIssue}
                className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-xs transition-colors"
              >
                {submitting ? (
                  <span>Issuing Tickets...</span>
                ) : (
                  <span>
                    Confirm & Issue Tickets · {formatNaira(grossCollected)}
                  </span>
                )}
              </Button>

              {/* Session Tally */}
              {sessionTally.count > 0 && (
                <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-2.5 text-[10px] text-neutral-500 space-y-0.5">
                  <p className="font-bold uppercase tracking-wider text-neutral-400">Today's Session</p>
                  <p className="tabular-nums">
                    {sessionTally.count} tickets issued · Gross {formatNaira(sessionTally.gross)} · Cut {formatNaira(sessionTally.cut)}
                    {sessionTally.discount > 0 ? ` · Discounts -${formatNaira(sessionTally.discount)}` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssistedSalesPage;
