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
  getLayoutPreset,
  getAccentPreset,
  parseTicketStyle,
  suggestTicketDesign,
  isDefaultTicketStyle,
} from '../data/ticketDesigns';
import { INCLUDED_SUGGESTIONS, TICKET_TYPE_PRESETS } from '../data/eventExtras';
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
  category: string;
}

const STEPS: { key: Step; label: string; description: string }[] = [
  { key: 'details', label: 'Details', description: 'Basic info & venue' },
  { key: 'tickets', label: 'Tickets', description: 'Pricing & tiers' },
  { key: 'vendors', label: 'Vendors', description: 'Stalls & applications' },
  { key: 'review', label: 'Publish', description: 'Review & go live' },
];

const defaultTicket = (): TicketDraft => ({
  name: 'General Admission',
  price: '',
  quantity: '100',
  isFree: false,
  ticketStyle: encodeTicketStyle('classic', 'rose'),
  badgeText: '',
  accentColor: '',
  ticketHeadline: 'COME AND JOIN',
  venueLabel: 'LIVE AT',
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
    approvalMode: 'auto',
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
  fd.append('category', form.category);
  
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
        maxPerPerson: t.maxPerPerson ? parseInt(t.maxPerPerson, 10) : 5,
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
  hasError,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const { hour, minute, period } = splitTime12(value);
  const update = (h: string, m: string, p: 'AM' | 'PM') => onChange(joinTime12(h, m, p));
  const selectClass =
    'h-9 bg-transparent text-sm font-medium text-center focus:outline-none cursor-pointer appearance-none';

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className={cn(
        "inline-flex items-center rounded-lg border bg-white dark:bg-neutral-900 px-2 py-1 gap-0.5 transition-colors",
        hasError 
          ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20" 
          : "border-neutral-200 dark:border-neutral-700"
      )}>
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
    <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800 sticky bottom-0 md:bottom-0 z-10 -mx-4 px-4 pb-3 md:mx-0 md:px-0 md:pb-0 md:static bg-white/95 dark:bg-gray-900/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
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
  const [showTicketPresets, setShowTicketPresets] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showTemplateGrid, setShowTemplateGrid] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const isEditing = !!id;
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
        const approvalRaw = vs?.approvalMode || event.vendorApprovalMode || 'auto';
        const approvalMode =
          approvalRaw === 'manual' || approvalRaw === 'vetted' ? approvalRaw : 'auto';

        setForm({
          templateId: 'custom',
          title: event.title || '',
          description: event.description || '',
          startDate: toLocalDateInput(start),
          endDate: toLocalDateInput(end),
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
                maxPerPerson?: number | null;
              }) => ({
                name: t.name,
                price: String(t.price ?? 0),
                quantity: t.quantity != null ? String(t.quantity) : capacityFallback,
                isFree: Number(t.price) === 0,
                ticketStyle: t.ticketStyle || encodeTicketStyle('classic', 'rose'),
                badgeText: t.badgeText || '',
                accentColor: t.accentColor || '',
                ticketHeadline: t.ticketHeadline || 'COME AND JOIN',
                venueLabel: t.venueLabel || 'LIVE AT',
                maxPerPerson:
                  t.maxPerPerson != null ? String(t.maxPerPerson) : '5',
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
        return { ...t, ticketStyle: styleId, accentColor: '' };
      }),
      imageUrl: template.image,
      includedItems: template.amenities ? [...template.amenities] : [],
      vendorSettings: template.vendorSettings
        ? { ...template.vendorSettings }
        : {
            allowVendors: false,
            stallTypes: [],
            allowedRoles: [],
            approvalMode: 'auto',
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

  const updateTicketQuantity = (index: number, raw: string) => {
    updateTicket(index, { quantity: raw });
  };

  const addTicketFromPreset = (preset: (typeof TICKET_TYPE_PRESETS)[number]) => {
    const exists = form.tickets.some((t) => t.name === preset.name);
    if (exists) {
      setActiveTicketIndex(form.tickets.findIndex((t) => t.name === preset.name));
      setShowTicketPresets(false);
      return;
    }
    setForm((prev) => ({
      ...prev,
      tickets: [
        ...prev.tickets,
        {
          name: preset.name,
          price: preset.suggestedPrice || '',
          quantity: '100',
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
    setForm((prev) => ({
      ...prev,
      tickets: [
        ...prev.tickets,
        { ...defaultTicket(), quantity: '100' },
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

  const validateDetails = (): string | null => {
    if (!isEditing && !form.templateId) return 'Choose a template to get started.';
    if (form.title.trim().length < 3) return 'Title must be at least 3 characters.';
    if (!form.category) return 'Please select an event category.';
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
    if (!coverImageSrc && !imageFile && !form.imageUrl) return 'Add a cover photo.';
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
    if (step === 'vendors') return validateVendors();
    return null;
  };

  const validateStepKey = (key: Step): string | null => {
    if (key === 'details') return validateDetails();
    if (key === 'tickets') return validateTickets();
    if (key === 'vendors') return validateVendors();
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
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
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
            <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="space-y-6">
              <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-2xs space-y-6">
                {/* ── Top-Positioned Template Selector ── */}
                {!isEditing && (
                  <div className="pb-5 border-b border-neutral-100 dark:border-neutral-800">
                    {form.templateId && form.templateId !== 'custom' && !showTemplateGrid ? (
                      /* Collapsed State when Template Chosen */
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700">
                            {EVENT_TEMPLATES.find((t) => t.id === form.templateId)?.image ? (
                              <img
                                src={EVENT_TEMPLATES.find((t) => t.id === form.templateId)?.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-rose-500" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                                {EVENT_TEMPLATES.find((t) => t.id === form.templateId)?.name}
                              </p>
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-full px-2 py-0.5">
                                Template applied
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {EVENT_TEMPLATES.find((t) => t.id === form.templateId)?.tagline}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowTemplateGrid(true)}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 px-3 py-1.5 rounded-full transition-colors shrink-0 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      /* Expanded Horizontal Scrollable Carousel */
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div>
                            <h2 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">Choose a template</h2>
                            <p className="text-[11px] text-neutral-500">Swipe or scroll horizontally to pick a pre-designed template or start blank.</p>
                          </div>
                          {form.templateId && form.templateId !== 'custom' && (
                            <button
                              type="button"
                              onClick={() => setShowTemplateGrid(false)}
                              className="text-xs font-bold text-neutral-500 hover:text-rose-500 cursor-pointer"
                            >
                              Collapse
                            </button>
                          )}
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
                    )}
                  </div>
                )}

                {/* Event Basic Details */}
                <div>
                  <FieldLabel>Cover photo</FieldLabel>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                    className="relative aspect-[16/9] sm:aspect-[2.5/1] rounded-xl overflow-hidden border border-dashed border-neutral-300 dark:border-neutral-700 cursor-pointer group hover:border-rose-400 transition-colors"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Event title</FieldLabel>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Summer Music Festival"
                      className={getInputClass('title')}
                    />
                  </div>
                  <div>
                    <FieldLabel>Category</FieldLabel>
                    <select
                      value={form.category}
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
                      <option value="">Select a category</option>
                      {['Music', 'Festival', 'Nightlife', 'Wedding', 'Food', 'Business', 'Technology', 'Conference', 'Arts', 'Sports', 'Wellness', 'Fairs', 'Other'].map(c => (
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
                  <div>
                    <FieldLabel>Start date</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className={cn(getInputClass('start date'), 'text-left')}>
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
                        <button type="button" className={cn(getInputClass('end date'), 'text-left')}>
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
                    hasError={hasError('time') || hasError('after the start')}
                  />
                  <TimePicker12
                    label="End time"
                    value={form.endTime12}
                    onChange={(v) => setForm((p) => ({ ...p, endTime12: v }))}
                    hasError={hasError('time') || hasError('after the start')}
                  />
                </div>

                <div>
                  <FieldLabel>Event type</FieldLabel>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, locationType: 'physical' }))}
                      className={cn(
                        'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                        form.locationType === 'physical' ? selectedChipClass : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                      )}
                    >
                      <MapPin className="h-4 w-4" /> Physical venue
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, locationType: 'online' }))}
                      className={cn(
                        'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                        form.locationType === 'online' ? selectedChipClass : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                      )}
                    >
                      <Globe className="h-4 w-4" /> Online event
                    </button>
                  </div>
                </div>

                <div>
                  <FieldLabel>{form.locationType === 'physical' ? 'Venue or address' : 'Meeting link'}</FieldLabel>
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
                      className={getInputClass('location')}
                    />
                    {form.latitude != null && form.longitude != null && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
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
                      placeholder="e.g. https://zoom.us/j/... or https://youtube.com/live/..."
                      className={getInputClass('link')}
                    />
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <FieldLabel>What&apos;s included</FieldLabel>
                  <p className="text-xs text-neutral-500 -mt-2">Pick suggestions or add custom features</p>
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
                      placeholder="Type a custom item and press Enter..."
                      className={cn(getInputClass(), 'flex-1')}
                    />
                    <Button type="button" variant="outline" onClick={addCustomIncluded} className="rounded-lg shrink-0 border-rose-200 text-rose-500 hover:bg-rose-50">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <StepActions onBack={() => navigate('/organizer/events')} onNext={goNext} backLabel="Cancel" error={error} onDismissError={clearError} />
            </motion.div>
          )}

          {step === 'tickets' && activeTicket && (
            <motion.div key="tickets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
                <div className="space-y-5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Ticket types</h2>
                    <span className="text-xs text-neutral-500 font-medium">
                      {hasUnlimitedTickets ? 'Unlimited capacity' : `${ticketQtyTotal} total tickets`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
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
                        <span className="ml-1 opacity-70">
                          ({getLayoutPreset(ticket.ticketStyle).name} · {getAccentPreset(ticket.ticketStyle).name})
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowTicketPresets(!showTicketPresets)}
                      className="px-3 py-1.5 rounded-full text-xs text-rose-500 border border-dashed border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1 cursor-pointer"
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
                            className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                          >
                            {preset.name}
                          </button>
                        ))}
                        <button type="button" onClick={addBlankTicket} className="px-3 py-2 rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-500 hover:border-rose-300 cursor-pointer">
                          Custom
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <FieldLabel>Ticket name</FieldLabel>
                      <input value={activeTicket.name} onChange={(e) => updateTicket(activeTicketIndex, { name: e.target.value })} placeholder="e.g. VIP" className={getInputClass('ticket needs a name')} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeTicket.isFree}
                            onChange={(e) => updateTicket(activeTicketIndex, { isFree: e.target.checked })}
                            className="rounded accent-rose-500 w-4 h-4"
                          />
                          Free ticket
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeTicket.isUnlimited ?? false}
                            onChange={(e) => updateTicket(activeTicketIndex, { isUnlimited: e.target.checked, quantity: e.target.checked ? '' : (activeTicket.quantity || '100') })}
                            className="rounded accent-rose-500 w-4 h-4"
                          />
                          Unlimited quantity
                        </label>
                      </div>

                      <div className="flex gap-3 items-end flex-wrap">
                        {!activeTicket.isFree && (
                          <div className="flex-1 min-w-[130px]">
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
                          <div className="flex-1 min-w-[130px]">
                            <FieldLabel>Quantity available</FieldLabel>
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
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Max tickets per person</FieldLabel>
                        <input
                          type="number"
                          min={1}
                          value={activeTicket.maxPerPerson || '5'}
                          onChange={(e) => updateTicket(activeTicketIndex, { maxPerPerson: e.target.value })}
                          placeholder="5"
                          className={getInputClass()}
                        />
                      </div>
                      <div>
                        <FieldLabel>Stub badge label</FieldLabel>
                        <input value={activeTicket.badgeText} onChange={(e) => updateTicket(activeTicketIndex, { badgeText: e.target.value })} placeholder="e.g. VIP ACCESS" className={getInputClass()} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>Ticket headline</FieldLabel>
                        <input value={activeTicket.ticketHeadline} onChange={(e) => updateTicket(activeTicketIndex, { ticketHeadline: e.target.value })} placeholder="COME AND JOIN" className={getInputClass()} />
                      </div>
                      <div>
                        <FieldLabel>Venue label</FieldLabel>
                        <input value={activeTicket.venueLabel} onChange={(e) => updateTicket(activeTicketIndex, { venueLabel: e.target.value })} placeholder="LIVE AT" className={getInputClass()} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <FieldLabel>Ticket layout</FieldLabel>
                        {form.category && (
                          <p className="text-[10px] text-neutral-500 mb-2">
                            Suggested for {form.category}: {suggestTicketDesign(form.category).reason}
                          </p>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          {TICKET_LAYOUTS.map((layout) => {
                            const current = parseTicketStyle(activeTicket.ticketStyle);
                            const selected = current.layout === layout.id;
                            return (
                              <button
                                key={layout.id}
                                type="button"
                                onClick={() =>
                                  updateTicket(activeTicketIndex, {
                                    ticketStyle: encodeTicketStyle(layout.id, current.accent),
                                    accentColor: '',
                                  })
                                }
                                className={cn(
                                  'p-2.5 rounded-lg border text-left transition-colors',
                                  selected
                                    ? 'border-rose-500 ring-1 ring-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20'
                                    : 'border-neutral-200 dark:border-neutral-700 hover:border-rose-300'
                                )}
                              >
                                <p className="text-[11px] font-semibold leading-tight">{layout.name}</p>
                                <p className="text-[9px] text-neutral-500 mt-0.5 leading-tight">{layout.description}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Accent color</FieldLabel>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {TICKET_ACCENTS.map((design) => {
                            const current = parseTicketStyle(activeTicket.ticketStyle);
                            const selected = current.accent === design.id;
                            return (
                              <button
                                key={design.id}
                                type="button"
                                onClick={() =>
                                  updateTicket(activeTicketIndex, {
                                    ticketStyle: encodeTicketStyle(current.layout, design.id),
                                    accentColor: '',
                                  })
                                }
                                className={cn(
                                  'p-2 rounded-lg border text-left transition-colors',
                                  selected
                                    ? 'border-rose-500 ring-1 ring-rose-500/30'
                                    : 'border-neutral-200 dark:border-neutral-700 hover:border-rose-300'
                                )}
                              >
                                <div className="w-full h-4 rounded mb-1" style={{ backgroundColor: design.accent }} />
                                <span className="text-[10px] font-medium">{design.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {form.tickets.length > 1 && (
                      <button type="button" onClick={() => removeTicket(activeTicketIndex)} className="text-xs text-rose-500 hover:text-rose-600">
                        Remove this ticket type
                      </button>
                    )}
                  </div>
                </div>

                <div className="lg:sticky lg:top-4 lg:self-start min-w-0 overflow-x-auto">
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
            <motion.div key="vendors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
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
                    <div key={i} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-sm text-neutral-500">
                          {t.isFree ? 'Free' : `₦${Number(t.price).toLocaleString()}`} · {t.isUnlimited ? 'Unlimited qty' : `${t.quantity} qty`}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400">
                        Design: {getLayoutPreset(t.ticketStyle).name} · {getAccentPreset(t.ticketStyle).name} · {t.ticketHeadline} / {t.venueLabel}
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
