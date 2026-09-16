import React from 'react';
import QRCode from 'qrcode.react';
import { Plane } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  resolveTicketStyle,
  type TicketLayoutId,
} from '../../data/ticketDesigns';

export interface EventTicketCardProps {
  eventName: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventImageUrl?: string;
  ticketType?: {
    name?: string;
    ticketStyle?: string | null;
    accentColor?: string | null;
    badgeText?: string | null;
    ticketHeadline?: string | null;
    venueLabel?: string | null;
  };
  ticketSerial?: string;
  qrValue?: string;
  qrCodeImage?: string | null;
  compact?: boolean;
  id?: string;
}

/** Pick black or white text for contrast on a hex background */
function inkOn(hex: string): '#ffffff' | '#0a0a0a' {
  const raw = hex.replace('#', '');
  if (raw.length < 6) return '#ffffff';
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  // Relative luminance
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.55 ? '#0a0a0a' : '#ffffff';
}

function formatTicketDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const ordinals = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    const suffix = ordinals[(v - 20) % 10] || ordinals[v] || ordinals[0];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${day}${suffix} | ${months[date.getMonth()].toUpperCase()} | ${date.getFullYear()}`;
  } catch {
    return dateString;
  }
}

function formatShortDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  } catch {
    return dateString;
  }
}

function formatPrettyDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) return { firstWord: title, restOfTitle: '' };
  return { firstWord: words[0], restOfTitle: words.slice(1).join(' ') };
}

function QrBlock({
  qrCodeImage,
  qrValue,
  size,
}: {
  qrCodeImage?: string | null;
  qrValue: string;
  size: number;
}) {
  if (qrCodeImage) {
    return (
      <img
        src={qrCodeImage}
        alt="QR"
        className="object-contain"
        style={{ width: size, height: size }}
        crossOrigin="anonymous"
      />
    );
  }
  // Canvas rasterizes cleanly with html2canvas (SVG often mis-sizes / clips).
  return <QRCode value={qrValue} size={size} renderAs="canvas" includeMargin={false} level="M" />;
}

/** Pill badge — flex + line-height 1 keeps label vertically centered (no top gap). */
function TicketBadge({
  label,
  style,
  className = '',
}: {
  label: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0 z-10 max-w-full ${className}`}
      style={{
        lineHeight: 1,
        ...style,
      }}
    >
      <span className="leading-none" style={{ lineHeight: 1 }}>
        {label}
      </span>
    </span>
  );
}

type LayoutProps = EventTicketCardProps & {
  accent: string;
  borderColor: string;
  badgeLabel: string;
};

/**
 * Classic — desktop: horizontal image pass; mobile: vertical black/accent stub.
 */
