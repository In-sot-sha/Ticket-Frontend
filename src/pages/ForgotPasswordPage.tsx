import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Loader2, ArrowLeft, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { getApiErrorMessage } from '../lib/apiError';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await api.auth.forgotPassword({ email: cleanEmail });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to send password reset link. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Left hero banner (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80"
          alt="PartyStorm Events"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/90 via-purple-700/80 to-indigo-900/90 mix-blend-multiply" />

        <div className="relative z-10 py-6 px-12 mx-0.5">
          <Link to="/" className="inline-flex items-center gap-1.5 text-white">
            <Ticket className="h-8 w-8 text-white/90" />
            <span className="text-xl font-extrabold tracking-tight">partystorm</span>
          </Link>
        </div>

        <div className="flex-1" />

        <div className="relative z-10 px-12 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-sm text-white"
          >
            <p className="text-lg font-semibold leading-relaxed">
              Don’t worry, it happens to the best of us.
            </p>
            <p className="text-white/70 text-sm mt-2">
              We&apos;ll help you get back to your tickets and events in no time.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right content / form area */}
      <div className="flex-1 flex flex-col py-6 px-4 sm:px-8 lg:px-12 bg-neutral-50 dark:bg-neutral-950">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2.5 rounded-full border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 pl-1.5 pr-4 py-1.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 shadow-sm hover:border-rose-200 dark:hover:border-rose-900/60 hover:text-rose-600 dark:hover:text-rose-400 hover:shadow transition-all duration-200"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 group-hover:text-rose-500 transition-colors duration-200">
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </span>
            Back to login
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center pt-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full space-y-6"
          >
            {/* Mobile logo */}
            <div className="text-center lg:text-left">
              <Link to="/" className="inline-flex items-center gap-1.5 mb-8 lg:hidden">
                <Ticket className="h-8 w-8 text-rose-500" />
                <span className="text-rose-500 font-extrabold text-xl tracking-tight">partystorm</span>
              </Link>
            </div>

            {submitted ? (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-8 shadow-sm text-center">
                <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-2xl flex items-center justify-center mb-5">
                  <CheckCircle2 className="h-8 w-8 text-rose-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-neutral-950 dark:text-white mb-2">
                  Check your inbox
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                  If an account exists for <span className="font-bold text-neutral-900 dark:text-white">{email}</span>, we&apos;ve sent instructions to reset your password. The link expires in 1 hour.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-transform active:scale-[0.98] duration-150 flex items-center justify-center gap-2"
                  >
                    Return to login
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail('');
                    }}
                    className="w-full py-2.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                  >
                    Didn&apos;t get an email? Try another address
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center lg:text-left mb-6">
                  <h2 className="text-2xl font-extrabold text-neutral-950 dark:text-white">
                    Forgot password?
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    No problem! Enter your email address and we&apos;ll send you a secure link to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium leading-relaxed">
                    {error}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm bg-white dark:bg-neutral-900">
                    <div className="relative">
                      <label
                        htmlFor="email"
                        className="absolute top-2.5 left-4 text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
                          placeholder="name@example.com"
                        />
                        <Mail className="h-4 w-4 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-transform active:scale-[0.98] duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? 'Sending link…' : 'Send reset link'}
                    </button>
                  </div>
                </form>

                <div className="text-center text-xs text-neutral-500 dark:text-neutral-400 pt-6">
                  Remember your password?{' '}
                  <Link to="/login" className="font-bold text-rose-500 hover:underline">
                    Log in
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
