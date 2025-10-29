import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Shield, 
  Key, 
  Mail, 
  Bell, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const Profile = () => {
  const { user, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would update the user's profile via an API
    console.log('Updated profile:', formData);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Please log in to view your profile.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 rounded-md text-left mb-1 ${
                          activeTab === tab.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              {activeTab === 'profile' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold">Profile Information</h1>
                    {!isEditing && (
                      <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    )}
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                          First Name
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            isEditing ? 'bg-white dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            isEditing ? 'bg-white dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                          Email Address
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            isEditing ? 'bg-white dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-1">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            isEditing ? 'bg-white dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50'
                          }`}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex space-x-4">
                        <Button type="submit">
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setFormData({
                              firstName: user.firstName,
                              lastName: user.lastName,
                              email: user.email,
                              phone: user.phone || '',
                            });
                            setIsEditing(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
                  
                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center mb-2">
                        <Shield className="h-5 w-5 mr-2 text-primary" />
                        <h2 className="text-lg font-medium">Password</h2>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Update your password regularly to keep your account secure
                      </p>
                      <Button variant="outline">Change Password</Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center mb-2">
                        <Key className="h-5 w-5 mr-2 text-primary" />
                        <h2 className="text-lg font-medium">Two-Factor Authentication</h2>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                        <h2 className="text-lg font-medium">Account Status</h2>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          user.isVerified ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        <span>
                          {user.isVerified ? 'Verified' : 'Not Verified'} - {user.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive email updates about your events</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Push Notifications</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications on your devices</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
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
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Billing Information</h1>
                  
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Current Plan</h3>
                      <p className="text-2xl font-bold text-primary">Free Plan</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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

              {activeTab === 'danger' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6 text-red-600 dark:text-red-400">Danger Zone</h1>
                  
                  <div className="space-y-6">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-900/50">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-red-800 dark:text-red-300 mb-2">Deactivate Account</h3>
                          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                            Permanently remove your account and all associated data. This action cannot be undone.
                          </p>
                          <Button variant="destructive">
                            Deactivate Account
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-900/50">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-red-800 dark:text-red-300 mb-2">Delete Account</h3>
                          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                            Completely delete your account and all data. This action is permanent and cannot be undone.
                          </p>
                          <Button variant="destructive">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;