import React, { useRef, useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode.react';
import { Download, Share2, MapPin, Upload, Loader2 } from 'lucide-react';
import { resolveImageUrl } from '../../lib/media';
import { captureElementPng } from '../../lib/capturePng';

export interface FlierEvent {
  title: string;
  date: string;
  time?: string;
  location: string;
  image: string;
  eventUrl?: string;
  organizerName?: string | null;
  organizerLogo?: string | null;
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
  embedded?: boolean;
}

type Format = 'story' | 'feed';
type Template = 'spotlight' | 'clean' | 'going';

const FORMATS: { key: Format; label: string; hint: string }[] = [
  { key: 'story', label: 'Story', hint: '9:16' },
  { key: 'feed', label: 'Square', hint: '1:1' },
];

const TEMPLATES: { key: Template; label: string }[] = [
  { key: 'spotlight', label: 'Poster' },
  { key: 'clean', label: 'Editorial' },
  { key: 'going', label: "I'm going" },
];

const TAGLINES = ["I'm going", "I'll be there", 'See you there', 'Join me'];

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80';

function bookingLink(eventUrl?: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://partystorm.ng';
  if (!eventUrl) return { href: `${origin}/events`, display: `${origin.replace(/^https?:\/\//, '')}/events` };
  const href = eventUrl.startsWith('http')
    ? eventUrl
    : `${origin}${eventUrl.startsWith('/') ? eventUrl : `/events/${eventUrl}`}`;
  return { href, display: href.replace(/^https?:\/\//, '') };
}

const TicketFlierGenerator: React.FC<TicketFlierGeneratorProps> = ({
  event,
  user,
  embedded = false,
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
  const square = format === 'feed';
  const orgLogo = resolveImageUrl(event.organizerLogo);
  const orgName = event.organizerName?.trim() || '';
  const link = useMemo(() => bookingLink(event.eventUrl), [event.eventUrl]);

  const dateParts = useMemo(() => {
    try {
      const d = new Date(event.date);
      if (Number.isNaN(d.getTime())) {
        return { day: '', weekday: event.date, monthYear: '', line: event.date };
      }
      return {
        day: String(d.getDate()),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        monthYear: d
          .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          .toUpperCase(),
        line: d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      };
    } catch {
      return { day: '', weekday: event.date, monthYear: '', line: event.date };
    }
  }, [event.date]);

  const timeLine = event.time?.trim() || '';
  const imageSrc = event.image || FALLBACK_IMAGE;
  const flierW = 360;
  const flierH = square ? 360 : 640;

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const maxH = square
        ? Math.min(window.innerHeight * 0.42, 420)
        : Math.min(window.innerHeight * (embedded ? 0.58 : 0.62), embedded ? 560 : 580);
      const byW = (w - 8) / flierW;
      const byH = maxH / flierH;
      setScale(Math.min(byW, byH, 1.05));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [flierH, square, embedded]);

  const capture = async () => {
    if (!flierRef.current) return null;
    return captureElementPng(flierRef.current, {
      backgroundColor: '#0a0a0a',
      scale: 2,
      sanitize: false,
    });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const canvas = await capture();
      if (!canvas) return;
      const a = document.createElement('a');
      a.download = `${event.title.replace(/\s+/g, '-').slice(0, 40)}-flier.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
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

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: event.title,
          text: `${tagline} — ${event.title}\nGet tickets: ${link.href}`,
          url: link.href,
          files: [file],
        });
      } else {
        await handleDownload();
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

  const BrandRow = ({ light = true }: { light?: boolean }) => (
    <div className="flex items-center justify-between gap-2">
      {orgLogo ? (
        <img
          src={orgLogo}
          alt=""
          crossOrigin="anonymous"
          className={`rounded-lg object-cover bg-white ${square ? 'h-10 w-10' : 'h-12 w-12'}`}
        />
      ) : (
        <span
          className={`flex items-center justify-center rounded-lg font-black ${
            square ? 'h-10 w-10 text-base' : 'h-12 w-12 text-lg'
          } ${light ? 'bg-white/15 text-white' : 'bg-black/10 text-[#1c1917]'}`}
        >
          {(orgName || 'H').charAt(0).toUpperCase()}
        </span>
      )}
      <span className={`shrink-0 font-black ${square ? 'text-xs' : 'text-sm'} ${light ? 'text-white' : 'text-[#1c1917]'}`}>
        party<span className="text-rose-500">storm</span>
      </span>
    </div>
  );

  const ScanToBook = ({ compact = false, mini = false }: { compact?: boolean; mini?: boolean }) => {
    const size = mini ? 32 : compact ? 40 : 64;
    return (
      <div
        className={`flex items-center bg-white text-neutral-900 ${
          mini ? 'gap-2 rounded-lg p-1.5' : compact ? 'gap-2 rounded-xl p-1.5' : 'gap-2.5 rounded-xl p-2'
        }`}
      >
        <div className="shrink-0 rounded-md bg-white">
          <QRCode value={link.href} size={size} renderAs="canvas" includeMargin={false} level="M" />
        </div>
        <div className="min-w-0 text-left">
          <p className={`font-extrabold text-rose-500 ${mini ? 'text-[9px]' : 'text-[11px]'}`}>
            Scan to get tickets
          </p>
          <p
            className={`mt-0.5 truncate font-semibold text-neutral-700 ${
              mini ? 'text-[8px] leading-tight' : 'text-[11px] leading-snug'
            }`}
          >
            {link.display}
          </p>
        </div>
      </div>
    );
  };

  const PosterFace = () => (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 text-white">
      <img
        src={imageSrc}
        alt=""
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover saturate-[1.15] brightness-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/25" />
      <div
        className={`relative z-10 flex h-full flex-col justify-between ${square ? 'px-5 py-4' : 'px-6 py-7'}`}
      >
        <BrandRow />
        <div className="min-h-0">
          <div className={`flex items-end gap-3 ${square ? 'mb-2' : 'mb-4'}`}>
            {dateParts.day ? (
              <>
                <span
                  className={`font-black leading-none ${square ? 'text-[2.6rem]' : 'text-[4.4rem]'}`}
                  style={{ fontFamily: '"Oswald", "Plus Jakarta Sans", sans-serif' }}
                >
                  {dateParts.day}
                </span>
                <div className={square ? 'mb-0.5' : 'mb-1.5'}>
                  <p className="text-[11px] font-extrabold text-rose-400">{dateParts.weekday}</p>
                  <p className="text-[11px] font-bold text-white/80">{dateParts.monthYear}</p>
                  {timeLine ? <p className="mt-0.5 text-[12px] font-semibold text-white">{timeLine}</p> : null}
                </div>
              </>
            ) : (
              <p className="text-sm font-bold">{dateParts.line}</p>
            )}
          </div>
          <h2
            className={`font-black uppercase leading-[1.05] ${square ? 'text-[1.45rem]' : 'text-[2.15rem]'}`}
            style={{ fontFamily: '"Oswald", "Plus Jakarta Sans", sans-serif' }}
          >
            {event.title}
          </h2>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-white/85">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
            <span>{event.location}</span>
          </p>
          <div className={square ? 'mt-2.5' : 'mt-4'}>
            <ScanToBook compact={square} />
          </div>
        </div>
      </div>
    </div>
  );

  const EditorialFace = () => (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#111114] text-white">
      <div className={`relative ${square ? 'h-[42%]' : 'h-[50%]'}`}>
        <img src={imageSrc} alt="" crossOrigin="anonymous" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-black/20" />
        <div className="absolute inset-x-0 top-0 p-4">
          <BrandRow />
        </div>
      </div>
      <div className={`flex flex-1 flex-col justify-between ${square ? 'px-4 pb-3.5 pt-1' : 'px-6 pb-6 pt-1'}`}>
        <div className="min-h-0">
          <p className="text-[10px] font-extrabold text-rose-400">
            {dateParts.weekday} {dateParts.day} {dateParts.monthYear}
            {timeLine ? `  ·  ${timeLine}` : ''}
          </p>
          <h2
            className={`mt-1.5 font-semibold leading-[1.05] ${square ? 'text-[1.25rem]' : 'text-[1.85rem]'}`}
            style={{ fontFamily: '"Cormorant Garamond", "Plus Jakarta Sans", Georgia, serif' }}
          >
            {event.title}
          </h2>
          <p className="mt-1.5 text-[11px] font-medium text-white/70">{event.location}</p>
        </div>
        <ScanToBook compact={square} />
      </div>
    </div>
  );

  const GoingFace = () => (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      <img
        src={imageSrc}
        alt=""
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover scale-110 blur-[2px] brightness-50"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={`relative z-10 flex h-full flex-col ${
          square ? 'justify-between px-4 py-3.5' : 'justify-between px-6 py-7'
        }`}
      >
        <BrandRow />

        <div className={`flex min-h-0 flex-col items-center text-center ${square ? 'gap-1.5' : 'gap-3'}`}>
          <div
            className={`overflow-hidden rounded-full border-2 border-white shadow-xl ${
              square ? 'h-12 w-12' : 'h-[5.25rem] w-[5.25rem]'
            }`}
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-rose-500 font-black ${square ? 'text-lg' : 'text-3xl'}`}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p
            className={`leading-none text-white ${square ? 'text-[1.45rem]' : 'text-[2rem]'}`}
            style={{ fontFamily: '"Great Vibes", cursive' }}
          >
            {tagline}
          </p>
          <p className={`font-bold text-white/80 ${square ? 'text-[11px]' : 'text-sm'}`}>{userName}</p>

          <div className="w-full overflow-hidden rounded-xl border border-white/20 bg-black/45 text-left">
            <div className={`flex items-center ${square ? 'gap-3 p-2.5' : 'p-0'}`}>
              {!square ? (
                <div className="relative h-24 w-full overflow-hidden">
                  <img src={imageSrc} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
                </div>
              ) : (
                <img
                  src={imageSrc}
                  alt=""
                  crossOrigin="anonymous"
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              )}
              {square ? (
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-[14px] font-extrabold leading-tight">{event.title}</h2>
                  <p className="mt-1 text-[11px] font-semibold text-white/75">
                    {dateParts.line}
                    {timeLine ? ` · ${timeLine}` : ''}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-white/55">{event.location}</p>
                </div>
              ) : null}
            </div>
            {!square ? (
              <div className="px-3.5 py-3">
                <h2 className="line-clamp-2 text-[15px] font-extrabold leading-tight">{event.title}</h2>
                <p className="mt-1 text-[11px] font-semibold text-white/70">
                  {dateParts.line}
                  {timeLine ? ` · ${timeLine}` : ''}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-white/55">{event.location}</p>
              </div>
            ) : null}
          </div>
        </div>

        <ScanToBook compact={square} mini={square} />
      </div>
    </div>
  );

  const Face =
    template === 'spotlight' ? PosterFace : template === 'clean' ? EditorialFace : GoingFace;

  return (
    <div
      className={
        embedded
          ? 'overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900'
          : 'overflow-hidden bg-white dark:bg-neutral-900'
      }
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div
          ref={containerRef}
          className="flex min-h-[280px] flex-1 items-center justify-center bg-neutral-950 px-3 py-5"
        >
          <div
            style={{ width: flierW * scale, height: flierH * scale }}
            className="relative overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: flierW,
                height: flierH,
              }}
            >
              <div className="h-full w-full overflow-hidden">
                <Face />
              </div>
            </div>
          </div>
        </div>

        <div
          ref={flierRef}
          aria-hidden
          className="pointer-events-none fixed left-[-10000px] top-0 overflow-hidden"
          style={{ width: flierW, height: flierH }}
        >
          <Face />
        </div>

        <div className="flex w-full shrink-0 flex-col justify-center space-y-4 p-4 lg:w-[280px] lg:border-l lg:border-neutral-200 dark:lg:border-neutral-800">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Size</p>
            <div className="flex flex-wrap gap-1.5">
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFormat(f.key)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    format === f.key
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {f.label}
                  <span className={`ml-1 font-semibold ${format === f.key ? 'opacity-70' : 'text-neutral-400'}`}>
                    {f.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Template</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTemplate(t.key)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    template === t.key
                      ? 'bg-rose-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {template === 'going' && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {TAGLINES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTagline(t)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      tagline === t
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-xs font-bold text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <Upload className="h-4 w-4 text-rose-500" />
                {avatar ? 'Change photo' : 'Add your photo'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-rose-500 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-70"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Share
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-neutral-300 text-sm font-bold text-neutral-900 dark:border-neutral-600 dark:text-white disabled:opacity-70"
            >
              <Download className="h-4 w-4" />
              Save PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFlierGenerator;
