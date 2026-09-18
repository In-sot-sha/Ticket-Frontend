import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Store,
  Info,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomAlertDialog } from '../components/ui/CustomAlertDialog';
import { useEventById } from '../hooks/queries/useEvents';
import { CACHE_CONFIGS } from '../lib/queryClient';
import { isValidEmail, isValidPhone } from '../lib/phone';
import { calculateBuyerCheckout, platformFeeForUnit } from '../lib/fees';
import { openPaystackCheckout } from '../lib/paystack';
import { ticketValidityLine } from '../lib/ticketValidity';
import { formatTicketPrice, isFreeTicketPrice, ticketUnitPrice } from '../lib/ticketPrice';
import { cn } from '../lib/utils';


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
    { id: 1, name: 'General Admission', price: 5000, maxPerPerson: 5 },
    { id: 2, name: 'VIP', price: 15000, maxPerPerson: 1 },
    { id: 3, name: 'Student', price: 2500, maxPerPerson: 3 }
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

  // React Query hook for fetching event data — always fresh (no cache)
  const { data: eventData } = useEventById(
    eventId ? Number(eventId) : 0,
    !!eventId,
    CACHE_CONFIGS.FRESH
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
  /** Owned counts from API keyed by ticketTypeId */
  const [ownedByType, setOwnedByType] = useState<Record<number, number>>({});

  const ticketTypes = (eventData?.ticketTypes ?? (!eventId ? mockEvent.ticketTypes : [])).map((t: any) => ({
    ...t,
    id: Number(t.id),
    price: ticketUnitPrice(t.price),
    isPaused: Boolean(t.isPaused),
    maxPerPerson: t.maxPerPerson == null || t.maxPerPerson === '' ? t.maxPerPerson : Number(t.maxPerPerson),
  }));

  // Normalize event data from API — never swap in mock paid tickets over a real event
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
    ticketTypes,
    stallTypes: (eventData.vendorTypes && eventData.vendorTypes) ? eventData.vendorTypes : [],
    allowVendors: eventData.allowVendors === true,
  } : { ...mockEvent, ticketTypes };

  const hostBrand = {
    organizerName: (normalizedEventData as any).organization?.name || null,
    organizerLogo: (normalizedEventData as any).organization?.logo || null,
  };

  const showAlert = (message: string, title?: string) => {
    setAlertDialog({ isOpen: true, message, title });
  };

  // Keep a ticket selected so Free (and other types) show in the summary
  useEffect(() => {
    if (!ticketTypes.length) return;
    const onSale = ticketTypes.filter((t: any) => !t.isPaused);
    const pool = onSale.length ? onSale : ticketTypes;
    const preselectedTypeId = Number(preselectedData.ticketTypeId);
    const preselectedQty = Number(preselectedData.quantity) || 1;
    const preselectedExists = pool.some((t: any) => Number(t.id) === preselectedTypeId && !t.isPaused);

    if (preselectedExists) {
      setSelectedTickets({ [preselectedTypeId]: preselectedQty });
      return;
    }

    const preferred =
      pool.find((t: any) => isFreeTicketPrice(t.price) && !t.isPaused) ||
      pool.find((t: any) => !t.isPaused) ||
      pool[0];
    if (preferred && !preferred.isPaused) {
      setSelectedTickets({ [Number(preferred.id)]: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventData?.ticketTypes, preselectedData.ticketTypeId, preselectedData.quantity]);

  // Pre-fill guest details from logged-in user
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.firstName && !guestFirstName) setGuestFirstName(user.firstName);
      if (user.lastName && !guestLastName) setGuestLastName(user.lastName);
      if (user.email && !guestEmail) setGuestEmail(user.email);
      if (user.phone && !guestPhone) setGuestPhone(user.phone);
      
      // Also pre-fill vendor business details from user's saved vendorProfile card
      if (bookMode === 'vendor') {
        const vp = (user as any).vendorProfile;
        if (vp) {
          if (vp.businessName && !businessName) setBusinessName(vp.businessName);
          if (vp.contactEmail && !businessEmail) setBusinessEmail(vp.contactEmail);
          if (vp.contactPhone && !businessPhone) setBusinessPhone(vp.contactPhone);
          if (vp.description && !description) setDescription(vp.description);
          if (vp.category && !vendorRole) setVendorRole(vp.category);
        } else {
          if (user.email && !businessEmail) setBusinessEmail(user.email);
          if (user.phone && !businessPhone) setBusinessPhone(user.phone);
        }
      }
    }
  }, [isAuthenticated, user, guestFirstName, guestLastName, guestEmail, guestPhone, bookMode]);

  // Derived state calculations
  const selectedTicketItems = Object.entries(selectedTickets)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([id, qty]) => ({ ticketTypeId: Number(id), quantity: Number(qty) }));

  const totalTicketsCount = selectedTicketItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = bookMode === 'vendor'
    ? (normalizedEventData.stallTypes?.find((s: any) => Number(s.id) === Number(selectedStallType))?.fee || 0)
    : (normalizedEventData.ticketTypes?.reduce((acc: number, t: any) => {
        const qty = selectedTickets[t.id] || selectedTickets[Number(t.id)] || 0;
        return acc + ticketUnitPrice(t.price) * qty;
      }, 0) || 0);

  const absorbFee = !!normalizedEventData.organization?.absorbFee;

  const platformFee =
    bookMode === 'vendor'
      ? (subtotal > 0 ? platformFeeForUnit(subtotal) : 0)
      : (normalizedEventData.ticketTypes?.reduce((acc: number, t: any) => {
          const qty = selectedTickets[t.id] || selectedTickets[Number(t.id)] || 0;
          if (qty <= 0) return acc;
          const unit = ticketUnitPrice(t.price);
          return acc + platformFeeForUnit(unit) * qty;
        }, 0) || 0);

  const { fee: serviceFee, total: totalAmount } = calculateBuyerCheckout(
    subtotal,
    platformFee,
    absorbFee,
  );

  const hasCheckoutSelection =
    bookMode === 'vendor' ? Boolean(selectedStallType) : totalTicketsCount > 0;
  const displayTotal = !hasCheckoutSelection
    ? '—'
    : totalAmount === 0
      ? 'Free'
      : `₦${totalAmount.toLocaleString()}`;

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

  const eventBackPath = normalizedEventData.slug
    ? `/events/${normalizedEventData.slug}`
    : eventId
      ? `/events/${eventId}`
      : '/';

  const handleHeaderBack = () => {
    if (isPaying) return;
    if (step > 1) {
      setStep(step - 1);
      return;
    }
    navigate(eventBackPath);
  };

  const handleContinue = async () => {
    if (isPaying) return;

    if (bookMode === 'vendor') {
      if (step === 1) {
        if (!selectedStallType) {
          showAlert('Please select a stall type.', 'Missing Information');
          return;
        }
        setStep(2);
        return;
      }
      if (step === 2) {
        if (!businessName.trim() || !businessEmail.trim() || !businessPhone.trim() || !description.trim() || !vendorRole) {
          showAlert('Please fill in all required fields', 'Missing Information');
          return;
        }
        if (!isValidEmail(businessEmail.trim())) {
          showAlert('Please enter a valid email address.', 'Invalid Email');
          return;
        }
        setStep(3);
        return;
      }
      if (step === 3) {
        setStep(4);
        return;
      }
      await executePayment();
      return;
    }

    if (step === 1) {
      if (totalTicketsCount <= 0) {
        showAlert('Please select at least one ticket.', 'No Tickets Selected');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      await refreshEligibility();
      setStep(3);
      return;
    }
    await executePayment();
  };

  const lastStep = bookMode === 'vendor' ? 4 : 3;
  const continueDisabled =
    isPaying ||
    (bookMode === 'tickets' && step === 1 && totalTicketsCount <= 0) ||
    (bookMode === 'vendor' && step === 1 && !selectedStallType);
  const continueLabel = isPaying
    ? 'Processing'
    : step < lastStep
      ? 'Continue'
      : totalAmount === 0
        ? bookMode === 'vendor'
          ? 'Submit application'
          : 'Get for free'
        : `Pay ₦${totalAmount.toLocaleString()}`;

  const stepCardClass =
    'border-0 bg-transparent p-0 shadow-none lg:rounded-2xl lg:border-2 lg:border-neutral-300 dark:lg:border-neutral-600 lg:bg-white dark:lg:bg-neutral-950 lg:p-5 lg:shadow-sm';

  const handlePaymentSuccess = async (paymentRef?: string) => {
    setIsPaying(true);
    try {
      if (bookMode === 'vendor') {
        // Paid vendor path confirms via Paystack confirm; free already fulfilled at initialize
        if (paymentRef) {
          const confirmRes = await api.post<any>('/payments/paystack/confirm', {
            reference: paymentRef,
          });
          if (confirmRes.status === 201 || confirmRes.status === 200) {
            showAlert('Your vendor application has been submitted successfully!', 'Application Received');
            navigate(`/events/${normalizedEventData.slug || normalizedEventData.id}`);
            return;
          }
        }
        showAlert('Payment could not be confirmed. Contact support with your reference.', 'Payment Error');
        return;
      }

      if (paymentRef) {
        const confirmRes = await api.post<any>('/payments/paystack/confirm', {
          reference: paymentRef,
        });
        const data = confirmRes.data;
        if (confirmRes.status === 201 || confirmRes.status === 200) {
          const firstType = data.tickets?.[0]?.ticketType;
          const confirmedOrder = {
            eventId: normalizedEventData.id,
            eventName: normalizedEventData.title,
            eventSlug: normalizedEventData.slug || null,
            eventDate: normalizedEventData.date,
            eventTime: `${normalizedEventData.startTime || '09:00 AM'} - ${normalizedEventData.endTime || '06:00 PM'}`,
            eventLocation: normalizedEventData.location,
            eventImageUrl: normalizedEventData.imageUrl,
            quantity: totalTicketsCount,
            totalAmount: totalAmount,
            currency: 'NGN',
            ticketType: firstType?.name,
            ticketStyle: firstType?.ticketStyle,
            accentColor: firstType?.accentColor,
            tickets: data.tickets,
            paymentReference: paymentRef,
            ...hostBrand,
          };
          navigate('/ticket-confirmation', { state: confirmedOrder });
          return;
        }
      }

      // Free path (no payment ref): use guest checkout
      const checkoutRes = await api.post<any>('/tickets/checkout/guest', {
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail.trim(),
        phone: guestPhone.trim() || undefined,
        eventId: Number(normalizedEventData.id),
        items: selectedTicketItems,
      });

      if (checkoutRes.status === 201) {
        const firstType = checkoutRes.data.tickets?.[0]?.ticketType;
        const confirmedOrder = {
          eventId: normalizedEventData.id,
          eventName: normalizedEventData.title,
          eventSlug: normalizedEventData.slug || null,
          eventDate: normalizedEventData.date,
          eventTime: `${normalizedEventData.startTime || '09:00 AM'} - ${normalizedEventData.endTime || '06:00 PM'}`,
          eventLocation: normalizedEventData.location,
          eventImageUrl: normalizedEventData.imageUrl,
          quantity: totalTicketsCount,
          totalAmount: totalAmount,
          currency: 'NGN',
          ticketType: firstType?.name,
          ticketStyle: firstType?.ticketStyle,
          accentColor: firstType?.accentColor,
          tickets: checkoutRes.data.tickets,
          ...hostBrand,
        };
        navigate('/ticket-confirmation', { state: confirmedOrder });
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.code === 'MAX_PER_PERSON') {
        showAlert(data.message || 'You already have the maximum tickets allowed.', 'Limit Reached');
      } else {
        showAlert(data?.message || err.message || 'Ticket registration failed.', 'Error');
      }
    } finally {
      setIsPaying(false);
    }
  };

  const openPaystackPopup = (init: {
    publicKey?: string | null;
    email: string;
    amountKobo: number;
    reference: string;
    accessCode?: string;
  }) => {
    try {
      openPaystackCheckout({
        accessCode: init.accessCode,
        publicKey: init.publicKey,
        email: init.email,
        amountKobo: init.amountKobo,
        reference: init.reference,
        onSuccess: (reference) => {
          void handlePaymentSuccess(reference);
        },
        onCancel: () => setIsPaying(false),
        onError: (message) => {
          setIsPaying(false);
          showAlert(message, 'Payment Error');
        },
      });
    } catch {
      setIsPaying(false);
      showAlert('Paystack could not open checkout. Please try again.', 'Payment Error');
    }
  };

  const handlePaystackPayment = async () => {
    setIsPaying(true);
    try {
      if (bookMode === 'vendor') {
        const initRes = await api.post<any>('/payments/paystack/initialize', {
          kind: 'VENDOR',
          eventId: Number(normalizedEventData.id),
          vendorTypeId: selectedStallType ? Number(selectedStallType) : undefined,
          businessName,
          businessEmail,
          businessPhone,
          description,
          category: vendorRole,
          staffCount: staffCount || undefined,
        });
        const init = initRes.data;
        if (init.free) {
          showAlert('Your vendor application has been submitted successfully!', 'Application Received');
          navigate(`/events/${normalizedEventData.slug || normalizedEventData.id}`);
          return;
        }
        openPaystackPopup({
          publicKey: init.publicKey,
          email: init.email,
          amountKobo: init.amountKobo,
          reference: init.reference,
          accessCode: init.accessCode,
        });
        return;
      }

      if (selectedTicketItems.length === 0) {
        showAlert('No tickets selected', 'Error');
        setIsPaying(false);
        return;
      }

      const initRes = await api.post<any>('/payments/paystack/initialize', {
        kind: 'TICKET',
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail.trim(),
        phone: guestPhone.trim() || undefined,
        eventId: Number(normalizedEventData.id),
        items: selectedTicketItems,
      });
      const init = initRes.data;

      if (init.free) {
        const firstType = init.tickets?.[0]?.ticketType;
        navigate('/ticket-confirmation', {
          state: {
            eventId: normalizedEventData.id,
            eventName: normalizedEventData.title,
            eventSlug: normalizedEventData.slug || null,
            eventDate: normalizedEventData.date,
            eventTime: `${normalizedEventData.startTime || '09:00 AM'} - ${normalizedEventData.endTime || '06:00 PM'}`,
            eventLocation: normalizedEventData.location,
            eventImageUrl: normalizedEventData.imageUrl,
            quantity: totalTicketsCount,
            totalAmount: 0,
            currency: 'NGN',
            ticketType: firstType?.name,
            ticketStyle: firstType?.ticketStyle,
            accentColor: firstType?.accentColor,
            tickets: init.tickets,
            ...hostBrand,
          },
        });
        return;
      }

      openPaystackPopup({
        publicKey: init.publicKey,
        email: init.email,
        amountKobo: init.amountKobo,
        reference: init.reference,
        accessCode: init.accessCode,
      });
    } catch (err: any) {
      const data = err.response?.data;
      showAlert(data?.message || err.message || 'Could not start payment.', 'Payment Error');
      setIsPaying(false);
    }
  };

  const handleOpayPayment = async () => {
    setIsPaying(true);
    try {
      const orderId = `OPAY_${Date.now()}_${normalizedEventData.id}`;
      
      const items = selectedTicketItems;

      // Store checkout metadata in localstorage so we can complete checkout when returning
      localStorage.setItem(`opay_order_${orderId}`, JSON.stringify({
        firstName: guestFirstName,
        lastName: guestLastName,
        email: guestEmail,
        phone: guestPhone,
        eventId: Number(normalizedEventData.id),
        eventName: normalizedEventData.title,
        eventSlug: normalizedEventData.slug || null,
        eventDate: normalizedEventData.date,
        eventTime: `${normalizedEventData.startTime || '09:00 AM'} - ${normalizedEventData.endTime || '06:00 PM'}`,
        eventLocation: normalizedEventData.location,
        eventImageUrl: normalizedEventData.imageUrl,
        organizerName: hostBrand.organizerName,
        organizerLogo: hostBrand.organizerLogo,
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
      setIsPaying(false);
    }
  };

  const executePayment = async () => {
    // Free and Paystack both go through server initialize (free fulfills immediately)
    if (totalAmount === 0 || paymentMethod === 'paystack') {
      await handlePaystackPayment();
      return;
    }
    if (paymentMethod === 'opay') {
      await handleOpayPayment();
    }
  };

  // Step validations
  const validateStep2 = () => {
    if (!guestFirstName.trim() || !guestLastName.trim()) {
      showAlert('First name and last name are required.', 'Missing Information');
      return false;
    }
    const email = guestEmail.trim();
    const phone = guestPhone.trim();
    if (!email) {
      showAlert('Email is required to buy tickets and complete payment.', 'Missing Information');
      return false;
    }
    if (!isValidEmail(email)) {
      showAlert('Please enter a valid email address.', 'Invalid Email');
      return false;
    }
    if (phone && !isValidPhone(phone)) {
      showAlert('Please enter a valid Nigerian phone number (e.g. 0803… or +234…).', 'Invalid Phone');
      return false;
    }
    return true;
  };

  const refreshEligibility = async () => {
    const email = guestEmail.trim();
    const phone = guestPhone.trim();
    if ((!email && !phone) || !normalizedEventData?.id) return;
    if (email && !isValidEmail(email)) return;
    if (phone && !isValidPhone(phone)) return;

    const types = (normalizedEventData.ticketTypes || []) as Array<{ id: number }>;
    const next: Record<number, number> = {};
    await Promise.all(
      types.map(async (t) => {
        try {
          const res = await api.tickets.checkEligibility({
            eventId: Number(normalizedEventData.id),
            ticketTypeId: t.id,
            email: email || undefined,
            phone: phone || undefined,
          });
          next[t.id] = res.data?.owned ?? 0;
        } catch {
          next[t.id] = ownedByType[t.id] ?? 0;
        }
      })
    );
    setOwnedByType(next);
  };

  // Helper: Get previous bookings for a ticket type (from eligibility API)
  const getPreviousBookings = (ticketTypeId: number): number => {
    return ownedByType[ticketTypeId] ?? 0;
  };

  // Helper: Get max per person (free = always 1; paid uses maxPerPerson or 5)
  const getMaxPerPerson = (ticketType: any): number => {
    if (isFreeTicketPrice(ticketType.price)) {
      return 1;
    }
    if (ticketType.maxPerPerson != null && ticketType.maxPerPerson > 0) {
      return ticketType.maxPerPerson;
    }
    return 5;
  };

  // Helper: Get available count for a ticket type
  const getAvailableCount = (ticketTypeId: number, ticketType: any): number => {
    const maxPerPerson = getMaxPerPerson(ticketType);
    const previousBookings = getPreviousBookings(ticketTypeId);
    return Math.max(0, maxPerPerson - previousBookings);
  };

  // Load owned ticket counts once we have a contact (logged-in or guest)
  useEffect(() => {
    if (bookMode !== 'tickets') return;
    const email = guestEmail.trim();
    const phone = guestPhone.trim();
    if (!email && !phone) return;
    if (email && !isValidEmail(email)) return;
    if (phone && !isValidPhone(phone)) return;
    void refreshEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookMode, guestEmail, guestPhone, normalizedEventData?.id]);

  const updateTicketQty = (id: number, delta: number) => {
    setSelectedTickets(prev => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      // Find the ticket type to get max per person
      const ticketType = normalizedEventData.ticketTypes?.find((t: any) => t.id === id);
      if (!ticketType) return prev;

      const maxPerPerson = getMaxPerPerson(ticketType);
      const availableCount = getAvailableCount(id, ticketType);

      // Check per-ticket-type limit
      if (newQty > availableCount) {
        const previousBookings = getPreviousBookings(id);
        if (previousBookings > 0) {
          showAlert(
            `You can buy ${availableCount} more ${ticketType.name} ticket(s).\nYou already have ${previousBookings} from previous bookings.`,
            'Per-Person Limit Reached'
          );
        } else {
          showAlert(
            `Maximum ${maxPerPerson} ${ticketType.name} ticket(s) per person.`,
            'Ticket Limit'
          );
        }
        return prev;
      }
      
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

  const handleTicketQtyChange = (id: number, valStr: string) => {
    const newQty = valStr === '' ? 0 : parseInt(valStr, 10);
    if (isNaN(newQty) || newQty < 0) return;

    const ticketType = normalizedEventData.ticketTypes?.find((t: any) => t.id === id);
    if (!ticketType) return;

    const availableCount = getAvailableCount(id, ticketType);

    if (newQty > availableCount) {
      const maxPerPerson = getMaxPerPerson(ticketType);
      const previousBookings = getPreviousBookings(id);
      if (previousBookings > 0) {
        showAlert(
          `You can buy ${availableCount} more ${ticketType.name} ticket(s).\nYou already have ${previousBookings} from previous bookings.`,
          'Per-Person Limit Reached'
        );
      } else {
        showAlert(
          `Maximum ${maxPerPerson} ${ticketType.name} ticket(s) per person.`,
          'Ticket Limit'
        );
      }
      return;
    }

    setSelectedTickets(prev => {
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-2 lg:py-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 lg:pb-0">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-3 mb-3 lg:mb-4">
          <button
            type="button"
            onClick={handleHeaderBack}
            aria-label="Go back"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-neutral-800 dark:text-neutral-100" />
          </button>
          <div>
            <h1 className="text-lg lg:text-xl font-extrabold text-neutral-900 dark:text-white">
              {bookMode === 'tickets' && hasCheckoutSelection && totalAmount === 0 ? 'Get your free ticket' : 'Confirm and Pay'}
            </h1>
            <p className="text-[11px] sm:text-xs text-neutral-500">
              {bookMode === 'tickets' && hasCheckoutSelection && totalAmount === 0
                ? 'No payment needed — just your details'
                : 'Secure ticket reservation without login'}
            </p>
          </div>
        </div>

        {/* Stepper bar - only for ticket or vendor, not for choice */}
        {bookMode !== 'choice' && (
          <div className="flex items-center justify-start gap-2 mb-4 overflow-x-auto py-0.5">
            {bookMode === 'tickets' ? (
              <>
                {['Review Tickets', 'Guest Details', hasCheckoutSelection && totalAmount === 0 ? 'Confirm' : 'Payment'].map((s, idx) => {
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
          
          {/* Left panel */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              
              {/* Step 0: Vendor vs Ticket Choice */}
              {bookMode === 'choice' && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm"
                >
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">How would you like to participate?</h2>
                  <p className="text-xs text-neutral-500 mb-3 sm:mb-6">Choose your preferred booking type for this event.</p>
                  
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
                  className={stepCardClass}
                >
                  <p className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Tickets
                  </p>
                  <h2 className="mt-0.5 font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Choose your ticket
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-500 mb-3">
                    Use + to pick a type. Free tickets are limited to one per person.
                  </p>
                  
                  <div className="space-y-2.5">
                    {(normalizedEventData.ticketTypes || []).length === 0 && (
                      <p className="text-sm text-neutral-500 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 px-4 py-6 text-center">
                        No ticket types are listed for this event yet.
                      </p>
                    )}
                    {(normalizedEventData.ticketTypes || []).length > 0 &&
                      (normalizedEventData.ticketTypes || []).every((t: any) => t.isPaused) && (
                      <p className="text-sm text-neutral-500 rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-4 text-center">
                        Ticket sales are paused right now. You can still see the types below.
                      </p>
                    )}
                    {(normalizedEventData.ticketTypes || []).map((t: any) => {
                      const qty = selectedTickets[t.id] || selectedTickets[Number(t.id)] || 0;
                      const availableCount = getAvailableCount(t.id, t);
                      const previousBookings = getPreviousBookings(t.id);
                      const maxPerPerson = getMaxPerPerson(t);
                      const remaining = Math.max(0, availableCount - qty);
                      const canBuyMore = remaining > 0 && totalTicketsCount < 10 && !t.isPaused;
                      const atLimit = availableCount <= 0 || (!canBuyMore && qty > 0);
                      const selected = qty > 0;

                      return (
                        <div
                          key={t.id}
                          role="group"
                          aria-label={t.name}
                          className={cn(
                            'w-full text-left rounded-2xl border-2 overflow-hidden transition-colors',
                            t.isPaused
                              ? 'border-neutral-200 dark:border-neutral-800 opacity-60'
                              : selected
                                ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950'
                          )}
                        >
                          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {selected && !t.isPaused && (
                                  <CheckCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                )}
                                <p className="font-ticket text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-white truncate">
                                  {t.name}
                                </p>
                                {t.isPaused && (
                                  <span className="shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-ticket font-semibold uppercase tracking-wider text-neutral-500">
                                    Paused
                                  </span>
                                )}
                              </div>
                              {ticketValidityLine(t.validOn, normalizedEventData.date, eventData?.endDate) ? (
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                  {ticketValidityLine(t.validOn, normalizedEventData.date, eventData?.endDate)}
                                </p>
                              ) : null}
                              <p className="font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1 leading-none">
                                {formatTicketPrice(t.price)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateTicketQty(t.id, -1)}
                                disabled={qty <= 0 || t.isPaused}
                                aria-label={`Decrease ${t.name}`}
                                className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-500 bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={availableCount}
                                value={qty}
                                onChange={(e) => handleTicketQtyChange(t.id, e.target.value)}
                                disabled={t.isPaused}
                                aria-label={`${t.name} quantity`}
                                className="w-12 h-9 text-center text-sm font-ticket font-bold rounded-lg border border-neutral-300 dark:border-neutral-500 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateTicketQty(t.id, 1)}
                                disabled={!canBuyMore}
                                aria-label={`Increase ${t.name}`}
                                className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-500 bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {(t.isPaused || atLimit || previousBookings > 0) && (
                          <div className="px-3.5 sm:px-4 pb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                            {t.isPaused ? (
                              <span className="text-neutral-500">Sales paused by the organizer</span>
                            ) : atLimit ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                                <Shield className="h-3.5 w-3.5 shrink-0" />
                                Limit reached · max {maxPerPerson} per person
                              </span>
                            ) : null}
                            {previousBookings > 0 && (
                              <span className="text-neutral-400 dark:text-neutral-500">
                                {atLimit || t.isPaused ? '· ' : ''}already own {previousBookings}
                              </span>
                            )}
                          </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* VENDOR FLOW: Step 1 - Stall Type Selection */}
              {step === 1 && bookMode === 'vendor' && (
                <motion.div
                  key="vendor-step1"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className={stepCardClass}
                >
                  <p className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Booth
                  </p>
                  <h2 className="mt-0.5 font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Select stall type
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-500 mb-3">
                    Choose the vendor booth space you’d like to apply for.
                  </p>
                  
                  {normalizedEventData.stallTypes && normalizedEventData.stallTypes.length > 0 ? (
                    <div className="space-y-3">
                      {normalizedEventData.stallTypes.map((stall: any) => {
                        const selected = String(selectedStallType) === String(stall.id);
                        return (
                        <button
                          key={stall.id}
                          type="button"
                          onClick={() => setSelectedStallType(stall.id)}
                          className={cn(
                            'w-full p-4 rounded-2xl border-2 transition-all text-left space-y-2',
                            selected
                              ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/10'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{stall.name}</h3>
                              {stall.description && (
                                <p className="text-xs text-neutral-500 mt-1">{stall.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-rose-500">
                                {Number(stall.fee) === 0 ? 'Free' : `₦${Number(stall.fee).toLocaleString()}`}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">Max {stall.maxStalls} stalls</p>
                            </div>
                          </div>
                        </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">No stall types available for this event</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* VENDOR FLOW: Step 2 - Business Information */}
              {step === 2 && bookMode === 'vendor' && (
                <motion.div
                  key="vendor-step2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className={stepCardClass}
                >
                  <p className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Business
                  </p>
                  <h2 className="mt-0.5 font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Business information
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-500 mb-3">
                    Tell us about your business.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-2">Business Name *</label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Catering Co"
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
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
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
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
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
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
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
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
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-2">Vendor Category *</label>
                      <select
                        value={vendorRole}
                        onChange={(e) => setVendorRole(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                      >
                        <option value="">Select a category</option>
                        {VENDOR_ROLES.map((role) => (
                          <option key={role.id} value={role.id}>{role.label}</option>
                        ))}
                      </select>
                    </div>
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
                  className={stepCardClass}
                >
                  <p className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Review
                  </p>
                  <h2 className="mt-0.5 font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Review your application
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-500 mb-3">
                    Check your details before payment.
                  </p>

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
                </motion.div>
              )}

              {/* VENDOR FLOW: Step 4 - Payment */}
              {step === 4 && bookMode === 'vendor' && (
                <motion.div
                  key="vendor-step4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className={stepCardClass}
                >
                  <p className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    {totalAmount === 0 ? 'Confirm' : 'Payment'}
                  </p>
                  <h2 className="mt-0.5 font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {totalAmount === 0 ? 'Submit application' : 'Pay securely'}
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-500 mb-3">
                    {totalAmount === 0
                      ? 'No payment needed — confirm to send your application.'
                      : 'Card, bank transfer, or USSD via Paystack.'}
                  </p>

                  {totalAmount === 0 ? (
                    <div className="rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/80 dark:bg-emerald-950/20 px-4 py-3.5">
                      <p className="font-ticket text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Free
                      </p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-500 mt-0.5">
                        You won’t be charged for this application.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paystack')}
                      className={cn(
                        'w-full rounded-2xl border-2 px-4 py-3 text-left transition-colors',
                        paymentMethod === 'paystack'
                          ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-neutral-300 dark:border-neutral-600'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-ticket text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-white">
                            Paystack
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">Card, bank transfer, USSD</p>
                        </div>
                        <div className={cn(
                          'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                          paymentMethod === 'paystack' ? 'border-rose-500 bg-rose-500' : 'border-neutral-300'
                        )}>
                          {paymentMethod === 'paystack' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  )}

                  {totalAmount > 0 && (
                    <div className="mt-3 flex items-start gap-2 text-neutral-500">
                      <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-snug">Encrypted checkout. Fees are shown in your summary.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Contact Form (Tickets Only) */}
              {step === 2 && bookMode === 'tickets' && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className={stepCardClass}
                >
                  <p className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Guest
                  </p>
                  <h2 className="mt-0.5 font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Your details
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-500 mb-3">
                    Email is required for your ticket confirmation.
                  </p>

                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="grid grid-cols-2 border-b border-neutral-200 dark:border-neutral-700">
                      <div className="relative border-r border-neutral-200 dark:border-neutral-700">
                        <label className="absolute top-2 left-3 font-ticket text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
                          First Name
                        </label>
                        <input
                          type="text"
                          required
                          value={guestFirstName}
                          onChange={(e) => setGuestFirstName(e.target.value)}
                          placeholder="John"
                          className="w-full px-3 pt-5 pb-1.5 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400"
                        />
                      </div>
                      <div className="relative">
                        <label className="absolute top-2 left-3 font-ticket text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
                          Last Name
                        </label>
                        <input
                          type="text"
                          required
                          value={guestLastName}
                          onChange={(e) => setGuestLastName(e.target.value)}
                          placeholder="Doe"
                          className="w-full px-3 pt-5 pb-1.5 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400"
                        />
                      </div>
                    </div>
                    <div className="relative border-b border-neutral-200 dark:border-neutral-700">
                      <label className="absolute top-2 left-3 font-ticket text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full px-3 pt-5 pb-1.5 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400"
                      />
                    </div>
                    <div className="relative">
                      <label className="absolute top-2 left-3 font-ticket text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="0803 000 0000"
                        className="w-full px-3 pt-5 pb-1.5 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400"
                      />
                    </div>
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
                  className={stepCardClass}
                >
                  <p className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    {totalAmount === 0 ? 'Confirm' : 'Payment'}
                  </p>
                  <h2 className="mt-0.5 font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {totalAmount === 0 ? 'Get your free ticket' : 'Pay securely'}
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-500 mb-3">
                    {totalAmount === 0
                      ? 'No payment needed — confirm to receive your ticket.'
                      : 'Card, bank transfer, or USSD via Paystack.'}
                  </p>

                  {totalAmount === 0 ? (
                    <div className="rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/80 dark:bg-emerald-950/20 px-4 py-3.5">
                      <p className="font-ticket text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Free
                      </p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-500 mt-0.5">
                        You won’t be charged for this order.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paystack')}
                      className={cn(
                        'w-full rounded-2xl border-2 px-4 py-3 text-left transition-colors',
                        paymentMethod === 'paystack'
                          ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-neutral-300 dark:border-neutral-600'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-ticket text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-white">
                            Paystack
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">Card, bank transfer, USSD</p>
                        </div>
                        <div className={cn(
                          'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                          paymentMethod === 'paystack' ? 'border-rose-500 bg-rose-500' : 'border-neutral-300'
                        )}>
                          {paymentMethod === 'paystack' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  )}

                  {totalAmount > 0 && (
                    <div className="mt-3 flex items-start gap-2 text-neutral-500">
                      <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-snug">Encrypted checkout. Fees are shown in your summary.</p>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Right panel: Event Info Sidebar (4 Cols) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="lg:sticky lg:top-24 rounded-2xl border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 p-4 lg:p-5 shadow-sm">
              <p className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                {bookMode === 'vendor' ? 'Booth' : 'Tickets'}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="font-ticket text-2xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none">
                  {displayTotal}
                </p>
              </div>

              <div className="mt-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <h3 className="font-ticket text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-white line-clamp-2">
                  {normalizedEventData.title}
                </h3>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  <span>{formatDate(normalizedEventData.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  <span>{normalizedEventData.startTime} – {normalizedEventData.endTime}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{normalizedEventData.location}</span>
                </div>
              </div>

              <div className="mt-3 space-y-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                {bookMode === 'tickets' ? (
                  <>
                    {normalizedEventData.ticketTypes?.map((t: any) => {
                      const qty = selectedTickets[t.id] || selectedTickets[Number(t.id)] || 0;
                      if (qty <= 0) return null;
                      const unit = ticketUnitPrice(t.price);
                      const free = unit === 0;
                      return (
                        <div key={t.id} className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                          <span>
                            {t.name} × {qty}
                          </span>
                          <span className="font-ticket font-semibold text-neutral-900 dark:text-white">
                            {free ? 'Free' : `₦${(unit * qty).toLocaleString()}`}
                          </span>
                        </div>
                      );
                    })}

                    {totalTicketsCount === 0 && (
                      <p className="text-xs text-neutral-400">No tickets selected</p>
                    )}

                    {serviceFee > 0 && (
                      <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="inline-flex items-center gap-1">
                          Fee
                          <span className="group relative inline-flex">
                            <button
                              type="button"
                              className="inline-flex text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 rounded-full"
                              aria-label="PartyStorm fees are non-refundable"
                            >
                              <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
                            </button>
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-44 -translate-x-1/2 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-[10px] font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
                            >
                              PartyStorm fees are non-refundable.
                            </span>
                          </span>
                        </span>
                        <span className="font-ticket font-semibold text-neutral-900 dark:text-white">
                          ₦{serviceFee.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <span className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                        Total
                      </span>
                      <span className="font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        {displayTotal}
                      </span>
                    </div>
                    {totalAmount === 0 && totalTicketsCount > 0 && (
                      <p className="text-[11px] text-neutral-500 text-center">You won’t be charged</p>
                    )}
                  </>
                ) : (
                  <>
                    {selectedStallType && normalizedEventData.stallTypes && (
                      <>
                        <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                          <span>Booth Fee</span>
                          <span className="font-ticket font-semibold text-neutral-900 dark:text-white">
                            ₦{subtotal.toLocaleString()}
                          </span>
                        </div>
                        {serviceFee > 0 && (
                          <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                            <span className="inline-flex items-center gap-1">
                              Fee
                              <span className="group relative inline-flex">
                                <button
                                  type="button"
                                  className="inline-flex text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 rounded-full"
                                  aria-label="PartyStorm fees are non-refundable"
                                >
                                  <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
                                </button>
                                <span
                                  role="tooltip"
                                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-44 -translate-x-1/2 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-[10px] font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
                                >
                                  PartyStorm fees are non-refundable.
                                </span>
                              </span>
                            </span>
                            <span className="font-ticket font-semibold text-neutral-900 dark:text-white">
                              ₦{serviceFee.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 flex items-center justify-between">
                          <span className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                            Total
                          </span>
                          <span className="font-ticket text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            {displayTotal}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {bookMode !== 'choice' && (
                <button
                  type="button"
                  disabled={continueDisabled}
                  onClick={() => void handleContinue()}
                  className="group mt-4 w-full rounded-xl bg-rose-500 px-4 py-3.5 text-white shadow-[0_8px_20px_-10px_rgba(244,63,94,0.65)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-rose-600 hover:shadow-[0_12px_24px_-10px_rgba(244,63,94,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-2 font-ticket text-[15px] font-semibold uppercase tracking-[0.12em]">
                    {isPaying ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing
                      </>
                    ) : step < lastStep ? (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4 opacity-90" />
                      </>
                    ) : totalAmount === 0 ? (
                      bookMode === 'vendor' ? (
                        <>Submit application</>
                      ) : (
                        <>
                          <Ticket className="h-4 w-4 opacity-90" />
                          Get for free
                        </>
                      )
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 opacity-90" />
                        Pay ₦{totalAmount.toLocaleString()}
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {(eventData || !eventId) && bookMode !== 'choice' && (
        <div className="lg:hidden fixed bottom-[3.6rem] left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-ticket font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Total
              </p>
              <span className="font-ticket text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                {displayTotal}
              </span>
            </div>
            <button
              type="button"
              disabled={continueDisabled}
              onClick={() => void handleContinue()}
              className="shrink-0 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-ticket font-semibold uppercase tracking-wider px-5 py-3 shadow-[0_6px_16px_-8px_rgba(244,63,94,0.7)] transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.99] disabled:opacity-50"
            >
              {continueLabel}
            </button>
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
