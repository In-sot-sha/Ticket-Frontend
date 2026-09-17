import React from 'react';
import QRCode from 'qrcode.react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  resolveTicketStyle,
  resolveTicketCopy,
  type TicketLayoutId,
} from '../../data/ticketDesigns';
import { resolveImageUrl } from '../../lib/media';

export interface TicketCopyPatch {
  ticketHeadline?: string;
  venueLabel?: string;
  ticketSublabel?: string;
  badgeText?: string;
}

export interface EventTicketCardProps {
  eventName: string;
  eventDate: string;
  /** Overrides formatted date (e.g. Fri 17 – Sun 19 Sep). */
  dateLabel?: string;
  /** Line under the date, e.g. "Only valid Fri 17 Sep." */
  validityNote?: string;
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
    ticketSublabel?: string | null;
  };
  ticketSerial?: string;
  qrValue?: string;
  qrCodeImage?: string | null;
  compact?: boolean;
  id?: string;
  editable?: boolean;
  onCopyChange?: (patch: TicketCopyPatch) => void;
  organizerName?: string | null;
  organizerLogo?: string | null;
  /** Always render the landscape pass (skip the stacked mobile stub). */
  forceLandscape?: boolean;
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

function shownDate(eventDate: string, dateLabel: string | undefined, fmt: (value: string) => string) {
  return dateLabel || fmt(eventDate);
}

function ValidityNote({ note, className }: { note?: string; className?: string }) {
  if (!note) return null;
  return (
    <p className={className || 'text-[9px] font-semibold opacity-70 mt-0.5 normal-case tracking-normal'}>
      {note}
    </p>
  );
}

function formatBoardDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
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

function EditableText({
  value,
  onCommit,
  enabled,
  className = '',
  style,
}: {
  value: string;
  onCommit: (next: string) => void;
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.textContent = value;
    }
  }, [value]);

  if (!enabled) {
    return (
      <span className={className} style={style}>
        {value}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      role="textbox"
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      title="Click to edit"
      className={`cursor-text rounded-sm outline-none hover:bg-black/10 focus:bg-black/10 focus:ring-1 focus:ring-current/40 ${className}`}
      style={style}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        const next = (e.currentTarget.textContent || '').replace(/\s+/g, ' ').trim();
        if (!next) {
          e.currentTarget.textContent = value;
          return;
        }
        e.currentTarget.textContent = next;
        if (next !== value) onCommit(next);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {value}
    </span>
  );
}

function EditCopy({
  value,
  field,
  enabled,
  onCopyChange,
  className,
  style,
}: {
  value: string;
  field: keyof TicketCopyPatch;
  enabled?: boolean;
  onCopyChange?: EventTicketCardProps['onCopyChange'];
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <EditableText
      value={value}
      enabled={enabled}
      onCommit={(next) => onCopyChange?.({ [field]: next })}
      className={className}
      style={style}
    />
  );
}

function TearStrip({ color, holeClass }: { color: string; holeClass: string }) {
  return (
    <>
      <div className="relative h-0 sm:hidden" aria-hidden>
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full ${holeClass}`} />
        <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full ${holeClass}`} />
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 border-t border-dashed" style={{ borderColor: color }} />
      </div>
      <div className="hidden sm:block w-0 relative shrink-0 self-stretch" aria-hidden>
        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-20 ${holeClass}`} />
        <div className="absolute inset-y-3 left-0 border-l border-dashed" style={{ borderColor: color }} />
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-20 ${holeClass}`} />
      </div>
    </>
  );
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

