import React, { useState } from 'react';
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
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

const GuestDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState<TicketCardTicket | null>(null);

  // Use TanStack Query for fetching tickets with 5min cache (GUEST_TICKETS config)
  const { data: tickets = [], isLoading, error } = useQuery({
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

  const style = selectedTicket
    ? getTicketStyle(selectedTicket.ticketType?.name)
    : undefined;

  const colors = selectedTicket
    ? getThemeColors(selectedTicket.ticketType)
    : getThemeColors(undefined);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-neutral-900 dark:text-neutral-100 pb-16">

      {/* Sub-header */}
      <div className="border-none sm:border-b border-neutral-150 dark:border-neutral-900 bg-neutral-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-end sm:justify-between sm:items-center py-4 gap-4">
            <div className="sm:flex hidden items-center">
              <Ticket className="h-6 w-6 text-rose-500 mr-2" />
              <h1 className="text-xl font-extrabold tracking-tight">My Tickets</h1>
            </div>
            <div className="flex items-center justify-end sm:justify-between gap-3">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:py-8 py-3">

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

          {isLoading ? (
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
      <ResponsiveModal
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
        title="Ticket Details"
        description="View your ticket details"
      >
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
          </div>
        </div>

        {/* The full concert ticket — same component as TicketConfirmationPage */}
        <div className="p-4 sm:p-6">
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
        <div className="px-5 pb-5">
          <div
            className={`flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl border ${selectedTicket?.status === 'VALID'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                : selectedTicket?.status === 'USED'
                  ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-800'
                  : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
              }`}
          >
            <CheckCircle className="h-4 w-4" />
            {selectedTicket?.status === 'VALID'
              ? 'Valid Entry Pass — Ready to Scan'
              : selectedTicket?.status === 'USED'
                ? 'This pass has already been scanned'
                : 'This pass has been cancelled'}
          </div>
        </div>
      </ResponsiveModal>

    </div>
  );
};

export default GuestDashboard;


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
  title,
  description,
}: Props) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="p-0">
          {/* <DrawerHeader className="text-left">
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader> */}
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