import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { api } from '../services/api';
import { 
  Building, 
  FileText, 
  Clock, 
  CheckCircle, 
  Globe,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BecomeOrganizer = () => {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [logo, setLogo] = useState('');
  const [socials, setSocials] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { setCurrentRole } = useRole();

  const isVerified = user?.ownedOrganizations?.some(org => org.isVerified);
  const isPending = user?.role === 'ORGANIZER' && !isVerified;

  const [orgStatus, setOrgStatus] = useState<'NONE' | 'PENDING' | 'VERIFIED'>(
    isVerified ? 'VERIFIED' : isPending ? 'PENDING' : 'NONE'
  );

  React.useEffect(() => {
    setOrgStatus(isVerified ? 'VERIFIED' : isPending ? 'PENDING' : 'NONE');
  }, [isVerified, isPending]);

  const TOTAL_STEPS = 4;

  const handleNext = () => {
    if (step === 1 && !businessName.trim()) return;
    if (step === 2 && !description.trim()) return;
    if (step === 3 && !contactInfo.trim()) return;
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.userRoles.becomeOrganizer({ 
        businessName, 
        description, 
        contactInfo,
        logo,
        socials
      });
      if (response.data?.user) {
        updateUser({ ...user, ...response.data.user } as any);
      }
      setOrgStatus('PENDING');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message;
      
      // If the backend says they already have organizations, they are likely already an organizer
      // but the local frontend state was out of sync. Let's fetch the fresh profile.
      if (errorMsg === 'You already have organizations') {
        try {
          const profileRes = await api.auth.verify();
          if (profileRes.data) {
            updateUser(profileRes.data);
            setOrgStatus('PENDING');
            return;
          }
        } catch (e) {
          // fallback to showing error
        }
      }

      setError(errorMsg || 'Network error. Please try again.');
      setStep(4); // stay on review step to show error
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // VERIFIED OR PENDING STATES
  // -------------------------------------------------------------
  if (orgStatus === 'VERIFIED') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-10 max-w-md w-full text-center border border-gray-200 dark:border-gray-800"
        >
          <div className="mx-auto bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4 text-neutral-900 dark:text-white tracking-tight">You're Verified!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Your organizer account is fully active. You can now start creating and managing your events.
          </p>
          <button 
            onClick={() => {
              if (user?.role === 'ORGANIZER' && (user as any)?.ownedOrganizations?.some((org: any) => org.isVerified)) {
                navigate('/organizer');
              }
            }}
            className="w-full flex items-center justify-center h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Go to Host Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (orgStatus === 'PENDING') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-10 max-w-md w-full text-center border border-gray-200 dark:border-gray-800"
        >
          <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 text-amber-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4 text-neutral-900 dark:text-white tracking-tight">Application Pending</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            We are currently reviewing your organizer application. You'll be notified as soon as you're approved.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center h-12 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-extrabold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
          >
            Return to Home
          </button>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ONBOARDING WIZARD
  // -------------------------------------------------------------
  
  // Slide animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const isNextDisabled = () => {
    if (step === 1 && !businessName.trim()) return true;
    if (step === 2 && !description.trim()) return true;
    if (step === 3 && !contactInfo.trim()) return true;
    return false;
  };

  const getStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              What's the name of your organization?
            </h2>
            <p className="text-base md:text-lg text-neutral-500 dark:text-neutral-400 font-medium">
              This is the name attendees will see when booking your events.
            </p>
            <div className="space-y-4">
              <div className="relative mt-6">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input 
                  autoFocus
                  type="text" 
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && businessName.trim() && handleNext()}
                  placeholder="e.g. Acme Events Co."
                  className="w-full pl-12 pr-4 py-4 text-lg md:text-xl font-bold bg-neutral-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-neutral-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm"
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input 
                  type="url" 
                  value={logo}
                  onChange={e => setLogo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && businessName.trim() && handleNext()}
                  placeholder="Logo URL (optional)"
                  className="w-full pl-12 pr-4 py-3 text-base md:text-lg font-medium bg-neutral-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-neutral-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Describe the experiences you create.
            </h2>
            <p className="text-base md:text-lg text-neutral-500 dark:text-neutral-400 font-medium">
              Tell us a bit about your brand.
            </p>
            <div className="relative mt-6">
              <FileText className="absolute left-4 top-4 h-5 w-5 text-neutral-400" />
              <textarea 
                autoFocus
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="We specialize in..."
                rows={3}
                className="w-full pl-12 pr-4 py-4 text-base md:text-lg font-medium bg-neutral-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-neutral-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm resize-none leading-relaxed"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Where can we verify your identity?
            </h2>
            <p className="text-base md:text-lg text-neutral-500 dark:text-neutral-400 font-medium">
              We use this to ensure trust on the platform.
            </p>
            <div className="space-y-4">
              <div className="relative mt-6">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input 
                  autoFocus
                  type="text" 
                  value={contactInfo}
                  onChange={e => setContactInfo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && contactInfo.trim() && handleNext()}
                  placeholder="Website Link"
                  className="w-full pl-12 pr-4 py-4 text-lg md:text-xl font-bold bg-neutral-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-neutral-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm"
                />
              </div>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input 
                  type="text" 
                  value={socials}
                  onChange={e => setSocials(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && contactInfo.trim() && handleNext()}
                  placeholder="Social Media Handle (e.g. @acme_events)"
                  className="w-full pl-12 pr-4 py-3 text-base md:text-lg font-medium bg-neutral-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-neutral-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm"
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Review your application
            </h2>
            <p className="text-base md:text-lg text-neutral-500 dark:text-neutral-400 font-medium">
              Make sure everything looks good before submitting.
            </p>
            
            <div className="mt-6 bg-neutral-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                  <Building className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white truncate">{businessName}</h3>
                  <p className="text-sm text-neutral-500 truncate">{contactInfo}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg font-medium flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                  {error}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-8 md:py-12 px-4 flex flex-col items-center">
      
      {/* Wizard Container */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-950 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-850 overflow-hidden flex flex-col">
        
        {/* Progress Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center">
              <Ticket className="h-4 w-4" />
            </div>
            <span className="text-sm font-extrabold text-neutral-900 dark:text-white">Host Onboarding</span>
          </div>
          <div className="text-xs font-bold text-neutral-400">
            Step {step} of {TOTAL_STEPS}
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="h-1 w-full bg-gray-100 dark:bg-gray-900">
          <motion.div 
            className="h-full bg-rose-500"
            initial={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>

        {/* Dynamic Content Area */}
        <div className="p-6 md:p-8 min-h-[250px] md:min-h-[300px] flex items-center relative overflow-hidden">
          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={step}
              custom={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full"
            >
              {getStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Footer */}
        <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className={`flex items-center gap-1.5 text-xs md:text-sm font-bold px-4 py-2 md:py-2.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg md:rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-neutral-600 dark:text-neutral-400'}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <button
            onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
            disabled={isNextDisabled() || loading}
            className="flex items-center gap-1.5 md:gap-2 h-10 md:h-11 px-5 md:px-6 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-neutral-900 rounded-lg md:rounded-xl text-xs md:text-sm font-extrabold shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : step === TOTAL_STEPS ? (
              'Submit Application'
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BecomeOrganizer;