function ClassicLayout(props: LayoutProps) {
  const {
    eventName,
    eventDate,
    eventLocation = 'Venue TBA',
    eventImageUrl,
    ticketType,
    ticketSerial = 'TKT-PREVIEW',
    qrValue = 'preview-ticket',
    qrCodeImage,
    compact = false,
    id,
    accent,
    borderColor,
    badgeLabel,
  } = props;
  const isMobile = useIsMobile();
  const split = splitTitle(eventName);
  const formattedDate = formatTicketDate(eventDate);
  const onAccent = inkOn(accent);
  const bannerImage =
    eventImageUrl ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80';
  const mobileQr = 148;
  const desktopQr = compact ? 72 : 160;
  const badgePill = {
    backgroundColor: onAccent === '#ffffff' ? '#0a0a0a' : '#ffffff',
    color: onAccent === '#ffffff' ? '#ffffff' : '#0a0a0a',
  } as const;

  /* Compact preview: same shell scale as Concert (max-w-xl, p-4, QR 72). */
  if (compact) {
    return (
      <div
        id={id}
        className={`relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-xl border bg-neutral-900 group ${borderColor}`}
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative flex-1 min-w-0 p-4 overflow-hidden text-white">
            <div className="absolute inset-0 z-0">
              <img
                src={bannerImage}
                alt={eventName}
                className="w-full h-full object-cover brightness-90 saturate-110"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/35 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />
            </div>

            <div className="relative z-10">
              <p className="text-[9px] font-black tracking-[0.25em] text-neutral-400 uppercase font-mono">
                {ticketType?.ticketHeadline?.trim() || 'COME AND JOIN'}
              </p>
              <h3 className="text-2xl font-extrabold tracking-tight leading-none mt-3 uppercase drop-shadow-md">
                <span style={{ color: accent }}>{split.firstWord}</span>
                {split.restOfTitle ? (
                  <>
                    {' '}
                    <span className="text-white">{split.restOfTitle}</span>
                  </>
                ) : null}
              </h3>

              <div className="mt-3">
                <p className="text-[8px] font-black tracking-widest text-neutral-400 font-mono">
                  {ticketType?.venueLabel?.trim() || 'LIVE AT'}
                </p>
                <p className="text-xs font-black tracking-tight text-white uppercase mt-0.5 line-clamp-2">
                  {eventLocation}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px]">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/45 font-mono">Date</p>
                  <p className="font-extrabold text-white uppercase font-mono mt-0.5">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/45 font-mono">Code</p>
                  <p className="font-extrabold text-white uppercase font-mono mt-0.5">{ticketSerial}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-0 sm:h-auto sm:w-0 shrink-0" aria-hidden>
            <div className="sm:hidden absolute left-0 right-0 top-1/2 -translate-y-1/2">
              <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950" />
              <div className="absolute right-0 translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950" />
              <div className="mx-4 border-t-2 border-dashed border-white/25" />
            </div>
            <div className="hidden sm:block absolute inset-y-0 left-0">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 z-20" />
              <div className="absolute inset-y-3 left-0 border-l-2 border-dashed border-white/25" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 z-20" />
            </div>
          </div>

          <div
            className="sm:w-[34%] sm:min-w-[120px] sm:max-w-[168px] p-4 flex flex-row sm:flex-col items-center justify-between gap-3 text-center relative shrink-0"
            style={{ backgroundColor: accent, color: onAccent }}
          >
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            <TicketBadge label={badgeLabel} style={badgePill} />
            <div className="bg-white p-2 rounded-xl shadow-md z-10 shrink-0">
              <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={desktopQr} />
            </div>
            <div className="shrink-0 z-10">
              <p className="text-[9px] font-black tracking-[0.22em] uppercase opacity-85 font-mono">
                Scan to entry
              </p>
              <p className="text-[10px] font-extrabold mt-0.5 tracking-wide font-mono">ADMIT ONE</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only ONE layout in the DOM — prevents double-ticket PNG downloads.
  if (isMobile) {
    return (
      <div
        id={id}
        className="relative w-full max-w-[340px] mx-auto flex flex-col overflow-hidden shadow-xl"
        style={{ borderRadius: 4 }}
      >
        <div className="relative bg-black text-white px-5 pt-5 pb-6">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/75 font-mono">
            {ticketType?.ticketHeadline?.trim() || 'COME AND JOIN'}
          </p>
          <h3 className="mt-3 text-[1.55rem] leading-[1.1] font-extrabold uppercase tracking-tight break-words">
            <span style={{ color: accent }}>{split.firstWord}</span>
            {split.restOfTitle ? (
              <>
                {' '}
                <span className="text-white">{split.restOfTitle}</span>
              </>
            ) : null}
          </h3>

          <div className="mt-5 min-w-0">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 font-mono">
              {ticketType?.venueLabel?.trim() || 'LIVE AT'}
            </p>
            <p className="mt-1 text-sm font-extrabold uppercase tracking-wide text-white break-words">
              {eventLocation}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/50 font-mono">Date</p>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-white font-mono leading-snug break-words">
                {formattedDate}
              </p>
            </div>
            <div className="border-l border-white/15 pl-3 min-w-0">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/50 font-mono">Code</p>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-white font-mono break-all">
                {ticketSerial}
              </p>
            </div>
          </div>
        </div>

        <div className="relative h-0 z-10" aria-hidden>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-neutral-50 dark:bg-neutral-950" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-neutral-50 dark:bg-neutral-950" />
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/80" />
        </div>

        <div
          className="px-5 pt-7 pb-6 flex flex-col items-center text-center"
          style={{ backgroundColor: accent, color: onAccent }}
        >
          <TicketBadge label={badgeLabel} style={badgePill} className="px-3.5" />
          <div className="mt-4 bg-white p-3 rounded-2xl shadow-lg">
            <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={mobileQr} />
          </div>
          <p className="mt-4 text-xs font-black tracking-[0.22em] uppercase opacity-90 font-mono">
            Scan to entry
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.18em] uppercase opacity-75 font-mono">
            Admit one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`relative w-full flex flex-row bg-neutral-900 ${borderColor} border rounded-[32px] overflow-hidden shadow-lg group`}
    >
      <div className="relative flex-1 min-w-0 p-6 lg:p-8 flex flex-col justify-between overflow-hidden text-white min-h-[270px]">
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImage}
            alt={eventName}
            className="w-full h-full object-cover brightness-90 saturate-110"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/35 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />
        </div>

        <div className="relative z-20 flex flex-col justify-between h-full min-w-0 gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black tracking-[0.22em] text-neutral-300 uppercase font-mono">
              {ticketType?.ticketHeadline?.trim() || 'COME AND JOIN'}
            </p>
            <h3 className="text-2xl lg:text-4xl font-extrabold tracking-tight leading-[1.08] mt-3 uppercase drop-shadow-md break-words">
              <span style={{ color: accent }}>{split.firstWord}</span>
              {split.restOfTitle ? (
                <>
                  {' '}
                  <span className="text-white">{split.restOfTitle}</span>
                </>
              ) : null}
            </h3>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-widest text-neutral-300 font-mono">
              {ticketType?.venueLabel?.trim() || 'LIVE AT'}
            </p>
            <h4 className="text-base lg:text-lg font-black tracking-tight text-white uppercase mt-0.5 break-words">
              {eventLocation}
            </h4>
          </div>

          <div className="border-t border-white/10 pt-3 flex flex-wrap gap-y-2 gap-x-6 text-xs text-white/80">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-neutral-300 font-mono block">DATE</span>
              <p className="font-extrabold text-white uppercase font-mono mt-0.5 text-[11px] lg:text-xs break-words">
                {formattedDate}
              </p>
            </div>
            <div className="pl-4 border-l border-white/10 min-w-0">
              <span className="text-[10px] font-bold text-neutral-300 font-mono block">CODE</span>
              <p className="font-extrabold text-white uppercase font-mono mt-0.5 text-[11px] lg:text-xs break-all">
                {ticketSerial}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between items-end py-4 relative bg-neutral-900 shrink-0" aria-hidden>
        <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 -mt-8 -mr-[16px] z-30" />
        <div className="border-l-2 border-dashed border-neutral-200 h-full my-0.5 z-30" />
        <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 -mb-8 -mr-[16px] z-30" />
      </div>

      <div
        className="w-52 lg:w-60 p-5 lg:p-6 flex flex-col justify-between items-center relative shrink-0"
        style={{ backgroundColor: accent, color: onAccent }}
      >
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        <TicketBadge label={badgeLabel} style={badgePill} className="mb-4 shadow-sm" />
        <div className="bg-white p-2 rounded-xl shadow-md z-10">
          <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={desktopQr} />
        </div>
        <div className="text-center mt-4 z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-90 font-mono">
            Scan to entry
          </p>
          <p className="text-[10px] font-mono opacity-75 mt-1">Admit one</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Celebration — wedding/birthday boarding pass (mustard rail + cream body + RSVP stub).
 * Dark ink on paper for readable contrast at every accent.
 */
function BoardingLayout(props: LayoutProps) {
  const {
    eventName,
    eventDate,
    eventTime = '4:00 PM',
    eventLocation = 'Venue TBA',
    ticketType,
    ticketSerial = 'TKT-PREVIEW',
    qrValue = 'preview-ticket',
    qrCodeImage,
    compact = false,
    id,
    accent,
    badgeLabel,
  } = props;
  const prettyDate = formatPrettyDate(eventDate);
  const shortDate = formatShortDate(eventDate);
  const ink = '#2c1810';
  const muted = '#5a4032';
  const paper = '#fffaf2';
  const railInk = inkOn(accent);
  const heroLine = ticketType?.ticketHeadline?.trim() || 'Save the date';
  const qrSize = compact ? 84 : 100;
  const seatCode = ticketSerial.replace(/^TKT-?/i, '').slice(0, 6) || '08/23';

  const fields = [
    { label: 'Date', value: prettyDate },
    { label: ticketType?.venueLabel?.trim() || 'Destination', value: eventLocation },
    { label: 'Time', value: eventTime },
    { label: 'Code', value: ticketSerial },
  ];

  return (
    <div
      id={id}
      className="relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-[#e6d5c3] min-w-0"
      style={{ backgroundColor: paper, color: ink }}
    >
      <div data-ticket-body className="flex flex-col sm:flex-row min-h-0">
        {/* Accent rail — top strip on mobile, left spine on desktop */}
        <div
          className="sm:w-12 shrink-0 flex items-center justify-center px-3 py-2.5 sm:py-5 sm:px-1.5 overflow-hidden"
          style={{ backgroundColor: accent, color: railInk }}
        >
          <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-center sm:rotate-[-90deg] sm:whitespace-nowrap sm:origin-center leading-tight">
            Love is in the air
          </p>
        </div>

        {/* Main boarding body */}
        <div className={`relative flex-1 min-w-0 ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold tracking-[0.28em] uppercase"
                style={{ color: muted }}
              >
                Boarding Pass
              </p>
              <h3
                data-ticket-text
                className={`${compact ? 'text-[1.75rem]' : 'text-[2rem] sm:text-[2.5rem]'} leading-[1.12] mt-1 break-words`}
                style={{
                  fontFamily: '"Great Vibes", "Cormorant Garamond", cursive',
                  color: ink,
                }}
              >
                {heroLine}
              </h3>
            </div>
            <div
              className="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 shrink-0"
              style={{ borderColor: accent, color: ink }}
              aria-hidden
            >
              <span className="text-[8px] font-bold tracking-wider uppercase" style={{ color: muted }}>
                Event
              </span>
              <span className="text-[10px] font-black leading-tight text-center px-1">
                {shortDate}
              </span>
            </div>
          </div>

          {/* Flight path + plane */}
          <div className="mt-1 flex items-center gap-2" aria-hidden>
            <div
              className="flex-1 border-t border-dashed opacity-70"
              style={{ borderColor: accent }}
            />
            <Plane className="w-4 h-4 rotate-45 shrink-0" style={{ color: accent }} strokeWidth={2.25} />
          </div>

          <p
            className="mt-3 text-[10px] font-bold tracking-[0.18em] uppercase"
            style={{ color: muted }}
          >
            Together with their families
          </p>
          <p
            data-ticket-text
            className={`${compact ? 'text-xl' : 'text-2xl'} font-semibold mt-0.5 leading-snug break-words`}
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              color: ink,
            }}
          >
            {eventName}
          </p>
          <p
            className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: accent }}
          >
            {badgeLabel}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
            {fields.map((field) => (
              <div key={field.label} className="min-w-0">
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: muted }}
                >
                  {field.label}
                </p>
                <p
                  data-ticket-text
                  className="mt-0.5 text-xs font-bold leading-snug break-words"
                  style={{ color: ink }}
                >
                  {field.value}
                </p>
              </div>
            ))}
          </div>

          {/* Decorative barcode */}
          <div className="mt-4 flex items-end gap-[1.5px] h-6 opacity-60" aria-hidden>
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i % 4 === 0 ? 2.5 : 1.25,
                  height: `${35 + ((i * 13) % 65)}%`,
                  backgroundColor: ink,
                }}
              />
            ))}
          </div>
        </div>

        {/* Perforation — horizontal mobile / vertical desktop */}
        <div className="relative h-0 sm:hidden">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950" />
          <div
            className="absolute left-3 right-3 top-1/2 -translate-y-1/2 border-t border-dashed"
            style={{ borderColor: `${accent}99` }}
          />
        </div>
        <div className="hidden sm:block w-0 relative shrink-0 self-stretch">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 z-20" />
          <div
            className="absolute inset-y-3 left-0 border-l border-dashed"
            style={{ borderColor: `${accent}99` }}
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 z-20" />
        </div>

        {/* RSVP stub */}
        <div
          className={`sm:w-[34%] sm:min-w-[132px] sm:max-w-[168px] ${compact ? 'p-4' : 'p-5'} flex flex-col items-center justify-center text-center shrink-0`}
          style={{ backgroundColor: `${accent}18` }}
        >
          <p
            className="text-sm font-black tracking-[0.24em] uppercase"
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              color: ink,
            }}
          >
            RSVP
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>
            {prettyDate}
          </p>
          <div
            className="mt-3 bg-white p-2 rounded-lg shadow-sm border"
            style={{ borderColor: `${accent}44` }}
          >
            <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={qrSize} />
          </div>
          <p
            data-ticket-text
            className="mt-2 text-[10px] font-mono font-bold tracking-wider break-all"
            style={{ color: ink }}
          >
            SEAT {seatCode}
          </p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: muted }}>
            Formal invite to follow
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Concert stub — bold nightlife / festival pass (distinct from Classic).
 * Horizontal stage-pass energy with neon accent strip.
 */
function StubLayout(props: LayoutProps) {
  const {
    eventName,
    eventDate,
    eventTime = '7:00 PM',
    eventLocation = 'Venue TBA',
    eventImageUrl,
    ticketType,
    ticketSerial = 'TKT-PREVIEW',
    qrValue = 'preview-ticket',
    qrCodeImage,
    compact = false,
    id,
    accent,
    badgeLabel,
  } = props;
  const split = splitTitle(eventName);
  const shortDate = formatShortDate(eventDate);
  const onAccent = inkOn(accent);
  const bannerImage =
    eventImageUrl ||
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80';
  const qrSize = compact ? 72 : 88;

  return (
    <div
      id={id}
      className={`relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-[#0b0b12] text-white min-w-0`}
    >
      {/* Neon top rail */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

      <div data-ticket-body className="flex flex-col sm:flex-row">
        <div className={`relative flex-1 min-w-0 ${compact ? 'p-4' : 'p-5 sm:p-6'} overflow-hidden`}>
          <div className="absolute inset-0 opacity-30">
            <img
              src={bannerImage}
              alt=""
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b12] via-[#0b0b12]/92 to-[#0b0b12]/50" />
          </div>

          {/* Diagonal accent slash */}
          <div
            className="pointer-events-none absolute -right-8 top-0 h-full w-16 rotate-12 opacity-40"
            style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }}
          />

          <div className="relative z-10 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2 py-0.5 text-[10px] font-black tracking-[0.2em] uppercase rounded max-w-full truncate"
                style={{ backgroundColor: accent, color: onAccent }}
              >
                {ticketType?.ticketHeadline?.trim() || 'LIVE SHOW'}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-white/55">
                Stage pass
              </span>
            </div>

            <h3
              data-ticket-text
              className={`${compact ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-black uppercase leading-[1.05] mt-3 tracking-tight break-words`}
              style={{ fontFamily: '"Oswald", ui-sans-serif, system-ui, sans-serif' }}
            >
              <span style={{ color: accent }}>{split.firstWord}</span>
              {split.restOfTitle ? (
                <>
                  {' '}
                  <span className="text-white">{split.restOfTitle}</span>
                </>
              ) : null}
            </h3>

            <p
              data-ticket-text
              className="mt-3 text-sm font-bold uppercase tracking-wide text-white/90 break-words"
            >
              {eventLocation}
            </p>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Date</p>
                <p data-ticket-text className="font-extrabold text-white mt-0.5 break-words">
                  {shortDate}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Doors</p>
                <p className="font-extrabold text-white mt-0.5">{eventTime}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Code</p>
                <p
                  data-ticket-text
                  className="font-extrabold font-mono text-white mt-0.5 break-all"
                >
                  {ticketSerial}
                </p>
              </div>
            </div>

            {/* Fake barcode stripes */}
            <div className="mt-5 flex items-end gap-[2px] h-7 opacity-70" aria-hidden>
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/80"
                  style={{
                    width: i % 5 === 0 ? 3 : 1.5,
                    height: `${40 + ((i * 17) % 60)}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tear */}
        <div className="relative h-0 sm:h-auto sm:w-0 shrink-0">
          <div className="sm:hidden absolute left-0 right-0 top-1/2 -translate-y-1/2">
            <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950" />
            <div className="absolute right-0 translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950" />
            <div className="mx-4 border-t-2 border-dashed border-white/25" />
          </div>
          <div className="hidden sm:block absolute inset-y-0 left-0">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 z-20" />
            <div className="absolute inset-y-3 left-0 border-l-2 border-dashed border-white/25" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 z-20" />
          </div>
        </div>

        {/* Stub */}
        <div
          className={`sm:w-[34%] sm:min-w-[120px] sm:max-w-[168px] ${compact ? 'p-4' : 'p-5'} flex flex-row sm:flex-col items-center justify-between gap-3 text-center shrink-0`}
          style={{ backgroundColor: accent, color: onAccent }}
        >
          <TicketBadge
            label={badgeLabel}
            style={{
              backgroundColor: onAccent === '#ffffff' ? '#0a0a0a' : '#ffffff',
              color: onAccent === '#ffffff' ? '#ffffff' : '#0a0a0a',
            }}
          />
          <div className="bg-white p-2 rounded-xl shadow-md shrink-0" data-ticket-qr>
            <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={qrSize} />
          </div>
          <div className="shrink-0">
            <p className="text-[10px] font-black tracking-[0.18em] uppercase opacity-90">
              Tear & keep
            </p>
            <p className="text-xs font-extrabold mt-0.5 tracking-wide">ADMIT ONE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const LAYOUTS: Record<
  TicketLayoutId,
  React.FC<LayoutProps>
> = {
  classic: ClassicLayout,
  boarding: BoardingLayout,
  stub: StubLayout,
};

const EventTicketCard: React.FC<EventTicketCardProps> = (props) => {
  const style = resolveTicketStyle(props.ticketType);
  const Layout = LAYOUTS[style.layout] || ClassicLayout;
  return (
    <Layout
      {...props}
      accent={style.accent}
      borderColor={style.borderColor}
      badgeLabel={style.badgeLabel}
    />
  );
};

export default EventTicketCard;
