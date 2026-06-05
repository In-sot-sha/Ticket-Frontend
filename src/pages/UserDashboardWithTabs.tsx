import React, { useState } from 'react';
import { 
  Ticket, 
  Store, 
  User as UserIcon, 
  Building,
  CheckCircle,
  MapPin,
  Calendar,
  Lock,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { Button } from '../components/ui/Button';
import VendorApplicationsDisplay from '../components/VendorApplicationsDisplay';
import Header from '../components/layout/Header';
import { Link } from 'react-router-dom';

// Tickets/Trips Tab
const TicketsTab = () => {
  const tickets = [
    {
      id: 1,
      eventTitle: "Tech Conference 2023",
      eventDate: "Dec 15, 2023",
      location: "Lagos, Nigeria",
      ticketType: "VIP Ticket",
      status: "VALID",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    },
    {
      id: 2,
      eventTitle: "Music Festival",
      eventDate: "Jan 20, 2024",
      location: "Abuja, Nigeria",
      ticketType: "General Ticket",
      status: "USED",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
    }
  ];

  return (
    <div className="py-6 space-y-6">
      <h2 className="text-xl font-extrabold tracking-tight">Your Tickets</h2>
      
      {tickets.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
          <Ticket className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold mb-1">No ticket bookings yet</h3>
          <p className="text-xs text-neutral-450 dark:text-neutral-500 mb-4 max-w-xs mx-auto">
            You haven't bought tickets for any upcoming listings. Explore events to book now!
          </p>
          <Link to="/">
            <Button className="rounded-full text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white">Find Events</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map(ticket => (
            <div key={ticket.id} className="border border-neutral-150 dark:border-neutral-900 rounded-2xl overflow-hidden flex bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
              
              {/* Event card thumbnail */}
              <div className="w-1/3 aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                <img src={ticket.image} alt={ticket.eventTitle} className="w-full h-full object-cover" />
              </div>
              
              {/* Ticket Details */}
              <div className="p-4 flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-2 leading-snug">{ticket.eventTitle}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase shrink-0 ${
                      ticket.status === 'VALID' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  
                  <div className="mt-3 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <p className="flex items-center gap-1.5 leading-none">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{ticket.eventDate}</span>
                    </p>
                    <p className="flex items-center gap-1.5 leading-none">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="truncate">{ticket.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5 leading-none">
                      <Ticket className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{ticket.ticketType}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-3">
                  <Button variant="outline" size="sm" className="rounded-full text-[11px] font-semibold border-neutral-250 hover:bg-neutral-50 dark:border-neutral-800">
                    View code
                  </Button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Profile Settings Tab
const ProfileTab = () => {
  const { user } = useAuth();
  
  return (
    <div className="py-6">
      <h2 className="text-xl font-extrabold tracking-tight mb-6">Profile Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Profile Summary Badge */}
        <div className="border border-neutral-150 dark:border-neutral-900 rounded-3xl p-6 bg-white dark:bg-gray-900 text-center shadow-sm">
          <div className="relative inline-block mx-auto mb-4">
            <div className="bg-rose-500 text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-extrabold shadow-md">
              {user?.firstName?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 bg-emerald-500 border-2 border-white dark:border-gray-900 text-white p-1 rounded-full">
              <CheckCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {user?.firstName} {user?.lastName}
          </h3>
          <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-1">{user?.email}</p>
          
          <div className="border-t border-neutral-100 dark:border-neutral-800 my-4 pt-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              <CheckCircle className="h-4 w-4 text-rose-500" />
              Identity verified
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              <CheckCircle className="h-4 w-4 text-rose-500" />
              Email confirmed
            </div>
          </div>
        </div>

        {/* Right Side: Profile fields forms */}
        <div className="lg:col-span-2 border border-neutral-150 dark:border-neutral-900 rounded-3xl p-6 md:p-8 bg-white dark:bg-gray-900 space-y-6 shadow-sm">
          <h3 className="font-extrabold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Edit details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-neutral-550 dark:text-neutral-400 mb-2">First name</label>
              <input
                type="text"
                defaultValue={user?.firstName}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm bg-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-neutral-550 dark:text-neutral-400 mb-2">Last name</label>
              <input
                type="text"
                defaultValue={user?.lastName}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm bg-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-neutral-550 dark:text-neutral-400 mb-2">Email address</label>
              <div className="relative">
                <input
                  type="email"
                  defaultValue={user?.email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-850/50 text-neutral-450 dark:text-neutral-500 text-sm focus:outline-none"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-neutral-550 dark:text-neutral-400 mb-2">Phone number</label>
              <div className="relative">
                <input
                  type="tel"
                  defaultValue={user?.phone || ''}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm bg-transparent"
                  placeholder="+234..."
                />
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <Button className="rounded-full text-xs font-bold px-6 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
              Save changes
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

// Main tab wrapper
const UserDashboardWithTabs = () => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'vendors' | 'profile'>('tickets');
  const { setCurrentRole } = useRole();

  const tabs = [
    { id: 'tickets', name: 'My Tickets', icon: Ticket },
    { id: 'vendors', name: 'Vendor Bookings', icon: Store },
    { id: 'profile', name: 'Profile Account', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-neutral-900 dark:text-neutral-100 pb-16">
      
      {/* Primary Header */}
      <Header />

      {/* Tabs Menu Header block */}
      <div className="border-b border-neutral-150 dark:border-neutral-900 bg-neutral-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center">
              <UserIcon className="h-6 w-6 text-rose-500 mr-2" />
              <h1 className="text-lg font-extrabold tracking-tight">Guest Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Link to="/events" className="text-xs font-bold px-3.5 py-2 rounded-full border border-neutral-250 dark:border-neutral-805 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                Browse Events
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentRole('ORGANIZER')}
                className="rounded-full text-xs font-bold px-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 shrink-0"
              >
                <Building className="h-3.5 w-3.5 mr-1.5" />
                Switch to Hosting
              </Button>
            </div>
          </div>
          
          {/* Tabs navigations */}
          <nav className="flex space-x-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 shrink-0 transition-all ${
                    isSelected
                      ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                      : 'border-transparent text-neutral-450 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>

        </div>
      </div>

      {/* Tab Content Display */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'vendors' && <VendorApplicationsDisplay />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>

    </div>
  );
};

export default UserDashboardWithTabs;