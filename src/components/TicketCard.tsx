import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import EventTicketCard from './tickets/EventTicketCard';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketCardTicket {
  id?: number | string;
  qrCode?: string | null;
  eventId?: number;
  ticketType?: {
    name?: string;
    price?: number;
    ticketStyle?: string | null;
    accentColor?: string | null;
    badgeText?: string | null;
    ticketHeadline?: string | null;
    venueLabel?: string | null;
  };
  event?: {
    id?: number;
    title?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    imageUrl?: string;
  };
  status?: string;
}

export interface TicketCardEventMeta {
  eventId?: number;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventImageUrl?: string;
  /** Fallback ticket type name when ticket.ticketType is absent */
  ticketType?: string;
  ticketStyle?: string | null;
  accentColor?: string | null;
  totalAmount?: number;
  quantity?: number;
}

export interface TicketCardProps {
  ticket: TicketCardTicket;
  /** Zero-based index within a list (used for mock serial fallback) */
  index?: number;
  /** Event-level metadata — used when ticket doesn't carry event fields directly */
  eventMeta?: TicketCardEventMeta;
  /** Whether to render the download button below the card */
  showDownload?: boolean;
  /** Override the DOM id prefix (default: "ticket-card") */
  idPrefix?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a date string as  "15TH | DECEMBER | 2023" */
export function formatTicketDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const s = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    const ordinal = day + (s[(v - 20) % 10] || s[v] || s[0]);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${ordinal.toUpperCase()} | ${months[date.getMonth()].toUpperCase()} | ${date.getFullYear()}`;
  } catch {
    return dateString;
  }
}

/** Splits a title so the first word can be accent-coloured */
export function splitTitle(title?: string): { firstWord: string; rest: string } {
  const words = (title || '').split(' ');
  return { firstWord: words[0] || '', rest: words.slice(1).join(' ') };
}

/** @deprecated Prefer ticketType.ticketStyle via EventTicketCard */
export function getTicketStyle(typeName?: string) {
  const n = (typeName || '').toUpperCase();
  if (n.includes('VIP') || n.includes('VVIP') || n.includes('GOLD'))
    return { sideBg: 'bg-[#eeb111]', borderColor: 'border-amber-200 dark:border-amber-800', accentColor: 'text-[#eeb111]' };
  if (n.includes('STUDENT') || n.includes('KID') || n.includes('CHILD'))
    return { sideBg: 'bg-[#10b981]', borderColor: 'border-emerald-200 dark:border-emerald-800', accentColor: 'text-[#10b981]' };
  if (n.includes('EXHIBITOR') || n.includes('VENDOR') || n.includes('SPONSOR'))
    return { sideBg: 'bg-[#8b5cf6]', borderColor: 'border-purple-200 dark:border-purple-800', accentColor: 'text-[#8b5cf6]' };
  return { sideBg: 'bg-[#f43f5e]', borderColor: 'border-rose-200 dark:border-rose-800', accentColor: 'text-[#f43f5e]' };
}

/** Derives a short serial string like "TKT-105-31" from available data */
export function getTicketSerial(ticket: TicketCardTicket, index: number, eventId?: number): string {
  if (ticket.id) {
    const eid = ticket.eventId ?? ticket.event?.id ?? eventId ?? 0;
    return `TKT-${eid}-${ticket.id}`;
  }
  return `TKT-MOCK-${index + 1}`;
}

// ─── Download helper ──────────────────────────────────────────────────────────

export async function downloadTicketCard(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Ticket element not found');

  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}

/** Shared Save-as-PNG button with loading state */
export function DownloadTicketButton({
  elementId,
  filename,
  label = 'Save as PNG',
  className = '',
}: {
  elementId: string;
  filename: string;
  label?: string;
  className?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadTicketCard(elementId, filename);
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={downloading}
      aria-busy={downloading}
      className={
        className ||
        'w-full h-10 flex items-center justify-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none'
      }
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {downloading ? 'Preparing PNG…' : label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  index = 0,
  eventMeta = {},
  showDownload = true,
  idPrefix = 'ticket-card',
}) => {
  const eventName = eventMeta.eventName ?? ticket.event?.title ?? 'Event';
  const eventDate = eventMeta.eventDate ?? ticket.event?.startDate ?? new Date().toISOString();
  const eventTime = eventMeta.eventTime ?? '';
  const eventLoc = eventMeta.eventLocation ?? ticket.event?.location ?? 'Venue TBA';
  const bannerImg = eventMeta.eventImageUrl ?? ticket.event?.imageUrl;

  const typeName = ticket.ticketType?.name ?? eventMeta.ticketType ?? 'General Admission';
  const serial = getTicketSerial(ticket, index, eventMeta.eventId);
  const qrValue = ticket.qrCode || serial;
  const cardId = `${idPrefix}-${serial}`;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5 sm:gap-3">
      <div className="mx-auto w-full min-w-0 max-w-xl md:max-w-none">
        <EventTicketCard
          id={cardId}
          eventName={eventName}
          eventDate={eventDate}
          eventTime={eventTime || undefined}
          eventLocation={eventLoc}
          eventImageUrl={bannerImg || undefined}
          ticketSerial={serial}
          qrValue={qrValue}
          ticketType={{
            name: typeName,
            ticketStyle: ticket.ticketType?.ticketStyle ?? eventMeta.ticketStyle,
            accentColor: ticket.ticketType?.accentColor ?? eventMeta.accentColor,
            badgeText: ticket.ticketType?.badgeText || typeName,
            ticketHeadline: ticket.ticketType?.ticketHeadline,
            venueLabel: ticket.ticketType?.venueLabel,
          }}
        />
      </div>

      {showDownload && (
        <div className="flex justify-center sm:justify-end gap-2 px-1 sm:px-2">
          <DownloadTicketButton
            elementId={cardId}
            filename={`ticket-${serial}.png`}
            label="Download Pass PNG"
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 px-4 py-2.5 rounded-full transition-all border border-neutral-200 dark:border-neutral-800 shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          />
        </div>
      )}
    </div>
  );
};

export default TicketCard;
