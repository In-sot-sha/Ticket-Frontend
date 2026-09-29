import React, { useRef, useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import { Download, Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { resolveImageUrl } from '../../lib/media';
import { captureElementPng } from '../../lib/capturePng';
import { DEFAULT_BRAND_LOGO } from './flierBrandLogo';

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
  avatar?: string;
}

interface TicketFlierGeneratorProps {
  event: FlierEvent;
  user?: FlierUser | null;
  guestName?: string;
  onClose?: () => void;
  embedded?: boolean;
}

const HEADLINE_PRESETS = [
  'I will / be / there',
  'I am / attending',
  'See you / there',
];

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
  guestName: propGuestName,
  embedded = false,
}) => {
  const flierRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Locked format to standard 4:5 flyer (1080x1350) and PartyStorm template
  const [headline, setHeadline] = useState(HEADLINE_PRESETS[0]);
  const [useEventCover, setUseEventCover] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(
    user?.avatar ? resolveImageUrl(user.avatar) : null
  );
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1);

  // Automatically resolve the guest name from ticket info / user
  const resolvedTicketName = useMemo(() => {
    if (propGuestName && propGuestName.trim() && propGuestName.trim().toLowerCase() !== 'guest') {
      return propGuestName.trim();
    }
    if (user?.firstName || user?.lastName) {
      const uName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (uName) return uName;
    }
    return propGuestName?.trim() || 'Guest';
  }, [propGuestName, user]);

  const [guestName, setGuestName] = useState(resolvedTicketName);

  useEffect(() => {
    if (resolvedTicketName) {
      setGuestName(resolvedTicketName);
    }
    if (user?.avatar && !avatar) {
      setAvatar(resolveImageUrl(user.avatar));
    }
  }, [resolvedTicketName, user]);

  const orgLogo = resolveImageUrl(event.organizerLogo);
  const orgName = event.organizerName?.trim() || '';
  const link = useMemo(() => bookingLink(event.eventUrl), [event.eventUrl]);

  const formattedDateTime = useMemo(() => {
    try {
      const d = new Date(event.date);
      if (Number.isNaN(d.getTime())) {
        return event.time ? `${event.date} · ${event.time}` : event.date;
      }
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      const dateStr = `${weekday}, ${month} ${day}`;
      return event.time ? `${dateStr} · ${event.time}` : dateStr;
    } catch {
      return event.date;
    }
  }, [event.date, event.time]);

  const imageSrc = event.image || FALLBACK_IMAGE;

  // Intrinsic canvas dimensions for the standard flyer (1080x1350)
  const flierW = 1080;
  const flierH = 1350;

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const maxH = Math.min(window.innerHeight * (embedded ? 0.65 : 0.72), embedded ? 580 : 640);
      const byW = (w - 24) / flierW;
      const byH = maxH / flierH;
      setScale(Math.min(byW, byH, 1));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [flierH, flierW, embedded]);

  const handleDownload = async () => {
    if (!flierRef.current) return;
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      let dataUrl: string;

      try {
        dataUrl = await htmlToImage.toPng(flierRef.current, {
          width: flierW,
          height: flierH,
          pixelRatio: 2,
          style: { transform: 'none', top: '0', left: '0' },
        });
      } catch {
        const canvas = await captureElementPng(flierRef.current, {
          width: flierW,
          height: flierH,
          scale: 1.5,
          backgroundColor: '#ffffff',
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      const a = document.createElement('a');
      a.href = dataUrl;
      const cleanEventTitle = (event.title || 'event').replace(/\s+/g, '-').slice(0, 30);
      const cleanGuest = (guestName || 'ticket').replace(/\s+/g, '-').slice(0, 20);
      a.download = `${cleanGuest}-${cleanEventTitle}-flyer.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Download error:', e);
      alert('Could not download flier. Please try again.');
    } finally {
      setBusy(false);
    }
  };


  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUseEventCover(false);
    setAvatar((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  // Headline lines and dynamic sizing
  const headlineLines = useMemo(() => {
    const raw = headline.trim() || 'I will / be / there';
    return raw.split(/[\n/]/).map((l) => l.trim()).filter(Boolean);
  }, [headline]);

  const headlineFontSize = useMemo(() => {
    const maxLine = headlineLines.reduce((max, l) => Math.max(max, l.length), 0);
    if (maxLine <= 5) return 128;
    if (maxLine <= 8) return 108;
    if (maxLine <= 11) return 88;
    if (maxLine <= 15) return 74;
    return 60;
  }, [headlineLines]);

  const eventNameFontSize = useMemo(() => {
    const len = event.title.length;
    if (len <= 20) return 46;
    if (len <= 35) return 38;
    if (len <= 50) return 32;
    return 26;
  }, [event.title]);

  // Center photo resolution
  const photoUrl = avatar ? avatar : useEventCover ? imageSrc : null;

  return (
    <div
      className={
        embedded
          ? 'overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900'
          : 'overflow-hidden bg-white dark:bg-neutral-900'
      }
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* Preview Canvas Stage */}
        <div
          ref={containerRef}
          className="flex min-h-[320px] flex-1 items-center justify-center bg-neutral-950 px-3 py-6"
        >
          <div
            style={{
              width: Math.round(flierW * scale),
              height: Math.round(flierH * scale),
            }}
            className="relative overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
          >
            <div
              ref={flierRef}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: flierW,
                height: flierH,
                position: 'absolute',
                top: 0,
                left: 0,
                background: '#ffffff',
                overflow: 'hidden',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {/* Torn pink/blue corner */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#004aad',
                  clipPath:
                    'polygon(0 0,68% 0,66% 2%,60% 5%,52% 9%,44% 14%,36% 20%,28% 27%,20% 34%,12% 40%,5% 45%,0 50%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Host logo with jagged polygon clip */}
              <div
                style={{
                  position: 'absolute',
                  left: 62,
                  top: 50,
                  width: 230,
                  height: 160,
                  background: '#ffffff',
                  clipPath:
                    'polygon(0 8%,6% 3%,14% 8%,24% 2%,36% 7%,48% 1%,60% 6%,72% 1%,84% 7%,94% 2%,100% 8%,100% 92%,92% 98%,80% 92%,66% 99%,50% 93%,36% 99%,22% 93%,10% 99%,0 92%)',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {orgLogo ? (
                  <img
                    src={orgLogo}
                    alt=""
                    crossOrigin="anonymous"
                    style={{ maxWidth: 190, maxHeight: 110, objectFit: 'contain' }}
                  />
                ) : (
                  <b
                    style={{
                      fontFamily: "'Anton', Impact, sans-serif",
                      fontSize: 34,
                      color: '#000000',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      padding: '0 10px',
                      lineHeight: 1.1,
                    }}
                  >
                    {orgName || 'HOST LOGO'}
                  </b>
                )}
              </div>

              {/* Brand logo (Partystorm) */}
              <img
                src="/images/partystorm-brand-logo.png"
                alt="Partystorm"
                crossOrigin="anonymous"
                style={{
                  position: 'absolute',
                  right: 40,
                  top: 62,
                  height: 86,
                  maxWidth: 340,
                  objectFit: 'contain',
                  mixBlendMode: 'multiply',
                  filter: 'contrast(1.4) brightness(1.02)',
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_BRAND_LOGO;
                }}
              />

              {/* Guest circular photo */}
              <div
                style={{
                  position: 'absolute',
                  left: 134,
                  top: 335,
                  width: 460,
                  height: 460,
                  borderRadius: '50%',
                  backgroundColor: '#004aad',
                  backgroundImage: photoUrl ? `url("${photoUrl}")` : undefined,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  boxShadow: '0 0 0 14px #ffde59',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!photoUrl && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      textAlign: 'center',
                      userSelect: 'none',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Anton', Impact, sans-serif",
                        fontSize: 160,
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        color: '#ffde59',
                      }}
                    >
                      {(guestName || 'G').charAt(0).toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800,
                        fontSize: 22,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        marginTop: 6,
                        color: '#ffffff',
                      }}
                    >
                      I&apos;LL BE THERE
                    </span>
                  </div>
                )}
              </div>

              {/* Guest name badge from ticket info */}
              <div
                style={{
                  position: 'absolute',
                  left: 104,
                  top: 848,
                  width: 522,
                  height: 100,
                  background: '#ffffff',
                  border: '4px solid #004aad',
                  borderRadius: 28,
                  display: 'grid',
                  placeItems: 'center',
                  padding: '0 32px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: -14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 22,
                    height: 22,
                    background: '#ffffff',
                    border: '4px solid #004aad',
                    borderRadius: '50%',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: -14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 22,
                    height: 22,
                    background: '#ffffff',
                    border: '4px solid #004aad',
                    borderRadius: '50%',
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 800,
                    fontSize: guestName.length > 20 ? 30 : guestName.length > 15 ? 36 : 44,
                    textTransform: 'uppercase',
                    color: '#000000',
                    letterSpacing: '0.5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {guestName}
                </span>
              </div>

              {/* Headline area */}
              <div
                style={{
                  position: 'absolute',
                  left: 668,
                  top: 335,
                  width: 380,
                  height: 613,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Anton', Impact, sans-serif",
                    fontSize: headlineFontSize,
                    lineHeight: 1,
                    letterSpacing: '-1px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    color: '#000000',
                  }}
                >
                  {headlineLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                <div
                  style={{
                    width: 130,
                    height: 12,
                    borderRadius: 6,
                    background: '#004aad',
                    marginTop: 26,
                  }}
                />
              </div>

              {/* QR Code Card */}
              <div
                style={{
                  position: 'absolute',
                  left: 800,
                  top: 1000,
                  width: 232,
                  padding: '17px 17px 15px',
                  background: '#ffffff',
                  borderRadius: 28,
                  zIndex: 2,
                  boxShadow: '0 12px 32px rgba(120, 10, 30, 0.28)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ width: 198, height: 198, background: '#ffffff' }}>
                  <QRCode
                    value={link.href}
                    size={198}
                    renderAs="canvas"
                    fgColor="#004aad"
                    bgColor="#ffffff"
                    level="H"
                    includeMargin={false}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <div
                  style={{
                    color: '#004aad',
                    fontWeight: 800,
                    fontSize: 21,
                    lineHeight: 1.15,
                    textAlign: 'center',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  Scan to get your ticket
                </div>
              </div>

              {/* Event Banner */}
              <div
                style={{
                  position: 'absolute',
                  left: 100,
                  top: 1016,
                  width: 680,
                  height: 150,
                  background: 'linear-gradient(90deg, #00306f, #0a62d8 50%, #00306f)',
                  clipPath: 'polygon(15% 0, 100% 0, 88% 55%, 80% 85%, 68% 100%, 0 100%, 6% 88%)',
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  padding: '0 90px 0 60px',
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: eventNameFontSize,
                  lineHeight: 1.05,
                  textTransform: 'uppercase',
                  color: '#ffde59',
                }}
              >
                <span
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {event.title}
                </span>
              </div>

              {/* Footer with safety margin so long venues don't overlap the QR card */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 184,
                  background: '#004aad',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 54px',
                  gap: 20,
                }}
              >
                <svg style={{ width: 54, height: 54, flex: 'none' }} viewBox="0 0 24 24">
                  <path
                    fill="#ffffff"
                    d="M12 1.5a8.5 8.5 0 0 0-8.5 8.5c0 6.3 8.5 13.5 8.5 13.5S20.5 16.300 20.500 10A8.500 8.500 0 0 0 12 1.500z"
                  />
                  <circle cx="12" cy="10" r="4" fill="#ffde59" />
                </svg>
                <div
                  style={{
                    fontFamily: "'Archivo Black', sans-serif",
                    fontSize: 26,
                    lineHeight: 1.2,
                    textTransform: 'uppercase',
                    flex: 1,
                    letterSpacing: '-0.5px',
                    overflow: 'hidden',
                    paddingRight: 280, // Safe margin so text wraps before the QR card
                  }}
                >
                  <div style={{ color: '#ffde59', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formattedDateTime}
                  </div>
                  <div
                    style={{
                      color: '#ffffff',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={event.location}
                  >
                    {event.location}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginTop: 10,
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 400,
                      fontSize: 27,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ width: 34, height: 34 }}>
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="#fff" />
                    </svg>
                    <svg viewBox="0 0 24 24" style={{ width: 34, height: 34 }}>
                      <path
                        fill="#fff"
                        d="M16.600 5.800A4.300 4.300 0 0 1 15.500 3h-3.100v12.400a2.600 2.600 0 1 1-2.600-2.600c.3 0 .5 0 .7.100V9.700a5.800 5.800 0 1 0 5 5.700V9a7.300 7.300 0 0 0 4.300 1.400V7.300a4.300 4.300 0 0 1-3.200-1.500z"
                      />
                    </svg>
                    <span>@partystorm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean, Streamlined Sidebar Controls (Size and Template Pickers Hidden) */}
        <div className="flex w-full shrink-0 flex-col justify-center space-y-4 p-4 lg:w-[300px] lg:border-l lg:border-neutral-200 dark:lg:border-neutral-800">
          {/* Circle Photo Customization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Circle photo
              </p>
              <button
                type="button"
                onClick={() => {
                  setUseEventCover(!useEventCover);
                  if (avatar) setAvatar(null);
                }}
                className={`inline-flex items-center gap-1 text-[11px] font-bold transition ${
                  useEventCover ? 'text-[#004aad]' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <ImageIcon className="h-3 w-3" />
                {useEventCover ? 'Using Event Cover' : 'Use Event Cover'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-3 text-xs font-bold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <Upload className="h-3.5 w-3.5 text-[#004aad]" />
                {avatar ? 'Change photo' : 'Add your photo'}
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar(null)}
                  title="Remove photo"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-rose-50 hover:text-rose-600 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </div>

          {/* Headline Customization */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Headline
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HEADLINE_PRESETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHeadline(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    headline === t
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {t.replace(/\//g, ' ').replace(/\s+/g, ' ').trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#004aad] text-sm font-bold text-white shadow-md shadow-[#004aad]/20 transition hover:bg-[#003882] active:scale-[0.99] disabled:opacity-70"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Save Flyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFlierGenerator;
