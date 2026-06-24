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
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Calendar as DateCalendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { api } from '../services/api';
import { EVENT_TEMPLATES, EventTemplate, TicketDraft } from '../data/eventTemplates';
import { TICKET_DESIGNS } from '../data/ticketDesigns';
import { INCLUDED_SUGGESTIONS, TICKET_TYPE_PRESETS } from '../data/eventExtras';
import EventTicketCard from '../components/tickets/EventTicketCard';
import VendorSettingsStep, { VendorSettings } from '../components/organizer/VendorSettingsStep';
import { LocationMap } from '../components/organizer/LocationMap';
import GoogleMapLocationPicker from '../components/organizer/GoogleMapLocationPicker';
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

type Step = 'details' | 'tickets' | 'vendors' | 'review';

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
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'review', label: 'Publish' },
];

const defaultTicket = (): TicketDraft => ({
  name: 'General Admission',
  price: '',
  quantity: '100',
  isFree: false,
  ticketStyle: 'rose',
  badgeText: '',
  accentColor: '',
  ticketHeadline: 'COME AND JOIN',
  venueLabel: 'LIVE AT',
});

const defaultForm = (): FormState => ({
  templateId: '',
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
    approvalMode: 'auto',
    applicationDeadline: 7,
  },
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
    (sum, t, i) => (i === excludeIndex ? sum : sum + parseInt(t.quantity || '0', 10)),
    0
  );
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
  fd.append('capacity', form.capacity);
  fd.append('isPublished', String(isPublished));
  
  // Add latitude/longitude if physical event
  if (form.locationType === 'physical' && form.latitude && form.longitude) {
    fd.append('latitude', String(form.latitude));
    fd.append('longitude', String(form.longitude));
  }
  
  fd.append(
    'ticketTypes',
    JSON.stringify(
      form.tickets.map((t) => ({
        name: t.name,
        price: t.isFree ? 0 : parseFloat(t.price || '0'),
        quantity: parseInt(t.quantity || '0', 10),
        ticketStyle: t.ticketStyle || 'rose',
        badgeText: t.badgeText || null,
        accentColor: t.accentColor || null,
        ticketHeadline: t.ticketHeadline || null,
        venueLabel: t.venueLabel || null,
      }))
    )
  );

  // Add vendor settings if vendors are enabled
  if (form.vendorSettings.allowVendors) {
    fd.append(
      'vendorSettings',
      JSON.stringify({
        allowVendors: true,
        stallTypes: form.vendorSettings.stallTypes,
        allowedRoles: form.vendorSettings.allowedRoles,
        approvalMode: form.vendorSettings.approvalMode,
        applicationDeadline: form.vendorSettings.applicationDeadline,
      })
    );
  }

  if (form.includedItems.length) fd.append('amenities', JSON.stringify(form.includedItems));

  if (form.locationType === 'online') {
    fd.append('onlineUrl', form.onlineUrl);
    fd.append('location', form.onlineUrl);
  } else {
    fd.append('location', form.location);
  }

  const firstPaid = form.tickets.find((t) => !t.isFree);
  if (firstPaid?.price) fd.append('price', firstPaid.price);
  if (image) fd.append('image', image);
  return fd;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
      {children}
    </span>
  );
}

