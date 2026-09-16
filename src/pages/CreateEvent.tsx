import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Upload,
  Globe,
  Check,
  ImageIcon,
  X,
  Plus,
  Sparkles,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Calendar as DateCalendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { api } from '../services/api';
import { EVENT_TEMPLATES, EventTemplate, TicketDraft } from '../data/eventTemplates';
import {
  TICKET_ACCENTS,
  TICKET_LAYOUTS,
  encodeTicketStyle,
  parseTicketStyle,
  suggestTicketDesign,
  isDefaultTicketStyle,
  getAccentPreset,
} from '../data/ticketDesigns';
import { INCLUDED_SUGGESTIONS } from '../data/eventExtras';
import EventTicketCard from '../components/tickets/EventTicketCard';
import VendorSettingsStep, { VendorSettings } from '../components/organizer/VendorSettingsStep';
import GoogleMapLocationPicker from '../components/organizer/GoogleMapLocationPicker';
import VenueAutocomplete from '../components/organizer/VenueAutocomplete';
import { GoogleMapLocation } from '../components/GoogleMapLocation';
import { cn } from '../lib/utils';
import { resolveImageUrl } from '../lib/media';
import {
  combineDateAndTime12,
  formatTime12,
  HOURS_12,
  joinTime12,
  MINUTES,
  PERIODS,
  splitTime12,
} from '../lib/time12';

type Step = 'details' | 'tickets' | 'review';

interface FormState {
  templateId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime12: string;
  endTime12: string;
  locationType: 'physical' | 'online';
  location: string;
  latitude?: number;
  longitude?: number;
  onlineUrl: string;
  capacity: string;
  tickets: TicketDraft[];
  imageUrl: string;
  includedItems: string[];
  vendorSettings: VendorSettings;
  category: string;
}

const STEPS: { key: Step; label: string; description: string }[] = [
  { key: 'details', label: 'Event', description: 'What, when & where' },
  { key: 'tickets', label: 'Tickets', description: 'Price & quantity' },
  { key: 'review', label: 'Publish', description: 'Check and go live' },
];

const defaultTicket = (): TicketDraft => ({
  name: 'General Admission',
  price: '',
  quantity: '100',
  isFree: false,
  ticketStyle: encodeTicketStyle('classic', 'rose'),
  badgeText: '',
  accentColor: '',
  ticketHeadline: '',
  venueLabel: '',
  ticketSublabel: '',
  maxPerPerson: '5',
});

const defaultForm = (): FormState => ({
  templateId: 'custom',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  startTime12: '6:00 PM',
  endTime12: '10:00 PM',
  locationType: 'physical',
  location: '',
  latitude: undefined,
  longitude: undefined,
  onlineUrl: '',
  capacity: '',
  tickets: [defaultTicket()],
  imageUrl: '',
  includedItems: [],
  vendorSettings: {
    allowVendors: false,
    stallTypes: [],
    allowedRoles: [],
    approvalMode: 'manual',
    applicationDeadline: 5,
  },
  category: 'Other',
});

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function formatDateLabel(dateStr: string) {
  if (!dateStr) return 'Pick a date';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NG', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function totalTicketQuantity(tickets: TicketDraft[], excludeIndex?: number) {
  return tickets.reduce(
    (sum, t, i) => (i === excludeIndex || t.isUnlimited ? sum : sum + parseInt(t.quantity || '0', 10)),
    0
  );
}

/** Local YYYY-MM-DD — avoids UTC day-shift from toISOString(). */
function toLocalDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildFormData(form: FormState, image: File | null, isPublished: boolean): FormData {
  const startDateTime = combineDateAndTime12(form.startDate, form.startTime12)!;
  const endDateTime = combineDateAndTime12(form.endDate || form.startDate, form.endTime12)!;
  const fd = new FormData();

  fd.append('title', form.title);
  fd.append('description', form.description);
  fd.append('startDate', startDateTime.toISOString());
  fd.append('endDate', endDateTime.toISOString());
  fd.append('locationType', form.locationType);

  const isAnyUnlimited = form.tickets.some((t) => t.isUnlimited);
  const totalCalculatedCapacity = form.tickets.reduce(
    (sum, t) => sum + (t.isUnlimited ? 0 : parseInt(t.quantity || '0', 10)),
    0
  );
  if (!isAnyUnlimited && totalCalculatedCapacity > 0) {
    fd.append('capacity', String(totalCalculatedCapacity));
  }

  fd.append('isPublished', String(isPublished));
  fd.append('category', form.category || 'Other');
  
  // Add latitude/longitude if physical event
  if (form.locationType === 'physical' && form.latitude != null && form.longitude != null) {
    fd.append('latitude', String(form.latitude));
    fd.append('longitude', String(form.longitude));
  }
  
  fd.append(
    'ticketTypes',
    JSON.stringify(
      form.tickets.map((t) => ({
        name: t.name,
        price: t.isFree ? 0 : parseFloat(t.price || '0'),
        quantity: t.isUnlimited ? 0 : parseInt(t.quantity || '0', 10),
        isUnlimited: !!t.isUnlimited,
        ticketStyle: t.ticketStyle || encodeTicketStyle('classic', 'rose'),
        badgeText: t.badgeText || null,
        accentColor: t.accentColor || null,
        ticketHeadline: t.ticketHeadline || null,
        venueLabel: t.venueLabel || null,
        ticketSublabel: t.ticketSublabel || null,
        maxPerPerson: t.maxPerPerson ? parseInt(t.maxPerPerson, 10) : 5,
        isPaused: !!t.isPaused,
      }))
    )
  );

  // Always send vendor settings so edit can turn vendors off
  fd.append(
    'vendorSettings',
    JSON.stringify({
      allowVendors: form.vendorSettings.allowVendors,
      stallTypes: form.vendorSettings.allowVendors ? form.vendorSettings.stallTypes : [],
      allowedRoles: form.vendorSettings.allowedRoles,
      approvalMode: form.vendorSettings.approvalMode,
      applicationDeadline: form.vendorSettings.applicationDeadline,
    })
  );

  if (form.includedItems.length) fd.append('amenities', JSON.stringify(form.includedItems));

  if (form.locationType === 'online') {
    fd.append('onlineUrl', form.onlineUrl);
    fd.append('location', form.onlineUrl);
  } else {
    fd.append('location', form.location);
  }

  const firstPaid = form.tickets.find((t) => !t.isFree);
  if (firstPaid?.price) fd.append('price', firstPaid.price);
  
  if (image) {
    fd.append('image', image);
  } else if (form.imageUrl) {
    fd.append('imageUrl', form.imageUrl);
  }
  
  return fd;
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
      {children}
      {optional && <span className="ml-1 font-normal text-neutral-400">optional</span>}
    </span>
  );
}

