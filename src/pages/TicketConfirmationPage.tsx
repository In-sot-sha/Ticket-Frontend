import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CheckCircle, Calendar, MapPin, Clock, Ticket, Shield, Download, User, ArrowLeft } from 'lucide-react';
import QRCode from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

// Helper to format date in the concert mockup style (e.g. 15TH | DECEMBER | 2023)
const formatTicketDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate();
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const dayStr = getOrdinal(day).toUpperCase();
    const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    const monthStr = months[date.getMonth()].toUpperCase();
    const year = date.getFullYear();
    return `${dayStr} | ${monthStr} | ${year}`;
  } catch {
    return dateString;
  }
};

// Helper to split title into two parts (e.g. first word highlighted)
const splitTitle = (title: string) => {
  const words = (title || '').split(' ');
  const firstWord = words[0] || '';
  const restOfTitle = words.slice(1).join(' ') || '';
  return { firstWord, restOfTitle };
};

const TicketConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Get order details from location state
  const orderData = location.state || {
    eventId: 1,
    eventName: "Music Concert 2023",
    ticketType: "VIP",
    quantity: 1,
    totalAmount: 5000,
    currency: "NGN",
    eventDate: "2023-12-15",
    eventTime: "09:00 PM",
    eventLocation: "123 Anywhere St., Any City",
    eventImageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    tickets: []
  };

  // Generate reference IDs
  const orderId = orderData.tickets?.[0]?.id 
    ? `ORD-${orderData.tickets[0].eventId}-${Date.now().toString().slice(-4)}`
    : `ORD-${Date.now().toString().slice(-6)}`;

  // Simple custom side backgrounds based on ticket type
  const getTicketTypeStyle = (type: string) => {
    const name = (type || '').toUpperCase();
    if (name.includes('VIP') || name.includes('VVIP') || name.includes('GOLD')) {
      return {
        badgeBg: 'bg-amber-500 text-white border-0',
        sideBg: 'bg-[#eeb111] text-amber-950', // Golden mockup color
        borderColor: 'border-amber-200 dark:border-amber-850',
        textColor: 'text-amber-955',
        accentColor: 'text-[#eeb111]'
      };
    }
    if (name.includes('STUDENT') || name.includes('KID') || name.includes('CHILD')) {
      return {
        badgeBg: 'bg-emerald-600 text-white border-0',
        sideBg: 'bg-[#10b981] text-emerald-955', // Emerald Green
        borderColor: 'border-emerald-250 dark:border-emerald-850',
        textColor: 'text-emerald-955',
        accentColor: 'text-[#10b981]'
      };
    }
    if (name.includes('EXHIBITOR') || name.includes('VENDOR') || name.includes('SPONSOR')) {
      return {
        badgeBg: 'bg-purple-600 text-white border-0',
        sideBg: 'bg-[#8b5cf6] text-purple-955', // Purple
        borderColor: 'border-purple-250 dark:border-purple-850',
        textColor: 'text-purple-955',
        accentColor: 'text-[#8b5cf6]'
      };
    }
    // General Admission / Regular / Default
    return {
      badgeBg: 'bg-rose-600 text-white border-0',
      sideBg: 'bg-[#f43f5e] text-rose-955', // Rose Pink
      borderColor: 'border-rose-250 dark:border-rose-850',
      textColor: 'text-rose-955',
      accentColor: 'text-[#f43f5e]'
    };
  };

  // Generate tickets list
  const ticketsList = (orderData.tickets && orderData.tickets.length > 0) 
    ? orderData.tickets 
    : Array.from({ length: orderData.quantity || 1 }, (_, index) => ({
        id: index + 1,
        qrCode: null,
        ticketType: {
          name: orderData.ticketType || 'General Admission',
          price: (orderData.totalAmount || 5000) / (orderData.quantity || 1)
        }
      }));

  // Browser-based direct canvas PNG download
  const downloadTicket = async (ticketSerial: string) => {
    const element = document.getElementById(`ticket-card-${ticketSerial}`);
    if (!element) return;
    
    try {
      if (!(window as any).html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      
      const html2canvas = (window as any).html2canvas;
      const canvas = await html2canvas(element, {
        scale: 3, // High-quality resolution
        useCORS: true,
        logging: false,
        backgroundColor: null
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

  // Sequential multi-ticket download
  const downloadAllTickets = async () => {
    for (let i = 0; i < ticketsList.length; i++) {
      const ticket = ticketsList[i];
      const ticketSerial = ticket.id ? `TKT-${ticket.eventId || orderData.eventId || 1}-${ticket.id}` : `TKT-MOCK-${i + 1}`;
      await downloadTicket(ticketSerial);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-12 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col items-center justify-start transition-colors duration-300">
      <div className="w-full max-w-6xl px-2 sm:px-6">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between mb-6 sm:mb-10 px-4 sm:px-0">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-xs font-black text-neutral-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            BACK TO HOME
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={downloadAllTickets}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-lg transition-transform active:scale-98"
            >
              <Download className="h-4 w-4" />
              DOWNLOAD ALL
            </button>
          </div>
        </div>

        {/* Confirmed Alert Toast */}
        <div className="mb-6 sm:mb-10 text-center px-4 sm:px-0">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mb-3 shadow-inner">
            <CheckCircle className="h-3.5 w-3.5" />
            CONFIRMED · {orderId}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">
            Your Digital Entrance Pass
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
            Show this card pass at the entry post or download the PNG to your device.
          </p>
        </div>

        {/* Tickets container */}
        <div className="space-y-6 sm:space-y-10">
          {ticketsList.map((ticket: any, index: number) => {
            const typeName = ticket.ticketType?.name || orderData.ticketType || 'General Admission';
            const style = getTicketTypeStyle(typeName);
            const ticketSerial = ticket.id ? `TKT-${ticket.eventId || orderData.eventId || 1}-${ticket.id}` : `TKT-MOCK-${index + 1}`;
            const split = splitTitle(orderData.eventName);
            const formattedDate = formatTicketDate(orderData.eventDate);
            const bannerImage = orderData.eventImageUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";

            return (
              <div key={ticket.id || index} className="flex flex-col gap-2.5 sm:gap-3">
                
                {/* Full-width Concert Ticket Card */}
                <div
                  id={`ticket-card-${ticketSerial}`}
                  className={`relative w-full flex flex-col md:flex-row bg-neutral-900 border ${style.borderColor} rounded-none sm:rounded-[32px] overflow-hidden shadow-lg group`}
                >
                  {/* Left Main Stub (Concert cover backdrop) - Less padding on mobile (p-4 vs p-8) */}
                  <div className="relative flex-1 p-4 sm:p-8 flex flex-col justify-between overflow-hidden text-white min-h-[190px] sm:min-h-[250px] md:min-h-[270px]">
                    
                    {/* Cover Photo Backdrop */}
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={bannerImage} 
                        alt={orderData.eventName} 
                        className="w-full h-full object-cover filter brightness-90 saturate-110" 
                        crossOrigin="anonymous"
                      />
                      {/* Dark overlays to ensure strong typography contrast */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/35 z-10" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />
                    </div>

                    {/* Main stub contents */}
                    <div className="relative z-20 flex flex-col justify-between h-full">
                      {/* Top Header: COME AND JOIN */}
                      <div>
                        <p className="text-[9px] md:text-xs font-black tracking-[0.25em] text-neutral-350 uppercase opacity-95 font-mono">
                          COME AND JOIN
                        </p>
                        
                        {/* Split title highlighted - Responsive size */}
                        <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none mt-2 sm:mt-3 uppercase drop-shadow-md">
                          <span className={style.accentColor}>{split.firstWord}</span>{' '}
                          <span className="text-white">{split.restOfTitle}</span>
                        </h3>
                      </div>

                      {/* Middle: LIVE AT venue */}
                      <div className="mt-3 sm:mt-4">
                        <p className="text-[8px] sm:text-[9px] font-black tracking-widest text-neutral-400 font-mono">LIVE AT</p>
                        <h4 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white uppercase mt-0.5">
                          {orderData.eventLocation || "123 Anywhere St., Any City"}
                        </h4>
                      </div>

                      {/* Bottom Details Grid */}
                      <div className="mt-6 sm:mt-8 border-t border-white/10 pt-3 flex flex-wrap gap-y-1.5 gap-x-4 sm:gap-x-6 text-[9px] sm:text-[10px] md:text-xs text-white/70">
                        <div>
                          <span className="text-[8px] font-bold text-neutral-400 font-mono block">TIME</span>
                          <p className="font-extrabold text-white uppercase font-mono mt-0.5">
                            {orderData.eventTime || "09:00 PM"}
                          </p>
                        </div>
                        <div className="pl-3 sm:pl-4 border-l border-white/10">
                          <span className="text-[8px] font-bold text-neutral-400 font-mono block">DATE</span>
                          <p className="font-extrabold text-white uppercase font-mono mt-0.5">
                            {formattedDate}
                          </p>
                        </div>
                        <div className="pl-3 sm:pl-4 border-l border-white/10">
                          <span className="text-[8px] font-bold text-neutral-400 font-mono block">CODE</span>
                          <p className="font-extrabold text-white uppercase font-mono mt-0.5">
                            {ticketSerial}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dotted separator line with circle cutouts - Vertical (Landscape screens) */}
                  <div className="hidden md:flex flex-col justify-between items-center py-4 relative bg-neutral-900 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 -mt-8 -mr-[16px] z-30" />
                    <div className="border-l-2 border-dashed border-neutral-700 h-full my-2 z-30" />
                    <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 -mb-8 -mr-[16px] z-30" />
                  </div>

                  {/* Dotted separator line with circle cutouts - Horizontal (Portrait/Mobile screens) - Less padding */}
                  <div className="flex md:hidden items-center px-2 relative bg-neutral-900 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 -ml-8 -mb-[16px] z-30" />
                    <div className="border-t-2 border-dashed border-neutral-700 w-full mx-2 z-30" />
                    <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 -mr-8 -mb-[16px] z-30" />
                  </div>

                  {/* Right Stub (Scan Stub - Solid custom color base on ticket type) - Less padding on mobile (p-4 vs p-6) */}
                  <div className={`w-full md:w-60 p-4 sm:p-6 flex flex-row md:flex-col justify-between items-center ${style.sideBg} relative shrink-0 text-black`}>
                    <div className="absolute inset-0 bg-black/5 dark:bg-black/10 pointer-events-none" />
                    
                    {/* Ticket Type Badge */}
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase bg-black text-white mb-0 md:mb-4 shadow-sm">
                      {typeName}
                    </span>

                    {/* QR Code Container (sole scanning element, no barcode, no seat details) */}
                    <div className="bg-white p-2 rounded-xl shadow-md transition-transform group-hover:scale-102">
                      {ticket.qrCode ? (
                        <img 
                          src={ticket.qrCode} 
                          alt="Ticket QR Code" 
                          className="w-20 h-20 md:w-28 md:h-28 object-contain" 
                        />
                      ) : (
                        <QRCode 
                          value={ticketSerial} 
                          size={80} 
                          renderAs="svg"
                          fgColor="#000000"
                          bgColor="#ffffff"
                        />
                      )}
                    </div>

                    {/* Scanner helper labels */}
                    <div className="text-right md:text-center mt-0 md:mt-4">
                      <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-85 font-mono">
                        SCAN TO ENTRY
                      </p>
                      <p className="text-[7px] font-mono opacity-60 mt-0.5">
                        ADMIT ONE
                      </p>
                    </div>
                  </div>
                </div>

                {/* Individual ticket download actions (excluded from the screenshot DOM node) */}
                <div className="flex justify-end gap-2 px-4 sm:px-2">
                  <button
                    onClick={() => downloadTicket(ticketSerial)}
                    className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 px-4 py-2 rounded-full transition-all border border-neutral-200 dark:border-neutral-800 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Pass PNG
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Secure Guarantee */}
        <div className="mt-8 sm:mt-12 mx-4 sm:mx-0 rounded-3xl bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-850 p-5 flex gap-4 items-start text-xs text-neutral-600 dark:text-neutral-400">
          <Shield className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-neutral-900 dark:text-neutral-200">Secure Gate Entry Notice</p>
            <p className="mt-1 leading-relaxed">
              This digital pass is unique and belongs solely to the attendee. Please avoid sharing this QR code. Once scanned at the check-in terminal, the pass will be logged as USED and cannot be scanned again.
            </p>
          </div>
        </div>

        {/* Bottom Actions footer */}
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
            onClick={downloadAllTickets}
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