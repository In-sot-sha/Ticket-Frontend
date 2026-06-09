import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock,
  CreditCard,
  Bell,
  Globe,
  Shield,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const SettingsDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'menu';

  const setActiveTab = (tab: string) => {
    if (tab === 'menu') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', desc: 'Provide your organizer details and contact info.', icon: User },
    { id: 'notifications', label: 'Notifications', desc: 'Choose how you want to be notified.', icon: Bell },
    { id: 'security', label: 'Login & Security', desc: 'Update your password and keep your account secured.', icon: Shield },
    { id: 'billing', label: 'Payments & Billing', desc: 'Review payments, subscriptions, and billing info.', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', desc: 'Language, timezone, and appearance settings.', icon: Globe },
  ];

  return (
    <div className="py-6 max-w-4xl mx-auto">
      {/* Breadcrumbs / Back */}
      {activeTab !== 'menu' && (
        <button 
          onClick={() => setActiveTab('menu')}
          className="flex items-center gap-1.5 text-xs font-bold hover:underline mb-6 text-neutral-600 dark:text-neutral-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Settings
        </button>
      )}

      {/* Dynamic header depending on panel */}
      {activeTab === 'menu' && (
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Organizer Settings</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Manage your organization settings and preferences
          </p>
        </div>
      )}

      {/* ─── MAIN MENU PANEL ─── */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tabs.map(tile => {
            const Icon = tile.icon;
            return (
              <div 
                key={tile.id}
                onClick={() => setActiveTab(tile.id)}
                className="p-6 border border-neutral-150 dark:border-neutral-900 rounded-2xl bg-white dark:bg-gray-900 shadow-sm hover:shadow-md cursor-pointer hover:border-neutral-250 dark:hover:border-neutral-800 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl w-fit">
                    <Icon className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-white">{tile.label}</h3>
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

      {/* Settings Content */}
      <div className="w-full">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-sm">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Profile Information</h2>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        defaultValue="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        defaultValue="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      defaultValue="john.doe@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      defaultValue="+234 801 234 5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      defaultValue="Event organizer and tech enthusiast"
                    ></textarea>
                  </div>
                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Notification Preferences</h2>
                <form className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive email updates about your events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications on your devices</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Event Reminders</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive reminders before your events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <Button>Save Preferences</Button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Security Settings</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="pt-4">
                    <Button>Update Password</Button>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium mb-3">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </form>
              </div>
            )}

            {/* Billing Settings */}
            {activeTab === 'billing' && (
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Billing Information</h2>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Current Plan</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Free Plan</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      You can create up to 3 events per month
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Payment Method</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">No payment method added</p>
                    <Button variant="outline" className="mt-2">Add Payment Method</Button>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Subscription</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['Free', 'Pro', 'Enterprise'].map((plan, index) => (
                        <div 
                          key={index} 
                          className={`border rounded-lg p-4 ${
                            index === 0 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <h4 className="font-medium">{plan}</h4>
                          <p className="text-2xl font-bold mt-2">
                            {index === 0 ? 'Free' : index === 1 ? '₦10,000' : 'Custom'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {index === 0 ? 'Forever' : index === 1 ? '/month' : '/contact'}
                          </p>
                          <Button 
                            className={`w-full mt-4 ${
                              index === 0 ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''
                            }`}
                            disabled={index === 0}
                          >
                            {index === 0 ? 'Current Plan' : 'Upgrade'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Settings */}
            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Preferences</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Language</label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>English</option>
                      <option>French</option>
                      <option>Spanish</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Timezone</label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>(GMT+01:00) West Central Africa</option>
                      <option>(GMT+00:00) Greenwich Mean Time</option>
                      <option>(GMT-08:00) Pacific Time</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Dark Mode</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Enable dark theme</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <Button>Save Preferences</Button>
                  </div>
                </form>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsDashboard;