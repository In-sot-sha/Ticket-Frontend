import React, { useMemo, useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Share2,
  MessageCircle,
  QrCode,
  Mail,
  Sparkles,
  Loader2,
  AlertCircle,
  Filter,
  Users,
  Clock,
  Send,
  HeartHandshake,
  CheckCircle2,
  BellRing,
} from 'lucide-react';
import { api } from '../../services/api';
import { OrganizerEvent } from '../../lib/eventOrganizer';

interface EventToolsPanelProps {
  event: OrganizerEvent & {
    isPromoted?: boolean;
    promotionRequestedAt?: string | null;
    ticketTypes?: Array<{ id: number; name: string }>;
  };
  onEventUpdate?: (patch: Partial<OrganizerEvent>) => void;
}

export const EventToolsPanel: React.FC<EventToolsPanelProps> = ({ event, onEventUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [requestedAt, setRequestedAt] = useState(event.promotionRequestedAt);

  // Email blast states
  const [blastSubject, setBlastSubject] = useState('Important update regarding your event ticket');
  const [blastMessage, setBlastMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CHECKED_IN' | 'UNCHECKED' | 'TICKET_TYPE'>('ALL');
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<number | undefined>(undefined);
  const [templateType, setTemplateType] = useState<'CUSTOM' | 'PRE_EVENT_REMINDER' | 'POST_EVENT_THANK_YOU'>('CUSTOM');

  const [previewLoading, setPreviewLoading] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<{
    totalTickets: number;
    matchingTickets: number;
    matchingRecipients: number;
    autoReminderEnabled?: boolean;
    autoPostEventEnabled?: boolean;
    autoReminder24hSent?: string | null;
    autoPostEventSent?: string | null;
  } | null>(null);

  const [blastBusy, setBlastBusy] = useState(false);
  const [blastMsg, setBlastMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Lifecycle email triggers & toggles
  const [lifecycleBusy, setLifecycleBusy] = useState<string | null>(null);
  const [lifecycleMsg, setLifecycleMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [autoReminder, setAutoReminder] = useState(true);
  const [autoPostEvent, setAutoPostEvent] = useState(true);

  const publicUrl = useMemo(() => {
    const path = `/events/${event.slug || event.id}`;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
    return path;
  }, [event.slug, event.id]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${event.title} — get tickets: ${publicUrl}`)}`;

  // Fetch blast preview when filters change
  const fetchPreview = () => {
    setPreviewLoading(true);
    api.events
      .getAttendeeBlastPreview(event.id, {
        filterStatus,
        ticketTypeId: selectedTicketTypeId,
      })
      .then((res) => {
        setRecipientPreview(res.data);
        if (typeof res.data.autoReminderEnabled === 'boolean') {
          setAutoReminder(res.data.autoReminderEnabled);
        }
        if (typeof res.data.autoPostEventEnabled === 'boolean') {
          setAutoPostEvent(res.data.autoPostEventEnabled);
        }
      })
      .catch((err) => console.warn('Could not load attendee preview:', err))
      .finally(() => setPreviewLoading(false));
  };

  useEffect(() => {
    fetchPreview();
  }, [event.id, filterStatus, selectedTicketTypeId]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', publicUrl);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Tickets for ${event.title}`,
          url: publicUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copyLink();
    }
  };

  const handleSelectTemplate = (preset: 'CUSTOM' | 'PRE_EVENT_REMINDER' | 'POST_EVENT_THANK_YOU') => {
    setTemplateType(preset);
    if (preset === 'PRE_EVENT_REMINDER') {
      setBlastSubject(`⏰ Reminder: ${event.title} is starting soon!`);
      setBlastMessage(`Hi! This is a quick reminder that ${event.title} is starting soon.\n\nPlease arrive on time and have your ticket QR code ready on your phone for fast check-in at the gate.`);
    } else if (preset === 'POST_EVENT_THANK_YOU') {
      setBlastSubject(`💖 Thank you for coming to ${event.title}!`);
      setBlastMessage(`Thank you for attending ${event.title}! We hope you had a fantastic experience.\n\nStay tuned for upcoming events and announcements from our team!`);
    } else {
      setBlastSubject('Important update regarding your event ticket');
      setBlastMessage('');
    }
  };

  const sendBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlastBusy(true);
    setBlastMsg(null);
    try {
      const res = await api.events.sendAttendeeBlast(event.id, {
        subject: blastSubject,
        message: blastMessage,
        filterStatus,
        ticketTypeId: selectedTicketTypeId,
        templateType,
      });
      setBlastMsg({ type: 'ok', text: res.data.message || 'Sent successfully.' });
      if (templateType === 'CUSTOM') {
        setBlastMessage('');
      }
      fetchPreview();
    } catch (err: any) {
      setBlastMsg({
        type: 'err',
        text: err?.response?.data?.message || 'Could not send message.',
      });
    } finally {
      setBlastBusy(false);
    }
  };

  const triggerLifecycle = async (triggerType: 'REMINDER_24H' | 'POST_EVENT') => {
    setLifecycleBusy(triggerType);
    setLifecycleMsg(null);
    try {
      const res = await api.events.triggerLifecycleEmail(event.id, { triggerType });
      setLifecycleMsg({ type: 'ok', text: res.data.message || 'Lifecycle email dispatched.' });
      fetchPreview();
    } catch (err: any) {
      setLifecycleMsg({
        type: 'err',
        text: err?.response?.data?.message || 'Could not dispatch lifecycle email.',
      });
    } finally {
      setLifecycleBusy(null);
    }
  };

  const toggleLifecycleSetting = async (field: 'reminder' | 'postEvent', value: boolean) => {
    try {
      if (field === 'reminder') setAutoReminder(value);
      if (field === 'postEvent') setAutoPostEvent(value);
      await api.events.triggerLifecycleEmail(event.id, {
        ...(field === 'reminder' ? { enableReminder: value } : {}),
        ...(field === 'postEvent' ? { enablePostEvent: value } : {}),
      });
    } catch {
      console.warn('Failed to update automated lifecycle email toggle.');
    }
  };

  const requestPromo = async () => {
    setPromoBusy(true);
    setPromoMsg(null);
    try {
      const res = await api.events.requestPromotion(event.id);
      setPromoMsg({ type: 'ok', text: res.data.message || 'Request sent.' });
      if (res.data.event?.promotionRequestedAt) {
        setRequestedAt(res.data.event.promotionRequestedAt);
        onEventUpdate?.({ promotionRequestedAt: res.data.event.promotionRequestedAt } as any);
      } else if (res.data.alreadyRequested || res.data.alreadyPromoted) {
        setRequestedAt(requestedAt || new Date().toISOString());
      }
    } catch (err: any) {
      setPromoMsg({
        type: 'err',
        text: err?.response?.data?.message || 'Could not request promotion.',
      });
    } finally {
      setPromoBusy(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Share kit */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xs">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-1 text-neutral-900 dark:text-white">
          <Share2 className="h-4 w-4 text-rose-500" />
          Promote this event
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Share the public link on WhatsApp, Instagram, or anywhere guests buy tickets.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <input
                readOnly
                value={publicUrl}
                className="flex-1 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 truncate"
              />
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-bold hover:border-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
              <button
                type="button"
                onClick={shareNative}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-bold hover:border-rose-300 hover:text-rose-500 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
          </div>
          <div className="shrink-0 text-center">
            <div className="inline-block p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white">
              <img src={qrUrl} alt="Event QR" className="w-28 h-28" width={112} height={112} />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1.5 flex items-center justify-center gap-1">
              <QrCode className="h-3 w-3" /> Scan to open event
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          {event.isPromoted ? (
            <p className="text-xs font-semibold text-emerald-600">
              This event is featured on PartyStorm.
            </p>
          ) : (
            <>
              <button
                type="button"
                disabled={promoBusy || Boolean(requestedAt)}
                onClick={requestPromo}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-900/40 disabled:opacity-50 transition-colors"
              >
                {promoBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {requestedAt ? 'Promotion requested' : 'Request homepage feature'}
              </button>
              <p className="text-[11px] text-neutral-500 mt-2">
                Ask PartyStorm to feature this event on the homepage carousel. Review is manual.
              </p>
            </>
          )}
          {promoMsg && (
            <p
              className={`mt-2 text-xs font-medium ${
                promoMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {promoMsg.text}
            </p>
          )}
        </div>
      </section>

      {/* Attendee Email Broadcast & Filter Hub */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
              <Mail className="h-4 w-4 text-rose-500" />
              Attendee Email Messaging Hub
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Send targeted email broadcasts to specific attendee segments or ticket tiers.
            </p>
          </div>

          {/* Recipient Counter Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
            {previewLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Users className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span>
              {recipientPreview ? `${recipientPreview.matchingRecipients} recipient(s)` : 'Calculating…'}
            </span>
          </div>
        </div>

        {/* Audience Filters */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 mb-2">
              <Filter className="h-3 w-3" /> Target Audience Segment
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ALL', label: 'All Attendees' },
                { id: 'CHECKED_IN', label: 'Checked-in Only' },
                { id: 'UNCHECKED', label: 'Not Checked-in' },
                { id: 'TICKET_TYPE', label: 'By Ticket Tier' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setFilterStatus(filter.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    filterStatus === filter.id
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-rose-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Tier Dropdown if selected */}
          {filterStatus === 'TICKET_TYPE' && (
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Select Ticket Tier
              </label>
              <select
                value={selectedTicketTypeId || ''}
                onChange={(e) => setSelectedTicketTypeId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:border-rose-500"
              >
                <option value="">-- All Ticket Tiers --</option>
                {event.ticketTypes?.map((tt) => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Email Preset Templates */}
        <div className="mb-6">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
            Email Preset Template
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'CUSTOM', label: 'Custom Message', icon: Send },
              { id: 'PRE_EVENT_REMINDER', label: '24h Gate Reminder', icon: Clock },
              { id: 'POST_EVENT_THANK_YOU', label: 'Post-Event Thank You', icon: HeartHandshake },
            ].map((preset) => {
              const IconComp = preset.icon;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectTemplate(preset.id as any)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    templateType === preset.id
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/50'
                      : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <IconComp className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Blast Form */}
        <form onSubmit={sendBlast} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Email Subject
            </label>
            <input
              value={blastSubject}
              onChange={(e) => setBlastSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-none focus:border-rose-500"
              maxLength={120}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Message Body
            </label>
            <textarea
              value={blastMessage}
              onChange={(e) => setBlastMessage(e.target.value)}
              rows={4}
              placeholder="Write your email content here…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm resize-y focus:outline-none focus:border-rose-500"
              maxLength={4000}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-neutral-500">
              Emails are formatted with official PartyStorm branding and reply link to your organization.
            </p>
            <button
              type="submit"
              disabled={blastBusy || blastMessage.trim().length < 10 || (recipientPreview?.matchingRecipients === 0)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 disabled:opacity-40 shadow-xs transition-all active:scale-[0.98]"
            >
              {blastBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send Broadcast to {recipientPreview?.matchingRecipients || 0} Attendee(s)
            </button>
          </div>

          {blastMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                blastMsg.type === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-200 dark:border-red-900/50'
              }`}
            >
              {blastMsg.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {blastMsg.text}
            </div>
          )}
        </form>
      </section>

      {/* Automated Event Lifecycle Email Controls */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
            <BellRing className="h-4 w-4 text-rose-500" />
            Automated & Scheduled Event Reminders
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure automatic pre-event gate reminders and post-event thank you messages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 24h Reminder Card */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-rose-500" />
                  24h Pre-Event Gate Reminder
                </h4>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Emails ticket holders 24 hours before event start with directions & QR code access.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoReminder}
                  onChange={(e) => toggleLifecycleSetting('reminder', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            {recipientPreview?.autoReminder24hSent ? (
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Last sent on {new Date(recipientPreview.autoReminder24hSent).toLocaleDateString('en-NG')}
              </p>
            ) : (
              <p className="text-[10px] text-neutral-400">Status: Scheduled before event start</p>
            )}

            <button
              type="button"
              disabled={lifecycleBusy !== null}
              onClick={() => triggerLifecycle('REMINDER_24H')}
              className="w-full py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:border-rose-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {lifecycleBusy === 'REMINDER_24H' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5 text-rose-500" />}
              Send 24h Reminder Now
            </button>
          </div>

          {/* Post-Event Card */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <HeartHandshake className="h-3.5 w-3.5 text-rose-500" />
                  Post-Event Thank You & Feedback
                </h4>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Emails checked-in attendees after the event ends thanking them for attending.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoPostEvent}
                  onChange={(e) => toggleLifecycleSetting('postEvent', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            {recipientPreview?.autoPostEventSent ? (
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Last sent on {new Date(recipientPreview.autoPostEventSent).toLocaleDateString('en-NG')}
              </p>
            ) : (
              <p className="text-[10px] text-neutral-400">Status: Scheduled after event end</p>
            )}

            <button
              type="button"
              disabled={lifecycleBusy !== null}
              onClick={() => triggerLifecycle('POST_EVENT')}
              className="w-full py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:border-rose-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {lifecycleBusy === 'POST_EVENT' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HeartHandshake className="h-3.5 w-3.5 text-rose-500" />}
              Send Post-Event Thank You Now
            </button>
          </div>
        </div>

        {lifecycleMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              lifecycleMsg.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-200 dark:border-red-900/50'
            }`}
          >
            {lifecycleMsg.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {lifecycleMsg.text}
          </div>
        )}
      </section>
    </div>
  );
};

export default EventToolsPanel;
