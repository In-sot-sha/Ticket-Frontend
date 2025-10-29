import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Ticket, 
  User, 
  CreditCard, 
  Plus,
  Eye,
  BarChart3,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';



// Organizer Dashboard Component
const OrganizerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="py-6">
      {/* Helpful header links for organizers */}
      {/* <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Quick Access</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/events" className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
            Browse Events
          </Link>
          <Link to="/organizer/events/create" className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
            Create Event
          </Link>
          <Link to="/organizer/vendors" className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
            Manage Vendors
          </Link>
          <Link to="/organizer/analytics" className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
            View Analytics
          </Link>
          <Link to="/organizer/settings" className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
            Settings
          </Link>
        </div>
      </div> */}
      
      <div>
        <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Welcome back, {user?.firstName}! Manage your events and tickets.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 text-primary mr-4">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Your Events</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 text-primary mr-4">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tickets</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 text-primary mr-4">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Attendees</p>
              <p className="text-2xl font-bold">235</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 text-primary mr-4">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Revenue</p>
              <p className="text-2xl font-bold">₦1,600,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Your Events
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium">Tech Conference 2023</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Dec 15, 2023</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium">Music Festival</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Jan 20, 2024</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Link to="events" className="text-primary hover:underline text-sm">
              View all events →
            </Link>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Ticket className="h-5 w-5 mr-2 text-primary" />
            Your Tickets
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium">Art & Culture Summit</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Dec 5, 2023</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Valid
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium">Business Leadership Conference</h3>
                <p className="text-sm text-gray-500">Feb 15, 2024</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Valid
              </span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Link to="/tickets" className="text-primary hover:underline text-sm">
              View all tickets →
            </Link>
          </div>
        </div>
      </div>

      {/* More sections can be added on separate pages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/vendors" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow text-center hover:shadow-md transition-shadow">
          <div className="flex justify-center mb-3">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold">Vendors</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Manage event vendors</p>
        </Link>
        
        <Link to="/analytics" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow text-center hover:shadow-md transition-shadow">
          <div className="flex justify-center mb-3">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold">Analytics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">View event insights</p>
        </Link>
        
        <Link to="/settings" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow text-center hover:shadow-md transition-shadow">
          <div className="flex justify-center mb-3">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold">Create Event</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Start a new event</p>
        </Link>
      </div>
    </div>
  );
};

// Main Dashboard Component that renders the appropriate dashboard based on context
const Dashboard = ({ context }: { context?: 'user' | 'organizer' | 'vendor' }) => {
  const { user } = useAuth();
  const { currentRole } = useRole();

  // Determine which dashboard to show based on context or current role
  // If no context is provided, default to the user's current role
  // For organizers, default to organizer dashboard
  const effectiveRole = context || currentRole;


      return <OrganizerDashboard />;

};

export default Dashboard;