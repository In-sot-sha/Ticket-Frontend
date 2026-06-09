import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CheckCircle, Shield, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TicketCard, {
  downloadTicketCard,
  getTicketSerial,
  type TicketCardEventMeta,
  type TicketCardTicket,
} from '../components/TicketCard';

const TicketConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

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
    eventId:       orderData.eventId,
    eventName:     orderData.eventName,
    eventDate:     orderData.eventDate,
    eventTime:     orderData.eventTime,
    eventLocation: orderData.eventLocation,
    eventImageUrl: orderData.eventImageUrl,
    ticketType:    orderData.ticketType,
    totalAmount:   orderData.totalAmount,
    quantity:      orderData.quantity,
  };

  // Build the list of tickets — real ones from the API, or mock stubs for preview
  const ticketsList: TicketCardTicket[] =
    orderData.tickets && orderData.tickets.length > 0
      ? orderData.tickets
      : Array.from({ length: orderData.quantity || 1 }, (_, i) => ({
          id: i + 1,
          qrCode: null,
          ticketType: {
            name:  orderData.ticketType || 'General Admission',
            price: (orderData.totalAmount || 5000) / (orderData.quantity || 1),
          },
        }));

  const orderId =
    orderData.tickets?.[0]?.id
      ? `ORD-${orderData.tickets[0].eventId}-${Date.now().toString().slice(-4)}`
      : `ORD-${Date.now().toString().slice(-6)}`;

  const downloadAll = async () => {
    for (let i = 0; i < ticketsList.length; i++) {
      const t = ticketsList[i];
      const serial = getTicketSerial(t, i, eventMeta.eventId);
      await downloadTicketCard(`ticket-card-${serial}`, `ticket-${serial}.png`);
      await new Promise(r => setTimeout(r, 600));
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-12 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col items-center justify-start transition-colors duration-300">
      <div className="w-full max-w-6xl px-2 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-10 px-4 sm:px-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-black text-neutral-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            BACK TO HOME
          </button>
          <button
            onClick={downloadAll}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-lg transition-transform active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            DOWNLOAD ALL
          </button>
        </div>

        {/* Confirmed badge + title */}
        <div className="mb-6 sm:mb-10 text-center px-4 sm:px-0">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mb-3 shadow-inner">
            <CheckCircle className="h-3.5 w-3.5" />
            CONFIRMED · {orderId}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">
            Your Digital Entrance Pass
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
            Show this card at the entry post or download the PNG to your device.
          </p>
        </div>

        {/* Ticket cards */}
        <div className="space-y-6 sm:space-y-10">
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

        {/* Security notice */}
        <div className="mt-8 sm:mt-12 mx-4 sm:mx-0 rounded-3xl bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-850 p-5 flex gap-4 items-start text-xs text-neutral-600 dark:text-neutral-400">
          <Shield className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-neutral-900 dark:text-neutral-200">Secure Gate Entry Notice</p>
            <p className="mt-1 leading-relaxed">
              This digital pass is unique and belongs solely to the attendee. Please avoid sharing this QR
              code. Once scanned at the check-in terminal, the pass will be logged as USED and cannot be
              scanned again.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-neutral-200 dark:border-neutral-850 mt-8 sm:mt-10 pt-6 px-4 sm:px-0">
          {isAuthenticated ? (
            <Button
              onClick={() => navigate('/user/tickets')}
              className="flex-grow h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-extrabold rounded-2xl shadow-sm transition-all hover:opacity-90"
            >
              VIEW MY DASHBOARD
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/recover-ticket')}
              className="flex-grow h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-extrabold rounded-2xl shadow-sm transition-all hover:opacity-90"
            >
              RECOVER LOST TICKETS
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex-grow h-12 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-extrabold rounded-2xl transition-all"
          >
            BROWSE MORE EVENTS
          </Button>
          <Button
            variant="outline"
            onClick={downloadAll}
            className="flex-grow h-12 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-extrabold rounded-2xl transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            DOWNLOAD RECEIPTS
          </Button>
        </div>

      </div>
    </div>
  );
};

export default TicketConfirmationPage;
