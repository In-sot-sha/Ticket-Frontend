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

const TicketConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white pb-24">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-rose-500 transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </button>

        {/* Success hero — one job */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            You&apos;re in
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            {ticketsList.length} pass{ticketsList.length === 1 ? '' : 'es'} for{' '}
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {eventMeta.eventName}
            </span>
            . Show at the gate or save a PNG.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={downloadAll}
              disabled={downloadingAll}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-5 shadow-md transition-colors disabled:opacity-70"
            >
              {downloadingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloadingAll ? 'Saving…' : 'Download passes'}
            </button>
            <button
              type="button"
              onClick={() => setShowFlier(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-bold px-5 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Make a flier
            </button>
          </div>
        </div>

        {/* Passes */}
        <div className="space-y-5">
          {ticketsList.map((ticket, index) => (
            <TicketCard
              key={ticket.id ?? index}
              ticket={ticket}
              index={index}
              eventMeta={eventMeta}
              showDownload
            />
          ))}
        </div>

        <p className="mt-8 flex items-start gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <Shield className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
          Keep your QR private. Once scanned at entry it cannot be reused.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/user/tickets' : '/recover-ticket')}
            className="flex-1 h-11 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-sm font-bold"
          >
            {isAuthenticated ? 'My tickets' : 'Recover tickets later'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="flex-1 h-11 rounded-full border border-neutral-300 dark:border-neutral-600 text-sm font-bold text-neutral-800 dark:text-neutral-100"
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
