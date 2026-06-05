import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const handleGoogleCredentialResponse = async (response: any) => {
    setError('');
    try {
      const success = await loginWithGoogle(response.credential);
      if (success) {
        navigate('/');
      } else {
        setError('Google signup failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during Google signup.');
    }
  };

  useEffect(() => {
    const initializeGoogle = async () => {
      if (!(window as any).google) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve(true);
          document.head.appendChild(script);
        });
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1038318042450-7koc1b0256vgeop3om0j6k0e2f5bptf6.apps.googleusercontent.com';
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: 320, 
            text: 'signup_with',
            shape: 'rectangular'
          }
        );
      } catch (err) {
        console.error('Failed to initialize Google Auth button:', err);
      }
    };

    initializeGoogle();
  }, []);

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
    
    try {
      const success = await register(email, password, firstName, lastName);
      if (success) {
        navigate('/');
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px]" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full space-y-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-neutral-100 dark:border-neutral-900 p-8 md:p-10 relative z-10"
      >
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 justify-center mb-4">
            <Ticket className="h-8 w-8 text-rose-500" />
            <span className="text-rose-500 font-extrabold text-xl tracking-tight">eventify</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-neutral-955 dark:text-white">
            Create an account
          </h2>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Sign up to book tickets and start hosting events
          </p>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-red-50 dark:bg-red-950/20 p-4 border border-red-100 dark:border-red-900/35"
          >
            <p className="text-xs text-red-650 dark:text-red-300 font-bold">{error}</p>
          </motion.div>
        )}
        
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {/* Stacked Input Cell Box */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm bg-white dark:bg-gray-900">
            
            {/* Split Names Grid */}
            <div className="grid grid-cols-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="relative border-r border-neutral-200 dark:border-neutral-800">
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
            
            {/* Email Address */}
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
                type={showPassword ? "text" : "password"}
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
                type={showConfirmPassword ? "text" : "password"}
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
            <label htmlFor="terms" className="ml-2 block text-neutral-600 dark:text-neutral-450 leading-snug cursor-pointer">
              I agree to the <a href="#" className="font-bold text-rose-500 hover:underline">Terms of Service</a> & <a href="#" className="font-bold text-rose-500 hover:underline">Privacy Policy</a>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-transform active:scale-[0.98] duration-150"
            >
              Sign up
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-neutral-500 dark:text-neutral-400 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-rose-500 hover:underline">
            Log in
          </Link>
        </div>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-150 dark:border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white dark:bg-gray-900 text-neutral-400 dark:text-neutral-500 font-medium">
              or continue with
            </span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="flex justify-center">
          <div id="google-signin-btn" className="w-full flex justify-center"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;