import React, { useMemo, useState } from 'react';
import {
  Ticket,
  Eye,
  CheckCircle,
  LogIn,
  Search,
  ArrowRight,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { CACHE_CONFIGS } from '../lib/queryClient';
import TicketCard, {
  DownloadTicketButton,
  getTicketSerial,
  type TicketCardTicket,
  type TicketCardEventMeta,
} from '../components/TicketCard';
import { ResponsiveModal } from '../components/ui/ResponsiveModal';
import { cn } from '../lib/utils';

function isTicketEventPast(ticket: TicketCardTicket) {
  const end = ticket.event?.endDate || ticket.event?.startDate;
  if (!end) return false;
  const d = new Date(end);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

function formatRelativeDate(dateString?: string) {
  if (!dateString) return '';
  const eventDate = new Date(dateString);
  if (Number.isNaN(eventDate.getTime())) return dateString;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) {
    return eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const TicketsDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState<TicketCardTicket | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await api.tickets.getMyTickets();
      return res.data || [];
    },
    enabled: !!user?.id,
    ...CACHE_CONFIGS.GUEST_TICKETS,
  });

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a: TicketCardTicket, b: TicketCardTicket) => {
      const aPast = isTicketEventPast(a);
      const bPast = isTicketEventPast(b);
      if (aPast !== bPast) return aPast ? 1 : -1;

      const aValid = a.status === 'VALID' ? 0 : 1;
      const bValid = b.status === 'VALID' ? 0 : 1;
      if (aValid !== bValid) return aValid - bValid;

      const aDate = new Date(a.event?.startDate || 0).getTime();
      const bDate = new Date(b.event?.startDate || 0).getTime();
      if (!aPast) return aDate - bDate;
      return bDate - aDate;
    });
  }, [tickets]);

  const buildEventMeta = (ticket: TicketCardTicket): TicketCardEventMeta => ({
    eventId: ticket?.event?.id ?? ticket.eventId,
    eventName: ticket?.event?.title,
    eventDate: ticket?.event?.startDate,
    eventLocation: ticket?.event?.location,
    eventImageUrl: ticket?.event?.imageUrl,
    ticketType: ticket?.ticketType?.name,
    ticketStyle: ticket?.ticketType?.ticketStyle,
    accentColor: ticket?.ticketType?.accentColor,
  });

  const modalIndex = selectedTicket
    ? sortedTickets.findIndex((t) => t.id === selectedTicket.id)
    : -1;

  const meta = selectedTicket ? buildEventMeta(selectedTicket) : null;

  const serial =
    selectedTicket && meta ? getTicketSerial(selectedTicket, modalIndex, meta.eventId) : '';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="p-5 backdrop-blur rounded-3xl sm:p-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-neutral-900 dark:text-white mb-3 leading-tight">
              Find Your Tickets
            </h1>
            <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
              You&apos;re not logged in yet. Choose how you want to get to your tickets.
            </p>

            <div className="space-y-5 mb-8">
              <div>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-11 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <LogIn className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                  <span>Login to My Account</span>
                </Button>
               
              </div>

              <div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/recover-ticket')}
                  className="w-full h-11 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-full text-sm font-bold hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 group"
                >
                  <Search className="h-4.5 w-4.5 group-hover:text-rose-500 transition-colors" />
                  <span className="group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Recover My Tickets
                  </span>
                </Button>
                <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed px-2">
                  Bought without logging in? Look up your passes with email or phone.
                </p>
              </div>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
                  or
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                Don&apos;t have an account?
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors group"
              >
                Create one now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
                Sign up with email or phone so your tickets stay linked to you.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Trusted by thousands of event attendees
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Secure Access</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Quick Recovery</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-neutral-900 dark:text-neutral-100 pb-20">
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-gray-950/90 border-b border-neutral-100 dark:border-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white">
                My Tickets
              </h1>
              <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {isLoading
                  ? 'Loading…'
                  : `${sortedTickets.length} pass${sortedTickets.length === 1 ? '' : 'es'} `}
              </p>
            </div>
            <Link
              to="/events"
              className="shrink-0 text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              Browse events <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex gap-3 rounded-2xl border border-neutral-150 dark:border-neutral-800 p-3"
              >
                <div className="h-20 w-20 rounded-xl bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedTickets.length === 0 ? (
          <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl mb-4">
              <Ticket className="h-8 w-8 text-neutral-400 dark:text-neutral-600" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No tickets yet</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-xs mx-auto">
              You haven&apos;t purchased any tickets. Explore events and get your first pass.
            </p>
            <Link to="/">
              <Button className="rounded-full text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-md">
                Discover Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className=" grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sortedTickets.map((ticket: TicketCardTicket) => {
              const past = isTicketEventPast(ticket);
              const coverImage =
                ticket.event?.imageUrl ||
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
              const status = ticket.status || 'VALID';

              return (
                <div key={ticket.id}>
                  <div className="flex gap-3 sm:gap-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-3.5">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                      <img
                        src={coverImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                          {ticket.event?.title || 'Event'}
                        </h3>
                        <span
                          className={cn(
                            'shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                            past
                              ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                              : status === 'VALID'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : status === 'USED'
                                  ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                  : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                          )}
                        >
                          {past ? 'Past' : status}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-rose-400 shrink-0" />
                        <span className="truncate">{formatRelativeDate(ticket.event?.startDate)}</span>
                      </p>
                      {ticket.event?.location && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                          <span className="truncate">{ticket.event.location}</span>
                        </p>
                      )}

                      <div className="mt-auto pt-2.5 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                          {ticket.ticketType?.name || 'Ticket'}
                          <span className="text-neutral-400 font-normal"> · #{ticket.id}</span>
                        </span>
                        <Button
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                          className="rounded-full text-[11px] font-bold h-8 px-3 bg-rose-500 hover:bg-rose-600 text-white border-0 shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ResponsiveModal
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
        size={6}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-rose-500">Entry Pass</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Present at gate for scanning
            </p>
          </div>
        </div>

        <div className="px-3 sm:px-6 pt-3 sm:pt-4">
          <DownloadTicketButton
            elementId={`ticket-card-${serial}`}
            filename={`ticket-${serial}.png`}
          />
        </div>

        <div className="p-3 sm:p-6 min-w-0">
          {selectedTicket && meta && (
            <TicketCard
              ticket={selectedTicket}
              index={modalIndex}
              eventMeta={meta}
              showDownload={false}
            />
          )}
        </div>

        <div className="px-3 sm:px-6 pb-5 sm:pb-6">
          <div
            className={`flex items-center justify-center gap-2 text-xs font-bold py-3 sm:py-3.5 px-3 rounded-xl border transition-all ${
              selectedTicket?.status === 'VALID'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                : selectedTicket?.status === 'USED'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                  : 'bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50'
            }`}
          >
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="text-center leading-snug">
              {selectedTicket?.status === 'VALID'
                ? 'Valid Entry Pass — Ready to Scan'
                : selectedTicket?.status === 'USED'
                  ? 'This pass has already been scanned'
                  : 'This pass has been cancelled'}
            </span>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
};

export default TicketsDashboard;

// Re-export for pages that historically imported this from GuestDashboard
export { ResponsiveModal } from '../components/ui/ResponsiveModal';
