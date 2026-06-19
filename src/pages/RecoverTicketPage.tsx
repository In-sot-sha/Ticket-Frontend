import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Ticket,
  Mail,
  Phone,
  Search,
  ArrowRight,
  Calendar,
  MapPin,
  Download,
  QrCode,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'input' | 'verify' | 'results';

const RecoverTicketPage = () => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [inputValue, setInputValue] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<Step>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveredTickets, setRecoveredTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [error, setError] = useState('');

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
      const mapped = tickets.map((t: any) => ({
        id: `TKT-${t.id}`,
        eventTitle: t.event?.title || 'Unknown Event',
        eventDate: t.event?.startDate 
          ? new Date(t.event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Date Pending',
        location: t.event?.location || 'Location Pending',
        ticketType: t.ticketType?.name || 'General',
        status: t.status || 'VALID',
        qrCode: t.qrCode || '',
        image: t.event?.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-full mb-4">
            <Ticket className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Recover Your Tickets
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto">
            Lost access to your tickets? Enter your email address or phone number
            to retrieve them instantly.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {(['input', 'verify', 'results'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-rose-500 text-white shadow-md'
                    : i < ['input', 'verify', 'results'].indexOf(step)
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-600'
                }`}
              >
                {i < ['input', 'verify', 'results'].indexOf(step) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 rounded-full ${
                    i < ['input', 'verify', 'results'].indexOf(step)
                      ? 'bg-rose-300 dark:bg-rose-700'
                      : 'bg-neutral-200 dark:bg-neutral-800'
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
              className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 bg-white dark:bg-gray-900 shadow-lg"
            >
              {error && (
                <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 p-4 border border-red-100 dark:border-red-900/35">
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold">{error}</p>
                </div>
              )}
              {/* Method toggle */}
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 mb-6">
                <button
                  onClick={() => {
                    setMethod('email');
                    setInputValue('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    method === 'email'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
                <button
                  onClick={() => {
                    setMethod('phone');
                    setInputValue('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    method === 'phone'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </button>
              </div>

              {/* Input field */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-6">
                <div className="relative">
                  <label className="absolute top-2.5 left-4 text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                    {method === 'email' ? 'Email Address' : 'Phone Number'}
                  </label>
                  {method === 'email' ? (
                    <input
                      type="email"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 pt-7 pb-3 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100"
                    />
                  ) : (
                    <input
                      type="tel"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full px-4 pt-7 pb-3 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100"
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

              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center mt-4">
                We'll send a 6-digit code to verify your identity
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
              className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 bg-white dark:bg-gray-900 shadow-lg"
            >
              <div className="text-center mb-8">
                <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-2">
                  Enter verification code
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  We sent a code to{' '}
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">
                    {inputValue}
                  </span>
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/20 p-4 border border-red-100 dark:border-red-900/35">
                  <p className="text-xs text-red-650 dark:text-red-300 font-bold">{error}</p>
                </div>
              )}

              {/* OTP inputs */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
                {verificationCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl font-extrabold bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-neutral-900 dark:text-white"
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

              <div className="text-center mt-4">
                <button
                  onClick={() => setStep('input')}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  ← Use a different {method}
                </button>
              </div>

              <div className="text-center mt-3">
                <button className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400">
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
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-full mb-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-1">
                  {recoveredTickets.length} ticket{recoveredTickets.length !== 1 ? 's' : ''} found
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Associated with {inputValue}
                </p>
              </div>

              {/* Ticket cards */}
              <div className="space-y-4">
                {recoveredTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex">
                      {/* Thumbnail */}
                      <div className="w-28 sm:w-36 shrink-0">
                        <img
                          src={ticket.image}
                          alt={ticket.eventTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">
                              {ticket.eventTitle}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase shrink-0 ${
                                ticket.status === 'VALID'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                            <p className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {ticket.eventDate}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              {ticket.location}
                            </p>
                          </div>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                            {ticket.ticketType} · {ticket.id}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() =>
                              setSelectedTicket(
                                selectedTicket === ticket.id ? null : ticket.id
                              )
                            }
                            className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            {selectedTicket === ticket.id ? 'Hide QR' : 'View QR'}
                          </button>
                          <button className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-3 py-1.5 rounded-full transition-colors">
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable QR section */}
                    <AnimatePresence>
                      {selectedTicket === ticket.id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-neutral-100 dark:border-neutral-800 p-6 flex flex-col items-center">
                            <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-inner">
                              {ticket.qrCode ? (
                                <img src={ticket.qrCode} alt="Ticket QR Code" className="w-40 h-40 object-contain mx-auto" />
                              ) : (
                                <div className="w-40 h-40 bg-neutral-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center">
                                  <QrCode className="h-20 w-20 text-neutral-300 dark:text-neutral-500" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-3 font-mono">
                              {ticket.qrCode}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setStep('input');
                    setInputValue('');
                    setVerificationCode(['', '', '', '', '', '']);
                  }}
                  className="text-xs font-bold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-full px-5 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  Search another account
                </button>
                <Link
                  to="/"
                  className="text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-full px-5 py-2.5 hover:opacity-90 transition-opacity"
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
