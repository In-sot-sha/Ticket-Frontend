import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  Users,
  Store,
  BarChart3,
  Settings,
  Megaphone,
  Copy,
  Check,
  Download,
  Loader2,
  Share2,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { api } from '../services/api';
import { OrganizerEvent } from '../lib/eventOrganizer';
import { OverviewTab } from '../components/organizer/OverviewTab';
import { AttendeesTab } from '../components/organizer/AttendeesTab';
import { VendorsTab } from '../components/organizer/VendorsTab';
import { AnalyticsTab } from '../components/organizer/AnalyticsTab';
import { EventToolsPanel } from '../components/organizer/EventToolsPanel';
import { SettingsTab } from '../components/organizer/SettingsTab';

type TabType = 'overview' | 'attendees' | 'marketing' | 'vendors' | 'analytics' | 'settings';

const OrganizerEventPage: React.FC = () => {
  const { id: eventParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [vendorApplications, setVendorApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Event QR modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  useEffect(() => {
    if (!eventParam) return;
    setLoading(true);
    setError(null);

    api.events
      .getOrganizerEventById(eventParam)
      .then((res) => setEvent(res.data))
      .catch(() => setError('Could not load event.'))
      .finally(() => setLoading(false));
  }, [eventParam]);

  useEffect(() => {
    if (!event?.id || !event.allowVendors) return;

    api
      .get<any[]>(`/vendors/applications?eventId=${event.id}`)
      .then((res) => setVendorApplications(res.data || []))
      .catch((err) => console.error('Failed to load vendor applications:', err));
  }, [event?.id, event?.allowVendors]);

  const publicPath = `/events/${event?.slug || event?.id}`;

  const fullPublicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${publicPath}`
    : publicPath;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(fullPublicUrl)}`;

  const [downloadingQr, setDownloadingQr] = useState(false);
  const [sharingQr, setSharingQr] = useState(false);

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullPublicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      window.prompt('Copy event link:', fullPublicUrl);
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
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out ${event?.title || 'this event'} on PartyStorm: ${fullPublicUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareQr = async () => {
    const filename = `event_qr_${event?.slug || event?.id}.png`;
    setSharingQr(true);
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type || 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: event?.title || 'Event QR',
          text: `Scan to get tickets for ${event?.title || 'this event'}`,
          files: [file],
        });
        return;
      }
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
        setCopiedQr(true);
        setTimeout(() => setCopiedQr(false), 2000);
        return;
      }
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      window.open(qrCodeImageUrl, '_blank');
    } finally {
      setSharingQr(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-24 md:pb-8 max-w-7xl mx-auto px-3 sm:px-6 p-4 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-12 text-center px-4">
        <p className="text-rose-500 mb-4">{error || 'Event not found'}</p>
        <Link to="/organizer/events">
          <Button variant="outline" className="rounded-full">
            ← Back to events
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8 max-w-7xl mx-auto px-0 sm:px-2 relative">
      {/* Sleek, ultra-compact action header bar */}
      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-2 mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Button
            variant="ghost"
            onClick={() => navigate('/organizer/events')}
            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-rose-500 transition-colors shrink-0 px-2 h-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </Button>
          {activeTab !== 'overview' && (
            <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate min-w-0">
              {event.title}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowQrModal(true)}
            className="rounded-lg text-xs px-2.5 h-8 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500 cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5 sm:mr-1 text-rose-500" />
            <span className="hidden sm:inline">Event QR</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareLink}
            className="rounded-lg text-xs px-2.5 h-8 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500 cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 sm:mr-1 text-rose-500" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        onValueChange={(value) => setActiveTab(value as TabType)}
        className="w-full"
      >
        <TabsList className="mb-3 w-full flex overflow-x-auto overflow-y-hidden flex-nowrap bg-transparent border-b border-neutral-200/80 dark:border-neutral-800 rounded-none p-0 h-auto justify-start items-end">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2.5 px-3 data-[state=active]:shadow-none text-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="attendees"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2.5 px-3 data-[state=active]:shadow-none text-sm"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Attendees
          </TabsTrigger>
          <TabsTrigger
            value="marketing"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2.5 px-3 data-[state=active]:shadow-none text-sm"
          >
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            Marketing
          </TabsTrigger>
          {event.allowVendors && (
            <TabsTrigger
              value="vendors"
              className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2.5 px-3 data-[state=active]:shadow-none text-sm"
            >
              <Store className="h-3.5 w-3.5 mr-1.5" />
              Vendors
              {vendorApplications.filter(
                (v) =>
                  v.applicationStatus === 'PENDING' ||
                  v.applicationStatus === null ||
                  v.applicationStatus === undefined
              ).length > 0 && (
                <span className="ml-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full px-1.5 py-0.5">
                  {
                    vendorApplications.filter(
                      (v) =>
                        v.applicationStatus === 'PENDING' ||
                        v.applicationStatus === null ||
                        v.applicationStatus === undefined
                    ).length
                  }
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2.5 px-3 data-[state=active]:shadow-none text-sm"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2.5 px-3 data-[state=active]:shadow-none text-sm"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="min-h-[420px]">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab event={event} vendorApplications={vendorApplications} />
          </TabsContent>

          <TabsContent value="attendees" className="mt-0">
            <AttendeesTab eventId={event.id} eventSlug={event.slug} />
          </TabsContent>

          <TabsContent value="marketing" className="mt-0">
            <EventToolsPanel
              event={event as any}
              onEventUpdate={(patch) => setEvent((prev) => (prev ? { ...prev, ...patch } : prev))}
            />
          </TabsContent>

          {event.allowVendors && (
            <TabsContent value="vendors" className="mt-0">
              <VendorsTab eventId={event.id} event={event} />
            </TabsContent>
          )}

          <TabsContent value="analytics" className="mt-0">
            <AnalyticsTab event={event} vendorApplications={vendorApplications} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsTab
              event={event}
              onEventUpdate={(patch) => setEvent((prev) => (prev ? { ...prev, ...patch } : prev))}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Event QR Code Modal for Others to Scan ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Scan to View & Buy Tickets</span>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white truncate mt-0.5">
                {event.title}
              </h3>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-neutral-200 dark:border-neutral-700 inline-block shadow-xs">
              <img
                src={qrCodeImageUrl}
                alt={`${event.title} QR Code`}
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>

            <p className="text-[11px] text-neutral-500">
              Show this QR code to attendees, friends, or customers so they can scan directly with their phone camera to purchase tickets.
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sharingQr}
                onClick={handleShareQr}
                className="flex-1 rounded-xl text-xs font-semibold h-10 gap-1.5 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500 cursor-pointer"
              >
                {sharingQr ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                ) : copiedQr ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Share2 className="h-3.5 w-3.5 text-rose-500" />
                )}
                {copiedQr ? 'Copied' : 'Share'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyPublicUrl}
                className="flex-1 rounded-xl text-xs font-semibold h-10 gap-1.5 border-neutral-200 dark:border-neutral-700 cursor-pointer"
              >
                {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedUrl ? 'Copied' : 'Copy link'}
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={downloadingQr}
                onClick={handleDownloadQr}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer border-0"
              >
                {downloadingQr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {downloadingQr ? 'Save' : 'Download'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerEventPage;
