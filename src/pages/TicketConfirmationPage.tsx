import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Download, Loader2, Share2, Shield } from 'lucide-react';
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
  const location = useLocation();
  const { user } = useAuth();
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showFlyer, setShowFlyer] = useState(false);

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
    organizerName: 'Host',
    organizerLogo: null,
  };

  const eventPath = orderData.eventSlug
    ? `/events/${orderData.eventSlug}`
    : `/events/${orderData.eventId}`;

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
    organizerName: orderData.organizerName,
    organizerLogo: orderData.organizerLogo,
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

  const passLabel = ticketsList.length === 1 ? 'Download pass' : 'Download passes';

  const downloadAll = async () => {
    if (downloadingAll) return;
    setDownloadingAll(true);
    try {
      for (let i = 0; i < ticketsList.length; i++) {
        const t = ticketsList[i];
        const serial = getTicketSerial(t, i, eventMeta.eventId);
        await downloadTicketCard(`ticket-card-${serial}`, `ticket-${serial}.png`);
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloadingAll(false);
    }
  };

  const flierEvent = useMemo(
    () => ({
      title: eventMeta.eventName || 'Event',
      date: eventMeta.eventDate || new Date().toISOString(),
      time: eventMeta.eventTime,
      location: eventMeta.eventLocation || 'Location',
      image: eventMeta.eventImageUrl || '',
      eventUrl: eventPath,
      organizerName: eventMeta.organizerName,
      organizerLogo: eventMeta.organizerLogo,
    }),
    [eventMeta, eventPath]
  );

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-5 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8 lg:pt-10">
        <div className="mb-3 sm:mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 sm:h-4 sm:w-4" />
            <h1 className="text-base font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              You&apos;re in
            </h1>
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-500 sm:mt-1.5 sm:text-sm sm:text-base">
            {ticketsList.length} pass{ticketsList.length === 1 ? '' : 'es'} for{' '}
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {eventMeta.eventName}
            </span>
          </p>
        </div>

        <section>
          <div
            className={
              ticketsList.length > 1
                ? 'flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:overflow-visible lg:pb-0'
                : ''
            }
          >
            {ticketsList.map((ticket, index) => (
              <div
                key={ticket.id ?? index}
                className={
                  ticketsList.length > 1
                    ? 'min-w-[88%] snap-center sm:min-w-[75%] lg:min-w-0'
                    : undefined
                }
              >
                {ticketsList.length > 1 ? (
                  <p className="mb-1.5 text-[11px] font-bold tabular-nums text-neutral-400">
                    Pass {index + 1} of {ticketsList.length}
                  </p>
                ) : null}
                <TicketCard
                  ticket={ticket}
                  index={index}
                  eventMeta={eventMeta}
                  compact={false}
                  showDownload={false}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={downloadAll}
                disabled={downloadingAll}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600 disabled:opacity-70 sm:w-auto"
              >
                {downloadingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloadingAll ? 'Saving…' : passLabel}
              </button>
              <button
                type="button"
                onClick={() => setShowFlyer(true)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 text-sm font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white md:hidden sm:w-auto"
              >
                <Share2 className="h-4 w-4 text-rose-500" />
                Share flyer
              </button>
            </div>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-neutral-500 sm:max-w-sm sm:text-right">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400 sm:hidden" />
              Keep the QR private. A scanned pass cannot be reused.
            </p>
          </div>
        </section>

        <ResponsiveModal open={showFlyer} onOpenChange={setShowFlyer} size={5}>
          <div className="px-4 pb-4 pt-1 md:px-1 md:pt-2">
            <h2 className="text-base font-extrabold tracking-tight md:hidden">Share flyer</h2>
            <p className="mt-0.5 text-xs text-neutral-500 md:hidden">
              Pick a size and template, then share or save.
            </p>
            <div className="mt-3 md:mt-0">
              <TicketFlierGenerator embedded event={flierEvent} user={user} />
            </div>
          </div>
        </ResponsiveModal>

        <section className="mt-12 hidden border-t border-neutral-200 pt-8 dark:border-neutral-800 md:block">
          <h2 className="text-lg font-extrabold tracking-tight">Share a flyer</h2>
          <p className="mt-1 max-w-xl text-sm text-neutral-500">
            Friends scan the code on the flyer to open this event and buy their own ticket.
          </p>
          <div className="mt-5">
            <TicketFlierGenerator embedded event={flierEvent} user={user} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default TicketConfirmationPage;