function OptionalSection({
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
          {hint && <p className="text-xs text-neutral-500 mt-0.5">{hint}</p>}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-neutral-400 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function TimePicker12({
  label,
  value,
  onChange,
  hasError,
  hideLabel,
  bare,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  hideLabel?: boolean;
  bare?: boolean;
}) {
  const { hour, minute, period } = splitTime12(value);
  const update = (h: string, m: string, p: 'AM' | 'PM') => onChange(joinTime12(h, m, p));
  const selectClass =
    'h-8 bg-transparent text-sm font-medium text-center focus:outline-none cursor-pointer appearance-none';

  return (
    <div className={hideLabel ? 'shrink-0' : undefined}>
      {!hideLabel && <FieldLabel>{label}</FieldLabel>}
      <div className={cn(
        "inline-flex items-center rounded-lg px-1.5 gap-0.5 transition-colors",
        bare
          ? "bg-neutral-100 dark:bg-neutral-800 h-9"
          : "border bg-white dark:bg-neutral-900 h-[42px] px-2",
        !bare && (hasError
          ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20"
          : "border-neutral-200 dark:border-neutral-700")
      )}>
        <select
          value={hour}
          onChange={(e) => update(e.target.value, minute, period)}
          className={cn(selectClass, 'w-8')}
          aria-label={`${label} hour`}
        >
          {HOURS_12.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-neutral-400 text-sm font-medium">:</span>
        <select
          value={minute}
          onChange={(e) => update(hour, e.target.value, period)}
          className={cn(selectClass, 'w-8')}
          aria-label={`${label} minute`}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => update(hour, minute, e.target.value as 'AM' | 'PM')}
          className={cn(selectClass, 'w-10 text-rose-500 font-semibold')}
          aria-label={`${label} AM or PM`}
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function formatDateTimeTrigger(dateStr: string, time12: string) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return time12;
  return `${d.toLocaleDateString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} · ${time12}`;
}

function DateTimePicker({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
  hasError,
}: {
  label: string;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  minDate?: Date;
  hasError?: boolean;
}) {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full h-[42px] px-3 rounded-lg border bg-white dark:bg-neutral-900 text-sm text-left flex items-center gap-2.5 transition-colors',
              hasError
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500',
              date ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'
            )}
          >
            <Calendar className="h-4 w-4 text-neutral-400 shrink-0" />
            <span className="flex-1 truncate">
              {date ? formatDateTimeTrigger(date, time) : 'Select date & time'}
            </span>
            <Clock className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 overflow-hidden" align="start">
          <DateCalendar
            mode="single"
            selected={date ? new Date(`${date}T12:00:00`) : undefined}
            onSelect={(d) => d && onDateChange(toLocalDateInput(d))}
            disabled={(d) => d < (minDate ?? todayStart)}
          />
          <div className="flex items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 px-3 py-2.5 bg-neutral-50/80 dark:bg-neutral-900">
            <span className="text-xs font-medium text-neutral-500">Time</span>
            <TimePicker12 hideLabel bare label={`${label} time`} value={time} onChange={onTimeChange} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function StepActions({
  onBack,
  onNext,
  nextLabel = 'Continue',
  backLabel = 'Back',
  error,
  onDismissError,
  children,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  error?: string | null;
  onDismissError?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-2 pt-5 border-t border-neutral-200 dark:border-neutral-800">
      {error && (
        <div className="mb-3 flex items-start gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg">
          <p className="flex-1">{error}</p>
          {onDismissError && (
            <button type="button" onClick={onDismissError} className="shrink-0 p-0.5 hover:text-rose-800" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-neutral-500 hover:text-rose-500 transition-colors shrink-0"
        >
          {backLabel}
        </button>
        {children ?? (
          <Button
            onClick={onNext}
            className="rounded-full px-5 sm:px-6 bg-rose-500 hover:bg-rose-600 text-white border-0 flex items-center gap-2 text-sm"
          >
            {nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState<FormState>(defaultForm);
  const [eventId, setEventId] = useState<number | null>(() => {
    if (!id) return null;
    const n = Number(id);
    return !Number.isNaN(n) && n > 0 && String(n) === id ? n : null;
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [savingType, setSavingType] = useState<'draft' | 'publish' | null>(null);
  const [isEventPublished, setIsEventPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [customIncluded, setCustomIncluded] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showTemplateGrid, setShowTemplateGrid] = useState(false);
  const [showExtras, setShowExtras] = useState(true);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const isEditing = !!id;
  const appliedTemplate = EVENT_TEMPLATES.find(
    (t) => t.id === form.templateId && t.id !== 'custom'
  );
  const hasUnlimitedTickets = form.tickets.some((t) => t.isUnlimited);
  const ticketQtyTotal = totalTicketQuantity(form.tickets);

  const includedChipOptions = [
    ...INCLUDED_SUGGESTIONS,
    ...form.includedItems.filter((i) => !INCLUDED_SUGGESTIONS.includes(i)),
  ];

  const clearError = () => setError(null);
  const coverImageSrc = imagePreview || resolveImageUrl(form.imageUrl);

  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, step, customIncluded]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        // Organizer endpoint accepts slug or id and returns full ticket/vendor fields
        const { data: event } = await api.events.getOrganizerEventById(id);
        setIsEventPublished(event.isPublished);
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        const amenities = parseJsonField<string[]>(event.amenities, []);
        const highlights = parseJsonField<Array<{ label: string }>>(event.highlights, []);
        const included = [...amenities, ...highlights.map((h) => h.label)].filter(
          (v, i, a) => a.indexOf(v) === i
        );
        const capacityFallback = event.capacity ? String(event.capacity) : '100';
        const vs = event.vendorSettings;
        const stallSource =
          (vs?.stallTypes?.length ? vs.stallTypes : null) ||
          (event.vendorTypes?.length ? event.vendorTypes : null);
        const deadlineDays =
          event.vendorDeadline && event.startDate
            ? Math.max(
                1,
                Math.round(
                  (new Date(event.startDate).getTime() -
                    new Date(event.vendorDeadline).getTime()) /
                    (24 * 60 * 60 * 1000)
                )
              )
            : 7;
        const approvalRaw = vs?.approvalMode || event.vendorApprovalMode || 'manual';
        const approvalMode = approvalRaw === 'auto' ? 'auto' : 'manual';

        const startInput = toLocalDateInput(start);
        const endInput = toLocalDateInput(end);
        setShowExtras(true);
        setForm({
          templateId: 'custom',
          title: event.title || '',
          description: event.description || '',
          startDate: startInput,
          endDate: endInput,
          startTime12: formatTime12(start),
          endTime12: formatTime12(end),
          locationType: event.locationType === 'online' ? 'online' : 'physical',
          location: event.locationType === 'online' ? '' : event.location || '',
          latitude: event.latitude != null ? Number(event.latitude) : undefined,
          longitude: event.longitude != null ? Number(event.longitude) : undefined,
          onlineUrl: event.onlineUrl || (event.locationType === 'online' ? event.location || '' : ''),
          capacity: event.capacity ? String(event.capacity) : '',
          tickets: event.ticketTypes?.length
            ? event.ticketTypes.map((t: {
                name: string;
                price: number;
                quantity: number | null;
                ticketStyle?: string;
                badgeText?: string | null;
                accentColor?: string | null;
                ticketHeadline?: string | null;
                venueLabel?: string | null;
                ticketSublabel?: string | null;
                maxPerPerson?: number | null;
                isPaused?: boolean;
              }) => ({
                name: t.name,
                price: String(t.price ?? 0),
                isUnlimited: Number(t.quantity) === 0,
                quantity: Number(t.quantity) === 0 ? '' : t.quantity != null ? String(t.quantity) : capacityFallback,
                isFree: Number(t.price) === 0,
                ticketStyle: t.ticketStyle || encodeTicketStyle('classic', 'rose'),
                badgeText: t.badgeText || '',
                accentColor: t.accentColor || '',
                ticketHeadline: t.ticketHeadline || '',
                venueLabel: t.venueLabel || '',
                ticketSublabel: t.ticketSublabel || '',
                maxPerPerson:
                  t.maxPerPerson != null ? String(t.maxPerPerson) : '5',
                isPaused: !!t.isPaused,
              }))
            : [defaultTicket()],
          imageUrl: event.imageUrl || '',
          includedItems: included,
          vendorSettings: {
            allowVendors: Boolean(vs?.allowVendors ?? event.allowVendors),
            stallTypes: stallSource
              ? stallSource.map((vt: {
                  id?: string | number;
                  name?: string;
                  price?: number;
                  fee?: number;
                  maxStalls?: number | null;
                  maxVendors?: number | null;
                  description?: string;
                }) => ({
                  id: `stall_${vt.id ?? vt.name}`,
                  name: vt.name || '',
                  price: Number(vt.price ?? vt.fee ?? 0),
                  maxStalls: Number(vt.maxStalls ?? vt.maxVendors ?? 10),
                  description: vt.description || '',
                }))
              : [],
            allowedRoles: Array.isArray(vs?.allowedRoles) ? vs.allowedRoles : [],
            approvalMode: approvalMode as VendorSettings['approvalMode'],
            applicationDeadline: deadlineDays,
          },
          category: event.category || '',
        });
        const resolvedCover = resolveImageUrl(event.imageUrl);
        if (resolvedCover) setImagePreview(resolvedCover);
        setEventId(event.id);
      } catch {
        setError('Could not load event.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const applyTemplate = (template: EventTemplate) => {
    const category = template.category || 'Other';
    const suggestion = suggestTicketDesign(category);
    setForm({
      templateId: template.id,
      title: template.title,
      description: template.description,
      startDate: '',
      endDate: '',
      startTime12: '6:00 PM',
      endTime12: '10:00 PM',
      locationType: template.locationType,
      location: '',
      onlineUrl: '',
      capacity: template.capacity,
      tickets: template.tickets.map((t, i) => {
        const { accent } = parseTicketStyle(t.ticketStyle);
        const styleId =
          i === 0 || isDefaultTicketStyle(t.ticketStyle)
            ? suggestion.styleId
            : encodeTicketStyle(suggestion.layout, accent);
        return { ...t, ticketStyle: styleId, accentColor: '', isFree: false };
      }),
      imageUrl: template.image,
      includedItems: template.amenities ? [...template.amenities] : [],
      vendorSettings: template.vendorSettings
        ? { ...template.vendorSettings }
        : {
            allowVendors: false,
            stallTypes: [],
            allowedRoles: [],
            approvalMode: 'manual',
            applicationDeadline: 5,
          },
      category,
    });
    setImagePreview(template.image);
    setImageFile(null);
    setError(null);
  };

  const toggleIncluded = (item: string) => {
    setForm((p) => ({
      ...p,
      includedItems: p.includedItems.includes(item)
        ? p.includedItems.filter((a) => a !== item)
        : [...p.includedItems, item],
    }));
  };

  const addCustomIncluded = () => {
    const trimmed = customIncluded.trim();
    if (!trimmed) return;
    setForm((p) => ({
      ...p,
      includedItems: p.includedItems.includes(trimmed) ? p.includedItems : [...p.includedItems, trimmed],
    }));
    setCustomIncluded('');
  };

  const handleImage = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const updateTicket = (index: number, updates: Partial<TicketDraft>) => {
    setForm((prev) => {
      const tickets = [...prev.tickets];
      tickets[index] = { ...tickets[index], ...updates };
      return { ...prev, tickets };
    });
  };

  const addBlankTicket = () => {
    setForm((prev) => ({
      ...prev,
      tickets: [
        ...prev.tickets,
        { ...defaultTicket(), name: `Ticket ${prev.tickets.length + 1}`, quantity: '100' },
      ],
    }));
    setActiveTicketIndex(form.tickets.length);
  };

  const removeTicket = (index: number) => {
    if (form.tickets.length <= 1) return;
    setForm((prev) => ({ ...prev, tickets: prev.tickets.filter((_, i) => i !== index) }));
    setActiveTicketIndex((i) => Math.max(0, i - 1));
  };

  const previewDate = form.startDate ? `${form.startDate}T12:00:00` : new Date().toISOString();
  const previewLocation = form.locationType === 'online' ? 'Online Event' : form.location || 'Venue TBA';
  const activeTicket = form.tickets[activeTicketIndex] ?? form.tickets[0];

  const validateDetails = (): string | null => {
    if (form.title.trim().length < 3) return 'Give your event a title.';
    if (form.description.trim().length < 3) return 'Add a short description.';
    if (!form.startDate) return 'Pick a start date.';
    const endDate = form.endDate || form.startDate;
    if (!form.startTime12 || !form.endTime12) return 'Set start and end times.';
    const start = combineDateAndTime12(form.startDate, form.startTime12);
    const end = combineDateAndTime12(endDate, form.endTime12);
    if (!start || !end) return 'Enter valid times.';
    if (end <= start) return 'End time must be after the start.';
    if (form.locationType === 'physical' && !form.location.trim()) return 'Add a venue or address.';
    if (form.locationType === 'online' && !form.onlineUrl.trim()) return 'Add a meeting link.';
    return null;
  };

  const validateTickets = (): string | null => {
    for (const t of form.tickets) {
      if (!t.name.trim()) return 'Each ticket needs a name.';
      if (!t.isFree && (!t.price || Number(t.price) < 0)) return 'Enter a valid price.';
      if (!t.isUnlimited && (!t.quantity || Number(t.quantity) < 1)) return 'Enter quantity or select Unlimited.';
    }
    return null;
  };

  const validateVendors = (): string | null => {
    if (form.vendorSettings.allowVendors && form.vendorSettings.stallTypes.length === 0) {
      return 'Please add at least one stall type to allow vendors.';
    }
    return null;
  };

  const validateStep = (): string | null => {
    if (step === 'details') return validateDetails();
    if (step === 'tickets') return validateTickets();
    return null;
  };

  const validateStepKey = (key: Step): string | null => {
    if (key === 'details') return validateDetails();
    if (key === 'tickets') return validateTickets();
    return null;
  };

  const validateAll = (): string | null => validateDetails() ?? validateTickets() ?? validateVendors();

  const scrollStepTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Mobile step chips: back always ok; forward must pass validators for each skipped step. */
  const goToStep = (target: Step) => {
    const targetIndex = STEPS.findIndex((s) => s.key === target);
    if (targetIndex < 0 || targetIndex === stepIndex) return;

    if (targetIndex < stepIndex) {
      setError(null);
      setStep(target);
      scrollStepTop();
      return;
    }

    for (let i = stepIndex; i < targetIndex; i++) {
      const err = validateStepKey(STEPS[i].key);
      if (err) {
        setError(err);
        setStep(STEPS[i].key);
        scrollStepTop();
        return;
      }
    }

    setError(null);
    setStep(target);
    scrollStepTop();
  };

  const saveEvent = async (isPublished: boolean) => {
    const detailsErr = validateDetails();
    const ticketsErr = validateTickets();
    const vendorsErr = validateVendors();
    const validationError = detailsErr ?? ticketsErr ?? vendorsErr;
    if (validationError) {
      setError(validationError);
      if (detailsErr) setStep('details');
      else if (ticketsErr) setStep('tickets');
      else setStep('review');
      scrollStepTop();
      return;
    }
    setSavingType(isPublished ? 'publish' : 'draft');
    setError(null);
    try {
      const fd = buildFormData(form, imageFile, isPublished);
      if (eventId) {
        await api.events.updateWithImage(eventId, fd);
      } else {
        const res = await api.events.createWithImage(fd);
        setEventId(res.data.event.id);
      }
      navigate('/organizer/events');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong.';
      setError(msg);
    } finally {
      setSavingType(null);
    }
  };

  const quickSave = async () => {
    const validationError = validateAll();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSavingType(isEventPublished ? 'publish' : 'draft');
    setError(null);
    try {
      const fd = buildFormData(form, imageFile, isEventPublished);
      await api.events.updateWithImage(eventId!, fd);
      navigate('/organizer/events');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong.';
      setError(msg);
    } finally {
      setSavingType(null);
    }
  };

  const goNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step === 'details') setStep('tickets');
    else if (step === 'tickets') setStep('review');
    // Scroll the main scrollable container (or window) to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError(null);
    if (step === 'details') navigate('/organizer/events');
    else if (step === 'tickets') setStep('details');
    else if (step === 'review') setStep('tickets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasError = (keyword: string) => !!(error && error.toLowerCase().includes(keyword.toLowerCase()));

  const getInputClass = (keyword?: string) => cn(
    'w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 transition-colors',
    keyword && hasError(keyword)
      ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-900 dark:text-white bg-rose-50/50 dark:bg-rose-950/20'
      : 'border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-rose-500/20 focus:border-rose-500'
  );

  const selectedChipClass =
    'border-rose-500 bg-rose-500 text-white dark:bg-rose-500 dark:text-white';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-8 w-full max-w-7xl mx-auto px-3 sm:px-6 overflow-x-hidden">
      {/* ── Page header ── */}
      <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4 flex items-center justify-between gap-3 shrink-0">
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={goBack}
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 shrink-0 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-extrabold text-neutral-900 dark:text-white leading-tight truncate">
              {isEditing ? 'Edit event' : 'Create event'}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-none mt-0.5 truncate">
              Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex]?.label}
            </p>
          </div>
        </div>

        {/* Right: save (if editing) + close */}
        <div className="flex items-center gap-2 shrink-0">
          {isEditing && (
            <button
              type="button"
              disabled={savingType !== null}
              onClick={quickSave}
              className="text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-full px-3.5 py-1.5 transition-colors shadow-2xs disabled:opacity-50"
            >
              {savingType ? 'Saving...' : 'Save'}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/organizer/events')}
            className="p-1.5 rounded-full text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* ── Connected Step Navigation for Desktop & Tablet ── */}
      <div className="hidden sm:flex items-center justify-between w-full mb-6 px-1">
        {STEPS.map((s, i) => {
          const isCompleted = i < stepIndex;
          const isCurrent = i === stepIndex;
          return (
            <React.Fragment key={s.key}>
              <button
                type="button"
                onClick={() => goToStep(s.key)}
                className="flex items-center gap-2.5 group focus:outline-none transition-all cursor-pointer"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0',
                    isCurrent
                      ? 'bg-rose-500 text-white ring-4 ring-rose-500/20 shadow-xs'
                      : isCompleted
                      ? 'bg-rose-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className="text-left min-w-0">
                  <p
                    className={cn(
                      'text-xs font-bold leading-tight transition-colors',
                      isCurrent
                        ? 'text-rose-500'
                        : isCompleted
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                    )}
                  >
                    {s.label}
                  </p>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-none mt-0.5">
                    {s.description}
                  </p>
                </div>
              </button>

              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-3 h-[2px] bg-neutral-200 dark:bg-neutral-800 relative overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      i < stepIndex ? 'w-full bg-rose-500' : 'w-0'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Mobile Step Pills ── */}
      <div className="flex sm:hidden gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goToStep(s.key)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              i === stepIndex
                ? 'border-rose-500 bg-rose-500 text-white shadow-2xs font-bold'
                : i < stepIndex
                ? 'border-rose-200 text-rose-500 bg-rose-50 dark:bg-rose-950/20'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-rose-300 hover:text-rose-500'
            )}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-full">
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="space-y-5">
              <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-2xs space-y-5">
                {!isEditing && (
                  <div>
                    {showTemplateGrid ? (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div>
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {appliedTemplate ? 'Change template' : 'Templates'}
                            </h2>
                            <p className="text-[11px] text-neutral-500">
                              {appliedTemplate
                                ? `Currently using ${appliedTemplate.name}`
                                : 'Pick one to pre-fill the form, or skip and write your own.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowTemplateGrid(false)}
                            className="text-xs font-semibold text-neutral-500 hover:text-rose-500"
                          >
                            Hide
                          </button>
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin snap-x max-w-full">
                          {EVENT_TEMPLATES.map((template) => {
                            const isSelected = form.templateId === template.id;
                            return (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => {
                                  applyTemplate(template);
                                  setShowTemplateGrid(false);
                                }}
                                className={cn(
                                  'text-left rounded-xl overflow-hidden border transition-all flex flex-col w-32 sm:w-40 shrink-0 snap-start group hover:shadow-2xs cursor-pointer',
                                  isSelected
                                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10'
                                    : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300 bg-neutral-50/50 dark:bg-neutral-850/50'
                                )}
                              >
                                <div className="relative aspect-[16/9] w-full shrink-0 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                                  {template.image ? (
                                    <img
                                      src={template.image}
                                      alt={template.name}
                                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';
                                      }}
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 px-2">
                                      <Plus className="h-4 w-4 text-rose-500" />
                                      <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wider text-center">Blank</span>
                                    </div>
                                  )}
                                  {isSelected && (
                                    <div className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 rounded-full flex items-center justify-center z-10 shadow-xs">
                                      <Check className="h-2.5 w-2.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="p-2 min-w-0">
                                  <p className={cn('text-xs font-bold truncate leading-tight', isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-white')}>
                                    {template.name}
                                  </p>
                                  <p className="text-[9px] text-neutral-400 truncate mt-0.5">{template.tagline}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : appliedTemplate ? (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 min-w-0 truncate">
                          Template: <span className="font-semibold text-neutral-900 dark:text-white">{appliedTemplate.name}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowTemplateGrid(true)}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 shrink-0"
                        >
                          Change template
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowTemplateGrid(true)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Start from a template
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <FieldLabel>Cover photo</FieldLabel>
                  {imagePreview ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileRef.current?.click()}
                      onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                      className="relative aspect-[16/9] sm:aspect-[2.5/1] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 cursor-pointer group"
                    >
                      <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Upload className="h-5 w-5 text-white" />
                        <span className="text-sm font-medium text-white">Change cover</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center gap-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 px-4 py-3 text-left hover:border-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/10 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                        <ImageIcon className="h-5 w-5 text-neutral-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Add a cover photo</p>
                        <p className="text-xs text-neutral-500">You can do this later</p>
                      </div>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <div className="sm:col-span-3">
                    <FieldLabel>Event title</FieldLabel>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Summer Music Festival"
                      className={getInputClass('title')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Category</FieldLabel>
                    <select
                      value={form.category || 'Other'}
                      onChange={(e) => {
                        const category = e.target.value;
                        const suggestion = suggestTicketDesign(category);
                        setForm((p) => ({
                          ...p,
                          category,
                          tickets: p.tickets.map((t) =>
                            isDefaultTicketStyle(t.ticketStyle)
                              ? { ...t, ticketStyle: suggestion.styleId, accentColor: '' }
                              : t
                          ),
                        }));
                      }}
                      className={getInputClass('category')}
                    >
                      {['Music', 'Festival', 'Nightlife', 'Wedding', 'Food', 'Business', 'Technology', 'Conference', 'Arts', 'Sports', 'Wellness', 'Fairs', 'Other'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Tell guests what to expect..."
                    rows={3}
                    className={cn(getInputClass('description'), 'resize-none')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DateTimePicker
                    label="Starts"
                    date={form.startDate}
                    time={form.startTime12}
                    onDateChange={(dateStr) =>
                      setForm((p) => ({
                        ...p,
                        startDate: dateStr,
                        endDate: !p.endDate || p.endDate < dateStr ? dateStr : p.endDate,
                      }))
                    }
                    onTimeChange={(v) => setForm((p) => ({ ...p, startTime12: v }))}
                    hasError={hasError('start date') || hasError('time') || hasError('after the start')}
                  />
                  <DateTimePicker
                    label="Ends"
                    date={form.endDate}
                    time={form.endTime12}
                    onDateChange={(dateStr) => setForm((p) => ({ ...p, endDate: dateStr }))}
                    onTimeChange={(v) => setForm((p) => ({ ...p, endTime12: v }))}
                    minDate={form.startDate ? new Date(`${form.startDate}T00:00:00`) : undefined}
                    hasError={hasError('end date') || hasError('time') || hasError('after the start')}
                  />
                </div>

                <div>
                  <FieldLabel>Location</FieldLabel>
                  <div
                    className={cn(
                      'rounded-xl border overflow-hidden bg-white dark:bg-neutral-900',
                      hasError('location') || hasError('link')
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-neutral-200 dark:border-neutral-700'
                    )}
                  >
                    <div className="grid grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, locationType: 'physical' }))}
                        className={cn(
                          'h-11 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors',
                          form.locationType === 'physical'
                            ? 'bg-rose-500 text-white'
                            : 'bg-neutral-50 dark:bg-neutral-800/70 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        )}
                      >
                        <MapPin className="h-4 w-4" />
                        In person
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, locationType: 'online' }))}
                        className={cn(
                          'h-11 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors border-l border-neutral-200 dark:border-neutral-700',
                          form.locationType === 'online'
                            ? 'bg-rose-500 text-white border-l-rose-500'
                            : 'bg-neutral-50 dark:bg-neutral-800/70 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        )}
                      >
                        <Globe className="h-4 w-4" />
                        Online
                      </button>
                    </div>
                    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
                      {form.locationType === 'physical' ? (
                        <>
                          <VenueAutocomplete
                            value={form.location}
                            onChange={(location) => setForm((p) => ({ ...p, location }))}
                            onSelect={(loc) =>
                              setForm((p) => ({
                                ...p,
                                location: loc.address,
                                ...(loc.latitude != null ? { latitude: loc.latitude } : {}),
                                ...(loc.longitude != null ? { longitude: loc.longitude } : {}),
                              }))
                            }
                            onOpenMapPicker={() => setShowMapPicker(true)}
                            latitude={form.latitude}
                            longitude={form.longitude}
                            className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          />
                          {form.latitude != null && form.longitude != null && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                              <GoogleMapLocation
                                location={form.location || 'Pinned venue'}
                                latitude={form.latitude}
                                longitude={form.longitude}
                                eventTitle={form.title || 'Event location'}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <input
                          value={form.onlineUrl}
                          onChange={(e) => setForm((p) => ({ ...p, onlineUrl: e.target.value }))}
                          placeholder="https://zoom.us/j/..."
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <OptionalSection
                  title="More options"
                  hint="What’s included for guests"
                  open={showExtras}
                  onToggle={() => setShowExtras((v) => !v)}
                >
                  <div className="space-y-3">
                    <FieldLabel>What’s included</FieldLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {includedChipOptions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleIncluded(item)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs border transition-colors cursor-pointer',
                              form.includedItems.includes(item) ? selectedChipClass : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:border-rose-300'
                            )}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={customIncluded}
                          onChange={(e) => setCustomIncluded(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomIncluded())}
                          placeholder="Add a custom item..."
                          className={cn(getInputClass(), 'flex-1')}
                        />
                        <Button type="button" variant="outline" onClick={addCustomIncluded} className="rounded-lg shrink-0 border-rose-200 text-rose-500 hover:bg-rose-50">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                  </div>
                </OptionalSection>

                <StepActions onBack={() => navigate('/organizer/events')} onNext={goNext} backLabel="Cancel" error={error} onDismissError={clearError} />
              </div>
            </motion.div>
          )}

          {step === 'tickets' && activeTicket && (
            <motion.div key="tickets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
              <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-2xs">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-4 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {form.tickets.map((ticket, i) => (
                        <button
                          key={`${ticket.name}-${i}`}
                          type="button"
                          onClick={() => setActiveTicketIndex(i)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                            activeTicketIndex === i ? selectedChipClass : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:border-rose-300'
                          )}
                        >
                          {ticket.name || `Ticket ${i + 1}`}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={addBlankTicket}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 inline-flex items-center gap-0.5 px-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>

                    <div>
                      <FieldLabel>Name</FieldLabel>
                      <input value={activeTicket.name} onChange={(e) => updateTicket(activeTicketIndex, { name: e.target.value })} placeholder="e.g. General Admission" className={getInputClass('ticket needs a name')} />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(activeTicket.isFree)}
                          onChange={(e) =>
                            updateTicket(activeTicketIndex, {
                              isFree: e.target.checked,
                              price: e.target.checked ? '0' : activeTicket.price === '0' ? '' : activeTicket.price,
                            })
                          }
                          className="rounded accent-rose-500 w-4 h-4"
                        />
                        Free
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeTicket.isUnlimited ?? false}
                          onChange={(e) => updateTicket(activeTicketIndex, { isUnlimited: e.target.checked, quantity: e.target.checked ? '' : (activeTicket.quantity || '100') })}
                          className="rounded accent-rose-500 w-4 h-4"
                        />
                        Unlimited
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {!activeTicket.isFree && (
                        <div>
                          <FieldLabel>Price (₦)</FieldLabel>
                          <input
                            type="number"
                            min={0}
                            value={activeTicket.price}
                            onChange={(e) => updateTicket(activeTicketIndex, { price: e.target.value })}
                            placeholder="5000"
                            className={getInputClass('price')}
                          />
                        </div>
                      )}
                      {!activeTicket.isUnlimited && (
                        <div>
                          <FieldLabel>Quantity</FieldLabel>
                          <input
                            type="number"
                            min={1}
                            value={activeTicket.quantity}
                            onChange={(e) => updateTicket(activeTicketIndex, { quantity: e.target.value })}
                            placeholder="100"
                            className={getInputClass('quantity')}
                          />
                        </div>
                      )}
                      <div>
                        <FieldLabel>Max per person</FieldLabel>
                        <input
                          type="number"
                          min={1}
                          value={activeTicket.maxPerPerson ?? ''}
                          onChange={(e) => updateTicket(activeTicketIndex, { maxPerPerson: e.target.value })}
                          placeholder="5"
                          className={getInputClass()}
                        />
                      </div>
                    </div>

                    {form.tickets.length > 1 && (
                      <button type="button" onClick={() => removeTicket(activeTicketIndex)} className="text-xs text-neutral-400 hover:text-rose-500">
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 min-w-0">
                    <div className="min-w-0 overflow-x-auto">
                      <EventTicketCard
                        key={`preview-${activeTicketIndex}-${activeTicket.ticketStyle}`}
                        compact
                        editable
                        onCopyChange={(patch) => updateTicket(activeTicketIndex, patch)}
                        eventName={form.title || 'Your Event'}
                        eventDate={previewDate}
                        eventTime={form.startTime12}
                        eventLocation={previewLocation}
                        eventImageUrl={coverImageSrc || undefined}
                        ticketType={{
                          name: activeTicket.name,
                          ticketStyle: activeTicket.ticketStyle,
                          accentColor: activeTicket.accentColor || null,
                          badgeText: activeTicket.badgeText,
                          ticketHeadline: activeTicket.ticketHeadline,
                          venueLabel: activeTicket.venueLabel,
                          ticketSublabel: activeTicket.ticketSublabel,
                        }}
                        ticketSerial="PREVIEW"
                      />
                    </div>
                    <div>
                      <FieldLabel>Layout</FieldLabel>
                      <div className="grid grid-cols-5 gap-1">
                        {TICKET_LAYOUTS.map((layout) => {
                          const current = parseTicketStyle(activeTicket.ticketStyle);
                          const selected = current.layout === layout.id;
                          return (
                            <button
                              key={layout.id}
                              type="button"
                              title={layout.description}
                              onClick={() =>
                                updateTicket(activeTicketIndex, {
                                  ticketStyle: encodeTicketStyle(layout.id, current.accent),
                                })
                              }
                              className={cn(
                                'px-1 py-1.5 rounded-lg border text-center transition-colors',
                                selected
                                  ? 'border-rose-500 ring-1 ring-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20'
                                  : 'border-neutral-200 dark:border-neutral-700 hover:border-rose-300'
                              )}
                            >
                              <p className="text-[10px] font-semibold leading-tight truncate">{layout.name}</p>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-2">Click any label on the ticket to type your own words.</p>
                    </div>
                    <div>
                      <FieldLabel>Color</FieldLabel>
                      <div className="flex flex-wrap items-center gap-2">
                        {TICKET_ACCENTS.map((design) => {
                          const current = parseTicketStyle(activeTicket.ticketStyle);
                          const selected = !activeTicket.accentColor && current.accent === design.id;
                          return (
                            <button
                              key={design.id}
                              type="button"
                              title={design.name}
                              onClick={() =>
                                updateTicket(activeTicketIndex, {
                                  ticketStyle: encodeTicketStyle(current.layout, design.id),
                                  accentColor: '',
                                })
                              }
                              className={cn(
                                'h-7 w-7 rounded-full border-2 transition-transform',
                                selected ? 'border-neutral-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'
                              )}
                              style={{ backgroundColor: design.accent }}
                            />
                          );
                        })}
                        <label
                          className={cn(
                            'relative h-7 w-7 rounded-full overflow-hidden border-2 cursor-pointer shrink-0',
                            activeTicket.accentColor ? 'border-neutral-900 dark:border-white scale-110' : 'border-neutral-300 dark:border-neutral-600'
                          )}
                          title="Pick any color"
                        >
                          <input
                            type="color"
                            value={activeTicket.accentColor || getAccentPreset(activeTicket.ticketStyle).accent}
                            onChange={(e) => updateTicket(activeTicketIndex, { accentColor: e.target.value })}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                          <span
                            className="block h-full w-full"
                            style={{
                              background: activeTicket.accentColor
                                ? activeTicket.accentColor
                                : 'conic-gradient(#ef4444, #f59e0b, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)',
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1.5">Use a preset, or tap the rainbow to pick your own.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Vendor stalls</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Optional — let vendors apply for booths at this event</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({
                        ...p,
                        vendorSettings: { ...p.vendorSettings, allowVendors: !p.vendorSettings.allowVendors },
                      }))}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
                        form.vendorSettings.allowVendors ? 'bg-rose-500' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                      aria-label="Allow vendor applications"
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          form.vendorSettings.allowVendors ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {form.vendorSettings.allowVendors && (
                    <VendorSettingsStep
                      settings={form.vendorSettings}
                      onSettingsChange={(vendorSettings) => setForm((p) => ({ ...p, vendorSettings }))}
                    />
                  )}
                </div>

                <StepActions onBack={goBack} onNext={goNext} nextLabel="Review" error={error} onDismissError={clearError} />
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  {coverImageSrc && <img src={coverImageSrc} alt={form.title} className="w-full aspect-[2/1] object-cover" />}
                  <div className="p-5 space-y-3">
                    <h2 className="text-lg font-semibold">{form.title}</h2>
                    <p className="text-sm text-neutral-500">{form.description}</p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateLabel(form.startDate)} {form.startTime12}
                      {form.endDate !== form.startDate && ` → ${formatDateLabel(form.endDate)}`} {form.endTime12}
                    </p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      {form.locationType === 'online' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {form.locationType === 'online' ? form.onlineUrl : form.location}
                    </p>
                    <div className="flex gap-4 text-xs text-neutral-500">
                      <span>Capacity: {hasUnlimitedTickets ? 'Unlimited' : `${ticketQtyTotal} people`}</span>
                      <span>·</span>
                      <span className="font-bold text-rose-500">{form.category}</span>
                    </div>
                    {form.includedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {form.includedItems.map((a) => (
                          <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Ticket types ({form.tickets.length})</h3>
                  {form.tickets.map((t, i) => (
                    <div key={i} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-sm text-neutral-500">
                          {t.isFree ? 'Free' : `₦${Number(t.price).toLocaleString()}`} · {t.isUnlimited ? 'Unlimited' : `${t.quantity} qty`}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">Vendor stalls</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Optional — skip unless you want booth applications</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, vendorSettings: { ...p.vendorSettings, allowVendors: !p.vendorSettings.allowVendors } }))}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
                          form.vendorSettings.allowVendors ? 'bg-rose-500' : 'bg-neutral-300 dark:bg-neutral-700'
                        }`}
                        aria-label="Allow vendor applications"
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            form.vendorSettings.allowVendors ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {form.vendorSettings.allowVendors && (
                      <VendorSettingsStep
                        settings={form.vendorSettings}
                        onSettingsChange={(vendorSettings) => setForm(p => ({ ...p, vendorSettings }))}
                      />
                    )}
                  </div>
                </div>
              </div>

              <StepActions onBack={goBack} backLabel="Back" error={error} onDismissError={clearError}>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" disabled={savingType !== null} onClick={() => saveEvent(false)} className="rounded-full px-3 sm:px-4 text-sm border-rose-200 text-rose-500 hover:bg-rose-50">
                    {savingType === 'draft' ? <Spinner className="h-4 w-4 text-rose-500" /> : (isEditing ? 'Save draft' : 'Save draft')}
                  </Button>
                  <Button disabled={savingType !== null} onClick={() => saveEvent(true)} className="rounded-full px-4 sm:px-5 bg-rose-500 hover:bg-rose-600 text-white border-0 text-sm">
                    {savingType === 'publish' ? <Spinner className="h-4 w-4" /> : (isEditing ? 'Update event' : 'Publish')}
                  </Button>
                </div>
              </StepActions>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Picker Modal */}
      <AnimatePresence>
        {showMapPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Pick Event Location</h2>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>
              <GoogleMapLocationPicker
                onLocationSelect={(location) => {
                  setForm((p) => ({
                    ...p,
                    location: location.address,
                    latitude: location.lat,
                    longitude: location.lng,
                  }));
                  setShowMapPicker(false);
                }}
                initialAddress={form.location || 'Kano, Nigeria'}
                initialLocation={
                  form.latitude != null && form.longitude != null
                    ? { lat: form.latitude, lng: form.longitude }
                    : undefined
                }
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateEvent;
