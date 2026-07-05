import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  User,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/Switch';
import { api } from '../services/api';

interface TicketType {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface EventInfo {
  id: number;
  title: string;
  startDate?: string;
  startTime?: string;
  location?: string;
  ticketTypes: TicketType[];
}

const ManualAttendeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    ticketTypeId: '',
    paymentMethod: 'CASH' as 'CASH' | 'POS' | 'TRANSFER',
    checkInNow: true,
    useSameDetails: true,
  });

  const [attendees, setAttendees] = useState([{ name: '', email: '', phone: '' }]);

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1 || newQty > 20) return;
    setAttendees(prev => {
      const updated = [...prev];
      while (updated.length < newQty) {
        updated.push({ name: '', email: '', phone: '' });
      }
      return updated.slice(0, newQty);
    });
  };

  const updateAttendee = (index: number, field: string, value: string) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };

  useEffect(() => {
    if (!id) return;
    setLoadingEvent(true);
    api.events
      .getOrganizerEventById(Number(id))
      .then((res) => {
        setEvent({
          id: res.data.id,
          title: res.data.title,
          startDate: res.data.startDate,
          startTime: res.data.startTime,
          location: res.data.location,
          ticketTypes: res.data.ticketTypes || [],
        });
        if (res.data.ticketTypes?.length > 0) {
          setForm((f) => ({ ...f, ticketTypeId: String(res.data.ticketTypes[0].id) }));
        }
      })
      .catch(() => setError('Could not load event details.'))
      .finally(() => setLoadingEvent(false));
  }, [id]);

  const selectedTicketType = event?.ticketTypes.find(
    (tt) => String(tt.id) === form.ticketTypeId
  );

  const total =
    selectedTicketType && !isNaN(selectedTicketType.price)
      ? selectedTicketType.price * attendees.length
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.ticketTypeId) return setError('Please select a ticket type.');
    if (form.useSameDetails) {
      if (!attendees[0].name.trim()) return setError('Please enter a name for the attendee.');
    } else {
      if (attendees.some(a => !a.name.trim())) return setError('Please enter names for all attendees.');
    }

    setSaving(true);
    try {
      const payloadAttendees = form.useSameDetails
        ? Array.from({ length: attendees.length }).map(() => ({
            name: attendees[0].name.trim(),
            email: attendees[0].email.trim() || undefined,
            phone: attendees[0].phone.trim() || undefined,
          }))
        : attendees.map(a => ({
            name: a.name.trim(),
            email: a.email.trim() || undefined,
            phone: a.phone.trim() || undefined,
          }));

      await api.post('/tickets/manual', {
        eventId: Number(id),
        ticketTypeId: Number(form.ticketTypeId),
        quantity: attendees.length,
        buyerName: attendees[0].name.trim(),
        buyerEmail: attendees[0].email.trim() || undefined,
        buyerPhone: attendees[0].phone.trim() || undefined,
        attendees: payloadAttendees,
        paymentMethod: form.paymentMethod,
        checkInNow: form.checkInNow,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to register attendee.');
    } finally {
      setSaving(false);
    }
  };
  const handleReset = () => {
    setSuccess(false);
    setForm((f) => ({
      ...f,
      checkInNow: true,
    }));
    setAttendees([{ name: '', email: '', phone: '' }]);
  };
  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all';

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center py-16 px-6 border border-green-200 dark:border-green-800 rounded-3xl bg-green-50 dark:bg-green-950/20 shadow-sm">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-3">
            Attendee Registered!
          </h2>
          <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
            {form.checkInNow
              ? 'The attendee has been registered and marked as checked in.'
              : 'The attendee has been registered successfully.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleReset} variant="outline" className="rounded-xl h-12 px-6 font-bold">
              Register Another
            </Button>
            <Button
              onClick={() => navigate(`/organizer/events/${id}`)}
              className="rounded-xl h-12 px-6 bg-rose-500 hover:bg-rose-600 text-white border-0 font-bold"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 sm:py-10 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to={`/organizer/events/${id}`} 
            className="flex items-center justify-center w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-neutral-800 dark:text-neutral-100" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
              Gate Registration
            </h1>
            <p className="text-xs text-neutral-500 font-medium">Add attendees manually to your event</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 mb-8 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Registration Failed</h3>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Form Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Ticket Options Section */}
            <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Ticket Selection</h2>
                  <p className="text-xs text-neutral-500">Choose the ticket type and quantity</p>
                </div>
              </div>

              {loadingEvent ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : (
                <div className="space-y-3">
                  {event?.ticketTypes.map((tt) => {
                    const isSelected = String(tt.id) === form.ticketTypeId;
                    return (
                      <div
                        key={tt.id}
                        onClick={() => {
                          if (!isSelected) {
                            setForm(f => ({ ...f, ticketTypeId: String(tt.id) }));
                            setAttendees([attendees[0]]);
                          }
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/20'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white">{tt.name}</p>
                          <p className="text-sm font-semibold text-rose-500 mt-1">
                            {tt.price === 0 ? 'Free' : `₦${tt.price.toLocaleString()}`}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(attendees.length - 1);
                              }}
                              disabled={attendees.length <= 1}
                              className="w-8 h-8 rounded-full flex items-center justify-center border border-neutral-300 dark:border-neutral-700 text-neutral-600 disabled:opacity-50 hover:bg-white dark:hover:bg-neutral-800"
                            >
                              -
                            </button>
                            <span className="font-bold text-neutral-900 dark:text-white min-w-[20px] text-center">
                              {attendees.length}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(attendees.length + 1);
                              }}
                              disabled={attendees.length >= 20}
                              className="w-8 h-8 rounded-full flex items-center justify-center border border-neutral-300 dark:border-neutral-700 text-neutral-600 disabled:opacity-50 hover:bg-white dark:hover:bg-neutral-800"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Attendee Info Section */}
            <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Guest Details</h2>
                    <p className="text-xs text-neutral-500">Enter the attendee's information</p>
                  </div>
                </div>
                {attendees.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Use for all tickets</span>
                    <Switch
                      checked={form.useSameDetails}
                      onCheckedChange={(c) => setForm(f => ({ ...f, useSameDetails: c }))}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {(form.useSameDetails ? [attendees[0]] : attendees).map((attendee, index) => (
                  <div key={index} className={index > 0 ? "pt-6 border-t border-neutral-100 dark:border-neutral-800" : ""}>
                    {!form.useSameDetails && (
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">
                        Attendee {index + 1}
                      </h3>
                    )}
                    <div className="space-y-5">
                      <div>
                        <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-2 uppercase tracking-wider">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="Enter guest's full name"
                          value={attendee.name}
                          onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                          autoFocus={index === 0}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> Email Address
                          </label>
                          <input
                            type="email"
                            className={inputClass}
                            placeholder="Optional (to send ticket)"
                            value={attendee.email}
                            onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> Phone Number
                          </label>
                          <input
                            type="tel"
                            className={inputClass}
                            placeholder="Optional"
                            value={attendee.phone}
                            onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column - Summary & Checkout */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-6">
              
              {/* Event Context Card */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Event Details</h3>
                
                {loadingEvent ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <>
                    <h4 className="font-extrabold text-neutral-900 dark:text-white mb-4 leading-tight">
                      {event?.title}
                    </h4>
                    
                    <div className="space-y-3">
                      {(event?.startDate || event?.startTime) && (
                        <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <Calendar className="w-4 h-4 mt-0.5 text-neutral-400 shrink-0" />
                          <span>
                            {event?.startDate && new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {event?.startTime && ` at ${event.startTime}`}
                          </span>
                        </div>
                      )}
                      
                      {event?.location && (
                        <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <MapPin className="w-4 h-4 mt-0.5 text-neutral-400 shrink-0" />
                          <span className="line-clamp-2">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Order Summary & Payment Card */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Order Summary</h3>
                
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {selectedTicketType?.name || 'Ticket'} (x{attendees.length})
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    ₦{total.toLocaleString()}
                  </span>
                </div>

                <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800 mb-6" />

                <div className="mb-6">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-3 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['CASH', 'POS', 'TRANSFER'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, paymentMethod: method }))}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          form.paymentMethod === method
                            ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400 shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Switch
                      checked={form.checkInNow}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, checkInNow: checked }))}
                    />
                  
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">
                        Check In Immediately
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Automatically mark this attendee as entered at the gate.
                      </p>
                    </div>
                  </label>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={saving || (form.useSameDetails ? !attendees[0].name.trim() : attendees.some(a => !a.name.trim())) || !form.ticketTypeId}
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 font-extrabold text-base shadow-md transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    'Registering...'
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Complete Registration
                    </>
                  )}
                </Button>
                
              </div>
              
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManualAttendeePage;
