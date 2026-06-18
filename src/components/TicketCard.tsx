import React from 'react';
import { Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useIsMobile } from '@/hooks/use-mobile';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketCardTicket {
  id?: number | string;
  qrCode?: string | null;
  eventId?: number;
  ticketType?: {
    name?: string;
    price?: number;
  };
  event?: {
    id?: number;
    title?: string;
    startDate?: string;
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

/** Returns colour tokens based on the ticket type name */
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

// ─── Download helper (loads html2canvas lazily) ───────────────────────────────

export async function downloadTicketCard(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;
  if (!(window as any).html2canvas) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('html2canvas failed to load'));
      document.body.appendChild(s);
    });
  }
  const canvas = await (window as any).html2canvas(element, {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: null,
  });
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}

// ─── Component ────────────────────────────────────────────────────────────────

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  index = 0,
  eventMeta = {},
  showDownload = true,
  idPrefix = 'ticket-card',
}) => {
  // Resolve event fields — prefer ticket.event, fall back to eventMeta
  const eventName  = eventMeta.eventName   ?? ticket.event?.title    ?? 'Event';
  const eventDate  = eventMeta.eventDate   ?? ticket.event?.startDate;
  const eventTime  = eventMeta.eventTime   ?? '';
  const eventLoc   = eventMeta.eventLocation ?? ticket.event?.location ?? '';
  const bannerImg  = eventMeta.eventImageUrl ?? ticket.event?.imageUrl
    ?? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

  const typeName  = ticket.ticketType?.name ?? eventMeta.ticketType ?? 'General Admission';
  const serial    = getTicketSerial(ticket, index, eventMeta.eventId);
  const qrValue   = ticket.qrCode || serial;
  const style     = getTicketStyle(typeName);
  const { firstWord, rest } = splitTitle(eventName);
  const formattedDate = formatTicketDate(eventDate);
  const cardId    = `${idPrefix}-${serial}`;

  const handleDownload = () =>
    downloadTicketCard(cardId, `ticket-${serial}.png`).catch(() =>
      alert('Failed to download ticket PNG. Please save/print the page instead.')
    );

    const isMobile = useIsMobile()

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      {/* ── Ticket Card (screenshot target) ─────────────────────────────── */}
      <div
        id={cardId}
        className={`relative w-full flex flex-col md:flex-row bg-neutral-900 border ${style.borderColor} rounded-none sm:rounded-[32px] overflow-hidden shadow-lg group`}
      >
        {/* Left stub — event cover + text */}
        <div className="relative flex-1 p-4 sm:p-8 flex flex-col justify-between overflow-hidden text-white min-h-[210px] sm:min-h-[250px] md:min-h-[270px]">
          {/* Background image + gradient overlays */}
          <div className="absolute inset-0 z-0">
            <img
              src={bannerImg}
              alt={eventName}
              className="w-full h-full object-cover brightness-90 saturate-110"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/35 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />
          </div>

          {/* Text content */}
          <div className="relative z-20 flex flex-col justify-between h-full">
            <div>
              <p className="text-[9px] md:text-xs font-black tracking-[0.25em] text-neutral-400 uppercase font-mono">
                COME AND JOIN
              </p>
              <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none mt-2 sm:mt-3 uppercase drop-shadow-md">
                <span className={style.accentColor}>{firstWord}</span>{' '}
                <span className="text-white">{rest}</span>
              </h3>
            </div>

            <div className="mt-3 sm:mt-4">
              <p className="text-[8px] sm:text-[9px] font-black tracking-widest text-neutral-400 font-mono">LIVE AT</p>
              <h4 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white uppercase mt-0.5">
                {eventLoc || 'Venue TBA'}
              </h4>
            </div>

            <div className="mt-6 sm:mt-8 border-t border-white/10 pt-3 flex flex-wrap gap-y-1.5 gap-x-4 sm:gap-x-6 text-[9px] sm:text-[10px] md:text-xs text-white/70">
              {eventTime && (
                <div>
                  <span className="text-[8px] font-bold text-neutral-400 font-mono block">TIME</span>
                  <p className="font-extrabold text-white uppercase font-mono mt-0.5">{eventTime}</p>
                </div>
              )}
              <div className={eventTime ? 'pl-3 sm:pl-4 border-l border-white/10' : ''}>
                <span className="text-[8px] font-bold text-neutral-400 font-mono block">DATE</span>
                <p className="font-extrabold text-white uppercase font-mono mt-0.5">{formattedDate || 'TBA'}</p>
              </div>
              <div className="pl-3 sm:pl-4 border-l border-white/10">
                <span className="text-[8px] font-bold text-neutral-400 font-mono block">CODE</span>
                <p className="font-extrabold text-white uppercase font-mono mt-0.5">{serial}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tear separator — vertical (md+) */}
        <div className="hidden md:flex flex-col justify-between items-end py-4 relative bg-neutral-900 shrink-0">
          <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 -mt-8 -mr-[16px] z-30" />
          <div className="border-l-2 border-dashed border-neutral-200 h-full my-0.5 z-30" />
          <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 -mb-8 -mr-[16px] z-30" />
        </div>

        {/* Tear separator — horizontal (mobile) */}
        <div className="flex md:hidden items-end px-2 relative bg-neutral-900 shrink-0">
          <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 -ml-8 -mb-[16px] z-30" />
          <div className="border-t-2 border-dashed border-neutral-200 w-full mx-0.5 z-30" />
          <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 -mr-8 -mb-[16px] z-30" />
        </div>

        {/* Right scan stub */}
        <div className={`w-full md:w-60 h-[250px] sm:h-full p-2 sm:p-6 flex flex-col md:flex-col justify-between items-center ${style.sideBg} relative shrink-0 text-black`}>
          <div className="absolute inset-0 bg-black/5 pointer-events-none" />

          {/* Ticket type badge */}
          <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase bg-black text-white mb-0 md:mb-4 shadow-sm z-10">
            {typeName}
          </span>

          {/* QR code — always rendered from the identifier string */}
          <div className="bg-white p-2 rounded-xl shadow-md transition-transform group-hover:scale-[1.02] z-10">
            <QRCodeSVG
              value={qrValue}
              size={160}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>

          {/* Scan labels */}
          <div className="text-righ md:text-center mt-0 md:mt-4 z-10">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-85 font-mono">SCAN TO ENTRY</p>
            <p className="text-[7px] font-mono opacity-60 mt-0.5 text-center">ADMIT ONE</p>
          </div>
        </div>
      </div>

      {/* ── Download action ──────────────────────────────────────────────── */}
      {showDownload && (
        <div className="flex justify-end gap-2 px-4 sm:px-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 px-4 py-2 rounded-full transition-all border border-neutral-200 dark:border-neutral-800 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Download Pass PNG
          </button>
        </div>
      )}
    </div>
  );
};

export default TicketCard;
