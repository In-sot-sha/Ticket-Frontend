import React, { useLayoutEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import {
  User,
  Shield,
  Mail,
  Bell,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Phone,
  Camera,
  Loader2,
  Store,
  LogOut,
  Ticket,
  LogIn,
} from 'lucide-react';

const inputClass =
  'w-full px-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 text-sm bg-white dark:bg-neutral-950';

const Profile = () => {
  const { user, updateUser, logout, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activePanel = searchParams.get('tab') || 'menu';

  const setActivePanel = (tab: string) => {
    if (tab === 'menu') setSearchParams({});
    else setSearchParams({ tab });
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [vendorData, setVendorData] = useState({
    businessName: user?.vendorProfile?.businessName || '',
    description: user?.vendorProfile?.description || '',
    contactEmail: user?.vendorProfile?.contactEmail || user?.email || '',
    contactPhone: user?.vendorProfile?.contactPhone || user?.phone || '',
    website: user?.vendorProfile?.website || '',
    category: user?.vendorProfile?.category || 'Food',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVendorChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setVendorData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await api.vendors.saveProfile({
        businessName: vendorData.businessName,
        description: vendorData.description,
        contactEmail: vendorData.contactEmail,
        contactPhone: vendorData.contactPhone,
        website: vendorData.website,
        category: vendorData.category,
      });
      if (response.data?.vendor) {
        updateUser({ ...user!, vendorProfile: response.data.vendor } as any);
        setSuccessMsg('Vendor business details saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save vendor details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image must be under 5MB.');
      return;
    }
    setIsUploadingAvatar(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.auth.uploadAvatar(file);
      if (response.data?.user) {
        updateUser(response.data.user);
        setFormData((prev) => ({ ...prev, avatar: response.data.user.avatar || '' }));
        setSuccessMsg('Profile photo updated!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await api.auth.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });
      if (response.data?.user) {
        updateUser(response.data.user);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [searchParams]);

  // ── Guest / logged-out profile (mobile tab friendly) ──────────────────────
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-white dark:bg-neutral-950">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-24 md:pb-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-sm shrink-0">
              <User className="h-7 w-7 sm:h-8 sm:w-8 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Your profile
              </h1>
              <p className="mt-1 text-sm text-neutral-500 sm:max-w-xl">
                Sign in to manage your details, tickets, and vendor info.
              </p>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 h-11 sm:h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4" />
              Log in
            </Link>
            <Link
              to="/register"
              className="flex w-full items-center justify-center h-11 sm:h-12 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Create account
            </Link>
          </div>

          <div className="mt-5 sm:mt-6 rounded-2xl border border-neutral-150 dark:border-neutral-900 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-900 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-0">
            <Link
              to="/recover-ticket"
              className="flex items-center gap-3 px-4 py-3 sm:py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors sm:border-r sm:border-neutral-100 dark:sm:border-neutral-900"
            >
              <div className="h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0">
                <Ticket className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Recover ticket</p>
                <p className="text-[11px] text-neutral-500">Get tickets back with email or phone</p>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
            </Link>
            <Link
              to="/events"
              className="flex items-center gap-3 px-4 py-3 sm:py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors border-t border-neutral-100 dark:border-neutral-900 sm:border-t-0"
            >
              <div className="h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0">
                <Store className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Explore events</p>
                <p className="text-[11px] text-neutral-500">Browse upcoming and past listings</p>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menuTiles = [
    {
      id: 'personal',
      title: 'Personal info',
      desc: 'Name, photo, phone',
      cardDesc: 'Provide your name, contact details, and edit your profile info.',
      icon: User,
    },
    {
      id: 'security',
      title: 'Login & security',
      desc: 'Password and account safety',
      cardDesc: 'Update your password and keep your account secured.',
      icon: Shield,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      desc: 'Email and marketing prefs',
      cardDesc: 'Choose how you want to be notified about ticket passes and events.',
      icon: Bell,
    },
    {
      id: 'vendor',
      title: 'Vendor business',
      desc: 'Pre-fill stall applications',
      cardDesc: 'Save your business details so event applications pre-fill automatically.',
      icon: Store,
    },
  ];

  const initials =
    `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const contactLine = user.email || user.phone || 'No contact on file';

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-12 pb-24 md:pb-10">
        {activePanel !== 'menu' && (
          <button
            type="button"
            onClick={() => setActivePanel('menu')}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-4 md:mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="md:hidden">Back</span>
            <span className="hidden md:inline">Account Settings</span>
          </button>
        )}

        {activePanel === 'menu' && (
          <>
            {/* ── Mobile: compact list design ── */}
            <div className="md:hidden">
              <div className="mb-5 rounded-2xl border border-neutral-150 dark:border-neutral-900 bg-neutral-50/80 dark:bg-neutral-900/40 px-4 py-5">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-3xl font-extrabold overflow-hidden ring-4 ring-white dark:ring-neutral-950 shrink-0 shadow-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <h1 className="text-xl font-extrabold tracking-tight break-words leading-snug">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1.5 break-all leading-relaxed">
                      {contactLine}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-150 dark:border-neutral-900 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-900 mb-3">
                {menuTiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => setActivePanel(tile.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{tile.title}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{tile.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-2.5">
             

                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-full border border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>

            {/* ── Desktop: card tiles ── */}
            <div className="hidden md:block">
              <div className="mb-10">
                <h1 className="text-3xl font-extrabold tracking-tight">Account</h1>
                <p className="text-sm text-neutral-500 mt-2">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    {user.firstName} {user.lastName}
                  </span>
                  {' · '}
                  {contactLine}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {menuTiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => setActivePanel(tile.id)}
                      className="p-6 border border-neutral-150 dark:border-neutral-900 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md cursor-pointer hover:border-neutral-250 dark:hover:border-neutral-700 transition-all flex flex-col justify-between text-left min-h-[180px]"
                    >
                      <div className="space-y-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl w-fit">
                          <Icon className="h-6 w-6 text-rose-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-neutral-900 dark:text-white">{tile.title}</h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                            {tile.cardDesc}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <span className="text-xs font-bold text-rose-500 flex items-center gap-0.5">
                          Manage <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activePanel === 'personal' && (
          <div className="rounded-2xl border border-neutral-150 dark:border-neutral-900 p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">Personal info</h2>
            <p className="text-xs text-neutral-500 mt-1 mb-5">Used on tickets and host profiles.</p>

            <form onSubmit={handleSavePersonal} className="space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-900">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-xl font-extrabold overflow-hidden">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-0.5 -right-0.5 bg-neutral-900 text-white p-1.5 rounded-full border-2 border-white dark:border-neutral-950 disabled:opacity-50"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="text-xs font-bold text-rose-500"
                >
                  {isUploadingAvatar ? 'Uploading…' : 'Change photo'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">First name</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className={`${inputClass} pl-10 bg-neutral-50 dark:bg-neutral-900 text-neutral-500`}
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">Phone</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0803…"
                      className={`${inputClass} pl-10`}
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-11 rounded-full text-sm font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </div>
        )}

        {activePanel === 'security' && (
          <div className="rounded-2xl border border-neutral-150 dark:border-neutral-900 p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-extrabold">Login & security</h2>
            <div className="flex items-center justify-between gap-3 py-3 border-b border-neutral-100 dark:border-neutral-900">
              <div>
                <p className="text-sm font-bold">Password</p>
                <p className="text-[11px] text-neutral-500">Update your sign-in password</p>
              </div>
              <Button variant="outline" className="rounded-full text-xs font-bold shrink-0">
                Update
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-bold">Two-factor auth</p>
                <p className="text-[11px] text-neutral-500">Extra protection for your account</p>
              </div>
              <Button variant="outline" className="rounded-full text-xs font-bold shrink-0">
                Enable
              </Button>
            </div>
          </div>
        )}

        {activePanel === 'notifications' && (
          <div className="rounded-2xl border border-neutral-150 dark:border-neutral-900 p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-extrabold">Notifications</h2>
            {[
              { title: 'Email notifications', desc: 'Confirmations, receipts, order codes', checked: true },
              { title: 'Marketing offers', desc: 'Discounts and early ticket sales', checked: false },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between gap-3 py-3 border-b border-neutral-100 dark:border-neutral-900 last:border-0"
              >
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-[11px] text-neutral-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                </label>
              </div>
            ))}
          </div>
        )}

        {activePanel === 'vendor' && (
          <div className="rounded-2xl border border-neutral-150 dark:border-neutral-900 p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">Vendor business</h2>
            <p className="text-xs text-neutral-500 mt-1 mb-5">Pre-fills stall applications.</p>
            <form onSubmit={handleSaveVendor} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">Business name *</label>
                <input
                  type="text"
                  name="businessName"
                  required
                  value={vendorData.businessName}
                  onChange={handleVendorChange}
                  className={inputClass}
                  placeholder="e.g. Catering Co"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">Contact email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={vendorData.contactEmail}
                    onChange={handleVendorChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">Contact phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={vendorData.contactPhone}
                    onChange={handleVendorChange}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">Category</label>
                <select
                  name="category"
                  value={vendorData.category}
                  onChange={handleVendorChange}
                  className={inputClass}
                >
                  {['Food', 'Drinks', 'Merchandise', 'Services', 'Other'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={vendorData.description}
                  onChange={handleVendorChange}
                  className={`${inputClass} resize-none`}
                  placeholder="What you offer…"
                />
              </div>
              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> {errorMsg}
                </div>
              )}
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-11 rounded-full text-sm font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
