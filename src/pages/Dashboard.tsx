import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Ticket as TicketIcon, 
  User, 
  CreditCard, 
  Plus,
  Eye,
  BarChart3,
  Users,
  ChevronRight,
  Scan
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

// Organizer Dashboard Component
const OrganizerDashboard = () => {
  const { user } = useAuth();

  // Mock events data for listings display
  const mockOrganizerEvents = [
    {
      id: 1,
      title: "Tech Conference 2023",
      date: "Dec 15, 2023",
      location: "Lagos, Nigeria",
      attendees: 145,
      status: "Active",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80"
    },
    {
      id: 2,
      title: "Music Festival",
      date: "Jan 20, 2024",
      location: "Abuja, Nigeria",
      attendees: 90,
      status: "Upcoming",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80"
    }
  ];

  return (
    <div className="py-6 px-4 md:px-8 max-w-7xl mx-auto bg-white dark:bg-gray-950 text-neutral-900 dark:text-neutral-100 min-h-screen">
      
      {/* Welcome Header */}
      <div className="mb-8 border-b border-neutral-100 dark:border-neutral-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Hosting Dashboard</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Welcome back, {user?.firstName}! Here is an overview of your events.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {[
          { label: 'Active Events', value: '2', icon: <Calendar className="h-4 w-4" />, change: 'Currently hosting' },
          { label: 'Tickets Sold', value: '235', icon: <TicketIcon className="h-4 w-4" />, change: '+12% this week' },
          { label: 'Stalls Registered', value: '8', icon: <Users className="h-4 w-4" />, change: '5 pending approval' },
          { label: 'Total Revenue', value: '₦1.6M', icon: <CreditCard className="h-4 w-4" />, change: 'Payouts processing' }
        ].map((stat, i) => (
          <div key={i} className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-5 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center text-neutral-400 dark:text-neutral-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">{stat.label}</span>
              {stat.icon}
            </div>
            <p className="text-2xl md:text-3xl font-black tracking-tight">{stat.value}</p>
            <p className="text-[10px] font-semibold text-neutral-450 dark:text-neutral-500 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Left Side: Events List (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-extrabold tracking-tight">Your Listings</h2>
            <Link to="events" className="text-xs font-bold text-rose-500 hover:underline">
              View all
            </Link>
          </div>
          
          <div className="border border-neutral-150 dark:border-neutral-905 rounded-2xl overflow-hidden divide-y divide-neutral-150 dark:divide-neutral-900">
            {mockOrganizerEvents.map((event) => (
              <div key={event.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/50 transition-colors">
                <div className="flex items-center gap-4">
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-16 h-16 rounded-xl object-cover border border-neutral-100 dark:border-neutral-800 shrink-0" 
                  />
                  <div>
                    <h3 className="font-bold text-sm leading-tight text-neutral-900 dark:text-white">{event.title}</h3>
                    <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">{event.date} &bull; {event.location}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{event.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link to={`/events/${event.id}`}>
                    <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold px-4 border-neutral-250 hover:bg-neutral-50 dark:border-neutral-800">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Link to={`/events/create/${event.id}`}>
                    <Button size="sm" className="rounded-full text-xs font-semibold px-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Host Tools Bento Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold tracking-tight">Hosting Shortcuts</h2>
          
          <div className="grid grid-cols-1 gap-4">
            
            {/* Create event shortcut */}
            <Link to="events/create" className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-5 hover:border-rose-500/50 dark:hover:border-rose-500/50 hover:shadow-sm transition-all group relative bg-white dark:bg-gray-900">
              <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mb-3">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Create event listing</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">Publish ticket tiers and configure vendor slots</p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Scan Tickets shortcut */}
            <Link to="scan" className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-5 hover:border-rose-500/50 dark:hover:border-rose-500/50 hover:shadow-sm transition-all group relative bg-white dark:bg-gray-900">
              <div className="h-10 w-10 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-full flex items-center justify-center mb-3">
                <Scan className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Scan Tickets</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">Verify attendee tickets at the gate</p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Vendor Applications shortcut */}
            <Link to="vendors-applications" className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-5 hover:border-rose-500/50 dark:hover:border-rose-500/50 hover:shadow-sm transition-all group relative bg-white dark:bg-gray-900">
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-full flex items-center justify-center mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Manage vendor applications</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">Approve and configure event stall bookings</p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Analytics shortcut */}
            <Link to="analytics" className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-5 hover:border-rose-500/50 dark:hover:border-rose-500/50 hover:shadow-sm transition-all group relative bg-white dark:bg-gray-900">
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">View revenue analytics</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">Track registration numbers and daily payouts</p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Router
const Dashboard = ({ context }: { context?: 'user' | 'organizer' | 'vendor' }) => {
  return <OrganizerDashboard />;
};

export default Dashboard;