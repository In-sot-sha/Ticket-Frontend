import React, { useState } from 'react';
import { 
  Ticket, 
  Store, 
  User, 
  Settings,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { Button } from '../components/ui/Button';
import VendorApplicationsDisplay from '../components/VendorApplicationsDisplay';
import Header from '../components/layout/Header';
import { Link } from 'react-router-dom';

// Tab components
const TicketsTab = () => {
  // Mock data for user's tickets
  const tickets = [
    {
      id: 1,
      eventTitle: "Tech Conference 2023",
      eventDate: "2023-12-15",
      location: "Lagos, Nigeria",
      ticketType: "VIP",
      status: "VALID"
    },
    {
      id: 2,
      eventTitle: "Music Festival",
      eventDate: "2024-01-20",
      location: "Abuja, Nigeria",
      ticketType: "General",
      status: "USED"
    }
  ];

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6">My Tickets</h2>
      
      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
          <p className="text-gray-500 mb-4">You haven't purchased any tickets. Explore events to get started!</p>
          <Button>Explore Events</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{ticket.eventTitle}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{ticket.eventDate}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.status === 'VALID' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {ticket.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Building className="h-4 w-4 mr-2" />
                  <span>{ticket.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Ticket className="h-4 w-4 mr-2" />
                  <span>{ticket.ticketType} Ticket</span>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const VendorsTab = () => {
  return <VendorApplicationsDisplay />;
};

const ProfileTab = () => {
  const { user } = useAuth();
  
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mr-4">
            <User className="h-8 w-8 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h3>
            <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              defaultValue={user?.firstName}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              defaultValue={user?.lastName}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              defaultValue={user?.email}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              defaultValue={user?.phone || ''}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

const UserDashboardWithTabs = () => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'vendors' | 'profile'>('tickets');
  const { setCurrentRole } = useRole();

  const tabs = [
    { id: 'tickets', name: 'My Tickets', icon: Ticket },
    { id: 'vendors', name: 'Vendor Applications', icon: Store },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  const handleSwitchToOrganizer = () => {
    setCurrentRole('ORGANIZER');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Helpful header links for users */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <div className="flex flex-wrap gap-2">
            <Link to="/events" className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs font-medium">
              Browse Events
            </Link>
            {/* {user?.role === 'ORGANIZER' && ( */}
              <Link to="/organizer/events/create" className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs font-medium">
                Create Event
              </Link>
            {/* )} */}
            <Link to="/vendors" className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs font-medium">
              Vendor Opportunities
            </Link>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-xl font-bold">User Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSwitchToOrganizer}
              >
                <Building className="h-4 w-4 mr-2" />
                Switch to Organizer
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'vendors' && <VendorsTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>
    </div>
  );
};

export default UserDashboardWithTabs;