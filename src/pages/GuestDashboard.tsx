import React, { useState, useEffect } from 'react';
import {
  Ticket,
  MapPin,
  Calendar,
  Loader2,
  X,
  Eye,
  Heart,
  CheckCircle,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import TicketCard, {
  downloadTicketCard,
  getTicketSerial,
  getTicketStyle,
  type TicketCardTicket,
  type TicketCardEventMeta,
} from '../components/TicketCard';
import { getDesignPreset } from '../data/ticketDesigns';

const GuestDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketCardTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketCardTicket | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await api.tickets.getAll({ userId: user.id });
        setTickets(res.data || []);
      } catch (err) {
        console.error('Failed to fetch user tickets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getThemeColors = (ticketType?: { ticketStyle?: string; name?: string }) => {
    const preset = getDesignPreset(ticketType?.ticketStyle);
    const map: Record<string, { bg: string; text: string; badge: string }> = {
      rose: {
        bg: 'from-rose-500 to-rose-600',
        text: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
      },
      gold: {
        bg: 'from-amber-500 to-amber-600',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
      },
      emerald: {
        bg: 'from-emerald-500 to-emerald-600',
        text: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
      },
      purple: {
        bg: 'from-purple-500 to-purple-600',
        text: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
      },
      midnight: {
        bg: 'from-slate-600 to-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        badge: 'bg-slate-50 text-slate-700 dark:bg-slate-950/20 dark:text-slate-400 border-slate-100 dark:border-slate-900/30',
      },
      ocean: {
        bg: 'from-sky-500 to-sky-600',
        text: 'text-sky-600 dark:text-sky-400',
        badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 border-sky-100 dark:border-sky-900/30',
      },
    };
    return map[preset.id] ?? map.rose;
  };

  // Build eventMeta from a ticket that has an embedded event object (from getAll)
  const buildEventMeta = (ticket: TicketCardTicket): TicketCardEventMeta => ({
    eventId:       ticket.event?.id ?? ticket.eventId,
    eventName:     ticket.event?.title,
    eventDate:     ticket.event?.startDate,
    eventLocation: ticket.event?.location,
    eventImageUrl: ticket.event?.imageUrl,
    ticketType:    ticket.ticketType?.name,
  });

  const modalIndex = selectedTicket
    ? tickets.findIndex(t => t.id === selectedTicket.id)
    : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-neutral-900 dark:text-neutral-100 pb-16">

      {/* Sub-header */}
      <div className="border-b border-neutral-150 dark:border-neutral-900 bg-neutral-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center">
              <Ticket className="h-6 w-6 text-rose-500 mr-2" />
              <h1 className="text-xl font-extrabold tracking-tight">My Tickets</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/events"
                className="text-xs font-bold px-4 py-2.5 rounded-full border border-neutral-250 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Browse Events
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/wishlist')}
                className="rounded-full text-xs font-bold px-4 bg-rose-500 hover:bg-rose-600 border-rose-500 text-white shrink-0 flex items-center gap-1.5"
              >
                <Heart className="h-4 w-4 fill-white" />
                Wishlist
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Gamification row — commented out until rewards backend is ready */}
        {/* 
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
            ...
          </div>
          <div className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            ...
          </div>
        </div>
        */}

        {/* Tickets list */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold tracking-tight">Your Purchased Tickets</h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-2" />
              <p className="text-xs text-neutral-500">Loading your passes...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
              <Ticket className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold mb-1">No ticket bookings yet</h3>
              <p className="text-xs text-neutral-500 mb-4 max-w-xs mx-auto">
                You haven't bought tickets for any upcoming listings. Explore events to book now!
              </p>
              <Link to="/">
                <Button className="rounded-full text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white">
                  Find Events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map(ticket => {
                const colors = getThemeColors(ticket.ticketType);
                const coverImage = ticket.event?.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                
                return (
                  <div
                    key={ticket.id}
                    className="border border-neutral-150 dark:border-neutral-900 rounded-2xl overflow-hidden flex bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow min-w-0"
                  >
                    {/* Thumbnail — fixed size, won't stretch the card vertically */}
                    <div className="w-24 sm:w-28 flex-shrink-0 relative self-stretch">
                      <img
                        src={coverImage}
                        alt={ticket.event?.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className={`absolute top-2 left-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase text-white bg-gradient-to-r ${colors.bg} max-w-[90%] truncate`}
                      >
                        {ticket.ticketType?.name}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-3 sm:p-4 flex flex-col justify-between flex-grow min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-1.5">
                          <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-2 leading-snug min-w-0">
                            {ticket.event?.title}
                          </h3>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase shrink-0 border ${colors.badge}`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                          <p className="flex items-center gap-1.5 leading-none">
                            <Calendar className="h-3 w-3 text-neutral-400 shrink-0" />
                            <span className="truncate">{formatDate(ticket.event?.startDate)}</span>
                          </p>
                          <p className="flex items-center gap-1.5 leading-none">
                            <MapPin className="h-3 w-3 text-neutral-400 shrink-0" />
                            <span className="truncate">{ticket.event?.location}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">
                          #{ticket.id}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                          className="rounded-full text-[10px] font-semibold border-neutral-250 hover:bg-neutral-50 dark:border-neutral-800 px-2 py-1 h-auto"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View pass
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Full Ticket Modal ─────────────────────────────────────────────────── */}
      {selectedTicket && (() => {
        const meta = buildEventMeta(selectedTicket);
        const serial = getTicketSerial(selectedTicket, modalIndex, meta.eventId);
        const style = getTicketStyle(selectedTicket.ticketType?.name);

        const colors = getThemeColors(selectedTicket.ticketType);
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/70 dark:bg-neutral-950/85 backdrop-blur-sm p-0 sm:p-4"
            onClick={e => { if (e.target === e.currentTarget) setSelectedTicket(null); }}
          >
            <div className="bg-neutral-50 dark:bg-neutral-950 w-full sm:max-w-4xl rounded-t-3xl sm:rounded-3xl overflow-y-auto max-h-[92dvh] sm:max-h-[90vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-rose-500">Entry Pass</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Present at gate for scanning</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      downloadTicketCard(`ticket-card-${serial}`, `ticket-${serial}.png`).catch(() =>
                        alert('Download failed.')
                      )
                    }
                    className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-rose-500 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Save PNG
                  </button>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* The full concert ticket — same component as TicketConfirmationPage */}
              <div className="p-4 sm:p-6">
                <TicketCard
                  ticket={selectedTicket}
                  index={modalIndex}
                  eventMeta={meta}
                  showDownload={false}
                />
              </div>

              {/* Valid status bar */}
              <div className="px-5 pb-5">
                <div
                  className={`flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl border ${
                    selectedTicket.status === 'VALID'
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                      : selectedTicket.status === 'USED'
                      ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-800'
                      : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  {selectedTicket.status === 'VALID'
                    ? 'Valid Entry Pass — Ready to Scan'
                    : selectedTicket.status === 'USED'
                    ? 'This pass has already been scanned'
                    : 'This pass has been cancelled'}
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default GuestDashboard;
