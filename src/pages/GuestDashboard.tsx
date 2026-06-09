import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  MapPin, 
  Calendar, 
  Loader2, 
  X, 
  Eye, 
  Heart,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getDesignPreset } from '../data/ticketDesigns';

const GuestDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-neutral-900 dark:text-neutral-100 pb-16">
      
      {/* Dashboard Subheader Block (simplified, no tabs) */}
      <div className="border-b border-neutral-150 dark:border-neutral-900 bg-neutral-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-6 gap-4">
            <div className="flex items-center">
              <Ticket className="h-6 w-6 text-rose-500 mr-2" />
              <h1 className="text-xl font-extrabold tracking-tight">My Tickets</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/events" className="text-xs font-bold px-4 py-2.5 rounded-full border border-neutral-250 dark:border-neutral-805 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
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

      {/* Main Content (Tickets Only) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <h2 className="text-lg font-bold tracking-tight">Your Purchased Tickets</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-2" />
              <p className="text-xs text-neutral-450 dark:text-neutral-500">Loading your passes...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
              <Ticket className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold mb-1">No ticket bookings yet</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mb-4 max-w-xs mx-auto">
                You haven't bought tickets for any upcoming listings. Explore events to book now!
              </p>
              <Link to="/">
                <Button className="rounded-full text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white">Find Events</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.map(ticket => {
                const colors = getThemeColors(ticket.ticketType);
                const coverImage = ticket.event?.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                
                return (
                  <div key={ticket.id} className="border border-neutral-150 dark:border-neutral-900 rounded-2xl overflow-hidden flex bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
                    
                    {/* Event card thumbnail */}
                    <div className="w-1/3 aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 relative">
                      <img src={coverImage} alt={ticket.event?.title} className="w-full h-full object-cover" />
                      <div className={`absolute top-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase text-white bg-gradient-to-r ${colors.bg}`}>
                        {ticket.ticketType?.name}
                      </div>
                    </div>
                    
                    {/* Ticket Details */}
                    <div className="p-4 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-2 leading-snug">{ticket.event?.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase shrink-0 border ${colors.badge}`}>
                            {ticket.status}
                          </span>
                        </div>
                        
                        <div className="mt-3 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                          <p className="flex items-center gap-1.5 leading-none">
                            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                            <span>{formatDate(ticket.event?.startDate)}</span>
                          </p>
                          <p className="flex items-center gap-1.5 leading-none">
                            <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                            <span className="truncate">{ticket.event?.location}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">Code: #{ticket.id}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedTicket(ticket)}
                          className="rounded-full text-[11px] font-semibold border-neutral-250 hover:bg-neutral-50 dark:border-neutral-800"
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

      {/* Ticket QR Modal */}
      {selectedTicket && (() => {
        const colors = getThemeColors(selectedTicket.ticketType);
        return (
          <div className="fixed inset-0 bg-neutral-900/60 dark:bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 relative animate-in zoom-in-95 duration-150">
              
              {/* Tear dots / card simulation header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 text-center relative">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="absolute right-4 top-4 text-neutral-450 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X className="h-4 w-4" />
                </button>
                <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">Active Entry Pass</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">Present at gate for scanning</p>
              </div>

              {/* Stub content */}
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-40 h-40 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center p-2">
                  {selectedTicket.qrCode ? (
                    <img src={selectedTicket.qrCode} alt="Ticket QR code" className="w-full h-full object-contain" />
                  ) : (
                    <Ticket className="h-10 w-10 text-neutral-300" />
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-neutral-900 dark:text-white">{selectedTicket.event?.title}</h4>
                  <p className="text-xs text-neutral-500">{formatDate(selectedTicket.event?.startDate)}</p>
                  <p className="text-xs text-neutral-450 dark:text-neutral-500">{selectedTicket.event?.location}</p>
                </div>

                <div className="border-t border-dashed border-neutral-200 dark:border-neutral-800 my-4 pt-4">
                  <div className="flex justify-between text-xs px-4">
                    <div className="text-left">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">Ticket Type</p>
                      <p className={`font-extrabold text-sm ${colors.text}`}>{selectedTicket.ticketType?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">Pass ID</p>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white">#{selectedTicket.id}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center gap-1.5 text-xs font-bold">
                  <CheckCircle className="h-4 w-4" />
                  Valid Entry Pass
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
