import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle,
  Globe,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  ImageIcon,
  AlertCircle,
  RefreshCw,
  Instagram,
  Link2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 1, title: 'Brand', subtitle: 'Name & logo', icon: Building2 },
  { id: 2, title: 'Story', subtitle: 'About you', icon: FileText },
  { id: 3, title: 'Verify', subtitle: 'Links & socials', icon: Globe },
  { id: 4, title: 'Review', subtitle: 'Submit', icon: CheckCircle },
];

const BecomeOrganizer = () => {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [logo, setLogo] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [socials, setSocials] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingRejected, setEditingRejected] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const org = user?.ownedOrganizations?.[0];
  const isVerified = org?.isVerified;
  const isRejected = Boolean(org && !org.isVerified && org.rejectedAt);
  const isPending = user?.role === 'ORGANIZER' && org && !org.isVerified && !org.rejectedAt;

  const [orgStatus, setOrgStatus] = useState<'NONE' | 'PENDING' | 'REJECTED' | 'VERIFIED'>(
    isVerified ? 'VERIFIED' : isRejected ? 'REJECTED' : isPending ? 'PENDING' : 'NONE'
  );

  useEffect(() => {
    setOrgStatus(
      isVerified ? 'VERIFIED' : isRejected ? 'REJECTED' : isPending ? 'PENDING' : 'NONE'
    );
  }, [isVerified, isRejected, isPending]);

  useEffect(() => {
    if (org && editingRejected) {
      setBusinessName(org.name || '');
      setDescription(org.description || '');
      setContactInfo(org.website || '');
      setLogo(org.logo || '');
      setLogoPreview(org.logo || '');
      setSocials(org.socials || '');
    }
  }, [org, editingRejected]);

  const TOTAL_STEPS = 4;

  const handleNext = () => {
    if (step === 1 && !businessName.trim()) return;
    if (step === 2 && !description.trim()) return;
    if (step === 3 && !contactInfo.trim()) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be under 5MB.');
      return;
    }

    setUploadingLogo(true);
    setError('');
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);

    try {
      const res = await api.userRoles.uploadOrgLogo(file);
      setLogo(res.data.url);
    } catch {
      setError('Failed to upload logo. Please try again.');
      setLogoPreview(org?.logo || '');
      setLogo(org?.logo || '');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
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
        socials,
      });
      if (response.data?.user) {
        updateUser({ ...user, ...response.data.user } as any);
      }
      setEditingRejected(false);
      setOrgStatus('PENDING');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message;
      if (errorMsg === 'Your application is already pending review') {
        try {
          const profileRes = await api.auth.verify();
          if (profileRes.data) {
            updateUser(profileRes.data);
            setOrgStatus('PENDING');
            return;
          }
        } catch {
          // fall through
        }
      }
      setError(errorMsg || 'Network error. Please try again.');
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 40 : -40, opacity: 0 }),
  };

  const isNextDisabled = () => {
    if (step === 1 && !businessName.trim()) return true;
    if (step === 2 && !description.trim()) return true;
    if (step === 3 && !contactInfo.trim()) return true;
    return false;
  };

  // ── Verified ──────────────────────────────────────────────────────────────
  if (orgStatus === 'VERIFIED') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-emerald-50/80 via-white to-white dark:from-emerald-950/20 dark:via-gray-950 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-emerald-500/10 border border-emerald-100 dark:border-emerald-900/30 p-10">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3">
              You're verified!
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
              Your host account is active. Start creating events and building your audience on PartyStorm.
            </p>
            <button
              onClick={() => navigate('/organizer')}
              className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Go to Host Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Pending ─────────────────────────────────────────────────────────────────
  if (orgStatus === 'PENDING' && !editingRejected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-amber-50/80 via-white to-white dark:from-amber-950/20 dark:via-gray-950 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-amber-500/10 border border-amber-100 dark:border-amber-900/30 p-10">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-amber-400/30 rounded-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl w-full h-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Clock className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3">
              Under review
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-2 leading-relaxed">
              We're reviewing <span className="font-bold text-neutral-700 dark:text-neutral-300">{org?.name}</span>.
            </p>
            <p className="text-sm text-neutral-400 mb-8">
              You'll get access to the host dashboard once approved — usually within 1–2 business days.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full h-12 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
            >
              Return to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Rejected ────────────────────────────────────────────────────────────────
  if (orgStatus === 'REJECTED' && !editingRejected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-red-50/60 via-white to-white dark:from-red-950/20 dark:via-gray-950 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-red-100 dark:border-red-900/30 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-6 text-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">Application needs updates</h2>
                  <p className="text-red-100 text-sm mt-0.5">Your host application was not approved</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Feedback from our team
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-5 mb-6">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {org?.rejectionReason || 'Please review your application details and resubmit.'}
                </p>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                Update your application based on the feedback above, then resubmit for another review.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setEditingRejected(true);
                    setStep(1);
                    setError('');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Update & Resubmit
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 h-12 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-xl text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Onboarding wizard ───────────────────────────────────────────────────────
  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                What's your brand called?
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                This name appears on your events and host profile.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  autoFocus
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && businessName.trim() && handleNext()}
                  placeholder="e.g. Lagos Nightlife Co."
                  className="w-full pl-12 pr-4 py-4 text-lg font-semibold bg-neutral-50 dark:bg-gray-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-300"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                  Brand logo <span className="font-normal normal-case text-neutral-400">(optional)</span>
                </p>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-all group"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-14 w-14 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 transition-colors">
                      <ImageIcon className="h-6 w-6 text-neutral-400 group-hover:text-rose-500" />
                    </div>
                  )}
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {uploadingLogo ? 'Uploading…' : logoPreview ? 'Change logo' : 'Upload logo'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">PNG, JPG or WebP · Max 5MB</p>
                  </div>
                  {uploadingLogo ? (
                    <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                  ) : (
                    <Upload className="h-5 w-5 text-neutral-400 group-hover:text-rose-500" />
                  )}
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoSelect}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Tell your story
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                Help attendees understand what makes your events special.
              </p>
            </div>
            <div className="relative">
              <FileText className="absolute left-4 top-4 h-5 w-5 text-neutral-400" />
              <textarea
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="We create unforgettable nightlife experiences across Lagos, bringing together music lovers and culture enthusiasts…"
                rows={5}
                className="w-full pl-12 pr-4 py-4 text-base bg-neutral-50 dark:bg-gray-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-300 resize-none leading-relaxed"
              />
              <p className="text-right text-[10px] text-neutral-400 mt-1">{description.length}/500</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                How can we verify you?
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                Share links that help us confirm your identity and track record.
              </p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  autoFocus
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && contactInfo.trim() && handleNext()}
                  placeholder="Website or portfolio link"
                  className="w-full pl-12 pr-4 py-4 text-lg font-semibold bg-neutral-50 dark:bg-gray-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-300"
                />
              </div>
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  value={socials}
                  onChange={(e) => setSocials(e.target.value)}
                  placeholder="@yourbrand or social profile URL"
                  className="w-full pl-12 pr-4 py-4 text-base bg-neutral-50 dark:bg-gray-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-300"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Ready to submit?
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                Double-check everything before we send it for review.
              </p>
            </div>

            <div className="bg-gradient-to-br from-neutral-50 to-rose-50/30 dark:from-gray-900/50 dark:to-rose-950/10 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-6 flex items-center gap-4 border-b border-neutral-200/80 dark:border-neutral-800">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-14 w-14 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700" />
                ) : (
                  <div className="h-14 w-14 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white truncate">{businessName}</h3>
                  <p className="text-sm text-neutral-500 truncate">{contactInfo}</p>
                  {socials && <p className="text-xs text-rose-500 mt-0.5">{socials}</p>}
                </div>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">About</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-rose-50/50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 py-10 md:py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Become a Host
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {editingRejected ? 'Update your application' : 'Start hosting on PartyStorm'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto text-sm md:text-base">
            {editingRejected
              ? 'Address the feedback and resubmit for review.'
              : 'Create unforgettable events and grow your community.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-8">
          {/* Step sidebar */}
          <div className="hidden lg:flex flex-col gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                      : isDone
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                        : 'text-neutral-400'
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20' : isDone ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-neutral-100 dark:bg-neutral-800'
                    }`}
                  >
                    {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold">{s.title}</p>
                    <p className={`text-[10px] ${isActive ? 'text-rose-100' : 'text-neutral-400'}`}>{s.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile step dots */}
          <div className="lg:hidden flex justify-center gap-2 mb-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  step === s.id ? 'w-8 bg-rose-500' : step > s.id ? 'w-4 bg-emerald-400' : 'w-4 bg-neutral-200 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-neutral-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between lg:hidden">
              <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                Step {step} of {TOTAL_STEPS}
              </span>
              <span className="text-xs text-neutral-400">{STEPS[step - 1]?.title}</span>
            </div>

            <div className="h-1 bg-neutral-100 dark:bg-neutral-800 lg:hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="p-6 md:p-10 min-h-[320px] flex items-center">
              <AnimatePresence mode="wait" custom={1}>
                <motion.div
                  key={step}
                  custom={1}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="w-full"
                >
                  {getStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-6 md:px-10 py-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between gap-4">
              <button
                onClick={handleBack}
                className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl transition-all ${
                  step === 1
                    ? 'opacity-0 pointer-events-none'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
                disabled={isNextDisabled() || loading || uploadingLogo}
                className="flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-100 text-white dark:text-neutral-900 rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : step === TOTAL_STEPS ? (
                  editingRejected ? 'Resubmit Application' : 'Submit Application'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeOrganizer;
