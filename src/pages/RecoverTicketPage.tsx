import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  CheckCircle,
  Eye,
  Calendar,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TicketCard, {
  DownloadTicketButton,
  getTicketSerial,
  type TicketCardTicket,
  type TicketCardEventMeta,
} from '../components/TicketCard';
import { Button } from '../components/ui/Button';
import { ResponsiveModal } from '../components/ui/ResponsiveModal';
import { cn } from '../lib/utils';

function isTicketEventPast(ticket: TicketCardTicket) {
  const end = ticket.event?.endDate || ticket.event?.startDate;
  if (!end) return false;
  const d = new Date(end);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

function formatRelativeDate(dateString?: string) {
  if (!dateString) return '';
  const eventDate = new Date(dateString);
  if (Number.isNaN(eventDate.getTime())) return dateString;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) {
    return eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type Step = 'input' | 'verify' | 'results';

const RecoverTicketPage = () => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [inputValue, setInputValue] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<Step>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveredTickets, setRecoveredTickets] = useState<TicketCardTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketCardTicket | null>(null);
  const [error, setError] = useState('');
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const buildEventMeta = (ticket: TicketCardTicket): TicketCardEventMeta => ({
    eventId: ticket?.event?.id ?? ticket.eventId,
    eventName: ticket?.event?.title,
    eventDate: ticket?.event?.startDate,
    eventLocation: ticket?.event?.location,
    eventImageUrl: ticket?.event?.imageUrl,
    ticketType: ticket?.ticketType?.name,
    ticketStyle: ticket?.ticketType?.ticketStyle,
    accentColor: ticket?.ticketType?.accentColor,
  });

  const modalIndex = selectedTicket
    ? recoveredTickets.findIndex((t) => t.id === selectedTicket.id)
    : -1;
  const meta = selectedTicket ? buildEventMeta(selectedTicket) : null;
  const serial =
    selectedTicket && meta ? getTicketSerial(selectedTicket, modalIndex, meta.eventId) : '';

  // Handle OTP input
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setVerificationCode(next);
    setError('');
    // Focus the box after the last pasted digit (or last box)
    const focusIdx = Math.min(pasted.length, 5);
    setTimeout(() => inputRefs.current[focusIdx]?.focus(), 10);
  };

  // Send verification code via email/SMS
  const handleSendCode = async () => {
    if (!inputValue) return;
    setIsLoading(true);
    setError('');
    try {
      await api.post('/tickets/recover/request', {
        contact: inputValue,
        method: method
      });
      setIsLoading(false);
      setStep('verify');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    }
  };

  // Verify code and retrieve tickets
  const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length < 6) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post<{ tickets: any[] }>('/tickets/recover/verify', {
        contact: inputValue,
        code
      });
      
      const tickets = response.data.tickets || [];
      const mapped: TicketCardTicket[] = tickets.map((t: any) => ({
        id: t.id,
        qrCode: t.qrCode || '',
        eventId: t.eventId ?? t.event?.id,
        status: t.status || 'VALID',
        ticketType: {
          name: t.ticketType?.name || 'General',
          price: t.ticketType?.price,
          ticketStyle: t.ticketType?.ticketStyle,
          accentColor: t.ticketType?.accentColor,
          badgeText: t.ticketType?.badgeText,
          ticketHeadline: t.ticketType?.ticketHeadline,
          venueLabel: t.ticketType?.venueLabel,
        },
        event: {
          id: t.event?.id,
          title: t.event?.title || 'Unknown Event',
          startDate: t.event?.startDate,
          location: t.event?.location || 'Location Pending',
          imageUrl: t.event?.imageUrl,
        },
      }));

      setRecoveredTickets(mapped);
      setIsLoading(false);
      setStep('results');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10 md:pt-16 pb-28 md:pb-16">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-10 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-2 sm:mb-3 px-1">
            Find Your Tickets
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed px-1">
            Lost access to your tickets? We&apos;ll help you recover them instantly using your email or phone number.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-10 md:mb-12">
          {(['input', 'verify', 'results'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-md ${
                  step === s
                    ? 'bg-rose-500 text-white shadow-lg'
                    : i < ['input', 'verify', 'results'].indexOf(step)
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600'
                }`}
              >
                {i < ['input', 'verify', 'results'].indexOf(step) ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`w-5 sm:w-8 h-1 rounded-full transition-all ${
                    i < ['input', 'verify', 'results'].indexOf(step)
                      ? 'bg-emerald-300 dark:bg-emerald-700'
                      : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ─── Step 1: Input ─── */}
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg"
            >
              {error && (
                <div className="mb-4 sm:mb-6 rounded-xl bg-red-50/80 dark:bg-red-950/30 p-3 sm:p-4 border border-red-100 dark:border-red-900/40">
                  <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-relaxed">{error}</p>
                </div>
              )}

              {/* Method toggle */}
              <div className="flex bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-1 mb-5 sm:mb-8">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    setInputValue('');
                    setError('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    method === 'email'
                      ? 'bg-white dark:bg-neutral-700 shadow-md text-neutral-900 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('phone');
                    setInputValue('');
                    setError('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    method === 'phone'
                      ? 'bg-white dark:bg-neutral-700 shadow-md text-neutral-900 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  Phone
                </button>
              </div>

              {/* Input field */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-5 sm:mb-8 bg-neutral-50 dark:bg-neutral-950/50">
                <div className="relative">
                  <label className="absolute top-3 left-4 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {method === 'email' ? 'Email Address' : 'Phone Number'}
                  </label>
                  {method === 'email' ? (
                    <input
                      type="email"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setError('');
                      }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full px-4 pt-8 pb-4 text-base sm:text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600"
                    />
                  ) : (
                    <input
                      type="tel"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setError('');
                      }}
                      placeholder="+234 801 234 5678"
                      autoComplete="tel"
                      className="w-full px-4 pt-8 pb-4 text-base sm:text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600"
                    />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={!inputValue || isLoading}
                className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-4 sm:mt-5 px-1">
                We&apos;ll send a secure 6-digit code to verify your identity
              </p>
            </motion.div>
          )}

          {/* ─── Step 2: Verify Code ─── */}
          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg"
            >
              <div className="text-center mb-6 sm:mb-10">
                <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">
                  Enter Verification Code
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 px-1">
                  We sent a code to{' '}
                  <span className="font-bold text-neutral-900 dark:text-white break-all">
                    {inputValue}
                  </span>
                </p>
              </div>

              {error && (
                <div className="mb-5 sm:mb-8 rounded-xl bg-red-50/80 dark:bg-red-950/30 p-3 sm:p-4 border border-red-100 dark:border-red-900/40">
                  <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-relaxed">{error}</p>
                </div>
              )}

              {/* OTP inputs */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 mb-6 sm:mb-10 px-0.5">
                {verificationCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onPaste={handlePaste}
                    className="w-10 h-12 sm:w-14 sm:h-16 min-w-0 flex-1 max-w-14 text-center text-xl sm:text-2xl font-extrabold bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-neutral-900 dark:text-white"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={verificationCode.join('').length < 6 || isLoading}
                className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="sm:hidden">Verify &amp; Get Tickets</span>
                    <span className="hidden sm:inline">Verify &amp; Retrieve Tickets</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Helper links */}
              <div className="mt-5 sm:mt-6 space-y-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setError('');
                  }}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline transition-colors"
                >
                  ← Use a different {method}
                </button>
                <button
                  type="button"
                  className="block w-full text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  Didn&apos;t receive a code?{' '}
                  <span className="font-bold underline">Resend</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Results ─── */}
          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="min-w-0"
            >
              <div className="text-center mb-5 sm:mb-8 px-1">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl mb-3 shadow-md">
                  <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">
                  {recoveredTickets.length} ticket{recoveredTickets.length !== 1 ? 's' : ''} found
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  Associated with <span className="font-bold break-all">{inputValue}</span>
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Tap View to open your pass and download a PNG.
                </p>
              </div>

              {recoveredTickets.length === 0 ? (
                <div className="text-center py-10 sm:py-14 bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 px-4">
                    No tickets matched this contact.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                  {recoveredTickets.map((ticket) => {
                    const past = isTicketEventPast(ticket);
                    const coverImage =
                      ticket.event?.imageUrl ||
                      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                    const status = ticket.status || 'VALID';

                    return (
                      <div
                        key={ticket.id}
                        className="flex gap-3 rounded-2xl border border-neutral-150 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 min-w-0"
                      >
                        <div className="relative h-16 w-16 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                          <img src={coverImage} alt="" className="h-full w-full object-cover" />
                        </div>

                        <div className="min-w-0 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                              {ticket.event?.title || 'Event'}
                            </h3>
                            <span
                              className={cn(
                                'shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                                past
                                  ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                                  : status === 'VALID'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                    : status === 'USED'
                                      ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                      : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                              )}
                            >
                              {past ? 'Past' : status}
                            </span>
                          </div>

                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-rose-400 shrink-0" />
                            <span className="truncate">{formatRelativeDate(ticket.event?.startDate)}</span>
                          </p>
                          {ticket.event?.location && (
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                              <span className="truncate">{ticket.event.location}</span>
                            </p>
                          )}

                          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                              {ticket.ticketType?.name || 'Ticket'}
                              <span className="text-neutral-400 font-normal"> · #{ticket.id}</span>
                            </span>
                            <Button
                              size="sm"
                              onClick={() => setSelectedTicket(ticket)}
                              className="rounded-full text-[11px] font-bold h-8 px-3 bg-rose-500 hover:bg-rose-600 text-white border-0 shrink-0"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setInputValue('');
                    setVerificationCode(['', '', '', '', '', '']);
                    setRecoveredTickets([]);
                    setSelectedTicket(null);
                    setError('');
                  }}
                  className="flex-1 text-sm font-bold text-neutral-700 dark:text-neutral-300 border-2 border-neutral-200 dark:border-neutral-800 rounded-full px-5 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Search Another Account
                </button>
                <Link
                  to="/"
                  className="flex-1 text-sm font-bold text-white bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-200 dark:text-neutral-900 rounded-full px-5 py-3 hover:opacity-90 transition-opacity text-center"
                >
                  Back to Home
                </Link>
              </div>

              <ResponsiveModal
                open={!!selectedTicket}
                onOpenChange={(open) => {
                  if (!open) setSelectedTicket(null);
                }}
                size={6}
              >
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-rose-500">Entry Pass</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Present at gate for scanning
                    </p>
                  </div>
                </div>

                <div className="px-3 sm:px-6 pt-3 sm:pt-4">
                  <DownloadTicketButton
                    elementId={`ticket-card-${serial}`}
                    filename={`ticket-${serial}.png`}
                  />
                </div>

                <div className="p-3 sm:p-6 min-w-0">
                  {selectedTicket && meta && (
                    <TicketCard
                      ticket={selectedTicket}
                      index={modalIndex}
                      eventMeta={meta}
                      showDownload={false}
                    />
                  )}
                </div>

                <div className="px-3 sm:px-6 pb-5 sm:pb-6">
                  <div
                    className={`flex items-center justify-center gap-2 text-xs font-bold py-3 sm:py-3.5 px-3 rounded-xl border transition-all ${
                      selectedTicket?.status === 'VALID'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                        : selectedTicket?.status === 'USED'
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                          : 'bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50'
                    }`}
                  >
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span className="text-center leading-snug">
                      {selectedTicket?.status === 'VALID'
                        ? 'Valid Entry Pass — Ready to Scan'
                        : selectedTicket?.status === 'USED'
                          ? 'This pass has already been scanned'
                          : 'This pass has been cancelled'}
                    </span>
                  </div>
                </div>
              </ResponsiveModal>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecoverTicketPage;
