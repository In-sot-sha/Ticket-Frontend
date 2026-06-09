import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  User, 
  Mail, 
  Phone, 
  Minus, 
  Plus, 
  CreditCard,
  Shield,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

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

const BookingPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedData = location.state || {};
  const { user, isAuthenticated } = useAuth();

  // Booking details state
  const [eventData, setEventData] = useState<any>(mockEvent);
  const [selectedTickets, setSelectedTickets] = useState<Record<number, number>>({});

  // Guest details state
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Flow states
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'opay'>('paystack');

  // Fetch Event Info
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const response = await api.events.getById(Number(eventId));
        if (response.data) {
          const fetched = response.data;
          if (!fetched.ticketTypes || fetched.ticketTypes.length === 0) {
            fetched.ticketTypes = mockEvent.ticketTypes;
          }
          setEventData(fetched);

          // Initialize selectedTickets with preselected type or first type
          const preselectedTypeId = Number(preselectedData.ticketTypeId);
          const preselectedQty = Number(preselectedData.quantity) || 1;
          const preselectedExists = fetched.ticketTypes.some((t: any) => Number(t.id) === preselectedTypeId);

          if (preselectedExists) {
            setSelectedTickets({ [preselectedTypeId]: preselectedQty });
          } else if (fetched.ticketTypes.length > 0) {
            setSelectedTickets({ [fetched.ticketTypes[0].id]: 1 });
          }
        }
      } catch (err) {
        console.warn('Failed to load event from API, using fallback data:', err);
        setEventData({
          ...mockEvent,
          id: Number(eventId)
        });
        setSelectedTickets({ [mockEvent.ticketTypes[0].id]: 1 });
      }
    };
    fetchEvent();
  }, [eventId]);

  // Pre-fill guest details from logged-in user
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.firstName && !guestFirstName) setGuestFirstName(user.firstName);
      if (user.lastName && !guestLastName) setGuestLastName(user.lastName);
      if (user.email && !guestEmail) setGuestEmail(user.email);
      if (user.phone && !guestPhone) setGuestPhone(user.phone);
    }
  }, [isAuthenticated, user]);

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

  const subtotal = eventData.ticketTypes?.reduce((acc: number, t: any) => {
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

  // Payment executors
  const handlePaymentSuccess = async () => {
    setIsPaying(true);
    try {
      const items = Object.entries(selectedTickets)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ ticketTypeId: Number(id), quantity: qty }));

      const checkoutRes = await api.post<any>('/tickets/checkout/guest', {
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail,
        phone: guestPhone,
        eventId: Number(eventData.id),
        items
      });

      if (checkoutRes.status === 201) {
        const confirmedOrder = {
          eventId: eventData.id,
          eventName: eventData.title,
          eventDate: eventData.date,
          eventTime: `${eventData.startTime || '09:00 AM'} - ${eventData.endTime || '06:00 PM'}`,
          eventLocation: eventData.location,
          eventImageUrl: eventData.imageUrl,
          quantity: totalTicketsCount,
          totalAmount: totalAmount,
          currency: 'NGN',
          tickets: checkoutRes.data.tickets
        };
        navigate('/ticket-confirmation', { state: confirmedOrder });
      }
    } catch (err: any) {
      alert('Reservation succeeded but ticket generation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsPaying(false);
    }
  };

  const handlePaystackPayment = () => {
    if (!(window as any).PaystackPop) {
      alert('Paystack loading failed. Please refresh and try again.');
      return;
    }

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d3000676b7db0bc43f07a4a2fa44a8ad8d1b6ee8';

    const handler = (window as any).PaystackPop.setup({
      key: publicKey,
      email: guestEmail,
      amount: Math.round(totalAmount * 100), // Paystack expects amount in kobo
      currency: 'NGN',
      ref: `EVT_${Date.now()}_${eventData.id}`,
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
      const orderId = `OPAY_${Date.now()}_${eventData.id}`;
      
      const items = Object.entries(selectedTickets)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ ticketTypeId: Number(id), quantity: qty }));

      // Store checkout metadata in localstorage so we can complete checkout when returning
      localStorage.setItem(`opay_order_${orderId}`, JSON.stringify({
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail,
        phone: guestPhone,
        eventId: Number(eventData.id),
        eventName: eventData.title,
        eventDate: eventData.date,
        eventTime: `${eventData.startTime || '09:00 AM'} - ${eventData.endTime || '06:00 PM'}`,
        eventLocation: eventData.location,
        eventImageUrl: eventData.imageUrl,
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
        alert('Failed to retrieve OPay cashier checkout portal.');
      }
    } catch (err: any) {
      alert('OPay checkout setup failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsPaying(false);
    }
  };

  const executePayment = async () => {
    if (paymentMethod === 'paystack') {
      handlePaystackPayment();
    } else if (paymentMethod === 'opay') {
      await handleOpayPayment();
    }
  };

  // Step validations
  const validateStep2 = () => {
    if (!guestFirstName.trim() || !guestLastName.trim() || !guestEmail.trim()) {
      alert('First Name, Last Name, and Email are required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      alert('Please enter a valid email address.');
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
        alert('You can select a maximum of 10 tickets per order.');
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-10">
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

        {/* Stepper bar */}
        <div className="flex items-center justify-start gap-3 mb-10 overflow-x-auto py-2">
          {['Review Tickets', 'Guest Details', 'Payment'].map((s, idx) => {
            const stepNum = idx + 1;
            return (
              <React.Fragment key={s}>
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
              </React.Fragment>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left panel: Stepper Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              
              {/* Step 1: Ticket Configuration */}
              {step === 1 && (
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
                    {eventData.ticketTypes?.map((t: any) => {
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
                        alert('Please select at least one ticket.');
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

              {/* Step 2: Contact Form */}
              {step === 2 && (
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
                      Continue to Payment
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment Processors selection */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Select payment method</h2>
                  <p className="text-xs text-neutral-500 mb-6">Choose how you'd like to pay securely</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
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
                    <div 
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
                    </div>

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
                  src={eventData.imageUrl} 
                  alt={eventData.title} 
                  className="w-20 h-20 object-cover rounded-xl shrink-0" 
                />
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-2">
                    {eventData.title}
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
                    <p>{formatDate(eventData.date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white">Time</p>
                    <p>{eventData.startTime} – {eventData.endTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white">Location</p>
                    <p className="line-clamp-2">{eventData.location}</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Price Details</h4>
                
                {eventData.ticketTypes?.map((t: any) => {
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
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingPage;
