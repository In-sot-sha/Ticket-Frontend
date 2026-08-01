import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  ScanLine,
  Users,
  Store,
  BarChart3,
  Briefcase,
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

type TabType = 'overview' | 'promote' | 'attendees' | 'vendors' | 'analytics';

const OrganizerEventPage: React.FC = () => {
  const { id: eventParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [vendorApplications, setVendorApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opsRequesting, setOpsRequesting] = useState(false);
  const [opsMsg, setOpsMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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
  const editPath = `/organizer/events/create/${event?.id}`;

  const requestPartyStormOps = async () => {
    if (!event) return;
    setOpsRequesting(true);
    setOpsMsg(null);
    try {
      await api.staff.requestOps({
        title: `Ops — ${event.title}`,
        organizationId: (event as any).organizationId,
        eventId: event.id,
        services: ['GATE', 'SCAN', 'WALK_IN'],
        notes: 'Organizer requested PartyStorm gate ops from event dashboard.',
      });
      setOpsMsg('Ops request sent. PartyStorm will assign staff and follow up.');
    } catch {
      setOpsMsg('Could not send ops request. Try again or contact support.');
    } finally {
      setOpsRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-24 md:pb-8 max-w-6xl mx-auto p-4 space-y-6">
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
    <div className="pb-24 md:pb-8 max-w-6xl mx-auto relative">
      {/* Slim sticky chrome — no cover image here */}
      <div className="sticky top-0 mt-[-10px] z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-rose-100/80 dark:border-neutral-800 px-4 py-3 flex items-center justify-between gap-2 md:static md:bg-transparent md:dark:bg-transparent md:border-0 md:px-0 md:mb-4 md:backdrop-blur-none">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            onClick={() => navigate('/organizer/events')}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-rose-500 transition-colors shrink-0 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </Button>
          {activeTab !== 'overview' && (
            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate min-w-0">
              {event.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs px-3 h-8 border-rose-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500"
            disabled={opsRequesting}
            onClick={requestPartyStormOps}
          >
            <Briefcase className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">{opsRequesting ? 'Requesting…' : 'Request ops'}</span>
          </Button>
          <Link to="/organizer/scan">
            <Button variant="outline" size="sm" className="rounded-full text-xs px-3 h-8 border-rose-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500">
              <ScanLine className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          </Link>
          <Link to={publicPath} target="_blank">
            <Button variant="outline" size="sm" className="rounded-full text-xs px-3 h-8 border-rose-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500">
              <ExternalLink className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Public</span>
            </Button>
          </Link>
          <Link to={editPath}>
            <Button
              size="sm"
              className="rounded-full text-xs px-3 h-8 bg-rose-500 hover:bg-rose-600 text-white border-0"
            >
              <Pencil className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </Link>
        </div>
      </div>

      {opsMsg && (
        <p className="mx-4 md:mx-0 mb-3 text-xs font-medium text-rose-600 dark:text-rose-400">
          {opsMsg}
        </p>
      )}

      <Tabs
        defaultValue="overview"
        onValueChange={(value) => setActiveTab(value as TabType)}
        className="w-full"
      >
        <TabsList className="mb-3 mx-4 sm:mx-0 flex overflow-x-auto overflow-y-hidden flex-nowrap bg-transparent border-b border-rose-100/70 dark:border-neutral-800 rounded-none p-0 h-auto justify-start items-end">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2.5 px-3 data-[state=active]:shadow-none text-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="promote"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2.5 px-3 data-[state=active]:shadow-none text-sm"
          >
            Promote
          </TabsTrigger>
          <TabsTrigger
            value="attendees"
            className="data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2.5 px-3 data-[state=active]:shadow-none text-sm"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Attendees
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
        </TabsList>

        <div className="min-h-[420px]">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab event={event} vendorApplications={vendorApplications} />
          </TabsContent>

          <TabsContent value="promote" className="mt-0">
            <EventToolsPanel
              event={event as any}
              onEventUpdate={(patch) => setEvent((prev) => (prev ? { ...prev, ...patch } : prev))}
            />
          </TabsContent>

          <TabsContent value="attendees" className="mt-0">
            <AttendeesTab eventId={event.id} eventSlug={event.slug} />
          </TabsContent>

          {event.allowVendors && (
            <TabsContent value="vendors" className="mt-0">
              <VendorsTab eventId={event.id} event={event} />
            </TabsContent>
          )}

          <TabsContent value="analytics" className="mt-0">
            <AnalyticsTab event={event} vendorApplications={vendorApplications} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default OrganizerEventPage;
