import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Lock,
  Store,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Calendar,
  Ticket,
  Plus,
  X,
  Save,
  Pause,
  Play,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { OrganizerEvent } from '../../lib/eventOrganizer';
import { ValidOnField } from './ValidOnField';
import { eventDayList, ymdFromUnknown } from '../../lib/ticketValidity';

interface SettingsTabProps {
  event: OrganizerEvent;
  onEventUpdate?: (patch: Partial<OrganizerEvent>) => void;
  readOnly?: boolean;
}

const TICKET_DESC_MAX = 800;

interface EditableTicket {
  id?: number;
  name: string;
  price: number | string;
  quantity: number | string;
  description?: string;
  isPaused?: boolean;
  isUnlimited?: boolean;
  validOn?: string;
}

function formatDateInput(isoString?: string) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeInput(isoString?: string) {
  if (!isoString) return '18:00';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '18:00';
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

const CATEGORIES = [
  'Music',
  'Festival',
  'Nightlife',
  'Wedding',
  'Food',
  'Business',
  'Technology',
  'Conference',
  'Arts',
  'Sports',
  'Wellness',
  'Fairs',
  'Other',
];

export const SettingsTab: React.FC<SettingsTabProps> = ({
  event,
  onEventUpdate,
  readOnly = false,
}) => {
  const navigate = useNavigate();

  // Visibility & Vendor toggles
  const [isPublished, setIsPublished] = useState<boolean>(
    event.isPublished ?? event.status === 'PUBLISHED'
  );
  const [allowVendors, setAllowVendors] = useState<boolean>(!!event.allowVendors);

  // Quick Event Details Form States
  const [title, setTitle] = useState(event.title || '');
  const [category, setCategory] = useState(event.category || 'Music');
  const [description, setDescription] = useState(event.description || '');
  const [startDate, setStartDate] = useState(formatDateInput(event.startDate));
  const [startTime, setStartTime] = useState(formatTimeInput(event.startDate));
  const [endDate, setEndDate] = useState(formatDateInput(event.endDate));
  const [endTime, setEndTime] = useState(formatTimeInput(event.endDate));
  const [locationType, setLocationType] = useState(event.locationType || 'physical');
  const [location, setLocation] = useState(event.location || '');
  const [onlineUrl, setOnlineUrl] = useState(event.onlineUrl || '');

  // Quick Ticket Tiers States
  const [tickets, setTickets] = useState<EditableTicket[]>(
    event.ticketTypes?.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      isUnlimited: t.quantity === 0,
      quantity: t.quantity === 0 ? '' : t.quantity ?? 100,
      description: t.description || '',
      isPaused: !!t.isPaused,
      validOn: ymdFromUnknown(t.validOn),
    })) || [{ name: 'Regular', price: 0, quantity: 100, description: '', isPaused: false }]
  );

  // Loading & Toast States
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateMsg, setUpdateMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal Deletion State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (updateMsg) {
      const timer = setTimeout(() => {
        setUpdateMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [updateMsg]);

  // Handle Visibility and Vendor toggles
  const handleSaveToggles = async (overrides?: Partial<OrganizerEvent>) => {
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const payload = {
        isPublished: overrides?.isPublished ?? isPublished,
        allowVendors: overrides?.allowVendors ?? allowVendors,
      };

      await api.put(`/events/${event.id}`, payload);

      if (onEventUpdate) {
        onEventUpdate(payload);
      }

      setUpdateMsg({ text: 'Status updated successfully.', type: 'success' });
    } catch (err: any) {
      setUpdateMsg({
        text: err?.response?.data?.message || 'Failed to update settings. Please try again.',
        type: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  const confirmUnpublish = () => {
    setUnpublishModalOpen(false);
    setIsPublished(false);
    handleSaveToggles({ isPublished: false });
  };

  const handleTogglePublish = () => {
    if (isPublished) {
      setUnpublishModalOpen(true);
      return;
    }
    setIsPublished(true);
    handleSaveToggles({ isPublished: true });
  };

  const handleToggleVendors = () => {
    const nextVal = !allowVendors;
    setAllowVendors(nextVal);
    handleSaveToggles({ allowVendors: nextVal });
  };

  // Handle Quick Save of Event Information
  const handleSaveQuickDetails = async (e?: React.FormEvent, ticketsOverride?: EditableTicket[]) => {
    e?.preventDefault();
    if (!title.trim()) {
      setUpdateMsg({ text: 'Please enter an event title.', type: 'error' });
      return;
    }

    const rows = ticketsOverride ?? tickets;
    if (rows.some((t) => !t.isUnlimited && Number(t.quantity) < 1)) {
      setUpdateMsg({
        text: 'Each ticket needs a quantity of at least 1, or mark it Unlimited.',
        type: 'error',
      });
      return;
    }

    setUpdating(true);
    setUpdateMsg(null);

    try {
      const startDateTime = startDate
        ? new Date(`${startDate}T${startTime || '00:00'}:00`).toISOString()
        : event.startDate;
      const endDateTime = endDate
        ? new Date(`${endDate}T${endTime || '23:59'}:00`).toISOString()
        : event.endDate;

      const payload: any = {
        title: title.trim(),
        category,
        description: description.trim(),
        startDate: startDateTime,
        endDate: endDateTime,
        locationType,
        location: locationType === 'physical' ? location.trim() : '',
        onlineUrl: locationType === 'online' ? onlineUrl.trim() : '',
        allowVendors,
        isPublished,
        ticketTypes: JSON.stringify(
          rows.map((t) => ({
            ...(t.id ? { id: t.id } : {}),
            name: t.name.trim() || 'General Admission',
            price: Number(t.price) || 0,
            quantity: t.isUnlimited ? 0 : Number(t.quantity) || 0,
            description: t.description?.trim()
              ? t.description.trim().slice(0, TICKET_DESC_MAX)
              : null,
            isPaused: !!t.isPaused,
            validOn:
              t.validOn && eventDayList(startDate, endDate || startDate).includes(t.validOn)
                ? t.validOn
                : null,
          }))
        ),
      };

      await api.put(`/events/${event.id}`, payload);

      if (onEventUpdate) {
        onEventUpdate({
          title: payload.title,
          category: payload.category,
          description: payload.description,
          startDate: payload.startDate,
          endDate: payload.endDate,
          locationType: payload.locationType,
          location: payload.location,
          onlineUrl: payload.onlineUrl,
          ticketTypes: rows.map((t) => ({
            id: t.id || 0,
            name: t.name,
            price: Number(t.price) || 0,
            quantity: t.isUnlimited ? 0 : Number(t.quantity) || 0,
            description: t.description?.trim() || null,
            isPaused: !!t.isPaused,
            validOn: t.validOn || null,
          })),
        });
      }

      setUpdateMsg({
        text: ticketsOverride ? 'Ticket sales updated.' : 'Event details updated successfully!',
        type: 'success',
      });
    } catch (err: any) {
      setUpdateMsg({
        text: err?.response?.data?.message || 'Could not save event details.',
        type: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Ticket tier helpers
  const handleUpdateTicket = (index: number, field: keyof EditableTicket, val: string) => {
    setTickets((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleAddTicket = () => {
    setTickets((prev) => [
      ...prev,
      { name: `Tier ${prev.length + 1}`, price: 0, quantity: 100, description: '' },
    ]);
  };

  const handleRemoveTicket = (index: number) => {
    if (tickets.length <= 1) return;
    setTickets((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Delete Event
  const handleDeleteEvent = async () => {
    if (confirmTitle.trim() !== event.title.trim()) {
      setDeleteError('Event title does not match.');
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/events/${event.id}`);
      navigate('/organizer/events', { replace: true });
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || 'Failed to delete event.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {readOnly && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold">
            Admin View (Read-Only) — Event details and ticket tiers cannot be updated from this view.
          </span>
        </div>
      )}

      {/* Toast Notification with auto-dismiss and close button */}
      {updateMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
            updateMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {updateMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{updateMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setUpdateMsg(null)}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Visibility */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Visibility</h3>
            <p className="mt-0.5 text-xs text-neutral-500">Who can find this event and apply as a vendor.</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
              isPublished
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
            )}
          >
            {isPublished ? 'Live' : 'Draft'}
          </span>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {isPublished ? <Globe className="h-3.5 w-3.5 text-emerald-500" /> : <Lock className="h-3.5 w-3.5 text-amber-500" />}
                Public listing
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                {isPublished ? 'Shown in discovery and searchable.' : 'Hidden from lists — direct link still works.'}
              </p>
            </div>
            {!readOnly ? (
              <Button
                variant={isPublished ? 'outline' : 'default'}
                size="sm"
                disabled={updating}
                onClick={handleTogglePublish}
                className={cn(
                  'h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold',
                  !isPublished && 'bg-rose-500 text-white hover:bg-rose-600'
                )}
              >
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            ) : (
              <span className="text-xs font-semibold text-neutral-500">{isPublished ? 'Published' : 'Draft'}</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                <Store className="h-3.5 w-3.5 text-rose-500" />
                Vendor applications
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">Let vendors apply for booths on this event.</p>
            </div>
            {!readOnly ? (
              <Button
                variant={allowVendors ? 'default' : 'outline'}
                size="sm"
                disabled={updating}
                onClick={handleToggleVendors}
                className={cn(
                  'h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold',
                  allowVendors && 'bg-rose-500 text-white hover:bg-rose-600'
                )}
              >
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : allowVendors ? 'On' : 'Off'}
              </Button>
            ) : (
              <span className="text-xs font-semibold text-neutral-500">{allowVendors ? 'On' : 'Off'}</span>
            )}
          </div>
        </div>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (readOnly) return;
          handleSaveQuickDetails(e);
        }}
        className="space-y-4"
      >
        {/* Details */}
        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
            <Calendar className="h-4 w-4 text-rose-500" />
            Event details
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500">Title, schedule, and where it happens.</p>
        </div>

        {/* 1. Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Music Festival"
              className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Category
            </label>
            <select
              value={category}
              disabled={readOnly}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Description */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            disabled={readOnly}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell attendees what to expect..."
            className="w-full p-3 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* 3. Dates & Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              disabled={readOnly}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              disabled={readOnly}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              disabled={readOnly}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              disabled={readOnly}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* 4. Event Type & Venue / Link */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Venue & Location
          </label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setLocationType('physical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                readOnly ? 'cursor-not-allowed opacity-80 ' : 'cursor-pointer '
              }${
                locationType === 'physical'
                  ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600'
              }`}
            >
              Physical Venue
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setLocationType('online')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                readOnly ? 'cursor-not-allowed opacity-80 ' : 'cursor-pointer '
              }${
                locationType === 'online'
                  ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600'
              }`}
            >
              Online Event
            </button>
          </div>

          {locationType === 'physical' ? (
            <input
              type="text"
              value={location}
              disabled={readOnly}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Landmark Centre, Plot 2 & 3, Water Corporation Dr, VI, Lagos"
              className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          ) : (
            <input
              type="url"
              value={onlineUrl}
              disabled={readOnly}
              onChange={(e) => setOnlineUrl(e.target.value)}
              placeholder="e.g. https://zoom.us/j/... or https://meet.google.com/..."
              className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          )}
        </div>
        </section>

        {/* Tickets */}
        <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
                <Ticket className="h-4 w-4 text-rose-500" />
                Ticket types
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                {readOnly
                  ? 'Ticket tiers for this event'
                  : 'Adjust prices, quantity, or which day a pass works'}
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={handleAddTicket}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            )}
          </div>

          <div className="space-y-2">
            {tickets.map((t, idx) => (
              <div
                key={t.id || idx}
                className={cn(
                  'rounded-xl border bg-neutral-50/60 p-3 dark:bg-neutral-950/40',
                  t.isPaused
                    ? 'border-amber-300 dark:border-amber-800'
                    : 'border-neutral-200 dark:border-neutral-800'
                )}
              >
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-[140px] flex-1">
                        <input
                          type="text"
                          value={t.name}
                          disabled={readOnly}
                          onChange={(e) => handleUpdateTicket(idx, 'name', e.target.value)}
                          placeholder="Tier name (e.g. VIP)"
                          className="h-8 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                      </div>
                      <div className="relative w-28">
                        <span className="absolute left-2 top-2 text-[10px] font-bold text-neutral-400">₦</span>
                        <input
                          type="number"
                          min={0}
                          value={t.price}
                          disabled={readOnly}
                          onChange={(e) => handleUpdateTicket(idx, 'price', e.target.value)}
                          placeholder="Price"
                          className="h-8 w-full rounded-lg border border-neutral-200 bg-white pl-5 pr-2 text-xs font-bold tabular-nums text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                      </div>
                      <div className="w-24">
                        {t.isUnlimited ? (
                          <div className="flex h-8 items-center justify-center rounded-lg border border-neutral-200 bg-white px-2.5 text-[11px] font-bold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800">
                            Unlimited
                          </div>
                        ) : (
                          <input
                            type="number"
                            min={1}
                            value={t.quantity}
                            disabled={readOnly}
                            onChange={(e) => handleUpdateTicket(idx, 'quantity', e.target.value)}
                            placeholder="Qty"
                            className="h-8 w-full rounded-lg border border-neutral-200 bg-white px-2.5 text-center text-xs tabular-nums text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                          />
                        )}
                      </div>
                      <label
                        className={cn(
                          'flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-neutral-500',
                          readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={!!t.isUnlimited}
                          disabled={readOnly}
                          onChange={(e) => {
                            setTickets((prev) =>
                              prev.map((row, i) =>
                                i === idx
                                  ? {
                                      ...row,
                                      isUnlimited: e.target.checked,
                                      quantity: e.target.checked ? '' : row.quantity || 100,
                                    }
                                  : row
                              )
                            );
                          }}
                          className="rounded accent-rose-500"
                        />
                        Unlimited
                      </label>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = tickets.map((row, i) =>
                              i === idx ? { ...row, isPaused: !row.isPaused } : row
                            );
                            setTickets(next);
                            void handleSaveQuickDetails(undefined, next);
                          }}
                          disabled={updating}
                          className={cn(
                            'flex h-8 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold disabled:opacity-50',
                            t.isPaused
                              ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                              : 'border-neutral-200 text-neutral-600 hover:border-amber-300 dark:border-neutral-700'
                          )}
                          title={t.isPaused ? 'Resume sales' : 'Pause sales'}
                        >
                          {t.isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                          {t.isPaused ? 'Paused' : 'Pause'}
                        </button>
                      )}
                      {!readOnly && tickets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTicket(idx)}
                          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-rose-500"
                          title="Remove tier"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>


                    <ValidOnField
                      startDate={startDate}
                      endDate={endDate || startDate}
                      value={t.validOn}
                      disabled={readOnly}
                      onChange={(next) => handleUpdateTicket(idx, 'validOn', next)}
                    />
                    <div>
                      <textarea
                        value={t.description || ''}
                        disabled={readOnly}
                        onChange={(e) =>
                          handleUpdateTicket(idx, 'description', e.target.value.slice(0, TICKET_DESC_MAX))
                        }
                        rows={2}
                        placeholder="Optional description (shown on booking page)"
                        className="min-h-[2.5rem] w-full resize-y rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                      <p className="mt-0.5 flex justify-end text-[10px] tabular-nums text-neutral-400">
                        {(t.description || '').length}/{TICKET_DESC_MAX}
                      </p>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {!readOnly && (
          <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-[11px] text-neutral-400">
              Ticket flier design or vendor forms?{' '}
              <button
                type="button"
                onClick={() => navigate(`/organizer/events/create/${event.id}`)}
                className="font-semibold text-rose-500 hover:underline"
              >
                Open full wizard →
              </button>
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={updating}
              className="h-9 w-full gap-1.5 rounded-xl border-0 bg-rose-500 px-5 text-xs font-bold text-white shadow-2xs hover:bg-rose-600 sm:w-auto"
            >
              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save changes
            </Button>
          </div>
        )}
      </form>

      {!readOnly && (
        <section className="space-y-4 rounded-2xl border border-rose-200/80 bg-rose-50/30 p-4 sm:p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-rose-700 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Danger zone
            </h3>
            <p className="mt-0.5 text-xs text-rose-600/80 dark:text-rose-400/80">
              To pause sales temporarily, unpublish above. Delete is permanent.
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-rose-200 dark:border-rose-950/50">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                Delete Event
              </p>
              <p className="text-[11px] text-neutral-500">
                Permanently delete this event and all associated records from PartyStorm.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="rounded-full text-xs font-semibold border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:hover:bg-rose-950 px-4 shrink-0 cursor-pointer"
            >
              Delete Event
            </Button>
          </div>
        </section>
      )}

      {unpublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div>
              <h4 className="text-base font-bold text-neutral-900 dark:text-white">Unpublish this event?</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
                It will leave the public list. People with the link can still open it. You can publish it again later.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnpublishModalOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={updating}
                onClick={confirmUnpublish}
                className="rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Unpublish'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/40">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-white">Delete Event</h4>
                <p className="text-xs text-neutral-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              To confirm permanent deletion, type the exact event title below:
            </p>
            <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 p-2.5 rounded-lg select-all">
              {event.title}
            </p>

            <input
              type="text"
              value={confirmTitle}
              onChange={(e) => setConfirmTitle(e.target.value)}
              placeholder="Type event title here"
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />

            {deleteError && (
              <p className="text-xs font-semibold text-rose-600">{deleteError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setConfirmTitle('');
                  setDeleteError(null);
                }}
                className="rounded-full text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={deleting || confirmTitle.trim() !== event.title.trim()}
                onClick={handleDeleteEvent}
                className="rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
