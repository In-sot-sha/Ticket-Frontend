import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import {
  Clock,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  AlertCircle,
  RefreshCw,
  Instagram,
  Twitter,
  Facebook,
  Calendar,
  Ticket,
  BarChart3,
  Users,
  Shield,
} from 'lucide-react';
import {
  EMPTY_ORG_SOCIALS,
  OrgSocialLinks,
  parseOrgSocials,
  serializeOrgSocials,
} from '../lib/orgSocials';

const inputClass =
  'w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-neutral-900 dark:text-white placeholder:text-neutral-400';

const labelClass = 'block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1';

const cardClass =
  'bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm';

const HOST_PERKS = [
  { icon: Calendar, label: 'Publish events', desc: 'List dates, venues & tickets' },
  { icon: Ticket, label: 'Sell tickets', desc: 'Secure checkout & QR passes' },
  { icon: BarChart3, label: 'Track sales', desc: 'Revenue & attendance live' },
  { icon: Users, label: 'Grow audience', desc: 'Build your host profile' },
];

const CHECKLIST = [
  'Business or brand name',
  'Website or portfolio link',
  'Short brand description',
  'At least 2 social profiles',
];

const countFilledSocials = (links: OrgSocialLinks) =>
  Object.values(links).filter((v) => v?.trim()).length;

const SOCIAL_FIELDS: Array<{
  key: keyof OrgSocialLinks;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: '@yourbrand',
    icon: <Instagram className="h-4 w-4" />,
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    placeholder: '@yourbrand',
    icon: <Twitter className="h-4 w-4" />,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'facebook.com/yourpage',
    icon: <Facebook className="h-4 w-4" />,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: '@yourbrand',
    icon: (
      <span className="text-[10px] font-extrabold leading-none">TT</span>
    ),
  },
];

