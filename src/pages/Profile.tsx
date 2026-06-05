import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import Header from '../components/layout/Header';
import { 
  User, 
  Shield, 
  Key, 
  Mail, 
  Bell, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Phone,
  Camera,
  Loader2
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activePanel, setActivePanel] = useState<'menu' | 'personal' | 'security' | 'notifications' | 'billing'>('menu');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        avatar: formData.avatar
      });

      if (response.data && response.data.user) {
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center p-8 bg-neutral-50 dark:bg-neutral-900 rounded-3xl max-w-sm">
          <User className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Access Denied</h3>
          <p className="text-xs text-neutral-500 mb-6">Please log in to manage your account details.</p>
          <a href="/login" className="bg-rose-500 text-white rounded-full px-6 py-2.5 text-xs font-bold hover:bg-rose-600">
            Log In
          </a>
        </div>
      </div>
    );
  }

  // Airbnb Accounts Tiles Menu
  const menuTiles = [
    {
      id: 'personal',
      title: 'Personal Info',
      desc: 'Provide your name, contact details, and edit your profile info.',
      icon: User,
    },
    {
      id: 'security',
      title: 'Login & Security',
      desc: 'Update your password and keep your account secured.',
      icon: Shield,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      desc: 'Choose how you want to be notified about ticket passes and events.',
      icon: Bell,
    },
    {
      id: 'billing',
      title: 'Payments & Payouts',
      desc: 'Review payments, payouts, coupons, and billing info.',
      icon: CreditCard,
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-neutral-950 dark:text-neutral-100">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Breadcrumbs / Back */}
        {activePanel !== 'menu' && (
          <button 
            onClick={() => setActivePanel('menu')}
            className="flex items-center gap-1.5 text-xs font-bold hover:underline mb-6 text-neutral-600 dark:text-neutral-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Account Settings
          </button>
        )}

        {/* Dynamic header depending on panel */}
        {activePanel === 'menu' && (
          <div className="mb-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Account</h1>
            <p className="text-sm text-neutral-500 mt-2">
              <span className="font-bold">{user.firstName} {user.lastName}</span> · {user.email} · <span className="underline">Go to profile</span>
            </p>
          </div>
        )}

        {/* ─── MAIN MENU PANEL ─── */}
        {activePanel === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuTiles.map(tile => {
              const Icon = tile.icon;
              return (
                <div 
                  key={tile.id}
                  onClick={() => setActivePanel(tile.id as any)}
                  className="p-6 border border-neutral-150 dark:border-neutral-900 rounded-2xl bg-white dark:bg-gray-900 shadow-sm hover:shadow-md cursor-pointer hover:border-neutral-250 dark:hover:border-neutral-805 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl w-fit">
                      <Icon className="h-6 w-6 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 dark:text-white">{tile.title}</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">{tile.desc}</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-0.5">
                      Manage <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── PERSONAL INFO PANEL ─── */}
        {activePanel === 'personal' && (
          <div className="bg-white dark:bg-gray-900 border border-neutral-150 dark:border-neutral-900 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Personal Information</h2>
              <p className="text-xs text-neutral-500 mt-1">Manage details used for your tickets and host profiles.</p>
            </div>

            <form onSubmit={handleSavePersonal} className="space-y-6">
              {/* Photo Upload Simulation */}
              <div className="flex items-center gap-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center text-2xl font-extrabold shadow-sm overflow-hidden">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.firstName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <button type="button" className="absolute -bottom-1 -right-1 bg-neutral-900 text-white p-1 rounded-full border-2 border-white dark:border-gray-900 hover:bg-neutral-800 transition-colors">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Profile photo</p>
                  <input 
                    type="text" 
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="URL to profile image" 
                    className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-transparent border-0 border-b border-neutral-200 dark:border-neutral-800 p-0 focus:ring-0 focus:border-rose-500 w-60 mt-1"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-550 dark:text-neutral-400 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm bg-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-neutral-550 dark:text-neutral-400 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm bg-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-550 dark:text-neutral-400 mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-850/50 text-neutral-450 dark:text-neutral-500 text-sm focus:outline-none"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-450" />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1.5">Email address cannot be changed.</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-neutral-550 dark:text-neutral-400 mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+234..."
                      className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm bg-transparent"
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-450" />
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> {errorMsg}
                </div>
              )}

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setFormData({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      phone: user.phone || '',
                      avatar: user.avatar || ''
                    });
                    setActivePanel('menu');
                  }}
                  className="rounded-full px-6 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="rounded-full px-6 text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ─── SECURITY PANEL ─── */}
        {activePanel === 'security' && (
          <div className="bg-white dark:bg-gray-900 border border-neutral-150 dark:border-neutral-900 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Login & Security</h2>
              <p className="text-xs text-neutral-500 mt-1">Manage password settings and secure your authentication tokens.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">Password</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Last updated: 1 month ago</p>
                </div>
                <Button variant="outline" className="rounded-full text-xs font-bold border-neutral-250">
                  Update
                </Button>
              </div>

              <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">Two-Factor Authentication</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Add an extra layer of security using an authenticator app.</p>
                </div>
                <Button variant="outline" className="rounded-full text-xs font-bold border-neutral-250">
                  Enable
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── NOTIFICATIONS PANEL ─── */}
        {activePanel === 'notifications' && (
          <div className="bg-white dark:bg-gray-900 border border-neutral-150 dark:border-neutral-900 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Notification Settings</h2>
              <p className="text-xs text-neutral-500 mt-1">Configure where and how you receive event notifications.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <div>
                  <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">Email Notifications</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Receive confirmations, receipts, and order codes.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 dark:after:border-neutral-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <div>
                  <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">Marketing Offers</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Hear about discounts, recommendations, and early ticket sales.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 dark:after:border-neutral-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ─── BILLING PANEL ─── */}
        {activePanel === 'billing' && (
          <div className="bg-white dark:bg-gray-900 border border-neutral-150 dark:border-neutral-900 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Payments & Billing</h2>
              <p className="text-xs text-neutral-500 mt-1">Review saved payment methods and transaction details.</p>
            </div>

            <div className="space-y-4">
              <div className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-950/20">
                <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">Payment methods</h4>
                <p className="text-xs text-neutral-500 mt-1">No payment methods added. You can add one during reservation checkout.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;