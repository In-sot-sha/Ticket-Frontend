import React, { useRef, useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import {
  Download,
  Share2,
  Calendar,
  MapPin,
  ArrowLeft,
  Upload,
  Loader2,
  Clock,
} from 'lucide-react';

export interface FlierEvent {
  title: string;
  date: string;
  /** Optional start time string (e.g. "9:00 PM") */
  time?: string;
  location: string;
  image: string;
  eventUrl?: string;
}

export interface FlierUser {
  firstName: string;
  lastName: string;
  role?: string;
}

interface TicketFlierGeneratorProps {
  event: FlierEvent;
  user?: FlierUser | null;
  onClose?: () => void;
}

/**
 * Social event fliers — research-backed hierarchy:
 * Title (largest) → Date/Time + Venue → CTA ("Get tickets").
 * Formats: Instagram Story 9:16 (with safe zones) + Feed square 1:1.
 */
type Format = 'story' | 'feed';
type Template = 'spotlight' | 'clean' | 'going';

const FORMATS: { key: Format; label: string; sub: string }[] = [
  { key: 'story', label: 'Story', sub: '9:16 · IG / WhatsApp' },
  { key: 'feed', label: 'Square', sub: '1:1 · Feed / X' },
];

const TEMPLATES: { key: Template; label: string; hint: string }[] = [
  { key: 'spotlight', label: 'Spotlight', hint: 'Bold full-bleed promo' },
  { key: 'clean', label: 'Clean', hint: 'Editorial announcement' },
  { key: 'going', label: "I'm going", hint: 'Personal share with photo' },
];

const TAGLINES = ["I'm going", "I'll be there", 'See you there', 'Join me'];

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80';

/** Story UI overlays ~250px of 1920 → ~13% top/bottom; keep content inset. */
const SAFE = {
  story: { pt: '14%', pb: '16%', px: '7%' },
  feed: { pt: '8%', pb: '8%', px: '7%' },
} as const;

const TicketFlierGenerator: React.FC<TicketFlierGeneratorProps> = ({
  event,
  user,
  onClose,
}) => {
  const flierRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<Format>('story');
  const [template, setTemplate] = useState<Template>('spotlight');
  const [tagline, setTagline] = useState(TAGLINES[0]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1);

  const userName = useMemo(
    () => (user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest'),
    [user]
  );

  const dateLine = useMemo(() => {
    try {
      const d = new Date(event.date);
      if (Number.isNaN(d.getTime())) return event.date;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return event.date;
    }
  }, [event.date]);

  const timeLine = event.time?.trim() || '';
  const imageSrc = event.image || FALLBACK_IMAGE;
  const flierW = 360;
  const flierH = format === 'story' ? 640 : 360;
  const pad = SAFE[format];

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const maxH = Math.min(window.innerHeight * 0.5, 520);
      const byW = w < flierW ? (w - 16) / flierW : 1;
      const byH = maxH / flierH;
      setScale(Math.min(1, byW, byH));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [flierH]);

  const capture = async () => {
    if (!flierRef.current) return null;
    return html2canvas(flierRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#0a0a0a',
      logging: false,
    });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const canvas = await capture();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `${event.title.replace(/\s+/g, '-').slice(0, 40)}-flier.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
      alert('Could not download flier.');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const canvas = await capture();
      if (!canvas) return;
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) return;
      const file = new File([blob], 'event-flier.png', { type: 'image/png' });
      const bookingUrl = event.eventUrl
        ? `${window.location.origin}${event.eventUrl.startsWith('/') ? event.eventUrl : `/events/${event.eventUrl}`}`
        : window.location.origin;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: event.title,
          text: `${tagline} — ${event.title}`,
          url: bookingUrl,
          files: [file],
        });
      } else {
        alert('Sharing isn’t supported here. Download the PNG instead.');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const MetaRows = ({ light = true }: { light?: boolean }) => (
    <div
      className={`mt-3 space-y-1.5 text-[11px] font-semibold leading-snug ${
        light ? 'text-white/90' : 'text-[#44403c]'
      }`}
    >
      <p className="flex items-center gap-2">
        <Calendar className={`h-3.5 w-3.5 shrink-0 ${light ? 'text-rose-400' : 'text-rose-500'}`} />
        <span>
          {dateLine}
          {timeLine ? ` · ${timeLine}` : ''}
        </span>
      </p>
      <p className="flex items-start gap-2">
        <MapPin className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${light ? 'text-rose-400' : 'text-rose-500'}`} />
        <span className="line-clamp-2">{event.location}</span>
      </p>
    </div>
  );

  /* ─── Templates ─── */

  const SpotlightFace = () => (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 text-white">
      <img
        src={imageSrc}
        alt=""
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/25" />
      <div
        className="relative z-10 flex h-full flex-col justify-between"
        style={{ paddingTop: pad.pt, paddingBottom: pad.pb, paddingLeft: pad.px, paddingRight: pad.px }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">
            {tagline}
          </span>
          <span className="text-[10px] font-black tracking-tight text-rose-400">PartyStorm</span>
        </div>

        <div>
          <h2
            className="line-clamp-3 text-[1.85rem] font-black uppercase leading-[1.05] tracking-tight"
            style={{ fontFamily: '"Oswald", ui-sans-serif, system-ui, sans-serif' }}
          >
            {event.title}
          </h2>
          <MetaRows light />
          <div className="mt-5 inline-flex items-center rounded-full bg-rose-500 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            Get tickets
          </div>
        </div>
      </div>
    </div>
  );

  const CleanFace = () => (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#f4f0e8] text-[#1c1917]">
      <div className={`relative shrink-0 ${format === 'story' ? 'h-[40%]' : 'h-[36%]'}`}>
        <img
          src={imageSrc}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4f0e8]/30 to-transparent" />
      </div>
      <div
        className="flex flex-1 flex-col justify-between"
        style={{
          paddingTop: '5%',
          paddingBottom: pad.pb,
          paddingLeft: pad.px,
          paddingRight: pad.px,
        }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#a8a29e]">
            {tagline}
          </p>
          <h2
            className={`mt-2 line-clamp-3 font-semibold leading-[1.08] tracking-tight ${
              format === 'story' ? 'text-[1.75rem]' : 'text-[1.35rem]'
            }`}
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            {event.title}
          </h2>
          <div className="mt-3 h-px w-8 bg-[#1c1917]/20" />
          <MetaRows light={false} />
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-[#1c1917]/10 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#57534e]">
              Get tickets
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-[#a8a29e]">PartyStorm</p>
          </div>
          <p className="max-w-[45%] truncate text-right text-[10px] font-semibold text-[#78716c]">
            {userName}
          </p>
        </div>
      </div>
    </div>
  );

  const GoingFace = () => (
    <div className="relative h-full w-full overflow-hidden bg-[#0b0b0f] text-white">
      <img
        src={imageSrc}
        alt=""
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0b0b0f]/80 to-[#0b0b0f]" />
      <div
        className="relative z-10 flex h-full flex-col items-center justify-between text-center"
        style={{ paddingTop: pad.pt, paddingBottom: pad.pb, paddingLeft: pad.px, paddingRight: pad.px }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose-400">
          PartyStorm
        </p>

        <div className="flex flex-col items-center">
          <div className="h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full border-2 border-white/35 bg-neutral-800 shadow-xl">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-rose-500 text-2xl font-black">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
            {tagline}
          </p>
          <h2
            className={`mt-2 max-w-[280px] line-clamp-3 font-black leading-tight tracking-tight ${
              format === 'story' ? 'text-2xl' : 'text-xl'
            }`}
          >
            {event.title}
          </h2>
          <p className="mt-2 text-sm font-semibold text-white/90">{userName}</p>
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold text-white/80">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
              <Calendar className="h-3 w-3" />
              {dateLine}
            </span>
            {timeLine ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                <Clock className="h-3 w-3" />
                {timeLine}
              </span>
            ) : null}
            <span className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-full bg-white/10 px-2.5 py-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {event.location}
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
            Get tickets on PartyStorm
          </p>
        </div>
      </div>
    </div>
  );

  const Face =
    template === 'spotlight' ? SpotlightFace : template === 'clean' ? CleanFace : GoingFace;

  return (
    <div className="overflow-hidden border-0 bg-white dark:bg-neutral-900 sm:rounded-2xl sm:border sm:border-neutral-200 sm:shadow-2xl dark:sm:border-neutral-700">
      {onClose && (
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Close
          </button>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Event flier</p>
          <span className="w-14" aria-hidden />
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Live preview */}
        <div
          ref={containerRef}
          className="flex min-h-[260px] flex-1 items-center justify-center bg-neutral-100 p-4 dark:bg-black/40 sm:p-6"
        >
          <div
            style={{ width: flierW * scale, height: flierH * scale }}
            className="relative shadow-2xl ring-1 ring-black/10"
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: flierW,
                height: flierH,
              }}
            >
              {/* Capture target: no radius/shadow so PNG edges stay clean */}
              <div ref={flierRef} className="h-full w-full overflow-hidden">
                <Face />
              </div>
            </div>
          </div>
        </div>

        {/* Controls — one job: configure then export */}
        <div className="flex w-full shrink-0 flex-col border-t border-neutral-200 p-4 dark:border-neutral-800 sm:p-5 lg:w-[320px] lg:border-l lg:border-t-0">
          <div className="flex-1 space-y-4">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Format
              </p>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800/80">
                {FORMATS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFormat(f.key)}
                    className={`rounded-lg px-2.5 py-2 text-left transition-colors ${
                      format === f.key
                        ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                        : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    <span className="block text-xs font-bold">{f.label}</span>
                    <span className="text-[9px] opacity-70">{f.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Look
              </p>
              <div className="flex flex-col gap-1.5">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTemplate(t.key)}
                    className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                      template === t.key
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <span className="block text-xs font-bold text-neutral-900 dark:text-white">
                      {t.label}
                    </span>
                    <span className="text-[10px] text-neutral-500">{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Tagline
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TAGLINES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTagline(t)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      tagline === t
                        ? 'bg-rose-500 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {template === 'going' && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Your photo
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-xs font-bold text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  <Upload className="h-4 w-4 text-rose-500" />
                  {avatar ? 'Change photo' : 'Upload photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatar}
                />
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleShare}
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-rose-500 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-70"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Share
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white text-sm font-bold text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white disabled:opacity-70"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
            <p className="pt-0.5 text-center text-[10px] text-neutral-400">
              Title · date · venue · get tickets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFlierGenerator;