function HostBadge({
  logo,
  name,
}: {
  logo?: string | null;
  name?: string | null;
}) {
  const src = resolveImageUrl(logo);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-cover bg-white shrink-0"
        crossOrigin="anonymous"
      />
    );
  }
  if (!name) return null;
  return (
    <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/15 text-sm font-black text-white shrink-0">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Pill badge — flex + line-height 1 keeps label vertically centered (no top gap). */
function TicketBadge({
  label,
  style,
  className = '',
  editable,
  onCommit,
}: {
  label: string;
  style?: React.CSSProperties;
  className?: string;
  editable?: boolean;
  onCommit?: (next: string) => void;
}) {
  return (
    <span
      data-ticket-badge
      className={`inline-flex h-[22px] items-center justify-center rounded-full px-3 text-[10px] font-bold uppercase leading-none shrink-0 z-10 max-w-full text-center ${className}`}
      style={style}
    >
      {editable && onCommit ? (
        <EditableText
          value={label}
          enabled
          onCommit={onCommit}
          className="leading-none"
          style={{ lineHeight: 1 }}
        />
      ) : (
        label
      )}
    </span>
  );
}

/** In-flow stack html2canvas can rasterize without overlapping lines. */
function CopyStack({
  kicker,
  title,
  venueLabel,
  venue,
  meta,
  className = '',
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  venueLabel?: React.ReactNode;
  venue?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-3 ${className}`}>
      {kicker}
      <div className="min-w-0">{title}</div>
      {venueLabel || venue ? (
        <div className="flex min-w-0 flex-col gap-1">
          {venueLabel}
          {venue}
        </div>
      ) : null}
      {meta}
    </div>
  );
}

type LayoutProps = EventTicketCardProps & {
  accent: string;
  borderColor: string;
  badgeLabel: string;
  copy: { headline: string; sublabel: string; venueLabel: string };
};

/**
 * Classic — desktop: horizontal image pass; mobile: vertical black/accent stub.
 */
function ClassicLayout(props: LayoutProps) {
  const {
    eventName,
    eventDate,
    dateLabel,
    validityNote,
    eventTime,
    eventLocation = 'Venue TBA',
    eventImageUrl,
    ticketType,
    qrValue = 'preview-ticket',
    qrCodeImage,
    compact = false,
    id,
    accent,
    borderColor,
    badgeLabel,
    copy,
    editable,
    onCopyChange,
    organizerLogo,
    organizerName,
    forceLandscape = false,
  } = props;
  const isMobile = useIsMobile();
  const split = splitTitle(eventName);
  const formattedDate = shownDate(eventDate, dateLabel, formatTicketDate);
  const onAccent = inkOn(accent);
  const bannerImage =
    eventImageUrl ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80';
  const mobileQr = 96;
  const desktopQr = compact ? 72 : 108;
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
        <div className="flex flex-row items-stretch">
          <div data-ticket-photo className="relative flex flex-1 min-w-0 flex-col items-start justify-start p-4 overflow-hidden text-white">
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

            <div className="relative z-10 w-full min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-black tracking-[0.25em] text-neutral-400 uppercase font-mono">
                  <EditCopy value={copy.headline} field="ticketHeadline" enabled={editable} onCopyChange={onCopyChange} />
                </p>
                <HostBadge logo={organizerLogo} name={organizerName} />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight leading-none mt-3 uppercase drop-shadow-md">
                <span style={{ color: accent }}>{split.firstWord}</span>
                {split.restOfTitle ? (
                  <>
                    {' '}
                    <span className="text-white">{split.restOfTitle}</span>
                  </>
                ) : null}
              </h3>

              <div className="mt-3 flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase text-neutral-400">
                  <EditCopy value={copy.venueLabel} field="venueLabel" enabled={editable} onCopyChange={onCopyChange} />
                </p>
                <p className="text-xs font-black text-white uppercase">
                  {eventLocation}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px]">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/45 font-mono">Date</p>
                  <p className="font-extrabold text-white uppercase font-mono mt-0.5">{formattedDate}</p>
                  <ValidityNote note={validityNote} className="text-[8px] font-semibold text-white/55 mt-0.5 normal-case tracking-normal" />
                </div>
                {eventTime ? (
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/45 font-mono">Time</p>
                    <p className="font-extrabold text-white uppercase font-mono mt-0.5">{eventTime}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative w-0 shrink-0" aria-hidden>
            <div className="absolute inset-y-0 left-0">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 z-20" />
              <div className="absolute inset-y-3 left-0 border-l-2 border-dashed border-white/25" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 z-20" />
            </div>
          </div>

          <div
            className="w-[34%] min-w-[120px] max-w-[168px] p-4 flex flex-col items-center justify-between gap-3 text-center relative shrink-0"
            style={{ backgroundColor: accent, color: onAccent }}
          >
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            <TicketBadge
              label={badgeLabel}
              style={badgePill}
              editable={editable}
              onCommit={(v) => onCopyChange?.({ badgeText: v })}
            />
            <div className="bg-white p-2 rounded-xl shadow-md z-10 shrink-0">
              <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={desktopQr} />
            </div>
            <div className="shrink-0 z-10">
              <p className="text-[9px] font-black tracking-[0.22em] uppercase opacity-85 font-mono">
                Scan to entry
              </p>
              <p className="text-[10px] font-extrabold mt-0.5 tracking-wide font-mono">
                <EditCopy value={copy.sublabel} field="ticketSublabel" enabled={editable} onCopyChange={onCopyChange} />
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Portrait pass — photo, details, then QR. Readable type, no tight tracking.
  if (isMobile && !forceLandscape) {
    return (
      <div
        id={id}
        className={`relative w-full max-w-md mx-auto flex flex-col overflow-hidden rounded-2xl shadow-xl border bg-neutral-900 ${borderColor}`}
      >
        <div className="relative text-white min-h-[240px]">
          <img
            src={bannerImage}
            alt={eventName}
            className="absolute inset-0 h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30" />
          <div className="relative z-10 p-5 pb-6">
            <CopyStack
              kicker={
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase text-white/70">
                    <EditCopy value={copy.headline} field="ticketHeadline" enabled={editable} onCopyChange={onCopyChange} />
                  </p>
                  <HostBadge logo={organizerLogo} name={organizerName} />
                </div>
              }
              title={
                <h3 className="text-[1.75rem] font-extrabold uppercase leading-tight">
                  <span style={{ color: accent }}>{split.firstWord}</span>
                  {split.restOfTitle ? (
                    <>
                      {' '}
                      <span className="text-white">{split.restOfTitle}</span>
                    </>
                  ) : null}
                </h3>
              }
              venueLabel={
                <p className="text-[11px] font-bold uppercase text-white/50">
                  <EditCopy value={copy.venueLabel} field="venueLabel" enabled={editable} onCopyChange={onCopyChange} />
                </p>
              }
              venue={<p className="text-sm font-semibold leading-snug text-white">{eventLocation}</p>}
              meta={
                <div className={`grid gap-3 ${eventTime ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <p className="text-[11px] font-semibold text-white/50">Date</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{formattedDate}</p>
                    <ValidityNote note={validityNote} className="text-[10px] font-semibold text-white/55 mt-0.5 normal-case" />
                  </div>
                  {eventTime ? (
                    <div>
                      <p className="text-[11px] font-semibold text-white/50">Time</p>
                      <p className="mt-0.5 text-sm font-bold text-white">{eventTime}</p>
                    </div>
                  ) : null}
                </div>
              }
            />
          </div>
        </div>

        <div className="relative h-0 z-10" aria-hidden>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-neutral-50 dark:bg-neutral-950" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-neutral-50 dark:bg-neutral-950" />
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/50" />
        </div>

        <div
          className="px-5 pt-3 pb-3 flex flex-col items-center text-center"
          style={{ backgroundColor: accent, color: onAccent }}
        >
          <TicketBadge
            label={badgeLabel}
            style={badgePill}
            className="px-3.5"
            editable={editable}
            onCommit={(v) => onCopyChange?.({ badgeText: v })}
          />
          <div className="mt-2 bg-white p-1.5 rounded-xl shadow-lg">
            <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={mobileQr} />
          </div>
          <p className="mt-1.5 text-[11px] font-bold uppercase opacity-90">Scan to enter</p>
          <p className="mt-0.5 text-[11px] font-semibold opacity-80">
            <EditCopy value={copy.sublabel} field="ticketSublabel" enabled={editable} onCopyChange={onCopyChange} />
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
      <div data-ticket-photo className="relative flex-1 min-w-0 p-6 lg:p-8 flex flex-col items-start justify-start overflow-hidden text-white min-h-[270px]">
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

        <div className="relative z-20 w-full min-w-0">
            <CopyStack
              kicker={
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase text-neutral-300">
                    <EditCopy value={copy.headline} field="ticketHeadline" enabled={editable} onCopyChange={onCopyChange} />
                  </p>
                  <HostBadge logo={organizerLogo} name={organizerName} />
                </div>
              }
              title={
                <h3 className="text-2xl lg:text-4xl font-extrabold leading-tight uppercase break-words">
                  <span style={{ color: accent }}>{split.firstWord}</span>
                  {split.restOfTitle ? (
                    <>
                      {' '}
                      <span className="text-white">{split.restOfTitle}</span>
                    </>
                  ) : null}
                </h3>
              }
              venueLabel={
                <p className="text-[10px] font-bold uppercase text-neutral-300">
                  <EditCopy value={copy.venueLabel} field="venueLabel" enabled={editable} onCopyChange={onCopyChange} />
                </p>
              }
              venue={
                <h4 className="text-base lg:text-lg font-extrabold text-white uppercase break-words">
                  {eventLocation}
                </h4>
              }
              meta={
                <div className="border-t border-white/10 pt-3 flex flex-wrap gap-y-2 gap-x-6 text-xs text-white/80">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-neutral-300 block">DATE</span>
                    <p className="font-extrabold text-white uppercase mt-0.5 text-[11px] lg:text-xs">
                      {formattedDate}
                    </p>
                    <ValidityNote note={validityNote} className="text-[9px] font-semibold text-white/55 mt-0.5 normal-case tracking-normal" />
                  </div>
                  {eventTime ? (
                    <div className="pl-4 border-l border-white/10 min-w-0">
                      <span className="text-[10px] font-bold text-neutral-300 block">TIME</span>
                      <p className="font-extrabold text-white uppercase mt-0.5 text-[11px] lg:text-xs">
                        {eventTime}
                      </p>
                    </div>
                  ) : null}
                </div>
              }
            />
        </div>
      </div>

      <div className="flex flex-col justify-between items-end py-4 relative bg-neutral-900 shrink-0" aria-hidden>
        <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 -mt-8 -mr-[16px] z-30" />
        <div className="border-l-2 border-dashed border-neutral-200 h-full my-0.5 z-30" />
        <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 -mb-8 -mr-[16px] z-30" />
      </div>

      <div
        className="w-40 lg:w-48 p-3 flex flex-col justify-center items-center gap-2.5 relative shrink-0"
        style={{ backgroundColor: accent, color: onAccent }}
      >
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        <TicketBadge
          label={badgeLabel}
          style={badgePill}
          className="shadow-sm"
          editable={editable}
          onCommit={(v) => onCopyChange?.({ badgeText: v })}
        />
        <div className="bg-white p-1.5 rounded-xl shadow-md z-10">
          <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={desktopQr} />
        </div>
        <div className="text-center z-10">
          <p className="text-[10px] font-bold uppercase opacity-90">
            Scan to entry
          </p>
          <p className="text-[10px] font-mono opacity-75 mt-1">
            <EditCopy value={copy.sublabel} field="ticketSublabel" enabled={editable} onCopyChange={onCopyChange} />
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Celebration — ivory first-class boarding pass.
 * Hierarchy: kicker → event name → date / time / venue → tear-off QR stub.
 */
function BoardingLayout(props: LayoutProps) {
  const {
    eventName,
    eventDate,
    dateLabel,
    validityNote,
    eventTime = '4:00 PM',
    eventLocation = 'Venue TBA',
    ticketType,
    qrValue = 'preview-ticket',
    qrCodeImage,
    compact = false,
    id,
    accent,
    badgeLabel,
    copy,
    editable,
    onCopyChange,
  } = props;
  const ink = '#2a1c12';
  const muted = '#7a5c48';
  const railInk = inkOn(accent);
  const qrSize = compact ? 86 : 102;
  const fields = [
    { label: 'Date', value: shownDate(eventDate, dateLabel, formatBoardDate), note: validityNote },
    { label: 'Time', value: eventTime },
    { label: copy.venueLabel, value: eventLocation, editableLabel: true as const },
  ];

  return (
    <div
      id={id}
      className={`relative w-full ${compact ? 'max-w-xl mx-auto' : ''} rounded-2xl overflow-hidden shadow-2xl min-w-0`}
      style={{
        background: 'linear-gradient(180deg, #fffdf8 0%, #f6ead8 100%)',
        color: ink,
        boxShadow: `0 18px 40px -18px ${accent}66, 0 8px 20px -12px rgba(42,28,18,0.35)`,
      }}
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: accent }} />
      <div
        className="pointer-events-none absolute inset-2 rounded-xl border opacity-25"
        style={{ borderColor: accent }}
        aria-hidden
      />

      <div data-ticket-body className="relative flex flex-col sm:flex-row min-h-0">
        <div className={`relative flex-1 min-w-0 ${compact ? 'px-5 py-4' : 'px-6 py-5'}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold tracking-[0.32em] uppercase" style={{ color: accent }}>
              <EditCopy value={copy.headline} field="ticketHeadline" enabled={editable} onCopyChange={onCopyChange} />
            </p>
            <p className="text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: muted }}>
              <EditCopy value={copy.sublabel} field="ticketSublabel" enabled={editable} onCopyChange={onCopyChange} />
            </p>
          </div>

          <h3
            data-ticket-text
            className={`${compact ? 'text-[1.7rem]' : 'text-[2rem] sm:text-[2.35rem]'} mt-2 leading-[1.12] break-words italic`}
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: ink }}
          >
            {eventName}
          </h3>

          <div className="my-3.5 flex items-center gap-2.5" aria-hidden>
            <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.4 }} />
            <span className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: accent }} />
            <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.4 }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {fields.map((field) => (
              <div key={field.label} className="min-w-0">
                <p className="text-[9px] font-semibold uppercase" style={{ color: muted }}>
                  {'editableLabel' in field && field.editableLabel ? (
                    <EditCopy value={copy.venueLabel} field="venueLabel" enabled={editable} onCopyChange={onCopyChange} />
                  ) : (
                    field.label
                  )}
                </p>
                <p data-ticket-text className="mt-1 text-xs font-semibold leading-snug break-words" style={{ color: ink }}>
                  {field.value}
                </p>
                {'note' in field && field.note ? (
                  <p className="mt-0.5 text-[9px] font-medium normal-case tracking-normal" style={{ color: muted }}>
                    {field.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-end gap-[1.5px] h-6 opacity-35" aria-hidden>
            {Array.from({ length: 42 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i % 5 === 0 ? 2.4 : 1.15,
                  height: `${38 + ((i * 17) % 62)}%`,
                  backgroundColor: ink,
                }}
              />
            ))}
          </div>
        </div>

        <TearStrip color={`${accent}99`} holeClass="bg-neutral-50 dark:bg-neutral-950" />

        <div
          className={`sm:w-[148px] sm:min-w-[132px] ${compact ? 'p-4' : 'p-5'} flex flex-col items-center justify-center text-center shrink-0 gap-3`}
          style={{ backgroundColor: accent, color: railInk }}
        >
          <TicketBadge
            label={badgeLabel}
            style={{
              backgroundColor: railInk === '#ffffff' ? '#1a120c' : '#fffdf8',
              color: railInk === '#ffffff' ? '#ffffff' : '#1a120c',
            }}
            editable={editable}
            onCommit={(v) => onCopyChange?.({ badgeText: v })}
          />
          <div className="bg-white p-1.5 rounded-lg shadow-sm">
            <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={qrSize} />
          </div>
          <div>
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase opacity-80">Scan to enter</p>
          </div>
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
    dateLabel,
    validityNote,
    eventTime,
    eventLocation = 'Venue TBA',
    eventImageUrl,
    qrValue = 'preview-ticket',
    qrCodeImage,
    compact = false,
    id,
    accent,
    badgeLabel,
    copy,
    editable,
    onCopyChange,
    organizerLogo,
    organizerName,
  } = props;
  const split = splitTitle(eventName);
  const shortDate = shownDate(eventDate, dateLabel, formatShortDate);
  const onAccent = inkOn(accent);
  const bannerImage =
    eventImageUrl ||
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80';
  const qrSize = compact ? 64 : 76;

  return (
    <div
      id={id}
      className={`relative w-full ${compact ? 'max-w-xl mx-auto' : ''} rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-[#0b0b12] text-white min-w-0`}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

      <div data-ticket-body className="flex flex-row items-stretch min-h-[220px]">
        <div
          data-ticket-photo
          className={`relative flex flex-1 min-w-0 flex-col items-start justify-start ${compact ? 'p-4' : 'p-3.5 sm:p-6'} overflow-hidden`}
        >
          <div className="absolute inset-0 opacity-30">
            <img
              src={bannerImage}
              alt=""
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b12] via-[#0b0b12]/92 to-[#0b0b12]/50" />
          </div>

          <div className="relative z-10 w-full min-w-0">
            <CopyStack
              kicker={
                <div className="flex items-center justify-between gap-2">
                  <TicketBadge
                    label={copy.headline}
                    style={{ backgroundColor: accent, color: onAccent }}
                    editable={editable}
                    onCommit={(v) => onCopyChange?.({ ticketHeadline: v })}
                  />
                  <HostBadge logo={organizerLogo} name={organizerName} />
                </div>
              }
              title={
                <h3
                  className={`${compact ? 'text-2xl' : 'text-xl sm:text-3xl'} font-black uppercase leading-tight break-words`}
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
              }
              venueLabel={
                <p className="text-[10px] font-bold uppercase leading-normal text-white/55">
                  <EditCopy value={copy.venueLabel} field="venueLabel" enabled={editable} onCopyChange={onCopyChange} />
                </p>
              }
              venue={
                <p className="text-xs sm:text-sm font-bold uppercase text-white/90 break-words">
                  {eventLocation}
                </p>
              }
              meta={
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-white/50">Date</p>
                    <p className="font-extrabold text-white mt-0.5 break-words">{shortDate}</p>
                    <ValidityNote note={validityNote} className="text-[9px] font-semibold text-white/55 mt-0.5 normal-case tracking-normal" />
                  </div>
                  {eventTime ? (
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase text-white/50">Time</p>
                      <p className="font-extrabold text-white mt-0.5">{eventTime}</p>
                    </div>
                  ) : null}
                </div>
              }
            />
          </div>
        </div>

        <div className="flex flex-col justify-between items-center py-3 relative bg-[#0b0b12] shrink-0" aria-hidden>
          <div className="w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 -mt-5 z-20" />
          <div className="border-l-2 border-dashed border-white/25 flex-1 my-0.5" />
          <div className="w-4 h-4 rounded-full bg-neutral-50 dark:bg-neutral-950 -mb-5 z-20" />
        </div>

        <div
          className={`w-[108px] sm:w-[148px] ${compact ? 'p-3' : 'p-3 sm:p-5'} flex flex-col items-center justify-center text-center shrink-0 gap-2 sm:gap-3`}
          style={{ backgroundColor: accent, color: onAccent }}
        >
          <TicketBadge
            label={badgeLabel}
            style={{
              backgroundColor: onAccent === '#ffffff' ? '#0a0a0a' : '#ffffff',
              color: onAccent === '#ffffff' ? '#ffffff' : '#0a0a0a',
            }}
            editable={editable}
            onCommit={(v) => onCopyChange?.({ badgeText: v })}
          />
          <div className="bg-white p-1.5 rounded-xl shadow-md shrink-0" data-ticket-qr>
            <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={qrSize} />
          </div>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase opacity-90">Scan to enter</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Cinema — vintage movie ticket with sprocket holes and admit-one stub.
 */
function CinemaLayout(props: LayoutProps) {
  const {
    eventName,
    eventDate,
    dateLabel,
    validityNote,
    eventTime = '7:00 PM',
    eventLocation = 'Venue TBA',
    qrValue = 'preview-ticket',
    qrCodeImage,
    compact = false,
    id,
    accent,
    badgeLabel,
    copy,
    editable,
    onCopyChange,
  } = props;
  const paper = '#f3ead8';
  const ink = '#1a120c';
  const onAccent = inkOn(accent);
  const qrSize = compact ? 76 : 92;

  return (
    <div
      id={id}
      className={`relative w-full ${compact ? 'max-w-xl mx-auto' : ''} overflow-hidden shadow-2xl min-w-0`}
      style={{ backgroundColor: paper, color: ink, borderRadius: 6 }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-neutral-950">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="w-2 h-2 rounded-[1px] shrink-0" style={{ backgroundColor: paper }} />
        ))}
      </div>

      <div data-ticket-body className="flex flex-col sm:flex-row">
        <div className={`relative flex-1 min-w-0 ${compact ? 'p-4' : 'p-5 sm:px-6 sm:py-5'}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black tracking-[0.32em] uppercase" style={{ color: accent }}>
              <EditCopy value={copy.headline} field="ticketHeadline" enabled={editable} onCopyChange={onCopyChange} />
            </p>
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-neutral-500">
              <EditCopy value={copy.sublabel} field="ticketSublabel" enabled={editable} onCopyChange={onCopyChange} />
            </p>
          </div>
          <h3
            data-ticket-text
            className={`${compact ? 'text-2xl' : 'text-3xl'} mt-2 font-black uppercase leading-[1.05] tracking-tight break-words`}
            style={{ fontFamily: '"Oswald", ui-sans-serif, system-ui, sans-serif' }}
          >
            {eventName}
          </h3>
          <div className="mt-4 grid grid-cols-3 gap-3 border-y border-neutral-900/10 py-3">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Date</p>
              <p className="mt-0.5 text-xs font-extrabold">{shownDate(eventDate, dateLabel, formatBoardDate)}</p>
              <ValidityNote note={validityNote} className="text-[9px] font-semibold text-neutral-500 mt-0.5 normal-case tracking-normal" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Showtime</p>
              <p className="mt-0.5 text-xs font-extrabold">{eventTime}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase text-neutral-500">
                <EditCopy value={copy.venueLabel} field="venueLabel" enabled={editable} onCopyChange={onCopyChange} />
              </p>
              <p data-ticket-text className="mt-0.5 text-xs font-extrabold break-words">{eventLocation}</p>
            </div>
          </div>
        </div>

        <TearStrip color="rgba(26,18,12,0.28)" holeClass="bg-neutral-50 dark:bg-neutral-950" />

        <div
          className={`sm:w-[148px] ${compact ? 'p-4' : 'p-5'} flex flex-col items-center justify-center text-center shrink-0 gap-3`}
          style={{ backgroundColor: accent, color: onAccent }}
        >
          <TicketBadge
            label={badgeLabel}
            style={{
              backgroundColor: onAccent === '#ffffff' ? '#0a0a0a' : '#ffffff',
              color: onAccent === '#ffffff' ? '#ffffff' : '#0a0a0a',
            }}
            editable={editable}
            onCommit={(v) => onCopyChange?.({ badgeText: v })}
          />
          <div className="bg-white p-1.5 rounded-md">
            <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={qrSize} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-neutral-950">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={`b-${i}`} className="w-2 h-2 rounded-[1px] shrink-0" style={{ backgroundColor: paper }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Gallery — photo-cover editorial pass.
 */
function FolioLayout(props: LayoutProps) {
  const {
    eventName,
    eventDate,
    dateLabel,
    validityNote,
    eventTime = '6:00 PM',
    eventLocation = 'Venue TBA',
    eventImageUrl,
    ticketType,
    qrValue = 'preview-ticket',
    qrCodeImage,
    compact = false,
    id,
    accent,
    badgeLabel,
    copy,
    editable,
    onCopyChange,
  } = props;
  const onAccent = inkOn(accent);
  const qrSize = compact ? 64 : 72;
  const bannerImage =
    eventImageUrl ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80';

  return (
    <div
      id={id}
      className={`relative w-full ${compact ? 'max-w-xl mx-auto' : ''} rounded-2xl overflow-hidden shadow-2xl min-w-0 text-white`}
    >
      <div data-ticket-body className="relative min-h-[240px] sm:min-h-[280px]">
        <img
          src={bannerImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />

        <div className={`relative z-10 flex h-full min-h-[240px] sm:min-h-[280px] ${compact ? 'p-4' : 'p-4 sm:p-5'} gap-4`}>
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase text-white/70">
                <EditCopy value={copy.headline} field="ticketHeadline" enabled={editable} onCopyChange={onCopyChange} />
              </p>
              <TicketBadge
                label={badgeLabel}
                style={{ backgroundColor: accent, color: onAccent }}
                editable={editable}
                onCommit={(v) => onCopyChange?.({ badgeText: v })}
              />
            </div>
            <CopyStack
              title={
                <>
                  <h3
                    className={`${compact ? 'text-2xl' : 'text-xl sm:text-3xl'} font-semibold leading-tight break-words`}
                    style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                  >
                    {eventName}
                  </h3>
                  <p className="mt-2 text-xs font-medium text-white/80">
                    {shownDate(eventDate, dateLabel, formatPrettyDate)}
                    {eventTime ? ` · ${eventTime}` : ''}
                  </p>
                  <ValidityNote note={validityNote} className="text-[10px] font-semibold text-white/55 mt-0.5 normal-case" />
                </>
              }
              venueLabel={
                <p className="text-[10px] font-bold uppercase text-white/50">
                  <EditCopy value={copy.venueLabel} field="venueLabel" enabled={editable} onCopyChange={onCopyChange} />
                </p>
              }
              venue={<p className="text-xs text-white/80 break-words">{eventLocation}</p>}
            />
          </div>
          <div className="shrink-0 self-center flex flex-col items-center">
            <div className="bg-white p-1.5 rounded-lg shadow-lg">
              <QrBlock qrCodeImage={qrCodeImage} qrValue={qrValue} size={qrSize} />
            </div>
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
  cinema: CinemaLayout,
  folio: FolioLayout,
};

const EventTicketCard: React.FC<EventTicketCardProps> = (props) => {
  const style = resolveTicketStyle(props.ticketType);
  const copy = resolveTicketCopy(props.ticketType, style.layout);
  const Layout = LAYOUTS[style.layout] || ClassicLayout;
  return (
    <Layout
      {...props}
      accent={style.accent}
      borderColor={style.borderColor}
      badgeLabel={style.badgeLabel}
      copy={copy}
    />
  );
};

export default EventTicketCard;
