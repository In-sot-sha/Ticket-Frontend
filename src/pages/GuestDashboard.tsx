import React, { useState } from 'react';
import {
  Ticket,
  MapPin,
  Calendar,
  Loader2,
  Eye,
  Heart,
  CheckCircle,
  Download,
  LogIn,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { CACHE_CONFIGS } from '../lib/queryClient';
import TicketCard, {
  downloadTicketCard,
  getTicketSerial,
  getTicketStyle,
  type TicketCardTicket,
  type TicketCardEventMeta,
} from '../components/TicketCard';
import { getDesignPreset } from '../data/ticketDesigns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from '@/components/ui/dialog';


import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer"

const TicketsDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState<TicketCardTicket | null>(null);

  // Use TanStack Query for fetching tickets with 5min cache (GUEST_TICKETS config)
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await api.tickets.getAll({ userId: user.id });
      return res.data || [];
    },
    enabled: !!user?.id,
    ...CACHE_CONFIGS.GUEST_TICKETS,
  });

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
    eventId: ticket?.event?.id ?? ticket.eventId,
    eventName: ticket?.event?.title,
    eventDate: ticket?.event?.startDate,
    eventLocation: ticket?.event?.location,
    eventImageUrl: ticket?.event?.imageUrl,
    ticketType: ticket?.ticketType?.name,
  });

  const modalIndex = selectedTicket
    ? tickets.findIndex(t => t.id === selectedTicket.id)
    : -1;

  // FIX: guard against selectedTicket being null before calling buildEventMeta
  const meta = selectedTicket ? buildEventMeta(selectedTicket) : null;

  const serial = selectedTicket && meta
    ? getTicketSerial(selectedTicket, modalIndex, meta.eventId)
    : '';

  // Unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Card Container */}
          <div className="bg-white dark:bg-neutral-900/80 backdrop-blur rounded-3xl shadow-lg border border-neutral-100 dark:border-neutral-800 p- sm:p-10">
            
            {/* Icon with subtle animation */}
            <div className="flex justify-center mb-8">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/50 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500/5 to-pink-500/5 dark:from-rose-500/10 dark:to-pink-500/10" />
                <Ticket className="h-10 w-10 text-rose-500 relative z-10" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-neutral-900 dark:text-white mb-3 leading-tight">
              Find Your Tickets
            </h1>

            {/* Subheading */}
            <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
              You're not logged in yet. Access your ticket history and manage your bookings with two simple options.
            </p>

            {/* Buttons Container */}
            <div className="space-y-3 mb-8">
              {/* Primary Button */}
              <button
                onClick={() => navigate('/login')}
                className="w-full h-14 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <LogIn className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                <span>Login to My Account</span>
              </button>

              {/* Secondary Button */}
              <button
                onClick={() => navigate('/recover-ticket')}
                className="w-full h-14 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-sm font-bold hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 group"
              >
                <Search className="h-4.5 w-4.5 group-hover:text-rose-500 transition-colors" />
                <span className="group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Search My Tickets</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">or</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                Don't have an account?
              </p>
              <Link 
                to="/register" 
                className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors group"
              >
                Create one now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Trusted by thousands of event attendees</p>
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
    <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-neutral-900 dark:text-neutral-100 pb-20">

      {/* Premium Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-neutral-100 dark:border-neutral-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-5 gap-4">
            
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40 rounded-xl">
                <Ticket className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white">My Tickets</h1>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Your event passes in one place</p>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <Link
                to="/events"
                className="text-xs font-bold px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
              >
                Explore Events
              </Link>
              <Button
                size="sm"
                onClick={() => navigate('/wishlist')}
                className="rounded-lg text-xs font-bold px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Heart className="h-3.5 w-3.5 fill-white" />
                <span className="hidden sm:inline">Wishlist</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

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
        <div className="space-y-8">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Your Purchased Tickets</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">View and manage all your event passes</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative w-12 h-12 mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-rose-500" />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Loading your passes...</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">This won't take long</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl backdrop-blur">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl mb-4">
                <Ticket className="h-8 w-8 text-neutral-400 dark:text-neutral-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No tickets yet</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-xs mx-auto">
                You haven't purchased any tickets. Explore amazing events and get your first ticket today!
              </p>
              <Link to="/">
                <Button className="rounded-lg text-sm font-bold bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95">
                  Discover Events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tickets.map(ticket => {
                const colors = getThemeColors(ticket.ticketType);
                const coverImage = ticket.event?.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';

                return (
                  <div
                    key={ticket.id}
                    className="group bg-white dark:bg-neutral-900/80 border border-neutral-150 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full hover:border-rose-200 dark:hover:border-rose-800/50"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={coverImage}
                        alt={ticket.event?.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {/* Badge */}
                      <div
                        className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase text-white bg-gradient-to-r ${colors.bg} shadow-md`}
                      >
                        {ticket.ticketType?.name}
                      </div>
                      {/* Status Badge */}
                      <div
                        className={`absolute top-3 right-3 text-[9px] font-extrabold px-2 py-1 rounded-md uppercase border ${colors.badge}`}
                      >
                        {ticket.status}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white line-clamp-2 leading-snug mb-3">
                          {ticket.event?.title}
                        </h3>
                        <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <p className="flex items-center gap-2 leading-relaxed">
                            <Calendar className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                            <span>{formatDate(ticket.event?.startDate)}</span>
                          </p>
                          <p className="flex items-center gap-2 leading-relaxed">
                            <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                            <span className="line-clamp-1">{ticket.event?.location}</span>
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                          #{ticket.id}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                          className="rounded-lg text-[11px] font-bold bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-3 py-2 h-auto shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Pass
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
      <ResponsiveModal
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-rose-500">Entry Pass</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Present at gate for scanning</p>
          </div>
          <button
            onClick={() => setSelectedTicket(null)}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Download Button */}
        <div className="px-6 pt-5 pb-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            onClick={() =>
              downloadTicketCard(`ticket-card-${serial}`, `ticket-${serial}.png`).catch(() =>
                alert('Download failed.')
              )
            }
            className="w-full h-10 flex items-center justify-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors active:scale-95"
          >
            <Download className="h-4 w-4" />
            Save as PNG
          </button>
        </div>

        {/* The full concert ticket */}
        <div className="p-6">
          {selectedTicket && meta && (
            <TicketCard
              ticket={selectedTicket}
              index={modalIndex}
              eventMeta={meta}
              showDownload={false}
            />
          )}
        </div>

        {/* Valid status bar */}
        <div className="px-6 pb-6">
          <div
            className={`flex items-center justify-center gap-2.5 text-xs font-bold py-3.5 rounded-xl border transition-all ${selectedTicket?.status === 'VALID'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                : selectedTicket?.status === 'USED'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                  : 'bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50'
              }`}
          >
            <CheckCircle className="h-5 w-5" />
            <span>
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


// ── ResponsiveModal ────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  description?: string
}

export function ResponsiveModal({
  open,
  onOpenChange,
  children,
}: Props) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="p-0">
          {children}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl p-1">
        {children}
      </DialogContent>
    </Dialog>
  )
}