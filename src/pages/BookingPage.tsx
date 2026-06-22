import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  Minus, 
  Plus, 
  CreditCard,
  Shield,
  ArrowRight,
  Store
} from 'lucide-react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomAlertDialog } from '../components/ui/CustomAlertDialog';
import { useEventById } from '../hooks/queries/useEvents';


// Mock event fallback matching EventDetailPage
const mockEvent = {
  id: 1,
  title: 'Tech Conference 2023',
  date: '2023-12-15',
  startTime: '09:00 AM',
  endTime: '06:00 PM',
  location: 'Eko Convention Centre, Lagos, Nigeria',
  price: 5000,
  imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  ticketTypes: [
    { id: 1, name: 'General Admission', price: 5000 },
    { id: 2, name: 'VIP', price: 15000 },
    { id: 3, name: 'Student', price: 2500 }
  ]
};

const VENDOR_ROLES = [
  { id: 'catering', label: 'Catering' },
  { id: 'photography', label: 'Photography/Videography' },
  { id: 'decoration', label: 'Decoration' },
  { id: 'transportation', label: 'Transportation' },
  { id: 'security', label: 'Security' },
  { id: 'sound_lighting', label: 'Sound & Lighting' },
  { id: 'other', label: 'Other' },
];

const BookingPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedData = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const bookingType = queryParams.get('type') || 'tickets'; // 'tickets' or 'vendor'
  const stallTypeId = queryParams.get('stallType');
  const { user, isAuthenticated } = useAuth();

  // React Query hook for fetching event data
  const { data: eventData } = useEventById(
    eventId ? Number(eventId) : 0,
    !!eventId
  );

  // Booking mode state
  const [bookMode, setBookMode] = useState<'choice' | 'tickets' | 'vendor'>(() => {
    if (bookingType === 'vendor') return 'vendor';
    if (bookingType === 'tickets') return 'tickets';
    return 'choice';
  });

  // Booking details state
  const [selectedTickets, setSelectedTickets] = useState<Record<number, number>>({});

  // Guest details state
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Vendor details state
  const [selectedStallType, setSelectedStallType] = useState<string>(stallTypeId || '');
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [staffCount, setStaffCount] = useState('');
  const [description, setDescription] = useState('');
  const [vendorRole, setVendorRole] = useState('');

  // Flow states
  const [step, setStep] = useState<number>(bookingType === 'vendor' ? (stallTypeId ? 2 : 1) : 1);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'opay'>('paystack');
  const [alertDialog, setAlertDialog] = useState<{isOpen: boolean, title?: string, message: string}>({isOpen: false, message: ''});

  // Normalize event data from API
  const normalizedEventData = eventData ? {
    ...eventData,
    date: eventData.startDate || eventData.date,
    startTime: eventData.startDate ? new Date(eventData.startDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) : eventData.startTime || '09:00 AM',
    endTime: eventData.endDate ? new Date(eventData.endDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) : eventData.endTime || '06:00 PM',
    ticketTypes: eventData.ticketTypes || mockEvent.ticketTypes,
    stallTypes: (eventData.vendorSettings && eventData.vendorSettings.stallTypes) ? eventData.vendorSettings.stallTypes : [],
    allowVendors: eventData.allowVendors === true,
  } : mockEvent;

  const showAlert = (message: string, title?: string) => {
    setAlertDialog({ isOpen: true, message, title });
  };

  // Initialize selectedTickets when event loads
  useEffect(() => {
    if (eventData?.ticketTypes) {
      const preselectedTypeId = Number(preselectedData.ticketTypeId);
      const preselectedQty = Number(preselectedData.quantity) || 1;
      const preselectedExists = eventData.ticketTypes.some((t: any) => Number(t.id) === preselectedTypeId);

      if (preselectedExists) {
        setSelectedTickets({ [preselectedTypeId]: preselectedQty });
      }
    }
  }, [eventData?.ticketTypes, preselectedData.ticketTypeId, preselectedData.quantity]);

  // Pre-fill guest details from logged-in user
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.firstName && !guestFirstName) setGuestFirstName(user.firstName);
      if (user.lastName && !guestLastName) setGuestLastName(user.lastName);
      if (user.email && !guestEmail) setGuestEmail(user.email);
      if (user.phone && !guestPhone) setGuestPhone(user.phone);
      
      // Also pre-fill vendor business details from user
      if (bookMode === 'vendor') {
        if (user.email && !businessEmail) setBusinessEmail(user.email);
        if (user.phone && !businessPhone) setBusinessPhone(user.phone);
      }
    }
  }, [isAuthenticated, user, guestFirstName, guestLastName, guestEmail, guestPhone, bookMode]);

  // Dynamically load Paystack script for Step 3
  useEffect(() => {
    if (step === 3) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [step]);

  // Derived state calculations
  const totalTicketsCount = Object.values(selectedTickets).reduce((acc, qty) => acc + qty, 0);

  const subtotal = normalizedEventData.ticketTypes?.reduce((acc: number, t: any) => {
    const qty = selectedTickets[t.id] || 0;
    return acc + (t.price || 0) * qty;
  }, 0) || 0;

  const serviceFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + serviceFee;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handlePaymentSuccess = async () => {
    setIsPaying(true);
    try {
      // Get first ticket type (backend expects single ticketTypeId/quantity)
      const firstTicketEntry = Object.entries(selectedTickets).find(([_, qty]) => qty > 0);
      if (!firstTicketEntry) {
        throw new Error('No tickets selected');
      }

      const [ticketTypeId, quantity] = firstTicketEntry;

      const checkoutRes = await api.post<any>('/tickets/checkout/guest', {
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail,
        phone: guestPhone,
        eventId: Number(normalizedEventData.id),
        ticketTypeId: Number(ticketTypeId),
        quantity: Number(quantity)
      });

      if (checkoutRes.status === 201) {
        const confirmedOrder = {
          eventId: normalizedEventData.id,
          eventName: normalizedEventData.title,
          eventDate: normalizedEventData.date,
          eventTime: `${normalizedEventData.startTime || '09:00 AM'} - ${normalizedEventData.endTime || '06:00 PM'}`,
          eventLocation: normalizedEventData.location,
          eventImageUrl: normalizedEventData.imageUrl,
          quantity: totalTicketsCount,
          totalAmount: totalAmount,
          currency: 'NGN',
          tickets: checkoutRes.data.tickets
        };
        navigate('/ticket-confirmation', { state: confirmedOrder });
      }
    } catch (err: any) {
      showAlert('Reservation succeeded but ticket generation failed: ' + (err.response?.data?.message || err.message), 'Ticket Error');
    } finally {
      setIsPaying(false);
    }
  };

  const handlePaystackPayment = () => {
    if (!(window as any).PaystackPop) {
      showAlert('Paystack loading failed. Please refresh and try again.', 'Payment Error');
      return;
    }

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d3000676b7db0bc43f07a4a2fa44a8ad8d1b6ee8';

    const handler = (window as any).PaystackPop.setup({
      key: publicKey,
      email: guestEmail,
      amount: Math.round(totalAmount * 100), // Paystack expects amount in kobo
      currency: 'NGN',
      ref: `EVT_${Date.now()}_${normalizedEventData.id}`,
      metadata: {
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: `${guestFirstName} ${guestLastName}`
          }
        ]
      },
      // callback MUST be a plain (non-async) function — Paystack validates the type
      callback: function(response: any) {
        console.log('[Paystack] Payment successful. Reference:', response.reference);
        // Fire the async checkout without awaiting here
        handlePaymentSuccess();
      },
      onClose: function() {
        console.log('[Paystack] Checkout popup closed by user.');
      }
    });

    handler.openIframe();
  };

  const handleOpayPayment = async () => {
    setIsPaying(true);
    try {
      const orderId = `OPAY_${Date.now()}_${normalizedEventData.id}`;
      
      const items = Object.entries(selectedTickets)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ ticketTypeId: Number(id), quantity: qty }));

      // Store checkout metadata in localstorage so we can complete checkout when returning
      localStorage.setItem(`opay_order_${orderId}`, JSON.stringify({
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail,
        phone: guestPhone,
        eventId: Number(normalizedEventData.id),
        eventName: normalizedEventData.title,
        eventDate: normalizedEventData.date,
        eventTime: `${normalizedEventData.startTime || '09:00 AM'} - ${normalizedEventData.endTime || '06:00 PM'}`,
        eventLocation: normalizedEventData.location,
        eventImageUrl: normalizedEventData.imageUrl,
        items,
        totalAmount: totalAmount
      }));

      const res = await api.post<any>('/payments/opay/create', {
        amount: totalAmount,
        orderId,
        email: guestEmail,
        name: `${guestFirstName} ${guestLastName}`
      });

      if (res.data && res.data.cashierUrl) {
        window.location.href = res.data.cashierUrl;
      } else {
        showAlert('Failed to retrieve OPay cashier checkout portal.', 'Payment Error');
      }
    } catch (err: any) {
      showAlert('OPay checkout setup failed: ' + (err.response?.data?.message || err.message), 'Payment Error');
    } finally {
      setIsPaying(false);
    }
  };

  const executePayment = async () => {
    if (totalAmount === 0) {
      await handlePaymentSuccess();
      return;
    }
    if (paymentMethod === 'paystack') {
      handlePaystackPayment();
    } else if (paymentMethod === 'opay') {
      await handleOpayPayment();
    }
  };

  // Step validations
  const validateStep2 = () => {
    if (!guestFirstName.trim() || !guestLastName.trim() || !guestEmail.trim()) {
      showAlert('First Name, Last Name, and Email are required.', 'Missing Information');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      showAlert('Please enter a valid email address.', 'Invalid Email');
      return false;
    }
    return true;
  };

  const updateTicketQty = (id: number, delta: number) => {
    setSelectedTickets(prev => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      // Enforce total transaction limit (max 10 tickets)
      const currentTotal = Object.entries(prev).reduce((acc, [k, v]) => acc + (Number(k) === id ? 0 : v), 0);
      if (currentTotal + newQty > 10) {
        showAlert('You can select a maximum of 10 tickets per order.', 'Ticket Limit');
        return prev;
      }

      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return {
        ...prev,
        [id]: newQty
      };
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 sm:py-10 py-3">
      {/* Show loading state while fetching event */}
      {!eventData && eventId && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-neutral-500">Loading event...</p>
          </div>
        </div>
      )}

      {/* Only show content when event data is loaded or using mock */}
      {(eventData || !eventId) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to={eventId ? `/events/${eventId}` : '/'} 
            className="flex items-center justify-center w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-neutral-800 dark:text-neutral-100" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
              Confirm and Pay
            </h1>
            <p className="text-xs text-neutral-500">Secure ticket reservation without login</p>
          </div>
        </div>

        {/* Stepper bar - only for ticket or vendor, not for choice */}
        {bookMode !== 'choice' && (
          <div className="flex items-center justify-start gap-3 mb-10 overflow-x-auto py-2">
            {bookMode === 'tickets' ? (
              <>
                {['Review Tickets', 'Guest Details', 'Payment'].map((s, idx) => {
                  const stepNum = idx + 1;
                  return (
                    <Fragment key={s}>
                      <div className="flex items-center gap-2 shrink-0">
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step === stepNum 
                              ? 'bg-rose-500 text-white' 
                              : step > stepNum 
                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' 
                              : 'bg-neutral-250 text-neutral-400 dark:bg-neutral-900'
                          }`}
                        >
                          {stepNum}
                        </div>
                        <span className={`text-xs font-bold ${step === stepNum ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                          {s}
                        </span>
                      </div>
                      {idx < 2 && (
                        <div className={`w-8 h-0.5 ${step > stepNum ? 'bg-rose-300' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
                      )}
                    </Fragment>
                  );
                })}
              </>
            ) : (
              <>
                {['Stall Type', 'Business Info', 'Review', 'Payment'].map((s, idx) => {
                  const stepNum = idx + 1;
                  return (
                    <Fragment key={s}>
                      <div className="flex items-center gap-2 shrink-0">
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step === stepNum 
                              ? 'bg-rose-500 text-white' 
                              : step > stepNum 
                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' 
                              : 'bg-neutral-250 text-neutral-400 dark:bg-neutral-900'
                          }`}
                        >
                          {stepNum}
                        </div>
                        <span className={`text-xs font-bold ${step === stepNum ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                          {s}
                        </span>
                      </div>
                      {idx < 3 && (
                        <div className={`w-8 h-0.5 ${step > stepNum ? 'bg-rose-300' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
                      )}
                    </Fragment>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left panel: Stepper Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              
              {/* Step 0: Vendor vs Ticket Choice */}
              {bookMode === 'choice' && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-850 rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">How would you like to participate?</h2>
                  <p className="text-xs text-neutral-500 mb-6">Choose your preferred booking type for this event.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tickets Option */}
                    <button
                      onClick={() => {
                        setBookMode('tickets');
                        setStep(1);
                      }}
                      className="p-6 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors text-left space-y-3 hover:bg-rose-50/50 dark:hover:bg-rose-950/10"
                    >
                      <Ticket className="h-8 w-8 text-rose-500" />
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Buy Tickets</h3>
                        <p className="text-xs text-neutral-500 mt-1">Attend as a guest and enjoy the event</p>
                      </div>
                    </button>

                    {/* Vendor Option - only show if vendors are enabled */}
                    {normalizedEventData?.allowVendors && (normalizedEventData?.stallTypes?.length > 0) && (
                      <button
                        onClick={() => {
                          setBookMode('vendor');
                          setStep(normalizedEventData.stallTypes?.length > 0 ? 1 : 2);
                        }}
                        className="p-6 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors text-left space-y-3 hover:bg-rose-50/50 dark:hover:bg-rose-950/10"
                      >
                        <Store className="h-8 w-8 text-rose-500" />
                        <div>
                          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Apply as Vendor</h3>
                          <p className="text-xs text-neutral-500 mt-1">Set up a booth or provide services</p>
                        </div>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
              
              {/* Step 1: Ticket Configuration */}
              {step === 1 && bookMode === 'tickets' && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-850 rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Select your tickets</h2>
                  <p className="text-xs text-neutral-500 mb-6">Select the quantity for each ticket type you want to order.</p>
                  
                  <div className="space-y-4">
                    {normalizedEventData.ticketTypes?.map((t: any) => {
                      const qty = selectedTickets[t.id] || 0;
                      return (
                        <div key={t.id} className="p-4 flex items-center justify-between border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                          <div>
                            <p className="font-extrabold text-sm text-neutral-900 dark:text-white">{t.name}</p>
                            <p className="text-xs font-bold text-rose-500 mt-1">₦{t.price.toLocaleString()}</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateTicketQty(t.id, -1)}
                              className="border border-neutral-300 dark:border-neutral-700 rounded-full p-1.5 hover:border-neutral-500 dark:hover:border-neutral-500 transition-colors disabled:opacity-30"
                              disabled={qty <= 0}
                            >
                              <Minus className="h-4 w-4 text-neutral-600 dark:text-neutral-350" />
                            </button>
                            <span className="text-sm font-bold w-6 text-center text-neutral-900 dark:text-white">
                              {qty}
                            </span>
                            <button
                              onClick={() => updateTicketQty(t.id, 1)}
                              className="border border-neutral-300 dark:border-neutral-700 rounded-full p-1.5 hover:border-neutral-500 dark:hover:border-neutral-500 transition-colors"
                            >
                              <Plus className="h-4 w-4 text-neutral-600 dark:text-neutral-350" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      if (totalTicketsCount <= 0) {
                        showAlert('Please select at least one ticket.', 'No Tickets Selected');
                        return;
                      }
                      setStep(2);
                    }}
                    className="mt-8 flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-xs font-extrabold px-6 shadow-md hover:shadow-lg transition-transform active:scale-98"
                  >
                    Continue to Details
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}

              {/* VENDOR FLOW: Step 1 - Stall Type Selection */}
              {step === 1 && bookMode === 'vendor' && (
                <motion.div
                  key="vendor-step1"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-850 rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Select Stall Type</h2>
                  <p className="text-xs text-neutral-500 mb-6">Choose the vendor booth space you'd like to apply for</p>
                  
                  {normalizedEventData.stallTypes && normalizedEventData.stallTypes.length > 0 ? (
                    <div className="space-y-3">
                      {normalizedEventData.stallTypes.map((stall: any) => (
                        <button
                          key={stall.id}
                          onClick={() => {
                            setSelectedStallType(stall.id);
                            setStep(2);
                          }}
                          className="w-full p-4 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-700 transition-all text-left space-y-2 hover:bg-rose-50/50 dark:hover:bg-rose-950/10"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{stall.name}</h3>
                              {stall.description && (
                                <p className="text-xs text-neutral-500 mt-1">{stall.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-rose-500">₦{stall.price.toLocaleString()}</p>
                              <p className="text-xs text-neutral-500 mt-0.5">Max {stall.maxStalls} stalls</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">No stall types available for this event</p>
                    </div>
                  )}

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => setBookMode('choice')}
                      className="border border-neutral-350 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-extrabold px-6 h-12 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              )}

              {/* VENDOR FLOW: Step 2 - Business Information */}
              {step === 2 && bookMode === 'vendor' && (
                <motion.div
                  key="vendor-step2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-850 rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Business Information</h2>
                  <p className="text-xs text-neutral-500 mb-6">Tell us about your business</p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-2">Business Name *</label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Catering Co"
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-2">Email *</label>
                        <input
                          type="email"
                          required
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                          placeholder="vendor@business.com"
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-2">Phone *</label>
                        <input
                          type="tel"
                          required
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                          placeholder="+234 801 234 5678"
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-2">Staff Count</label>
                      <input
                        type="number"
                        min="1"
                        value={staffCount}
                        onChange={(e) => setStaffCount(e.target.value)}
                        placeholder="5"
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-2">Description *</label>
                      <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell us about your business..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-2">Vendor Category *</label>
                      <select
                        value={vendorRole}
                        onChange={(e) => setVendorRole(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      >
                        <option value="">Select a category</option>
                        {VENDOR_ROLES.map((role) => (
                          <option key={role.id} value={role.id}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="border border-neutral-350 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-extrabold px-6 h-12 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (!businessName.trim() || !businessEmail.trim() || !businessPhone.trim() || !description.trim() || !vendorRole) {
                          showAlert('Please fill in all required fields', 'Missing Information');
                          return;
                        }
                        setStep(3);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-xs font-extrabold px-6 shadow-md hover:shadow-lg transition-transform active:scale-98"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* VENDOR FLOW: Step 3 - Review */}
              {step === 3 && bookMode === 'vendor' && (
                <motion.div
                  key="vendor-step3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-850 rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Review Your Application</h2>
                  <p className="text-xs text-neutral-500 mb-6">Please review your details before proceeding to payment</p>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <p className="text-xs text-neutral-500 uppercase tracking-wide font-bold">Business Details</p>
                      <div className="text-sm text-neutral-900 dark:text-white space-y-1">
                        <p><span className="text-neutral-500">Name:</span> {businessName}</p>
                        <p><span className="text-neutral-500">Email:</span> {businessEmail}</p>
                        <p><span className="text-neutral-500">Phone:</span> {businessPhone}</p>
                        {staffCount && <p><span className="text-neutral-500">Staff:</span> {staffCount}</p>}
                        <p><span className="text-neutral-500">Category:</span> {VENDOR_ROLES.find(r => r.id === vendorRole)?.label}</p>
                      </div>
                    </div>

                    {selectedStallType && normalizedEventData.stallTypes && (
                      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide font-bold">Stall Type</p>
                        <div className="text-sm text-neutral-900 dark:text-white">
                          {normalizedEventData.stallTypes.find((s: any) => s.id === selectedStallType)?.name}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="border border-neutral-350 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-extrabold px-6 h-12 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-xs font-extrabold px-6 shadow-md hover:shadow-lg transition-transform active:scale-98"
                    >
                      Continue to Payment
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* VENDOR FLOW: Step 4 - Payment */}
              {step === 4 && bookMode === 'vendor' && (
                <motion.div
                  key="vendor-step4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Select Payment Method</h2>
                  <p className="text-xs text-neutral-500 mb-6">Choose how you'd like to pay for your vendor booth</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setPaymentMethod('paystack')}
                      className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col justify-between h-36 transition-all ${
                        paymentMethod === 'paystack'
                          ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/10'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-neutral-800 dark:text-neutral-100">Paystack</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'paystack' ? 'border-rose-500 bg-rose-500 text-white' : 'border-neutral-300'}`}>
                          {paymentMethod === 'paystack' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Card, Bank Transfer, USSD</p>
                        <p className="text-[10px] text-neutral-400 mt-1">Instant confirmation</p>
                      </div>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30 flex gap-3 mb-6">
                    <Shield className="h-5 w-5 text-neutral-500 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-neutral-850 dark:text-neutral-200">Secure Checkout</p>
                      <p className="text-[10px] text-neutral-450 dark:text-neutral-400 mt-0.5">Your payment is encrypted and processed securely.</p>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => setStep(3)}
                      className="border border-neutral-350 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-extrabold px-6 h-12 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                      disabled={isPaying}
                    >
                      Back
                    </button>
                    <button
                      onClick={executePayment}
                      disabled={isPaying}
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold px-6 shadow-md hover:shadow-lg transition-transform active:scale-98 disabled:opacity-50"
                    >
                      {isPaying ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Complete Application
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Contact Form (Tickets Only) */}
              {step === 2 && bookMode === 'tickets' && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-850 rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Guest Information</h2>
                  <p className="text-xs text-neutral-500 mb-6">Enter details to receive your ticket and QR code</p>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-850 overflow-hidden shadow-sm bg-white dark:bg-gray-900">
                      
                      {/* Name inputs */}
                      <div className="grid grid-cols-2 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="relative border-r border-neutral-200 dark:border-neutral-800">
                          <label className="absolute top-2.5 left-4 text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                            First Name
                          </label>
                          <input
                            type="text"
                            required
                            value={guestFirstName}
                            onChange={(e) => setGuestFirstName(e.target.value)}
                            placeholder="John"
                            className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100"
                          />
                        </div>
                        <div className="relative">
                          <label className="absolute top-2.5 left-4 text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                            Last Name
                          </label>
                          <input
                            type="text"
                            required
                            value={guestLastName}
                            onChange={(e) => setGuestLastName(e.target.value)}
                            placeholder="Doe"
                            className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100"
                          />
                        </div>
                      </div>
                      
                      {/* Email address */}
                      <div className="relative border-b border-neutral-200 dark:border-neutral-800">
                        <label className="absolute top-2.5 left-4 text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="johndoe@example.com"
                          className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100"
                        />
                      </div>
                      
                      {/* Phone number */}
                      <div className="relative">
                        <label className="absolute top-2.5 left-4 text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+234 801 234 5678"
                          className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="border border-neutral-350 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-extrabold px-6 h-12 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (validateStep2()) {
                          setStep(3);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-xs font-extrabold px-6 shadow-md hover:shadow-lg transition-transform active:scale-98"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment Processors selection (Tickets Only) */}
              {step === 3 && bookMode === 'tickets' && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Select payment method</h2>
                  <p className="text-xs text-neutral-500 mb-6">Choose how you'd like to pay securely</p>

                  <div className="grid grid-cols-1 sm:grid-cols- gap-4">
                    {totalAmount === 0 ? (
                      <div className="col-span-1 sm:col-span-2 p-6 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">Free Registration</p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-1">No payment is required for these tickets.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Paystack gate selection */}
                        <div 
                          onClick={() => setPaymentMethod('paystack')}
                          className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col justify-between h-36 transition-all ${
                            paymentMethod === 'paystack'
                              ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/10'
                              : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-neutral-800 dark:text-neutral-100">Paystack</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'paystack' ? 'border-rose-500 bg-rose-500 text-white' : 'border-neutral-300'}`}>
                              {paymentMethod === 'paystack' && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Card, Bank Transfer, USSD</p>
                            <p className="text-[10px] text-neutral-400 mt-1">Instant ticket confirmation</p>
                          </div>
                        </div>

                        {/* OPay gate selection */}
                        {/* <div 
                          onClick={() => setPaymentMethod('opay')}
                          className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col justify-between h-36 transition-all ${
                            paymentMethod === 'opay'
                              ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/10'
                              : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-neutral-800 dark:text-neutral-100">OPay Checkout</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'opay' ? 'border-rose-500 bg-rose-500 text-white' : 'border-neutral-300'}`}>
                              {paymentMethod === 'opay' && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-teal-600 dark:text-teal-400">OPay Wallet, Card, Bank</p>
                            <p className="text-[10px] text-neutral-400 mt-1">Real-time payment clearance</p>
                          </div>
                        </div> */}
                      </>
                    )}
                  </div>

                  {/* Payment security indicator */}
                  <div className="mt-6 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30 flex gap-3">
                    <Shield className="h-5 w-5 text-neutral-500 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-neutral-850 dark:text-neutral-200">Secure Checkout Guarantee</p>
                      <p className="text-[10px] text-neutral-450 dark:text-neutral-400 mt-0.5">Your payment is encrypted and processed directly by our secure gateway partners.</p>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="border border-neutral-350 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-extrabold px-6 h-12 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                      disabled={isPaying}
                    >
                      Back
                    </button>
                    <button
                      onClick={executePayment}
                      disabled={isPaying}
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold px-6 shadow-md hover:shadow-lg transition-transform active:scale-98 disabled:opacity-50"
                    >
                      {isPaying ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : totalAmount === 0 ? (
                        <>
                          <Ticket className="h-4 w-4" />
                          Get for Free
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Pay ₦{totalAmount.toLocaleString()}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Right panel: Event Info Sidebar (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-900 border border-neutral-205 dark:border-neutral-850 rounded-3xl p-6 shadow-sm sticky top-24">
              
              {/* Event card header */}
              <div className="flex gap-4 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-850">
                <img 
                  src={normalizedEventData.imageUrl} 
                  alt={normalizedEventData.title} 
                  className="w-20 h-20 object-cover rounded-xl shrink-0" 
                />
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-2">
                    {normalizedEventData.title}
                  </h3>
                  <p className="text-[10px] text-neutral-450 mt-1 uppercase tracking-wider">Event Details</p>
                </div>
              </div>

              {/* Event Meta rows */}
              <div className="space-y-4 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-850 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white">Date</p>
                    <p>{formatDate(normalizedEventData.date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white">Time</p>
                    <p>{normalizedEventData.startTime} – {normalizedEventData.endTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white">Location</p>
                    <p className="line-clamp-2">{normalizedEventData.location}</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Price Details</h4>
                
                {bookMode === 'tickets' ? (
                  <>
                    {normalizedEventData.ticketTypes?.map((t: any) => {
                      const qty = selectedTickets[t.id] || 0;
                      if (qty <= 0) return null;
                      return (
                        <div key={t.id} className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                          <span>
                            {t.name} (₦{t.price.toLocaleString()} × {qty})
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white">
                            ₦{(t.price * qty).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}

                    {totalTicketsCount === 0 && (
                      <p className="text-xs text-neutral-400">No tickets selected</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                      <span className="underline">Service Fee (5%)</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        ₦{serviceFee.toLocaleString()}
                      </span>
                    </div>

                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex items-center justify-between text-sm font-extrabold text-neutral-900 dark:text-white">
                      <span>Total (NGN)</span>
                      <span>₦{totalAmount.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    {selectedStallType && normalizedEventData.stallTypes && (
                      <>
                        <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                          <span>Booth Fee</span>
                          <span className="font-bold text-neutral-900 dark:text-white">
                            ₦{normalizedEventData.stallTypes.find((s: any) => s.id === selectedStallType)?.price.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex items-center justify-between text-sm font-extrabold text-neutral-900 dark:text-white">
                          <span>Total (NGN)</span>
                          <span>₦{normalizedEventData.stallTypes.find((s: any) => s.id === selectedStallType)?.price.toLocaleString() || '0'}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
        </div>
      )}

      <CustomAlertDialog 
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        description={alertDialog.message}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default BookingPage;
