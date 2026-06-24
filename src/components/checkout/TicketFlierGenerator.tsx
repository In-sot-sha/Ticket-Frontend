import React, { useRef, useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { Download, CheckCircle, Share2, Calendar, MapPin, Sparkles, ArrowLeft, Upload } from 'lucide-react';

export interface FlierEvent {
  title: string;
  date: string;
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

type DesignStyle = 'minimalist' | 'sunset' | 'dark' | 'retro';

const DESIGNS: { key: DesignStyle; label: string; dot: string }[] = [
  { key: 'minimalist', label: 'Clean',   dot: 'bg-white border border-neutral-300' },
  { key: 'sunset',     label: 'Sunset',  dot: 'bg-gradient-to-tr from-rose-500 to-amber-400' },
  { key: 'dark',       label: 'Dark',    dot: 'bg-[#0C0C0E] border border-neutral-700' },
  { key: 'retro',      label: 'Retro',   dot: 'bg-[#FAF6F0] border border-[#C3B091]' },
];

const SQUARE_THEMES = [
  { key: 'blue', label: 'Royal Blue', bg: 'bg-[#4E60D6]', border: 'border-[#6273e8]' },
  { key: 'red', label: 'Coral Red', bg: 'bg-[#D95555]', border: 'border-[#e06c6c]' },
  { key: 'gold', label: 'Mustard Gold', bg: 'bg-[#CFA240]', border: 'border-[#dbae4f]' },
  { key: 'purple', label: 'Deep Purple', bg: 'bg-[#8E2CA8]', border: 'border-[#a13fba]' },
];

const ROLE_PRESETS = [
  "I'm attending",
  "I'm speaking at",
  "Thrilled to Support",
  "We're exhibiting at",
];

const ConcentricRings = () => (
  <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none text-white/40" viewBox="0 0 360 360" fill="none" stroke="currentColor">
    {Array.from({ length: 16 }, (_, i) => (
      <circle key={i} cx="180" cy="180" r={32 + i * 16} strokeWidth="1" />
    ))}
  </svg>
);

const TicketFlierGenerator: React.FC<TicketFlierGeneratorProps> = ({ event, user, onClose }) => {
  const flierRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [design, setDesign] = useState<DesignStyle>('minimalist');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scale, setScale] = useState(1);

  // Square format states
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [customTagline, setCustomTagline] = useState("I'm attending");
  const [squareTheme, setSquareTheme] = useState<'blue' | 'red' | 'gold' | 'purple'>('blue');

  const userName = useMemo(() => 
    user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest Attendee',
  [user]);

  const userTitle = useMemo(() => 
    user?.role ? `${user.role.charAt(0) + user.role.slice(1).toLowerCase()} Pass` : 'Event Attendee',
  [user]);

  const formattedDate = useMemo(() =>
    new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
  [event.date]);

  // Auto-scale flier preview to fit container
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      setScale(w < 360 ? (w - 16) / 360 : 1);
    };
    measure();
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 120);
    return () => { window.removeEventListener('resize', measure); clearTimeout(t); };
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAvatar(url);
    }
  };

  const triggerAvatarUpload = () => fileInputRef.current?.click();

  const handleDownload = async () => {
    if (!flierRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(flierRef.current, { scale: 3, useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `PartyStorm-${event.title.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('Download failed', e); }
    finally { setIsGenerating(false); }
  };

  const handleShare = async () => {
    if (!flierRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(flierRef.current, { scale: 3, useCORS: true, backgroundColor: null });
      canvas.toBlob(async (blob) => {
        if (!blob) { setIsGenerating(false); return; }
        const file = new File([blob], `PartyStorm-${event.title.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            const bookingUrl = event.eventUrl
              ? `${window.location.origin}${event.eventUrl.startsWith('/') ? '' : '/events/'}${event.eventUrl}`
              : window.location.origin;
            await navigator.share({
              title: `${customTagline} ${event.title}!`,
              text: `Check this out! 🎉 ${customTagline} ${event.title}! Get tickets here 👇`,
              url: bookingUrl,
              files: [file]
            });
          } catch (err) { if ((err as Error).name !== 'AbortError') console.error(err); }
        } else {
          alert("Image sharing isn't supported on this device. Please download instead.");
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (e) { console.error('Share failed', e); setIsGenerating(false); }
  };

  const displayUrl = useMemo(() => {
    if (!event.eventUrl) return null;
    const host = window.location.host.replace('www.', '');
    const path = event.eventUrl.startsWith('/') ? event.eventUrl : `/events/${event.eventUrl}`;
    return `${host}${path}`;
  }, [event.eventUrl]);

  /* ──────── Render ──────── */
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 md:p-8 max-w-4xl mx-auto shadow-xl border border-neutral-200/80 dark:border-neutral-800 transition-colors">

      {/* ── Mobile back button ── */}
      {onClose && (
        <button
          onClick={onClose}
          className="md:hidden flex items-center gap-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-4 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">

        {/* ═══ Left: Flier Preview ═══ */}
        <div className="w-full md:flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-black/50 rounded-2xl p-3 sm:p-4 md:p-6 border border-neutral-100 dark:border-neutral-800/40 overflow-hidden">

          {/* Format Toggle Selector */}
          <div className="flex gap-2 mb-4 w-full overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFormat('story')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                format === 'story'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              Story Pass (9:16)
            </button>
            <button
              onClick={() => setFormat('square')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                format === 'square'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              Social Post (1:1)
            </button>
          </div>

          {/* Theme selector — horizontal scroll on mobile, shown only for story format */}
          {format === 'story' && (
            <div className="flex gap-2 mb-4 w-full overflow-x-auto pb-1 md:hidden scrollbar-hide">
              {DESIGNS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDesign(d.key)}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                    design === d.key
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                      : 'bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${d.dot}`} />
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Scaled flier container */}
          <div
            ref={containerRef}
            className="w-full flex items-center justify-center overflow-hidden"
            style={{ height: `${(format === 'story' ? 540 : 360) * scale}px` }}
          >
            <div
              style={{ transform: `scale(${scale})`, transformOrigin: 'center', width: 360, height: format === 'story' ? 540 : 360 }}
              className="shrink-0"
            >
              <div ref={flierRef} className={`w-[360px] ${format === 'story' ? 'h-[540px]' : 'h-[360px]'} shadow-2xl relative select-none rounded-[1.5rem] overflow-hidden`}>

                {/* ─── Story Format Render ─── */}
                {format === 'story' && (
                  <>
                    {/* ─── 1. Clean / Minimalist ─── */}
                    {design === 'minimalist' && (
                      <div className="w-full h-full bg-white text-neutral-900 flex flex-col justify-between p-5 relative border border-neutral-100">
                        <div className="relative h-[55%] w-full overflow-hidden rounded-2xl bg-neutral-100">
                          <img src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'} alt={event.title} crossOrigin="anonymous" className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 bg-rose-500 px-2.5 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-md">
                            🎉 I'm Attending!
                          </div>
                        </div>

                        {/* Tear-off line */}
                        <div className="relative my-2">
                          <div className="border-t border-dashed border-neutral-200 w-full" />
                          <div className="absolute -left-7 -top-[9px] w-[18px] h-[18px] rounded-full bg-neutral-50 border-r border-neutral-200/50" />
                          <div className="absolute -right-7 -top-[9px] w-[18px] h-[18px] rounded-full bg-neutral-50 border-l border-neutral-200/50" />
                        </div>

                        <div className="flex-1 flex flex-col justify-between pt-1">
                          <div>
                            <h3 className="font-extrabold text-lg leading-tight mb-2 tracking-tight line-clamp-2">{event.title}</h3>
                            <div className="space-y-1 text-[11px] text-neutral-500 font-medium">
                              <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" /> {formattedDate}</p>
                              <p className="flex items-center gap-1.5 line-clamp-1"><MapPin className="w-3.5 h-3.5 shrink-0" /> {event.location}</p>
                            </div>
                          </div>

                          <div className="flex items-end justify-between pt-3 border-t border-neutral-100">
                            <div>
                              <p className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-400">Attendee</p>
                              <p className="font-bold text-xs text-neutral-900 truncate max-w-[180px]">{userName}</p>
                              {displayUrl && (
                                <p className="text-[8px] text-rose-500 font-bold mt-1 truncate max-w-[200px]">🔗 {displayUrl}</p>
                              )}
                            </div>
                            <span className="font-black tracking-tighter text-[11px] text-rose-500 shrink-0">PartyStorm</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── 2. Sunset Glow ─── */}
                    {design === 'sunset' && (
                      <div className="w-full h-full bg-gradient-to-br from-rose-500 via-amber-500 to-indigo-600 p-4 relative flex flex-col justify-between overflow-hidden">
                        <div className="flex-1 bg-white/95 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative">
                          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-100 mb-3">
                            <img src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'} alt={event.title} crossOrigin="anonymous" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                              🎉 I'M GOING!
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-black text-neutral-900 text-lg leading-tight tracking-tight mb-2 line-clamp-2">{event.title}</h3>
                              <div className="space-y-1 text-[11px] font-semibold">
                                <p className="flex items-center gap-1.5 text-neutral-600"><Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {formattedDate}</p>
                                <p className="flex items-center gap-1.5 text-neutral-600 line-clamp-1"><MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {event.location}</p>
                              </div>
                            </div>
                            <div className="border-t border-neutral-100 pt-3 mt-3 flex justify-between items-end">
                              <div>
                                <p className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-400">Attendee</p>
                                <p className="font-extrabold text-rose-600 text-xs truncate max-w-[180px]">{userName}</p>
                                {displayUrl && (
                                  <p className="text-[8px] text-rose-500 font-bold mt-1 truncate max-w-[200px]">🔗 {displayUrl}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 text-rose-500 shrink-0">
                                <Sparkles className="w-3 h-3 fill-current" />
                                <span className="font-black tracking-tighter text-[11px]">PartyStorm</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── 3. Dark VIP ─── */}
                    {design === 'dark' && (
                      <div className="w-full h-full bg-[#0C0C0E] text-white flex flex-col justify-between p-5 relative border border-neutral-800">
                        <div className="absolute inset-2.5 border border-amber-500/20 rounded-2xl pointer-events-none" />
                        <div className="relative z-10 flex-1 flex flex-col justify-between h-full p-1.5">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-black tracking-widest text-[9px] text-amber-500 uppercase">🎉 I'M ATTENDING</span>
                          </div>
                          <div className="relative h-[40%] w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800">
                            <img src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'} alt={event.title} crossOrigin="anonymous" className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between pt-3">
                            <div>
                              <h3 className="font-extrabold text-white text-lg leading-tight tracking-tight mb-2 line-clamp-2">{event.title}</h3>
                              <div className="space-y-1 text-[11px] text-neutral-400">
                                <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {formattedDate}</p>
                                <p className="flex items-center gap-1.5 line-clamp-1"><MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {event.location}</p>
                              </div>
                            </div>
                            <div className="border-t border-neutral-800 pt-3 flex justify-between items-end">
                              <div>
                                <p className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-500">Attendee</p>
                                <p className="font-black text-amber-500 text-xs truncate max-w-[180px]">{userName.toUpperCase()}</p>
                                {displayUrl && (
                                  <p className="text-[8px] text-amber-500/80 font-bold mt-1 truncate max-w-[200px]">🔗 {displayUrl}</p>
                                )}
                              </div>
                              <span className="font-black tracking-widest text-[9px] uppercase text-white shrink-0">PartyStorm</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── 4. Retro Ticket Stub ─── */}
                    {design === 'retro' && (
                      <div className="w-full h-full bg-[#FAF6F0] text-[#3E3227] flex flex-col justify-between p-5 relative overflow-hidden border border-[#E9E4DC]">
                        <div className="absolute inset-3 border border-dashed border-[#C3B091] rounded-lg pointer-events-none" />
                        <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-50 dark:bg-black border border-[#C3B091]" />
                        <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-50 dark:bg-black border border-[#C3B091]" />

                        <div className="relative z-10 flex-1 flex flex-col justify-between h-full p-1">
                          <div className="text-center">
                            <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#8C7A6B]">
                              🎉 I'M ATTENDING! • PARTYSTORM
                            </span>
                          </div>

                          <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-[#FAF6F0] border border-[#C3B091] my-2 p-1">
                            <img src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'} alt={event.title} crossOrigin="anonymous" className="w-full h-full object-cover filter grayscale contrast-125 sepia-[0.3]" />
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div className="text-center px-2">
                              <h3 className="font-serif font-bold text-[#3E3227] text-base leading-tight tracking-normal mb-1.5 line-clamp-2">{event.title}</h3>
                              <div className="font-mono text-[10px] text-[#8C7A6B] space-y-0.5">
                                <p>{formattedDate.toUpperCase()}</p>
                                <p className="truncate">{event.location.toUpperCase()}</p>
                              </div>
                            </div>

                            <div className="border-t border-dashed border-[#C3B091] my-3 w-full" />

                            <div className="flex justify-between items-end">
                              <div>
                                <p className="font-mono text-[8px] uppercase tracking-wider text-[#8C7A6B]">Attendee</p>
                                <p className="font-serif font-black text-[#3E3227] text-xs tracking-tight truncate max-w-[180px]">{userName}</p>
                                {displayUrl && (
                                  <p className="font-mono text-[7px] text-[#8C7A6B] mt-1 truncate max-w-[200px]">🔗 {displayUrl}</p>
                                )}
                              </div>
                              <span className="font-mono font-black text-[9px] tracking-wider text-[#3E3227] shrink-0">PST-PASS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ─── Square (1:1) Format Render ─── */}
                {format === 'square' && (() => {
                  const activeTheme = SQUARE_THEMES.find(t => t.key === squareTheme) || SQUARE_THEMES[0];
                  return (
                    <div className={`w-[360px] h-[360px] ${activeTheme.bg} text-white p-5 relative flex flex-col justify-between select-none overflow-hidden rounded-[1.5rem]`}>
                      {/* Rings overlay */}
                      <ConcentricRings />

                      {/* Header Logo */}
                      <div className="flex justify-center z-10">
                        <div className="flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5 text-white/90 fill-current animate-pulse" />
                          <span className="font-black tracking-widest text-[8px] uppercase text-white/95">PartyStorm</span>
                        </div>
                      </div>

                      {/* Middle Area */}
                      <div className="flex flex-col items-center justify-center text-center z-10 flex-1 my-1">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-white/90">
                          {customTagline}
                        </span>
                        <h3 className="font-extrabold text-sm leading-tight tracking-tight mt-1 line-clamp-1 max-w-[280px]">
                          {event.title}
                        </h3>

                        {/* Circular Avatar */}
                        <div className={`relative w-20 h-20 rounded-full border-4 ${activeTheme.border} shadow-lg overflow-hidden my-3 bg-neutral-100 flex items-center justify-center shrink-0`}>
                          {customAvatar ? (
                            <img src={customAvatar} alt="Attendee" className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-xl font-black text-white ${activeTheme.bg}`}>
                              {userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Guest name */}
                        <h4 className="font-serif font-black text-sm tracking-tight text-white leading-tight">
                          {userName}
                        </h4>
                        {/* Subtitle / Title */}
                        <p className="text-[9px] text-white/80 font-semibold tracking-wide mt-0.5 truncate max-w-[280px]">
                          {userTitle}
                        </p>
                      </div>

                      {/* Bottom details badges */}
                      <div className="flex items-center justify-center gap-2 z-10 text-[8px] font-black border-t border-white/10 pt-2 shrink-0">
                        <span className="flex items-center gap-1 text-white/90 bg-white/10 px-2 py-0.5 rounded shadow-sm border border-white/5 uppercase tracking-wider">
                          <Calendar className="w-2.5 h-2.5 text-white/80" />
                          {formattedDate}
                        </span>
                        <span className="flex items-center gap-1 text-white/90 bg-white/10 px-2 py-0.5 rounded shadow-sm border border-white/5 uppercase tracking-wider truncate max-w-[150px]">
                          <MapPin className="w-2.5 h-2.5 text-white/80 shrink-0" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        </div>

        {/* ═══ Right: Controls (hidden on mobile — shown below preview) ═══ */}
        <div className="w-full md:flex-1 flex flex-col justify-between py-1 md:py-2">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1 rounded-full text-xs font-bold mb-3 shadow-sm">
              <CheckCircle className="w-4 h-4" /> Pass Secured
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white mb-1.5 tracking-tight">
              Share the hype! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
              Upload your photo and choose your role to design a customized event card!
            </p>

            {/* Customization controls based on format */}
            {format === 'story' ? (
              /* Story Mode Theme Selector */
              <div className="hidden md:block mb-6">
                <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-3">
                  Design Theme
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {DESIGNS.map(d => (
                    <button
                      key={d.key}
                      onClick={() => setDesign(d.key)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        design === d.key
                          ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full shrink-0 ${d.dot}`} />
                      <span className="text-xs font-extrabold">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Simplified Square Mode Controls: Only Upload Photo and Tagline select */
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-2">
                    Your Photo
                  </label>
                  <button
                    onClick={triggerAvatarUpload}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-neutral-350 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-xs font-extrabold text-neutral-600 dark:text-neutral-350 transition-colors shadow-sm"
                  >
                    <Upload className="w-4 h-4 shrink-0 text-rose-500" />
                    {customAvatar ? 'Change Uploaded Photo' : 'Choose Photo (JPG/PNG)'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-2">
                    Tagline / Role
                  </label>
                  <select
                    value={customTagline}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomTagline(val);
                      // Auto map background color theme matching screenshot
                      if (val === "I'm attending") setSquareTheme('blue');
                      else if (val === "I'm speaking at") setSquareTheme('red');
                      else if (val === "Thrilled to Support") setSquareTheme('gold');
                      else if (val === "We're exhibiting at") setSquareTheme('purple');
                    }}
                    className="w-full h-11 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-extrabold focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    {ROLE_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset.replace(' at', '')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-4 md:pt-6 border-t border-neutral-100 dark:border-neutral-800/80">
            <div className="flex gap-2.5">
              <button
                onClick={handleShare}
                disabled={isGenerating}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full h-11 sm:h-12 font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 text-xs sm:text-sm"
              >
                {isGenerating
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Share2 className="w-4 h-4" />
                }
                {isGenerating ? 'Generating...' : 'Share'}
              </button>
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-full h-11 sm:h-12 font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 text-xs sm:text-sm border border-neutral-200 dark:border-neutral-700"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="hidden md:flex w-full bg-white hover:bg-neutral-50 dark:bg-transparent dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full h-11 sm:h-12 font-bold transition-colors items-center justify-center gap-2 text-xs sm:text-sm border border-neutral-200 dark:border-neutral-800"
              >
                Back
              </button>
            )}

            <p className="text-center text-[10px] text-neutral-400 dark:text-neutral-500 pt-1 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-rose-500" /> Works with WhatsApp, Instagram & Twitter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFlierGenerator;
