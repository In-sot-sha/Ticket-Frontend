import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  ArrowLeft,
  Loader2,
  Share2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TicketCard, {
  downloadTicketCard,
  getTicketSerial,
  type TicketCardEventMeta,
  type TicketCardTicket,
} from '../components/TicketCard';
import TicketFlierGenerator from '../components/checkout/TicketFlierGenerator';
import { ResponsiveModal } from '../components/ui/ResponsiveModal';
import { useIsMobile } from '../hooks/use-mobile';

const TicketConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [showFlier, setShowFlier] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const orderData = location.state || {
    eventId: 1,
    eventName: 'Music Concert 2023',
    ticketType: 'General Admission',
    quantity: 1,
    totalAmount: 5000,
    currency: 'NGN',
    eventDate: '2023-12-15',
    eventTime: '09:00 PM',
    eventLocation: '123 Anywhere St., Any City',
    eventImageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    tickets: [],
  };

  const eventMeta: TicketCardEventMeta = {
    eventId: orderData.eventId,
    eventName: orderData.eventName,
    eventDate: orderData.eventDate,
    eventTime: orderData.eventTime,
    eventLocation: orderData.eventLocation,
    eventImageUrl: orderData.eventImageUrl,
    ticketType: orderData.ticketType,
    ticketStyle: orderData.ticketStyle ?? orderData.tickets?.[0]?.ticketType?.ticketStyle,
    accentColor: orderData.accentColor ?? orderData.tickets?.[0]?.ticketType?.accentColor,
    totalAmount: orderData.totalAmount,
    quantity: orderData.quantity,
  };

  const ticketsList: TicketCardTicket[] =
    orderData.tickets && orderData.tickets.length > 0
      ? orderData.tickets
      : Array.from({ length: orderData.quantity || 1 }, (_, i) => ({
          id: i + 1,
          qrCode: null,
          ticketType: {
            name: orderData.ticketType || 'General Admission',
            price: (orderData.totalAmount || 5000) / (orderData.quantity || 1),
          },
        }));

  const downloadAll = async () => {
    if (downloadingAll) return;
    setDownloadingAll(true);
    try {
      for (let i = 0; i < ticketsList.length; i++) {
        const t = ticketsList[i];
        const serial = getTicketSerial(t, i, eventMeta.eventId);
        await downloadTicketCard(`ticket-card-${serial}`, `ticket-${serial}.png`);
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white pb-16 sm:pb-20">
      <div className="mx-auto w-full max-w-lg px-4 pt-5 sm:px-6 sm:pt-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-rose-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </button>

        <div className="mb-5 flex items-center gap-3 sm:mb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 sm:h-12 sm:w-12">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">You&apos;re in</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {ticketsList.length} pass{ticketsList.length === 1 ? '' : 'es'} for{' '}
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{eventMeta.eventName}</span>
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadAll}
            disabled={downloadingAll}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-rose-500 px-4 text-sm font-bold text-white shadow-md shadow-rose-500/30 hover:bg-rose-600 disabled:opacity-70"
          >
            {downloadingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloadingAll ? 'Saving…' : 'Download passes'}
          </button>
          <button
            type="button"
            onClick={() => setShowFlier(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-900 shadow-sm hover:border-rose-200 hover:text-rose-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          >
            <Share2 className="h-4 w-4" />
            Make a flier
          </button>
        </div>

        <div className="space-y-5">
          {ticketsList.map((ticket, index) => (
            <TicketCard
              key={ticket.id ?? index}
              ticket={ticket}
              index={index}
              eventMeta={eventMeta}
              compact={!isMobile}
              showDownload
            />
          ))}
        </div>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
          Keep the QR private. A scanned pass cannot be reused.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/user/tickets' : '/recover-ticket')}
            className="inline-flex h-10 items-center rounded-full bg-neutral-900 px-4 text-sm font-bold text-white shadow-sm dark:bg-white dark:text-neutral-950"
          >
            {isAuthenticated ? 'My tickets' : 'Recover tickets later'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="inline-flex h-10 items-center rounded-full border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-800 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            Browse events
          </button>
        </div>
      </div>

      <ResponsiveModal open={showFlier} onOpenChange={setShowFlier} size={5}>
        <div className="sm:pr-6">
          <TicketFlierGenerator
            event={{
              title: eventMeta.eventName || 'Event',
              date: eventMeta.eventDate || new Date().toISOString(),
              time: eventMeta.eventTime,
              location: eventMeta.eventLocation || 'Location',
              image: eventMeta.eventImageUrl || '',
              eventUrl: orderData.eventSlug
                ? `/events/${orderData.eventSlug}`
                : `/events/${orderData.eventId}`,
            }}
            user={user}
            onClose={() => setShowFlier(false)}
          />
        </div>
      </ResponsiveModal>
    </div>
  );
};

export default TicketConfirmationPage;
