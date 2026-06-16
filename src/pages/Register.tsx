import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Ticket, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { neonAuthClient } from '../lib/neonAuth';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  // ---------- Google via Neon Auth ----------
  const handleGoogleSignUp = async () => {
    if (!neonAuthClient) {
      setError('Google sign-in is not configured. Please set VITE_NEON_AUTH_URL.');
      return;
    }
    setError('');
    setGoogleLoading(true);
    try {
      await neonAuthClient.signIn.social({ provider: 'google' });
      // Neon Auth redirects — execution stops here
    } catch (err: any) {
      console.error('Neon Auth Google error:', err);
      setError('Google sign-up failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  // After Neon Auth redirects back, check for an active session
  useEffect(() => {
    const client = neonAuthClient;
    if (!client) return;
    const checkNeonSession = async () => {
      try {
        const result = await client.getSession();
        if (result.data?.session && result.data?.user) {
          const success = await loginWithGoogle(result.data.session.token);
          if (success) {
            navigate('/');
          }
        }
      } catch {
        // No active Neon session
      }
    };
    checkNeonSession();
  }, []);

  // ---------- Email / Password via custom backend ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const success = await register(email, password, firstName, lastName);
      if (success) {
        navigate('/');
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* ====== LEFT: Brand Panel (desktop only) ====== */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col overflow-hidden">
        {/* Background Image & Gradient Overlay */}
        <img 
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80" 
          alt="Event background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/90 via-purple-700/80 to-indigo-900/90 mix-blend-multiply" />

        {/* Header Logo */}
        <div className="relative z-10 py-6 px-12 mx-0.5">
          <Link to="/" className="inline-flex items-center gap-1.5 text-white">
            <Ticket className="h-8 w-8 text-white/90" />
            <span className="text-xl font-extrabold tracking-tight">partystorm</span>
          </Link>
        </div>

        {/* Spacer pushes content to bottom */}
        <div className="flex-1" />

        {/* Bottom Branding Content */}
        <div className="relative z-10 px-12 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-sm text-white"
          >
            <p className="text-lg font-semibold leading-relaxed">
              Discover, book, and manage events effortlessly.
            </p>
            <p className="text-white/50 text-sm mt-2">
              Join thousands of event organizers and attendees.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ====== RIGHT: Register Form ====== */}
      <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-8 lg:px-12 bg-neutral-50 dark:bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full space-y-5"
        >
          {/* Mobile logo */}
          <div className="text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-1.5 mb-14 lg:hidden ">
              <Ticket className="h-8 w-8 text-rose-500" />
              <span className="text-rose-500 font-extrabold text-xl tracking-tight">partystorm</span>
            </Link>
            <h2 className="text-2xl font-extrabold text-neutral-950 dark:text-white">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Sign up to book tickets and start hosting events
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-red-50 dark:bg-red-950/20 p-4 border border-red-100 dark:border-red-900/35"
            >
              <p className="text-xs text-red-600 dark:text-red-300 font-bold">{error}</p>
            </motion.div>
          )}

          {/* ---- Google Sign-Up (Neon Auth) ---- */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-semibold text-neutral-700 dark:text-neutral-200 transition-all duration-150 active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-neutral-50 dark:bg-neutral-950 text-neutral-400 dark:text-neutral-500 font-medium">
                or continue with email
              </span>
            </div>
          </div>

          {/* ---- Email / Password Form ---- */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm bg-white dark:bg-neutral-900">
              {/* Split Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-neutral-200 dark:border-neutral-800">
                <div className="relative border-b sm:border-b-0 sm:border-r border-neutral-200 dark:border-neutral-800">
                  <label className="absolute top-2.5 left-4 text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                    First name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100"
                    placeholder="John"
                  />
                </div>
                <div className="relative">
                  <label className="absolute top-2.5 left-4 text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                    Last name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="relative border-b border-neutral-200 dark:border-neutral-800">
                <label className="absolute top-2.5 left-4 text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100"
                  placeholder="email@example.com"
                />
              </div>

              {/* Password */}
              <div className="relative border-b border-neutral-200 dark:border-neutral-800">
                <label className="absolute top-2.5 left-4 text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100 pr-10"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-350"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <label className="absolute top-2.5 left-4 text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                  Confirm password
                </label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 pt-6 pb-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-100 pr-10"
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-350"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center text-xs pt-1">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-neutral-350 rounded cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-neutral-600 dark:text-neutral-450 leading-snug cursor-pointer"
              >
                I agree to the{' '}
                <Link to="/terms" className="font-bold text-rose-500 hover:underline">
                  Terms of Service
                </Link>{' '}
                &{' '}
                <Link to="/privacy" className="font-bold text-rose-500 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-transform active:scale-[0.98] duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Creating account…' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="text-center text-xs text-neutral-500 dark:text-neutral-400 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-rose-500 hover:underline">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;