function TimePicker12({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { hour, minute, period } = splitTime12(value);
  const update = (h: string, m: string, p: 'AM' | 'PM') => onChange(joinTime12(h, m, p));
  const selectClass =
    'h-9 bg-transparent text-sm font-medium text-center focus:outline-none cursor-pointer appearance-none';

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 gap-0.5">
        <select
          value={hour}
          onChange={(e) => update(e.target.value, minute, period)}
          className={cn(selectClass, 'w-9')}
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
          className={cn(selectClass, 'w-9')}
          aria-label={`${label} minute`}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => update(hour, minute, e.target.value as 'AM' | 'PM')}
          className={cn(selectClass, 'w-11 text-rose-500 font-semibold')}
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
    <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800">
      {error && (
        <div className="mb-4 flex items-start gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg">
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
          className="text-sm font-medium text-neutral-500 hover:text-rose-500 transition-colors"
        >
          {backLabel}
        </button>
        {children ?? (
          <Button
            onClick={onNext}
            className="rounded-full px-6 bg-rose-500 hover:bg-rose-600 text-white border-0 flex items-center gap-2"
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
  const [eventId, setEventId] = useState<number | null>(id ? Number(id) : null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [customIncluded, setCustomIncluded] = useState('');
  const [showTicketPresets, setShowTicketPresets] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const isEditing = !!id;
  const capacityNum = parseInt(form.capacity || '0', 10);

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
        const { data: event } = await api.events.getByIdAuth(Number(id));
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        const amenities = parseJsonField<string[]>(event.amenities, []);
        const highlights = parseJsonField<Array<{ label: string }>>(event.highlights, []);
        const included = [...amenities, ...highlights.map((h) => h.label)].filter(
          (v, i, a) => a.indexOf(v) === i
        );

        setForm({
          templateId: 'custom',
          title: event.title || '',
          description: event.description || '',
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          startTime12: formatTime12(start),
          endTime12: formatTime12(end),
          locationType: event.locationType === 'online' ? 'online' : 'physical',
          location: event.location || '',
          latitude: event.latitude,
          longitude: event.longitude,
          onlineUrl: event.onlineUrl || '',
          capacity: event.capacity ? String(event.capacity) : '',
          tickets: event.ticketTypes?.length
            ? event.ticketTypes.map((t: {
                name: string;
                price: number;
                quantity: number;
                ticketStyle?: string;
                badgeText?: string;
                accentColor?: string;
                ticketHeadline?: string;
                venueLabel?: string;
              }) => ({
                name: t.name,
                price: String(t.price),
                quantity: String(t.quantity),
                isFree: t.price === 0,
                ticketStyle: t.ticketStyle || 'rose',
                badgeText: t.badgeText || '',
                accentColor: t.accentColor || '',
                ticketHeadline: t.ticketHeadline || 'COME AND JOIN',
                venueLabel: t.venueLabel || 'LIVE AT',
              }))
            : [defaultTicket()],
          imageUrl: event.imageUrl || '',
          includedItems: included,
          vendorSettings: event.vendorSettings || {
            allowVendors: false,
            stallTypes: [],
            allowedRoles: [],
            approvalMode: 'auto',
            applicationDeadline: 7,
          },
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
      tickets: template.tickets.map((t) => ({ ...t })),
      imageUrl: template.image,
      includedItems: template.amenities ? [...template.amenities] : [],
      vendorSettings: {
        allowVendors: false,
        stallTypes: [],
        allowedRoles: [],
        approvalMode: 'auto',
        applicationDeadline: 7,
      },
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

  const updateTicketQuantity = (index: number, raw: string) => {
    const qty = parseInt(raw || '0', 10);
    if (!raw) {
      updateTicket(index, { quantity: raw });
      return;
    }
    const otherTotal = totalTicketQuantity(form.tickets, index);
    const maxAllowed = Math.max(1, capacityNum - otherTotal);
    const capped = capacityNum > 0 ? Math.min(qty, maxAllowed) : qty;
    updateTicket(index, { quantity: String(capped) });
  };

  const addTicketFromPreset = (preset: (typeof TICKET_TYPE_PRESETS)[number]) => {
    const exists = form.tickets.some((t) => t.name === preset.name);
    if (exists) {
      setActiveTicketIndex(form.tickets.findIndex((t) => t.name === preset.name));
      setShowTicketPresets(false);
      return;
    }
    const otherTotal = totalTicketQuantity(form.tickets);
    const remaining = capacityNum > 0 ? Math.max(1, capacityNum - otherTotal) : 50;
    setForm((prev) => ({
      ...prev,
      tickets: [
        ...prev.tickets,
        {
          name: preset.name,
          price: preset.suggestedPrice || '',
          quantity: String(Math.min(50, remaining)),
          isFree: preset.isFree ?? false,
          ticketStyle: preset.ticketStyle,
          badgeText: preset.badgeText,
          accentColor: '',
          ticketHeadline: preset.ticketHeadline || 'COME AND JOIN',
          venueLabel: preset.venueLabel || 'LIVE AT',
        },
      ],
    }));
    setActiveTicketIndex(form.tickets.length);
    setShowTicketPresets(false);
  };

  const addBlankTicket = () => {
    const otherTotal = totalTicketQuantity(form.tickets);
    const remaining = capacityNum > 0 ? Math.max(1, capacityNum - otherTotal) : 50;
    setForm((prev) => ({
      ...prev,
      tickets: [
        ...prev.tickets,
        { ...defaultTicket(), quantity: String(Math.min(50, remaining)) },
      ],
    }));
    setActiveTicketIndex(form.tickets.length);
    setShowTicketPresets(false);
  };

  const removeTicket = (index: number) => {
    if (form.tickets.length <= 1) return;
    setForm((prev) => ({ ...prev, tickets: prev.tickets.filter((_, i) => i !== index) }));
    setActiveTicketIndex((i) => Math.max(0, i - 1));
  };

  const previewDate = form.startDate ? `${form.startDate}T12:00:00` : new Date().toISOString();
  const previewLocation = form.locationType === 'online' ? 'Online Event' : form.location || 'Venue TBA';
  const activeTicket = form.tickets[activeTicketIndex] ?? form.tickets[0];
  const ticketQtyTotal = totalTicketQuantity(form.tickets);
  const remainingCapacity = capacityNum > 0 ? capacityNum - ticketQtyTotal : null;

  const validateDetails = (): string | null => {
    if (!isEditing && !form.templateId) return 'Choose a template to get started.';
    if (form.title.trim().length < 3) return 'Title must be at least 3 characters.';
    if (form.description.trim().length < 10) return 'Description must be at least 10 characters.';
    if (!form.startDate) return 'Select a start date.';
    if (!form.endDate) return 'Select an end date.';
    if (!form.startTime12 || !form.endTime12) return 'Set start and end times.';
    const start = combineDateAndTime12(form.startDate, form.startTime12);
    const end = combineDateAndTime12(form.endDate, form.endTime12);
    if (!start || !end) return 'Enter valid times.';
    if (end <= start) return 'End date and time must be after the start.';
    if (form.locationType === 'physical' && !form.location.trim()) return 'Enter a venue or address.';
    if (form.locationType === 'online' && !form.onlineUrl.trim()) return 'Enter your meeting link.';
    if (!form.capacity || capacityNum < 1) return 'Set how many people can attend.';
    if (!coverImageSrc && !imageFile) return 'Add a cover photo.';
    return null;
  };

  const validateTickets = (): string | null => {
    for (const t of form.tickets) {
      if (!t.name.trim()) return 'Each ticket needs a name.';
      if (!t.isFree && (!t.price || Number(t.price) < 0)) return 'Enter a valid price.';
      if (!t.quantity || Number(t.quantity) < 1) return 'Each ticket needs a quantity.';
    }
    if (capacityNum > 0 && ticketQtyTotal > capacityNum) {
      return `Total tickets (${ticketQtyTotal}) cannot exceed capacity (${capacityNum}).`;
    }
    return null;
  };

  const validateStep = (): string | null => {
    if (step === 'details') return validateDetails();
    if (step === 'tickets') return validateTickets();
    return null;
  };

  const validateAll = (): string | null => validateDetails() ?? validateTickets();

  const saveEvent = async (isPublished: boolean) => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
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
      setSaving(false);
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
    else if (step === 'tickets') setStep('vendors');
    else if (step === 'vendors') setStep('review');
    // Scroll the main scrollable container (or window) to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError(null);
    if (step === 'details') navigate('/organizer/events');
    else if (step === 'tickets') setStep('details');
    else if (step === 'vendors') setStep('tickets');
    else if (step === 'review') setStep('vendors');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500';

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
    <div className="pb-6 md:pb-6 sm:px-2">
      {/* ── Page header — sticky on mobile, part of normal flow on desktop ── */}
      <div className="sticky top-0 z-20 bg-white/97 dark:bg-gray-900/97 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0 md:static md:bg-transparent md:dark:bg-transparent md:border-0 md:px-0 md:pt-0 md:pb-4 md:backdrop-blur-none mb-3">
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
            <h1 className="text-sm font-extrabold text-neutral-900 dark:text-white leading-tight truncate md:text-xl md:font-bold">
              {isEditing ? 'Edit event' : 'Create event'}
            </h1>
            <p className="text-[10px] md:text-sm text-neutral-500 dark:text-neutral-400 leading-none mt-0.5 truncate">
              {STEPS[stepIndex]?.label}
            </p>
          </div>
        </div>

        {/* Right: step progress dots + close */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i <= stepIndex
                    ? 'w-6 md:w-8 bg-rose-500'
                    : 'w-3 md:w-4 bg-neutral-200 dark:bg-neutral-700'
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/organizer/events')}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-0">
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                {!isEditing && (
                  <div className="lg:col-span-2">
                    {/* ── Mobile: collapsed pill after selection, expanded grid before ── */}
                    {/* Desktop: always show the sticky sidebar grid */}

                    {/* Mobile collapsed state — show after a template is chosen */}
                    {form.templateId && (
                      <div className="lg:hidden flex items-center justify-between gap-3 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 mb-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={EVENT_TEMPLATES.find(t => t.id === form.templateId)?.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 truncate">
                              {EVENT_TEMPLATES.find(t => t.id === form.templateId)?.name}
                            </p>
                            <p className="text-[10px] text-neutral-500">Template selected</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, templateId: '' }))}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-700 shrink-0 underline"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    {/* Template grid — always on desktop, only before selection on mobile */}
                    <div className={cn(
                      'lg:sticky lg:top-4',
                      form.templateId ? 'hidden lg:block' : 'block'
                    )}>
                      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Choose a template</h2>
                      <p className="text-xs text-neutral-500 mt-1 mb-3">
                        These are all the templates available right now.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {EVENT_TEMPLATES.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => applyTemplate(template)}
                            className={cn(
                              'text-left rounded-xl overflow-hidden border transition-all',
                              form.templateId === template.id
                                ? 'border-rose-500 ring-2 ring-rose-500/30'
                                : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300'
                            )}
                          >
                            <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-800">
                              <img
                                src={template.image}
                                alt={template.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';
                                }}
                              />
                              {form.templateId === template.id && (
                                <div className="absolute top-2 right-2 h-5 w-5 bg-rose-500 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="p-2.5">
                              <p className="text-sm font-medium">{template.name}</p>
                              <p className="text-[10px] text-neutral-500 mt-0.5">{template.tagline}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className={cn('space-y-5', !isEditing ? 'lg:col-span-3' : 'lg:col-span-5')}>
                  <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Event details</h2>

                  <div>
                    <FieldLabel>Cover photo</FieldLabel>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileRef.current?.click()}
                      onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                      className="relative aspect-[2/1] rounded-xl overflow-hidden border border-dashed border-neutral-300 dark:border-neutral-700 cursor-pointer group hover:border-rose-400 transition-colors"
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Upload className="h-5 w-5 text-white" />
                            <span className="text-sm font-medium text-white">Change cover</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-1 text-neutral-400">
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-xs">Upload cover photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Event title</FieldLabel>
                      <input
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Summer Music Festival"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <FieldLabel>Capacity (max attendees)</FieldLabel>
                      <input
                        type="number"
                        min={1}
                        value={form.capacity}
                        onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                        placeholder="e.g. 200"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Tell guests what to expect..."
                      rows={3}
                      className={cn(inputClass, 'resize-none')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Start date</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className={cn(inputClass, 'text-left')}>
                            {formatDateLabel(form.startDate)}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DateCalendar
                            mode="single"
                            selected={form.startDate ? new Date(form.startDate + 'T12:00:00') : undefined}
                            onSelect={(d) => {
                              if (!d) return;
                              const dateStr = d.toISOString().split('T')[0];
                              setForm((p) => ({
                                ...p,
                                startDate: dateStr,
                                endDate: !p.endDate || p.endDate < dateStr ? dateStr : p.endDate,
                              }));
                            }}
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <FieldLabel>End date</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className={cn(inputClass, 'text-left')}>
                            {formatDateLabel(form.endDate)}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DateCalendar
                            mode="single"
                            selected={form.endDate ? new Date(form.endDate + 'T12:00:00') : undefined}
                            onSelect={(d) => d && setForm((p) => ({ ...p, endDate: d.toISOString().split('T')[0] }))}
                            disabled={(d) => {
                              const min = form.startDate ? new Date(form.startDate + 'T00:00:00') : new Date(new Date().setHours(0, 0, 0, 0));
                              return d < min;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                    <TimePicker12
                      label="Start time"
                      value={form.startTime12}
                      onChange={(v) => setForm((p) => ({ ...p, startTime12: v }))}
                      
                    />
                    <TimePicker12
                      label="End time"
                      value={form.endTime12}
                      onChange={(v) => setForm((p) => ({ ...p, endTime12: v }))}
                    />
                  </div>

                  <div>
                    <FieldLabel>Event type</FieldLabel>
                    <div className="flex gap-2">
                      {(['physical', 'online'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, locationType: type }))}
                          className={cn(
                            'flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all',
                            form.locationType === type
                              ? 'border-rose-500 bg-rose-500 text-white'
                              : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:border-rose-300'
                          )}
                        >
                          {type === 'physical' ? <><MapPin className="h-3 w-3 inline mr-1" />In person</> : <><Globe className="h-3 w-3 inline mr-1" />Online</>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>{form.locationType === 'physical' ? 'Venue or address' : 'Meeting link'}</FieldLabel>
                    {form.locationType === 'physical' ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. 12 Admiralty Way, Lekki" className={cn(inputClass, 'flex-1')} />
                          <button
                            type="button"
                            onClick={() => setShowMapPicker(true)}
                            className="px-4 py-2.5 bg-rose-500 text-white rounded-lg font-semibold text-sm hover:bg-rose-600 transition-colors flex items-center gap-2 shrink-0"
                          >
                            <MapPin className="h-4 w-4" />
                            Pick Location
                          </button>
                        </div>
                        {/* {form.latitude && form.longitude && (
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg">
                            <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">
                              ✓ Coordinates saved: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                            </p>
                          </div>
                        )}
                        <LocationMap 
                          location={form.location} 
                          onLocationChange={(location) => setForm((p) => ({ ...p, location }))}
                        /> */}
                      </div>
                    ) : (
                      <input value={form.onlineUrl} onChange={(e) => setForm((p) => ({ ...p, onlineUrl: e.target.value }))} placeholder="e.g. https://zoom.us/j/..." className={inputClass} />
                    )}
                  </div>

                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
                    <FieldLabel>What&apos;s included</FieldLabel>
                    <p className="text-xs text-neutral-500 -mt-1">Pick suggestions or type your own below</p>
                    <div className="flex flex-wrap gap-1.5">
                      {includedChipOptions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleIncluded(item)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs border transition-colors',
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
                        placeholder="Type a custom item and press Enter..."
                        className={cn(inputClass, 'flex-1')}
                      />
                      <Button type="button" variant="outline" onClick={addCustomIncluded} className="rounded-lg shrink-0 border-rose-200 text-rose-500 hover:bg-rose-50">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <StepActions onBack={() => navigate('/organizer/events')} onNext={goNext} backLabel="Cancel" error={error} onDismissError={clearError} />
            </motion.div>
          )}

          {step === 'tickets' && activeTicket && (
            <motion.div key="tickets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Ticket types</h2>
                    {capacityNum > 0 && (
                      <span className="text-xs text-neutral-500">
                        {ticketQtyTotal} / {capacityNum} seats used
                        {remainingCapacity !== null && remainingCapacity > 0 && ` · ${remainingCapacity} left`}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {form.tickets.map((ticket, i) => (
                      <button
                        key={`${ticket.name}-${i}`}
                        type="button"
                        onClick={() => setActiveTicketIndex(i)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                          activeTicketIndex === i ? selectedChipClass : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:border-rose-300'
                        )}
                      >
                        {ticket.name || `Ticket ${i + 1}`}
                        <span className="ml-1 opacity-70">({TICKET_DESIGNS.find((d) => d.id === ticket.ticketStyle)?.name})</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowTicketPresets(!showTicketPresets)}
                      className="px-3 py-1.5 rounded-full text-xs text-rose-500 border border-dashed border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add ticket
                    </button>
                  </div>

                  {showTicketPresets && (
                    <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-3">
                      <p className="text-xs font-medium text-neutral-600">Choose a ticket type</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TICKET_TYPE_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => addTicketFromPreset(preset)}
                            className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                          >
                            {preset.name}
                          </button>
                        ))}
                        <button type="button" onClick={addBlankTicket} className="px-3 py-2 rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-500 hover:border-rose-300">
                          Custom
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <FieldLabel>Ticket name</FieldLabel>
                      <input value={activeTicket.name} onChange={(e) => updateTicket(activeTicketIndex, { name: e.target.value })} placeholder="e.g. VIP" className={inputClass} />
                    </div>
                    <div className="flex gap-3 items-end flex-wrap">
                      <label className="flex items-center gap-2 text-xs pb-2.5 shrink-0">
                        <input type="checkbox" checked={activeTicket.isFree} onChange={(e) => updateTicket(activeTicketIndex, { isFree: e.target.checked })} className="rounded accent-rose-500" />
                        Free ticket
                      </label>
                      {!activeTicket.isFree && (
                        <div className="flex-1 min-w-[120px]">
                          <FieldLabel>Price (₦)</FieldLabel>
                          <input type="number" min={0} value={activeTicket.price} onChange={(e) => updateTicket(activeTicketIndex, { price: e.target.value })} placeholder="5000" className={inputClass} />
                        </div>
                      )}
                      <div className="flex-1 min-w-[100px]">
                        <FieldLabel>Quantity available</FieldLabel>
                        <input
                          type="number"
                          min={1}
                          max={capacityNum > 0 ? capacityNum - totalTicketQuantity(form.tickets, activeTicketIndex) + parseInt(activeTicket.quantity || '0', 10) : undefined}
                          value={activeTicket.quantity}
                          onChange={(e) => updateTicketQuantity(activeTicketIndex, e.target.value)}
                          placeholder="100"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Stub badge label</FieldLabel>
                      <input value={activeTicket.badgeText} onChange={(e) => updateTicket(activeTicketIndex, { badgeText: e.target.value })} placeholder="e.g. VIP ACCESS" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Ticket headline</FieldLabel>
                        <input value={activeTicket.ticketHeadline} onChange={(e) => updateTicket(activeTicketIndex, { ticketHeadline: e.target.value })} placeholder="COME AND JOIN" className={inputClass} />
                      </div>
                      <div>
                        <FieldLabel>Venue label</FieldLabel>
                        <input value={activeTicket.venueLabel} onChange={(e) => updateTicket(activeTicketIndex, { venueLabel: e.target.value })} placeholder="LIVE AT" className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Ticket design (per type)</FieldLabel>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {TICKET_DESIGNS.map((design) => (
                          <button
                            key={design.id}
                            type="button"
                            onClick={() => updateTicket(activeTicketIndex, { ticketStyle: design.id, accentColor: '' })}
                            className={cn(
                              'p-2 rounded-lg border text-left transition-colors',
                              activeTicket.ticketStyle === design.id
                                ? 'border-rose-500 ring-1 ring-rose-500/30'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-rose-300'
                            )}
                          >
                            <div className="w-full h-4 rounded mb-1" style={{ backgroundColor: design.accent }} />
                            <span className="text-[10px] font-medium">{design.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.tickets.length > 1 && (
                      <button type="button" onClick={() => removeTicket(activeTicketIndex)} className="text-xs text-rose-500 hover:text-rose-600">
                        Remove this ticket type
                      </button>
                    )}
                  </div>
                </div>

                <div className="lg:sticky lg:top-4 lg:self-start">
                  <p className="text-xs font-medium text-neutral-500 mb-3">Preview — {activeTicket.name || 'Ticket'}</p>
                  <EventTicketCard
                    key={`preview-${activeTicketIndex}-${activeTicket.ticketStyle}`}
                    compact
                    eventName={form.title || 'Your Event'}
                    eventDate={previewDate}
                    eventTime={form.startTime12}
                    eventLocation={previewLocation}
                    eventImageUrl={coverImageSrc || undefined}
                    ticketType={{
                      name: activeTicket.name,
                      ticketStyle: activeTicket.ticketStyle,
                      accentColor: activeTicket.accentColor || null,
                      badgeText: activeTicket.badgeText || activeTicket.name,
                      ticketHeadline: activeTicket.ticketHeadline,
                      venueLabel: activeTicket.venueLabel,
                    }}
                    ticketSerial="PREVIEW"
                  />
                </div>
              </div>

              <StepActions onBack={goBack} onNext={goNext} error={error} onDismissError={clearError} />
            </motion.div>
          )}

          {step === 'vendors' && (
            <motion.div key="vendors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-2xl">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Vendor Settings</h2>
                <p className="text-xs text-neutral-500 mb-6">
                  Allow vendors to apply for booth spaces at your event with customizable stall types and pricing.
                </p>

                {/* Allow Vendors Toggle */}
                <div className="mb-6 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-neutral-900 dark:text-white">Allow Vendor Applications</p>
                    <p className="text-xs text-neutral-500 mt-1">Enable vendors to apply for booth spaces</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, vendorSettings: { ...p.vendorSettings, allowVendors: !p.vendorSettings.allowVendors } }))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      form.vendorSettings.allowVendors ? 'bg-rose-500' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        form.vendorSettings.allowVendors ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Vendor Settings Form */}
                {form.vendorSettings.allowVendors && (
                  <VendorSettingsStep
                    settings={form.vendorSettings}
                    onSettingsChange={(vendorSettings) => setForm(p => ({ ...p, vendorSettings }))}
                  />
                )}
              </div>

              <StepActions onBack={goBack} onNext={goNext} error={error} onDismissError={clearError} />
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                    <p className="text-xs text-neutral-500">Capacity: {form.capacity} people</p>
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
                    <div key={i} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-sm text-neutral-500">
                          {t.isFree ? 'Free' : `₦${Number(t.price).toLocaleString()}`} · {t.quantity} qty
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400">
                        Design: {TICKET_DESIGNS.find((d) => d.id === t.ticketStyle)?.name} · {t.ticketHeadline} / {t.venueLabel}
                      </p>
                    </div>
                  ))}

                  {/* Vendor Settings Summary */}
                  {form.vendorSettings.allowVendors && (
                    <>
                      <h3 className="text-sm font-semibold mt-6">Vendor Settings</h3>
                      <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Stall Types</span>
                          <span className="text-sm text-neutral-500">{form.vendorSettings.stallTypes.length} types</span>
                        </div>
                        {form.vendorSettings.stallTypes.map((stall) => (
                          <div key={stall.id} className="text-xs text-neutral-600 pl-3">
                            {stall.name}: ₦{stall.price.toLocaleString()} · {stall.maxStalls} max stalls
                          </div>
                        ))}
                        <div className="text-xs text-neutral-600 pt-1">
                          Roles: {form.vendorSettings.allowedRoles.join(', ') || 'None selected'}
                        </div>
                        <div className="text-xs text-neutral-600">
                          Approval: {form.vendorSettings.approvalMode === 'auto' ? 'Auto-approve' : form.vendorSettings.approvalMode === 'manual' ? 'Manual review' : 'Vetted only'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <StepActions onBack={goBack} backLabel="Back" error={error} onDismissError={clearError}>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={saving} onClick={() => saveEvent(false)} className="rounded-full px-4 text-sm border-rose-200 text-rose-500 hover:bg-rose-50">
                    Save draft
                  </Button>
                  <Button disabled={saving} onClick={() => saveEvent(true)} className="rounded-full px-5 bg-rose-500 hover:bg-rose-600 text-white border-0 text-sm">
                    {saving ? <Spinner className="h-4 w-4" /> : 'Publish'}
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
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateEvent;
