import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CheckCircle, Download, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventTicketCard from '../components/tickets/EventTicketCard';

const TicketConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const orderData = location.state || {
    eventId: 1,
    eventName: 'Music Concert 2023',
    ticketType: 'VIP',
    quantity: 1,
    totalAmount: 5000,
    eventDate: '2023-12-15',
    eventTime: '7:00 PM',
    eventLocation: '123 Anywhere St., Any City',
    eventImageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    tickets: [],
  };

  const orderId = orderData.tickets?.[0]?.id
    ? `ORD-${orderData.tickets[0].eventId}-${Date.now().toString().slice(-4)}`
    : `ORD-${Date.now().toString().slice(-6)}`;

  const ticketsList =
    orderData.tickets && orderData.tickets.length > 0
      ? orderData.tickets
      : Array.from({ length: orderData.quantity || 1 }, (_, index) => ({
          id: index + 1,
          qrCode: null,
          ticketType: {
            name: orderData.ticketType || 'General Admission',
            ticketStyle: 'rose',
            price: (orderData.totalAmount || 5000) / (orderData.quantity || 1),
          },
        }));

  const downloadTicket = async (ticketSerial: string) => {
    const element = document.getElementById(`ticket-card-${ticketSerial}`);
    if (!element) return;

    try {
      if (!(window as Window & { html2canvas?: unknown }).html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const html2canvas = (window as Window & { html2canvas: (el: HTMLElement, opts: object) => Promise<HTMLCanvasElement> }).html2canvas;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `ticket-${ticketSerial}.png`;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download ticket PNG. Please save/print the receipt page instead.');
    }
  };

  const downloadAllTickets = async () => {
    for (let i = 0; i < ticketsList.length; i++) {
      const ticket = ticketsList[i];
      const ticketSerial = ticket.id
        ? `TKT-${ticket.eventId || orderData.eventId || 1}-${ticket.id}`
        : `TKT-MOCK-${i + 1}`;
      await downloadTicket(ticketSerial);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-12 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>
          <button
            type="button"
            onClick={downloadAllTickets}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-full"
          >
            <Download className="h-4 w-4" />
            Download all
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-emerald-600 text-xs font-bold mb-3">
            <CheckCircle className="h-3.5 w-3.5" />
            Confirmed · {orderId}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Your digital pass</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Show this at the gate or download to your device.
          </p>
        </div>

        <div className="space-y-8">
          {ticketsList.map((ticket: {
            id?: number;
            eventId?: number;
            qrCode?: string | null;
            ticketType?: {
              name?: string;
              ticketStyle?: string;
              accentColor?: string;
              badgeText?: string;
            };
          }, index: number) => {
            const ticketSerial = ticket.id
              ? `TKT-${ticket.eventId || orderData.eventId || 1}-${ticket.id}`
              : `TKT-MOCK-${index + 1}`;

            return (
              <div key={ticket.id || index} className="space-y-3">
                <EventTicketCard
                  id={`ticket-card-${ticketSerial}`}
                  eventName={orderData.eventName}
                  eventDate={orderData.eventDate}
                  eventTime={orderData.eventTime}
                  eventLocation={orderData.eventLocation}
                  eventImageUrl={orderData.eventImageUrl}
                  ticketType={ticket.ticketType}
                  ticketSerial={ticketSerial}
                  qrCodeImage={ticket.qrCode}
                  qrValue={ticketSerial}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => downloadTicket(ticketSerial)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-rose-500 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PNG
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 p-5 flex gap-4 text-sm text-neutral-600 dark:text-neutral-400">
          <Shield className="h-5 w-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-semibold text-neutral-900 dark:text-neutral-200">Secure entry</p>
            <p className="mt-1 leading-relaxed">
              Each pass is unique. Once scanned at check-in, it cannot be used again.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          {isAuthenticated ? (
            <Button
              onClick={() => navigate('/user/tickets')}
              className="flex-1 h-12 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold"
            >
              View my tickets
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/recover-ticket')}
              className="flex-1 h-12 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold"
            >
              Recover lost tickets
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex-1 h-12 rounded-2xl text-xs font-bold"
          >
            Browse more events
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketConfirmationPage;
