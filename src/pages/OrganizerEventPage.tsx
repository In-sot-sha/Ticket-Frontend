import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Users,
  TrendingUp,
  UserCheck,
  Pencil,
  ExternalLink,
  ScanLine,
  Copy,
  CheckCircle2,
  Globe,
  Store,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { api } from '../services/api';
import { resolveImageUrl } from '../lib/media';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { formatNaira, OrganizerEvent } from '../lib/eventOrganizer';
import { motion } from 'framer-motion';

const OrganizerEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [vendorApplications, setVendorApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors'>('overview');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendeeLoading, setAttendeeLoading] = useState(false);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<number | null>(null);
  const [selectedTicketTypeName, setSelectedTicketTypeName] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    api.events
      .getOrganizerEventById(Number(id))
      .then((res) => setEvent(res.data))
      .catch(() => setError('Could not load event.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch vendor applications when event has vendors enabled
  useEffect(() => {
    if (!event?.id || !event.allowVendors) return;
    
    setVendorLoading(true);
    api
      .get<any[]>(`/vendors/applications?eventId=${event.id}`)
      .then((res) => setVendorApplications(res.data))
      .catch((err) => console.error('Failed to load vendor applications:', err))
      .finally(() => setVendorLoading(false));
  }, [event?.id, event?.vendorSettings?.allowVendors]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-12 text-center px-4">
        <p className="text-rose-500 mb-4">{error || 'Event not found'}</p>
        <Link to="/organizer/events">
          <Button variant="outline" className="rounded-full">← Back to events</Button>
        </Link>
      </div>
    );
  }

  const stats  = event.stats;
  const cover  = resolveImageUrl(event.imageUrl);
  const start  = new Date(event.startDate);
  const end    = new Date(event.endDate);
  const pct    = stats?.sellThroughPercent ?? 0;
  const sold   = stats?.ticketsSold ?? event.attendees ?? 0;
  const checkedIn = stats?.ticketsCheckedIn ?? 0;
  const earned = stats?.actualRevenue ?? event.revenue ?? 0;
  const expected = stats?.expectedRevenue ?? 0;

  const publicUrl = `${window.location.origin}/events/${event.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openAttendanceModal = async () => {
    setShowAttendanceModal(true);
    setAttendeeLoading(true);
    try {
      const res = await api.get<any[]>(`/tickets/event/${id}`);
      setAttendees(res.data || []);
    } catch (err) {
      console.error('Failed to load attendees:', err);
      setAttendees([]);
    } finally {
      setAttendeeLoading(false);
    }
  };

  const openTicketTypeAttendanceModal = async (ticketTypeId: number, ticketTypeName: string) => {
    setSelectedTicketTypeId(ticketTypeId);
    setSelectedTicketTypeName(ticketTypeName);
    setShowAttendanceModal(true);
    setAttendeeLoading(true);
    try {
      const res = await api.get<any[]>(`/tickets/event/${id}`);
      // Filter to only tickets of this type that are checked in
      const filtered = res.data?.filter(t => t.ticketTypeId === ticketTypeId) || [];
      setAttendees(filtered);
    } catch (err) {
      console.error('Failed to load attendees:', err);
      setAttendees([]);
    } finally {
      setAttendeeLoading(false);
    }
  };

  const statCards = [
    { label: 'Tickets sold',     value: String(sold),          sub: stats ? `of ${stats.ticketInventory} available` : undefined, icon: <Ticket className="h-4 w-4" /> },
    { label: 'Checked in',       value: String(checkedIn),     sub: sold > 0 ? `${Math.round((checkedIn / sold) * 100)}% of sold` : 'No sales yet', icon: <UserCheck className="h-4 w-4" /> },
    { label: 'Revenue earned',   value: formatNaira(earned),   sub: 'From ticket sales', icon: <TrendingUp className="h-4 w-4" />, accent: true },
    { label: 'Expected revenue', value: formatNaira(expected), sub: `${pct}% sold through`, icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="pb-24 md:pb-8 max-w-5xl mx-auto">

      {/* ── Sticky mobile header bar ── */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800 px-4 py-3 flex items-center justify-between gap-2 -mx-4 md:static md:bg-transparent md:dark:bg-transparent md:border-0 md:px-0 md:mb-5 md:backdrop-blur-none">
        <button
          onClick={() => navigate('/organizer/events')}
          className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-rose-500 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" /> Events
        </button>
        <div className="flex items-center gap-2">
          <Link to="/organizer/scan">
            <Button variant="outline" size="sm" className="rounded-full text-xs px-3 h-8">
              <ScanLine className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          </Link>
          <Link to={`/events/${event.id}`} target="_blank">
            <Button variant="outline" size="sm" className="rounded-full text-xs px-3 h-8">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Public</span>
            </Button>
          </Link>
          <Link to={`/organizer/events/create/${event.id}`}>
            <Button size="sm" className="rounded-full text-xs px-3 h-8 bg-rose-500 hover:bg-rose-600 text-white border-0">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Cover image ── */}
      <div className="rounded-none sm:rounded-2xl overflow-hidden -mx-4 sm:mx-0 mb-4">
        {cover ? (
          <div className="aspect-[3/1] max-h-44 sm:max-h-56 relative">
            <img src={cover} alt={event.title} className="w-full h-full object-cover" />
            {/* Sell-through progress strip */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div className="h-full bg-rose-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          <div className="aspect-[3/1] max-h-44 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Calendar className="h-10 w-10 text-neutral-300" />
          </div>
        )}
      </div>

      {/* ── Title + meta ── */}
      <div className="px-4 sm:px-0 mb-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white leading-tight">
            {event.title}
          </h1>
          <EventPhaseBadge event={event} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {start.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {' – '}
            {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 min-w-0">
              {event.locationType === 'online'
                ? <Globe className="h-3.5 w-3.5 shrink-0" />
                : <MapPin className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{event.location}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      {event.allowVendors && (
        <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 sm:px-0 mb-6 flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'vendors'
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            Vendors
          </button>
        </div>
      )}

      {/* ── Tab Content ── */}
      {activeTab === 'overview' && (
        <>
          {/* ── Stat cards — 2 cols on mobile, 4 on lg ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-0 mb-5">
            {statCards.map((card) => (
              <div
                key={card.label}
                onClick={card.label === 'Checked in' ? openAttendanceModal : undefined}
                className={`rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4 ${
                  card.label === 'Checked in' ? 'cursor-pointer hover:border-rose-300 hover:shadow-md transition-all' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 leading-tight">
                    {card.label}
                  </span>
                  <span className={card.accent ? 'text-rose-500' : 'text-neutral-400'}>{card.icon}</span>
                </div>
                <p className={`text-lg sm:text-xl font-extrabold ${card.accent ? 'text-rose-500' : 'text-neutral-900 dark:text-white'}`}>
                  {card.value}
                </p>
                {card.sub && (
                  <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">{card.sub}</p>
                )}
              </div>
            ))}
          </div>

          {/* ── Sell-through bar ── */}
          <div className="mx-4 sm:mx-0 mb-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-neutral-500">Sell-through rate</p>
              <p className="text-xs font-extrabold text-rose-500">{pct}%</p>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1.5">{sold} sold · {(stats?.ticketInventory ?? 0) - sold} remaining</p>
          </div>

          {/* ── Ticket type breakdown ── */}
          {stats?.ticketTypeStats && stats.ticketTypeStats.length > 0 && (
            <div className="mx-4 sm:mx-0 mb-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5 text-rose-500" /> Sales by ticket type
                </h2>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {stats.ticketTypeStats.map((tt) => {
                  const ttPct = (tt.quantity ?? 0) > 0
                    ? Math.round((tt.sold / (tt.quantity ?? 1)) * 100)
                    : 0;
                  const ticketsLeft = (tt.quantity ?? 0) - tt.sold;
                  return (
                    <div 
                      key={tt.id} 
                      onClick={() => openTicketTypeAttendanceModal(tt.id, tt.name)}
                      className="px-4 py-3.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      {/* Name + price row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">{tt.name}</p>
                          <p className="text-xs text-neutral-500">
                            {tt.price === 0 ? 'Free' : formatNaira(tt.price)} · {tt.quantity ?? 0} total
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-rose-500 shrink-0">{ttPct}%</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-2.5">
                        <div className="h-full bg-rose-400 rounded-full" style={{ width: `${ttPct}%` }} />
                      </div>
                      {/* Stats grid — 4 cols, compact on mobile */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Sold',     value: String(tt.sold) },
                          { label: 'Left',     value: String(ticketsLeft) },
                          { label: 'Earned',   value: formatNaira(tt.revenue),         accent: true },
                          { label: 'Max',      value: formatNaira(tt.expectedRevenue) },
                        ].map(s => (
                          <div key={s.label}>
                            <p className="text-[9px] text-neutral-400 uppercase tracking-wide leading-none mb-0.5">{s.label}</p>
                            <p className={`text-xs font-bold truncate ${s.accent ? 'text-rose-500' : 'text-neutral-900 dark:text-white'}`}>
                              {s.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Public link ── */}
          <div className="mx-4 sm:mx-0 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Public event link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-neutral-50 dark:bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-100 dark:border-neutral-800 truncate text-neutral-500">
                {publicUrl}
              </code>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold hover:border-rose-300 hover:text-rose-500 transition-colors shrink-0"
              >
                {copied
                  ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Copied</>
                  : <><Copy className="h-3.5 w-3.5" /> Copy</>
                }
              </button>
            </div>
          </div>
        </>
      )}

      {/* Vendors Tab */}
      {activeTab === 'vendors' && event.allowVendors && (
        <div className="space-y-6">
          {/* Vendor Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-0">
            {[
              { 
                label: 'Total Applications',
                value: String(vendorApplications.length),
                icon: <Store className="h-4 w-4" />
              },
              { 
                label: 'Pending',
                value: String(vendorApplications.filter(v => v.applicationStatus === null).length),
                icon: <AlertCircle className="h-4 w-4" />
              },
              { 
                label: 'Approved',
                value: String(vendorApplications.filter(v => v.applicationStatus === true).length),
                icon: <CheckCircle className="h-4 w-4" />,
                accent: true
              },
              { 
                label: 'Rejected',
                value: String(vendorApplications.filter(v => v.applicationStatus === false).length),
                icon: <XCircle className="h-4 w-4" />
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 leading-tight">
                    {card.label}
                  </span>
                  <span className={card.accent ? 'text-green-500' : 'text-neutral-400'}>{card.icon}</span>
                </div>
                <p className={`text-lg sm:text-xl font-extrabold ${card.accent ? 'text-green-500' : 'text-neutral-900 dark:text-white'}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Vendor Applications List */}
          {vendorLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : vendorApplications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">No applications yet</p>
              <p className="text-xs text-neutral-500">Vendor applications will appear here once vendors submit their requests.</p>
            </div>
          ) : (
            <div className="space-y-6 px-4 sm:px-0">
              {/* Pending Applications */}
              {vendorApplications.filter(v => v.applicationStatus === null).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    Pending Applications ({vendorApplications.filter(v => v.applicationStatus === null).length})
                  </h3>
                  <div className="grid gap-3">
                    {vendorApplications
                      .filter(v => v.applicationStatus === null)
                      .map((app) => (
                        <VendorApplicationCard key={app.id} app={app} eventId={Number(id)} onActionComplete={() => window.location.reload()} />
                      ))}
                  </div>
                </div>
              )}

              {/* Approved Vendors */}
              {vendorApplications.filter(v => v.applicationStatus === true).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Approved Vendors ({vendorApplications.filter(v => v.applicationStatus === true).length})
                  </h3>
                  <div className="grid gap-3">
                    {vendorApplications
                      .filter(v => v.applicationStatus === true)
                      .map((app) => (
                        <VendorApplicationCard key={app.id} app={app} eventId={Number(id)} onActionComplete={() => window.location.reload()} />
                      ))}
                  </div>
                </div>
              )}

              {/* Rejected Applications */}
              {vendorApplications.filter(v => v.applicationStatus === false).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Rejected ({vendorApplications.filter(v => v.applicationStatus === false).length})
                  </h3>
                  <div className="grid gap-3">
                    {vendorApplications
                      .filter(v => v.applicationStatus === false)
                      .map((app) => (
                        <VendorApplicationCard key={app.id} app={app} eventId={Number(id)} onActionComplete={() => window.location.reload()} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Attendance Modal ── */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white">
                  {selectedTicketTypeId ? `Attendees - ${selectedTicketTypeName}` : 'Attendees'}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">{attendees.length} checked in</p>
              </div>
              <button
                onClick={() => {
                  setShowAttendanceModal(false);
                  setSelectedTicketTypeId(null);
                  setSelectedTicketTypeName('');
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {attendeeLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Spinner />
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">No attendees checked in yet</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {attendees.map((attendee, idx) => (
                    <div key={idx} className="p-4 sm:p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-sm text-neutral-900 dark:text-white">
                            {attendee.user?.firstName} {attendee.user?.lastName}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">{attendee.user?.email}</p>
                          {attendee.user?.phone && (
                            <p className="text-xs text-neutral-500">{attendee.user.phone}</p>
                          )}
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full shrink-0">
                          ✓ Checked In
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-2 space-y-1">
                        <p><strong>Ticket:</strong> {attendee.ticketType?.name}</p>
                        <p><strong>QR Code:</strong> <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px]">{attendee.qrCode}</code></p>
                        {attendee.updatedAt && (
                          <p><strong>Checked In:</strong> {new Date(attendee.updatedAt).toLocaleString('en-NG')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrganizerEventPage;

// Vendor Application Card Component
const VendorApplicationCard: React.FC<{ app: any; eventId: number; onActionComplete?: () => void }> = ({ app, eventId, onActionComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.put(`/vendors/applications/${app.id}`, { applicationStatus: true });
      onActionComplete?.();
    } catch (error) {
      console.error('Failed to approve application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await api.put(`/vendors/applications/${app.id}`, { applicationStatus: false });
      onActionComplete?.();
    } catch (error) {
      console.error('Failed to reject application:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = 
    app.applicationStatus === null ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
    app.applicationStatus === true ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  const statusText =
    app.applicationStatus === null ? 'PENDING' :
    app.applicationStatus === true ? 'APPROVED' :
    'REJECTED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
            {app.vendor?.businessName || app.user?.firstName + ' ' + app.user?.lastName}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Applied: {new Date(app.createdAt).toLocaleDateString('en-NG')}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
        {app.vendor?.businessName && (
          <p><strong>Business:</strong> {app.vendor.businessName}</p>
        )}
        {app.vendor?.contactEmail && (
          <p><strong>Email:</strong> {app.vendor.contactEmail}</p>
        )}
        {app.user?.email && app.user.email !== app.vendor?.contactEmail && (
          <p><strong>User Email:</strong> {app.user.email}</p>
        )}
        {app.vendor?.description && (
          <p className="line-clamp-2"><strong>Description:</strong> {app.vendor.description}</p>
        )}
        <p><strong>Event:</strong> {app.event?.title}</p>
      </div>

      {app.applicationStatus === null && (
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={loading}
            className="flex-1 rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
          >
            {loading ? '...' : 'Reject'}
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 rounded-lg text-xs bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? '...' : 'Approve'}
          </Button>
        </div>
      )}
    </motion.div>
  );
};
