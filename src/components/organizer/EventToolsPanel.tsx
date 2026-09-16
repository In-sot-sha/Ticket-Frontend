import React, { useState, useEffect } from 'react';
import {
  Mail,
  Loader2,
  AlertCircle,
  Send,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { OrganizerEvent } from '../../lib/eventOrganizer';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface EventToolsPanelProps {
  event: OrganizerEvent & {
    ticketTypes?: Array<{ id: number; name: string }>;
  };
  onEventUpdate?: (patch: Partial<OrganizerEvent>) => void;
}

export const EventToolsPanel: React.FC<EventToolsPanelProps> = ({ event }) => {
  const { user } = useAuth();

  // Email blast states — defaults to "Starting Soon" template
  const [templateType, setTemplateType] = useState<'CUSTOM' | 'PRE_EVENT_REMINDER' | 'POST_EVENT_THANK_YOU'>('PRE_EVENT_REMINDER');
  const [blastSubject, setBlastSubject] = useState(`⏰ Reminder: ${event.title} is starting soon!`);
  const [blastMessage, setBlastMessage] = useState(
    `Hi! This is a friendly reminder that ${event.title} is starting soon.\n\nPlease arrive on time and have your ticket QR code ready on your phone for smooth check-in at the gate.`
  );
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CHECKED_IN' | 'UNCHECKED' | 'TICKET_TYPE'>('ALL');
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<number | undefined>(undefined);

  // Test Email state
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Recipient preview
  const [previewLoading, setPreviewLoading] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<{
    totalTickets: number;
    matchingTickets: number;
    matchingRecipients: number;
  } | null>(null);

  const [blastBusy, setBlastBusy] = useState(false);
  const [blastMsg, setBlastMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

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
      })
      .catch((err) => console.warn('Could not load attendee preview:', err))
      .finally(() => setPreviewLoading(false));
  };

  useEffect(() => {
    fetchPreview();
  }, [event.id, filterStatus, selectedTicketTypeId]);

  const handleSelectTemplate = (preset: 'CUSTOM' | 'PRE_EVENT_REMINDER' | 'POST_EVENT_THANK_YOU') => {
    setTemplateType(preset);
    if (preset === 'PRE_EVENT_REMINDER') {
      setBlastSubject(`⏰ Reminder: ${event.title} is starting soon!`);
      setBlastMessage(`Hi! This is a friendly reminder that ${event.title} is starting soon.\n\nPlease arrive on time and have your ticket QR code ready on your phone for smooth check-in at the gate.`);
    } else if (preset === 'POST_EVENT_THANK_YOU') {
      setBlastSubject(`💖 Thank you for attending ${event.title}!`);
      setBlastMessage(`Thank you for coming to ${event.title}! We hope you had an unforgettable time.\n\nStay connected for our upcoming events and announcements.`);
    } else {
      setBlastSubject(`Important update: ${event.title}`);
      setBlastMessage('');
    }
  };

  // Send Test Email
  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setTestMsg({ type: 'err', text: 'Enter a valid email address for the test preview.' });
      return;
    }
    if (!blastMessage.trim()) {
      setTestMsg({ type: 'err', text: 'Enter a message body first before sending a test.' });
      return;
    }

    setTestBusy(true);
    setTestMsg(null);
    try {
      const res = await api.events.sendAttendeeBlast(event.id, {
        subject: blastSubject,
        message: blastMessage,
        testEmail: testEmail.trim(),
        templateType,
      });
      setTestMsg({ type: 'ok', text: res.data.message || `Test email sent to ${testEmail}` });
    } catch (err: any) {
      setTestMsg({
        type: 'err',
        text: err?.response?.data?.message || 'Failed to send test email.',
      });
    } finally {
      setTestBusy(false);
    }
  };

  // Send Full Broadcast
  const sendBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blastMessage.trim()) return;

    if (!window.confirm(`Are you sure you want to broadcast this email to ${recipientPreview?.matchingRecipients || 'all'} attendee(s)?`)) {
      return;
    }

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
      setBlastMsg({ type: 'ok', text: res.data.message || 'Broadcast email dispatched successfully!' });
      if (templateType === 'CUSTOM') {
        setBlastMessage('');
      }
      fetchPreview();
    } catch (err: any) {
      setBlastMsg({
        type: 'err',
        text: err?.response?.data?.message || 'Could not send broadcast email.',
      });
    } finally {
      setBlastBusy(false);
    }
  };

  const senderName = (event as any).organization?.name || 'PartyStorm Host';

  return (
    <div className="space-y-5 w-full">
      {/* ── Sender Identity Banner ── */}
      <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-neutral-900 dark:text-white">
              Sender Identity: <span className="text-rose-600 dark:text-rose-400">{senderName} via PartyStorm</span>
            </p>
            <p className="text-[11px] text-neutral-500">
              Emails will be sent with official branding and verified headers for guaranteed delivery.
            </p>
          </div>
        </div>
      </div>

      {/* ── Direct Broadcast Email & Announcement ── */}
      <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Mail className="h-4 w-4 text-rose-500" />
              Broadcast Email to Attendees
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Send updates, venue/arrival instructions, or announcements to all or filtered attendees.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-neutral-500">Audience:</span>
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              {previewLoading ? '...' : `${recipientPreview?.matchingRecipients || 0} attendees`}
            </span>
          </div>
        </div>

        {blastMsg && (
          <div className={cn('p-3.5 rounded-xl text-xs flex items-center gap-2', blastMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300')}>
            {blastMsg.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
            <span>{blastMsg.text}</span>
          </div>
        )}

        <form onSubmit={sendBlast} className="space-y-4">
          {/* Audience Filter & Template Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Target Recipients
              </label>
              <select
                value={filterStatus === 'TICKET_TYPE' ? `tier_${selectedTicketTypeId}` : filterStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('tier_')) {
                    setFilterStatus('TICKET_TYPE');
                    setSelectedTicketTypeId(Number(val.replace('tier_', '')));
                  } else {
                    setFilterStatus(val as any);
                    setSelectedTicketTypeId(undefined);
                  }
                }}
                className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">All Registered Attendees ({recipientPreview?.totalTickets || 0})</option>
                <option value="UNCHECKED">Not Checked In Yet</option>
                <option value="CHECKED_IN">Checked In At Gate</option>
                {event.ticketTypes?.map((t) => (
                  <option key={t.id} value={`tier_${t.id}`}>
                    Ticket Tier: {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Quick Template Presets
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('PRE_EVENT_REMINDER')}
                  className={cn('px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer', templateType === 'PRE_EVENT_REMINDER' ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:border-rose-300')}
                >
                  ⏰ Starting Soon
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('POST_EVENT_THANK_YOU')}
                  className={cn('px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer', templateType === 'POST_EVENT_THANK_YOU' ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:border-rose-300')}
                >
                  💖 Thank You
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('CUSTOM')}
                  className={cn('px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer', templateType === 'CUSTOM' ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:border-rose-300')}
                >
                  ✍️ Custom
                </button>
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              value={blastSubject}
              onChange={(e) => setBlastSubject(e.target.value)}
              placeholder="e.g. Important gate & parking update for tomorrow"
              className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Message Content
              </label>
              <span className="text-[11px] text-neutral-400">Personalized with attendee&apos;s name automatically</span>
            </div>
            <textarea
              rows={6}
              value={blastMessage}
              onChange={(e) => setBlastMessage(e.target.value)}
              placeholder="Type your announcement or update here..."
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none leading-relaxed"
              required
            />
          </div>

          {/* ── Test Preview Box ── */}
          <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>🧪</span> Test Email Preview (Optional)
                </p>
                <p className="text-[11px] text-neutral-500">
                  Preview how this email looks in your personal inbox before broadcasting to all attendees.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="flex-1 min-w-0">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter your personal email (e.g. you@gmail.com)"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={testBusy || !blastMessage.trim()}
                onClick={sendTestEmail}
                className="h-9 rounded-xl text-xs font-bold px-3.5 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500 cursor-pointer shrink-0"
              >
                {testBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 text-rose-500" />}
                {testBusy ? 'Sending Test...' : 'Send Test to this Email'}
              </Button>
            </div>

            {testMsg && (
              <p className={cn('text-xs font-semibold pt-1', testMsg.type === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {testMsg.text}
              </p>
            )}
          </div>

          {/* ── Final Broadcast Action ── */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-[11px] text-neutral-400">
              Ready to send? This email will be personalized with each attendee&apos;s name and dispatched immediately.
            </p>

            <Button
              type="submit"
              disabled={blastBusy || previewLoading || !blastMessage.trim() || (recipientPreview?.matchingRecipients || 0) === 0}
              className="w-full sm:w-auto h-11 rounded-xl text-xs sm:text-sm font-bold px-6 bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-2xs gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {blastBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending Broadcast...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Broadcast to {recipientPreview?.matchingRecipients || 0} Attendees
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
