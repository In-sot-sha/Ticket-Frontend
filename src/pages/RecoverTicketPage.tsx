import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Ticket,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TicketCard, { type TicketCardTicket } from '../components/TicketCard';

type Step = 'input' | 'verify' | 'results';

const RecoverTicketPage = () => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [inputValue, setInputValue] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<Step>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveredTickets, setRecoveredTickets] = useState<TicketCardTicket[]>([]);
  const [error, setError] = useState('');
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

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
    <div className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40 rounded-2xl mb-6 shadow-lg">
            <Ticket className="h-10 w-10 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3">
            Find Your Tickets
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Lost access to your tickets? We'll help you recover them instantly using your email or phone number.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {(['input', 'verify', 'results'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold transition-all shadow-md ${
                  step === s
                    ? 'bg-rose-500 text-white shadow-lg'
                    : i < ['input', 'verify', 'results'].indexOf(step)
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600'
                }`}
              >
                {i < ['input', 'verify', 'results'].indexOf(step) ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`w-8 h-1 rounded-full transition-all ${
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
              className="bg-white dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-lg"
            >
              {error && (
                <div className="mb-6 rounded-xl bg-red-50/80 dark:bg-red-950/30 p-4 border border-red-100 dark:border-red-900/40">
                  <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-relaxed">{error}</p>
                </div>
              )}

              {/* Method toggle */}
              <div className="flex bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-1 mb-8">
                <button
                  onClick={() => {
                    setMethod('email');
                    setInputValue('');
                    setError('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                    method === 'email'
                      ? 'bg-white dark:bg-neutral-700 shadow-md text-neutral-900 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <button
                  onClick={() => {
                    setMethod('phone');
                    setInputValue('');
                    setError('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                    method === 'phone'
                      ? 'bg-white dark:bg-neutral-700 shadow-md text-neutral-900 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  Phone
                </button>
              </div>

              {/* Input field */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-8 bg-neutral-50 dark:bg-neutral-950/50">
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
                      className="w-full px-4 pt-8 pb-4 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600"
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
                      className="w-full px-4 pt-8 pb-4 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600"
                    />
                  )}
                </div>
              </div>

              <button
                onClick={handleSendCode}
                disabled={!inputValue || isLoading}
                className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-5">
                We'll send a secure 6-digit code to verify your identity
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
              className="bg-white dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-lg"
            >
              <div className="text-center mb-10">
                <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">
                  Enter Verification Code
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  We sent a code to{' '}
                  <span className="font-bold text-neutral-900 dark:text-white break-all">
                    {inputValue}
                  </span>
                </p>
              </div>

              {error && (
                <div className="mb-8 rounded-xl bg-red-50/80 dark:bg-red-950/30 p-4 border border-red-100 dark:border-red-900/40">
                  <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-relaxed">{error}</p>
                </div>
              )}

              {/* OTP inputs */}
              <div className="flex items-center justify-center gap-2.5 mb-10">
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
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-extrabold bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-neutral-900 dark:text-white"
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={verificationCode.join('').length < 6 || isLoading}
                className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Verify & Retrieve Tickets
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Helper links */}
              <div className="mt-6 space-y-3 text-center">
                <button
                  onClick={() => {
                    setStep('input');
                    setError('');
                  }}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline transition-colors"
                >
                  ← Use a different {method}
                </button>
                <button className="block w-full text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                  Didn't receive a code?{' '}
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
            >
              {/* Success message */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl mb-4 shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">
                  {recoveredTickets.length} ticket{recoveredTickets.length !== 1 ? 's' : ''} found
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Associated with <span className="font-bold break-all">{inputValue}</span>
                </p>
              </div>

              {/* Ticket cards */}
              <div className="space-y-6 mb-10">
                {recoveredTickets.map((ticket, idx) => (
                  <motion.div
                    key={ticket.id ?? idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 px-1">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${
                          ticket.status === 'VALID'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <TicketCard ticket={ticket} index={idx} showDownload />
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setStep('input');
                    setInputValue('');
                    setVerificationCode(['', '', '', '', '', '']);
                    setRecoveredTickets([]);
                    setError('');
                  }}
                  className="flex-1 text-sm font-bold text-neutral-700 dark:text-neutral-300 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl px-6 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Search Another Account
                </button>
                <Link
                  to="/"
                  className="flex-1 text-sm font-bold text-white bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-200 dark:text-neutral-900 rounded-xl px-6 py-3 hover:opacity-90 transition-opacity text-center"
                >
                  Back to Home
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecoverTicketPage;
