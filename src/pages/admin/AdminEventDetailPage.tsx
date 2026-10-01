import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  Users,
  Copy,
  Check,
  Download,
  Loader2,
  Share2,
  X,
  ExternalLink,
  LayoutDashboard,
  Calendar,
  Clock,
  MapPin,
  Globe,
  TrendingUp,
  Ticket,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { api } from '../../services/api';
import { OrganizerEvent, formatNaira } from '../../lib/eventOrganizer';
import { resolveImageUrl } from '../../lib/media';
import { AttendeesTab } from '../../components/organizer/AttendeesTab';
import EventPhaseBadge from '../../components/organizer/EventPhaseBadge';

type AdminEventTab = 'overview' | 'attendees';

const AdminEventDetailPage: React.FC = () => {
  const { id: eventParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminEventTab>('overview');

  // Event QR modal state & link copy
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  useEffect(() => {
    if (!eventParam) return;
    setLoading(true);
    setError(null);

    api.events
      .getOrganizerEventById(eventParam)
      .then((res) => setEvent(res.data))
      .catch(() => setError('Could not load event details.'))
      .finally(() => setLoading(false));
  }, [eventParam]);

  const publicPath = `/events/${event?.slug || event?.id}`;
  const fullPublicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${publicPath}`
      : publicPath;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
    fullPublicUrl
  )}`;

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullPublicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      window.prompt('Copy event link:', fullPublicUrl);
    }
  };

  const copySlug = async () => {
    if (!event?.slug && !event?.id) return;
    try {
      await navigator.clipboard.writeText(String(event.slug || event.id));
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadQr = async () => {
    setDownloadingQr(true);
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `event_qr_${event?.slug || event?.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR code blob:', err);
      window.open(qrCodeImageUrl, '_blank');
    } finally {
      setDownloadingQr(false);
    }
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || 'Event on PartyStorm',
          text: `Check out ${event?.title || 'this event'} on PartyStorm!`,
          url: fullPublicUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `Check out ${event?.title || 'this event'} on PartyStorm: ${fullPublicUrl}`
    )}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="pb-16 max-w-7xl mx-auto px-2 sm:px-4 p-3 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-16 text-center px-4 max-w-md mx-auto space-y-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
          <X className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {error || 'Event not found'}
        </p>
        <Link to="/admin/events">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  // Key metrics & computations
  const stats = event.stats;
  const cover = resolveImageUrl(event.imageUrl);
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const totalSold = stats?.ticketsSold ?? (event.attendees || 0);
  const totalRevenue = stats?.actualRevenue ?? (event.revenue || 0);
  const checkedInCount = stats?.ticketsCheckedIn ?? 0;
  const totalInventory =
    stats?.ticketInventory ??
    (event.ticketTypes?.reduce((acc, t) => acc + (t.quantity || 0), 0) || 0);

  const checkInRate = totalSold > 0 ? Math.round((checkedInCount / totalSold) * 100) : 0;
  const sellThroughRate =
    totalInventory > 0 ? Math.min(Math.round((totalSold / totalInventory) * 100), 100) : 0;

  const ticketRows =
    stats?.ticketTypeStats?.length
      ? stats.ticketTypeStats
      : (event.ticketTypes || []).map((tt) => ({
          id: tt.id,
          name: tt.name,
          price: tt.price,
          quantity: tt.quantity,
          sold: 0,
          revenue: 0,
          checkedIn: 0,
          expectedRevenue: 0,
        }));

  // Amenities parse
  const rawAmenities = (event as any).amenities;
  let parsedAmenities: string[] = [];
  if (Array.isArray(rawAmenities)) {
    parsedAmenities = rawAmenities;
  } else if (typeof rawAmenities === 'string') {
    try {
      parsedAmenities = JSON.parse(rawAmenities);
    } catch {
      parsedAmenities = rawAmenities ? [rawAmenities] : [];
    }
  }

  const organization = (event as any).organization;
  const isPromoted = Boolean((event as any).isPromoted);

  return (
    <div className="pb-16 max-w-7xl mx-auto px-2 sm:px-3 space-y-2.5">
      {/* ── 1. Compact Header Bar ── */}
      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/events')}
            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0 px-2 h-7 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Events</span>
          </Button>

          <span className="text-neutral-300 dark:text-neutral-700">/</span>

          <h1 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            {event.title}
          </h1>

          <button
            type="button"
            onClick={copySlug}
            title="Copy ID"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <span>#{event.id}</span>
            {copiedSlug ? (
              <Check className="h-2.5 w-2.5 text-emerald-500" />
            ) : (
              <Copy className="h-2.5 w-2.5 opacity-60" />
            )}
          </button>

          <div className="hidden sm:inline-block scale-90 origin-left">
            <EventPhaseBadge event={event} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg text-xs px-2.5 h-7 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer gap-1 font-semibold"
            >
              <ExternalLink className="h-3 w-3 text-neutral-400" />
              <span className="hidden sm:inline">Public</span>
            </Button>
          </a>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowQrModal(true)}
            className="rounded-lg text-xs px-2.5 h-7 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500 cursor-pointer gap-1 font-semibold"
          >
            <QrCode className="h-3 w-3 text-rose-500" />
            <span className="hidden sm:inline">QR</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareLink}
            className="rounded-lg text-xs px-2.5 h-7 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500 cursor-pointer gap-1 font-semibold"
          >
            <Share2 className="h-3 w-3 text-rose-500" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Compact Host & Status Ribbon ── */}
      {organization && (
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 px-3 py-1.5 shadow-2xs flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {organization.logo ? (
              <img
                src={resolveImageUrl(organization.logo) || ''}
                alt={organization.name}
                className="w-5 h-5 rounded-md object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-rose-500 to-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                {organization.name?.[0]?.toUpperCase() || 'O'}
              </div>
            )}
            <span className="text-neutral-400 text-[11px]">Host:</span>
            <span className="font-bold text-neutral-900 dark:text-white truncate text-[11px]">
              {organization.name}
            </span>
            {organization.isVerified && (
              <span title="Verified Host" className="inline-flex items-center">
                <BadgeCheck className="h-3 w-3 fill-rose-500 text-white shrink-0" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {isPromoted && (
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3 w-3" />
                Promoted
              </span>
            )}
            <Link
              to="/admin/organizations"
              className="font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              Org Directory →
            </Link>
          </div>
        </div>
      )}

      {/* ── 2 Tabs: Overview & Attendees ── */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as AdminEventTab)}
        className="w-full"
      >
        <TabsList className="mb-2.5 w-full flex overflow-x-auto overflow-y-hidden flex-nowrap bg-transparent border-b border-neutral-200/80 dark:border-neutral-800 rounded-none p-0 h-auto justify-start items-end">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2 px-3 data-[state=active]:shadow-none text-xs sm:text-sm font-bold flex items-center gap-1.5"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>

          <TabsTrigger
            value="attendees"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2 px-3 data-[state=active]:shadow-none text-xs sm:text-sm font-bold flex items-center gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            Attendees
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: OVERVIEW ── */}
        <TabsContent value="overview" className="mt-0 focus-visible:outline-none space-y-3">
          {/* Compact Hero Banner */}
          <section className="overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs relative">
            <div className="relative min-h-[110px] sm:min-h-[135px] w-full flex flex-col justify-end">
              {cover ? (
                <>
                  <img
                    src={cover}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-rose-950/60" />
              )}

              {/* Title & Logistics Bar */}
              <div className="relative z-10 p-3.5 sm:p-4 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {event.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold capitalize text-[10px]">
                      {event.category}
                    </span>
                  )}
                  {event.isPublished ? (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-emerald-500/80 text-white font-bold text-[9px]">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-neutral-600/80 text-white font-bold text-[9px]">
                      Draft
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-xl font-black tracking-tight text-white drop-shadow-sm">
                  {event.title}
                </h2>

                <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/90">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/45 backdrop-blur-md border border-white/10 font-medium text-[10px]">
                    <Calendar className="h-3 w-3 text-rose-400 shrink-0" />
                    {start.toLocaleDateString('en-NG', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/45 backdrop-blur-md border border-white/10 font-medium text-[10px]">
                    <Clock className="h-3 w-3 text-rose-400 shrink-0" />
                    {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {' – '}
                    {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>

                  {event.location && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/45 backdrop-blur-md border border-white/10 font-medium text-[10px] max-w-sm truncate">
                      {event.locationType === 'online' ? (
                        <Globe className="h-3 w-3 text-rose-400 shrink-0" />
                      ) : (
                        <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                      )}
                      <span className="truncate">{event.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Left 2 Cols: Description & Amenities */}
            <div className="md:col-span-2 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-2.5">
              <div className="space-y-1">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-rose-500" />
                  About Event
                </h3>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                  {event.description || 'No detailed description provided by organizer.'}
                </p>
              </div>

              {parsedAmenities.length > 0 && (
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Amenities & Highlights
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {parsedAmenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium border border-neutral-200/50 dark:border-neutral-700/50"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 1 Col: Quick Logistics */}
            <div className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Event Logistics
                </h3>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-500">Mode</span>
                    <span className="font-bold text-neutral-900 dark:text-white capitalize">
                      {event.locationType || 'Venue'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-500">Vendors</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {event.allowVendors ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Promotion</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {isPromoted ? 'Promoted' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyPublicUrl}
                  className="w-full rounded-xl text-xs font-bold h-7 gap-1"
                >
                  {copiedUrl ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copiedUrl ? 'Copied' : 'Copy Event Link'}
                </Button>
              </div>
            </div>
          </div>

          {/* Ticket Inventory Breakdown Table */}
          <section className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
            <div className="px-3.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Ticket Tiers ({ticketRows.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-100 dark:border-neutral-800">
                  <tr>
                    <th className="py-2 px-3">Tier Name</th>
                    <th className="py-2 px-3">Price</th>
                    <th className="py-2 px-3">Sold / Cap</th>
                    <th className="py-2 px-3">Sell-Through</th>
                    <th className="py-2 px-3">Checked In</th>
                    <th className="py-2 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {ticketRows.map((tt) => {
                    const qty = tt.quantity;
                    const sold = tt.sold || 0;
                    const tierRevenue = tt.revenue || sold * (tt.price || 0);
                    const left = qty != null ? Math.max(qty - sold, 0) : null;
                    const isSoldOut = qty != null && left === 0;
                    const pct = qty && qty > 0 ? Math.min(Math.round((sold / qty) * 100), 100) : 0;

                    return (
                      <tr key={tt.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2 px-3 font-bold text-neutral-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{tt.name}</span>
                            {isSoldOut && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                                Sold Out
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                          {tt.price === 0 ? 'Free' : formatNaira(tt.price)}
                        </td>
                        <td className="py-2 px-3 tabular-nums">
                          <span className="font-bold text-neutral-900 dark:text-white">{sold}</span>
                          <span className="text-neutral-400"> / {qty != null ? qty : '∞'}</span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-rose-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-neutral-500 tabular-nums">
                              {qty != null ? `${pct}%` : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 tabular-nums font-semibold text-neutral-700 dark:text-neutral-300">
                          {tt.checkedIn || 0}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-neutral-900 dark:text-white tabular-nums">
                          {formatNaira(tierRevenue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {ticketRows.length > 0 && (
                  <tfoot className="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold border-t border-neutral-200 dark:border-neutral-700 text-xs">
                    <tr>
                      <td className="py-2.5 px-3 text-neutral-900 dark:text-white font-extrabold">Total</td>
                      <td className="py-2.5 px-3 text-neutral-400">—</td>
                      <td className="py-2.5 px-3 text-neutral-900 dark:text-white tabular-nums">
                        {totalSold} {totalInventory > 0 ? `/ ${totalInventory}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300 tabular-nums">
                        {totalInventory > 0 ? `${sellThroughRate}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-900 dark:text-white tabular-nums">
                        {checkedInCount} ({checkInRate}%)
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-neutral-900 dark:text-white tabular-nums">
                        {formatNaira(totalRevenue)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </TabsContent>

        {/* ── TAB 2: ATTENDEES ── */}
        <TabsContent value="attendees" className="mt-0 focus-visible:outline-none">
          <AttendeesTab
            eventId={event.id}
            eventSlug={event.slug}
            event={event}
            readOnly={true}
          />
        </TabsContent>
      </Tabs>

      {/* ── Event QR Code Modal ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-center space-y-3 relative">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                Event Pass & Details
              </span>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white truncate mt-0.5">
                {event.title}
              </h3>
            </div>

            <div className="p-2.5 bg-white rounded-2xl border border-neutral-200 dark:border-neutral-700 inline-block shadow-xs">
              <img
                src={qrCodeImageUrl}
                alt={`QR code for ${event.title}`}
                className="w-44 h-44 mx-auto object-contain"
              />
            </div>

            <p className="text-[11px] text-neutral-500 break-all px-2 select-all">
              {fullPublicUrl}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyPublicUrl}
                className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold h-9 rounded-xl border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
              >
                {copiedUrl ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copiedUrl ? 'Copied' : 'Copy Link'}
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={downloadingQr}
                onClick={handleDownloadQr}
                className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold h-9 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer border-0"
              >
                {downloadingQr ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                {downloadingQr ? 'Saving…' : 'Download'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventDetailPage;