const BecomeOrganizer = () => {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [logo, setLogo] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [socialLinks, setSocialLinks] = useState<OrgSocialLinks>({ ...EMPTY_ORG_SOCIALS });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingRejected, setEditingRejected] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const redirectAfterVerified =
    searchParams.get('redirect') || '/organizer/events/create';

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
      setSocialLinks(parseOrgSocials(org.socials));
    }
  }, [org, editingRejected]);

  const updateSocial = (key: keyof OrgSocialLinks, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!contactInfo.trim()) {
      setError('A website or portfolio link is required for verification.');
      return;
    }
    if (countFilledSocials(socialLinks) < 2) {
      setError('Please add at least 2 social profiles.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.userRoles.becomeOrganizer({
        businessName,
        description,
        contactInfo,
        logo,
        socials: serializeOrgSocials(socialLinks),
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
    } finally {
      setLoading(false);
    }
  };

  if (orgStatus === 'VERIFIED') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-neutral-100/70 dark:bg-gray-950">
        <div className={`max-w-md w-full text-center ${cardClass} p-8`}>
          <div className="mx-auto w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center mb-5">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            You're verified
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
            Your host account is active. You can create events and manage your audience from the dashboard.
          </p>
          <Button
            onClick={() => navigate(redirectAfterVerified)}
            className="w-full rounded-xl h-11 font-bold"
          >
            {redirectAfterVerified.includes('/events/create')
              ? 'Create your event'
              : 'Go to Host Dashboard'}
          </Button>
        </div>
      </div>
    );
  }

  if (orgStatus === 'PENDING' && !editingRejected) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-neutral-100/70 dark:bg-gray-950">
        <div className={`max-w-md w-full text-center ${cardClass} p-8`}>
          <div className="mx-auto w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center mb-5">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            Application under review
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 leading-relaxed">
            We're reviewing <span className="font-semibold text-neutral-700 dark:text-neutral-300">{org?.name}</span>.
          </p>
          <p className="text-xs text-neutral-400 mb-6">
            You'll get dashboard access once approved — usually within 1–2 business days.
          </p>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full rounded-xl h-11 font-bold">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (orgStatus === 'REJECTED' && !editingRejected) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-neutral-100/70 dark:bg-gray-950">
        <div className={`max-w-lg w-full ${cardClass} overflow-hidden`}>
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Application needs updates</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Your host application was not approved</p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Feedback from our team
            </p>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-5">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {org?.rejectionReason || 'Please review your application details and resubmit.'}
              </p>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
              Update your details based on the feedback above, then resubmit for another review.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setEditingRejected(true);
                  setError('');
                }}
                className="flex-1 rounded-xl h-11 font-bold gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Update & Resubmit
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1 rounded-xl h-11 font-bold">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filledSocials = countFilledSocials(socialLinks);
  const checklistDone = [
    !!businessName.trim(),
    !!contactInfo.trim(),
    !!description.trim(),
    filledSocials >= 2,
  ];

  return (
    <div className="bg-white dark:bg-gray-950 lg:bg-neutral-100 lg:dark:bg-gray-950 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5 items-start">
          {/* Left — desktop only */}
          <div className="hidden lg:block lg:col-span-2 space-y-4">
            <div className={`${cardClass} p-5`}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold mb-3">
                <Clock className="h-3 w-3" />
                Reviewed in 1–2 business days
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {editingRejected ? 'Update your application' : 'Become a host'}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                {editingRejected
                  ? 'Update your details based on feedback, then resubmit.'
                  : 'Apply to host events on PartyStorm. Complete the form and our team will verify your brand.'}
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full rounded-xl h-10 text-xs font-bold"
                asChild
              >
                <Link to="/for-organizers">
                  See what organizers get
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className={`${cardClass} p-5`}>
              <h2 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-3">
                What you unlock
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {HOST_PERKS.map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40"
                  >
                    <div className="h-7 w-7 rounded-md bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-2">
                      <Icon className="h-3.5 w-3.5 text-rose-500" />
                    </div>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{label}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{desc}</p>
                  </div>
                ))}
              </div>
            </div>


            <div className="rounded-xl border border-neutral-800 bg-neutral-900 dark:bg-neutral-800 p-4 text-white flex gap-3">
              <Shield className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Verified host badge</p>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Approved hosts get a verified badge on events. Attendees can view your website and social links from your profile.
                </p>
              </div>
            </div>
          </div>

          {/* Form — full page on mobile, card on desktop */}
          <div className="lg:col-span-3">
            <div className="lg:bg-white lg:dark:bg-gray-900 lg:rounded-xl lg:border lg:border-neutral-200 lg:dark:border-neutral-700 lg:shadow-sm lg:p-6">
              <div className="lg:hidden mb-5">
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {editingRejected ? 'Update your application' : 'Become a host'}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {editingRejected
                    ? 'Update your details and resubmit.'
                    : 'Fill in your brand details — reviewed in 1–2 business days.'}
                </p>
              </div>

              <h2 className="hidden lg:block text-sm font-bold text-neutral-900 dark:text-white mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                Brand details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="businessName" className={labelClass}>
                      Business / brand name
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Lagos Nightlife Co."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactInfo" className={labelClass}>
                      Website or portfolio
                    </label>
                    <input
                      id="contactInfo"
                      type="url"
                      required
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Logo</label>
                    <div className="flex items-center gap-2 h-[38px] px-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="shrink-0 h-7 w-7 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center overflow-hidden disabled:opacity-50"
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                        ) : uploadingLogo ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 truncate disabled:opacity-50"
                      >
                        {uploadingLogo ? 'Uploading…' : logoPreview ? 'Change logo' : 'Upload logo'}
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

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className={labelClass}>
                      About your brand
                    </label>
                    <textarea
                      id="description"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What kind of events do you host? Who is your audience?"
                      rows={3}
                      maxLength={500}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Social profiles</label>
                    <p className="text-[11px] text-neutral-400 mb-2">
                      Add at least 2 — shown on your public host profile.
                      {filledSocials > 0 && (
                        <span className="ml-1 text-neutral-500">
                          ({filledSocials}/2 added)
                        </span>
                      )}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SOCIAL_FIELDS.map(({ key, label, placeholder, icon }) => (
                        <div key={key}>
                          <label htmlFor={`social-${key}`} className={labelClass}>
                            {label}
                          </label>
                          <div className="relative">
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                              {icon}
                            </div>
                            <input
                              id={`social-${key}`}
                              type="text"
                              value={socialLinks[key] || ''}
                              onChange={(e) => updateSocial(key, e.target.value)}
                              placeholder={placeholder}
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end pt-2 lg:border-t lg:border-neutral-100 lg:dark:border-neutral-800">
                  <Button
                    type="submit"
                    disabled={loading || uploadingLogo}
                    className="w-full lg:w-auto rounded-lg h-10 px-8 font-bold gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : editingRejected ? (
                      'Resubmit application'
                    ) : (
                      'Submit application'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeOrganizer;
