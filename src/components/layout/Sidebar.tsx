import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Ticket, 
  Users, 
  BarChart3, 
  User, 
  Settings,
  Menu,
  X,
  PlusCircle,
  DollarSign,
  Eye
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  href: string;
  allowedRoles? :string[];
}

const Sidebar: React.FC<{ isOpen: boolean; toggleSidebar: () => void }> = ({ 
  isOpen, 
  toggleSidebar 
}) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Define sidebar items with role-based access
  const sidebarItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      icon: <Ticket className="h-5 w-5" />,
      href: '/organizer',
      allowedRoles: ['USER', 'ORGANIZER', 'ADMIN']
    },
 
    
    // Organizer-specific items
    {
      title: 'Manage Events',
      icon: <Calendar className="h-5 w-5" />,
      href: 'events',

    },
    {
      title: 'Create Event',
      icon: <PlusCircle className="h-5 w-5" />,
      href: 'events/create',

    },
    {
      title: 'Vendor Applications',
      icon: <Users className="h-5 w-5" />,
      href: 'vendors-applications',

    },
    {
      title: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      href: 'analytics',

    },
    {
      title: 'Finance',
      icon: <DollarSign className="h-5 w-5" />,
      href: 'finance',

    },
    
    // Items for users who want to become organizers
    {
      title: 'Organizer Settings',
      icon: <Settings className="h-5 w-5" />,
      href: 'organizer-settings',
      allowedRoles: ['USER', 'VENDOR']
    },
    

  
  ];

  // Filter sidebar items based on user role
  const filteredItems = user 
    ? sidebarItems
    // .filter(item => 
    //     !item.allowedRoles || 
    //     item.allowedRoles.includes(user.role)
    //   )
    : sidebarItems.filter(item => 
        !item.allowedRoles || 
        item.allowedRoles.includes('USER') // Default to showing items available to all users when not logged in
      );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:inset-0 flex flex-col`}
      >
        <div className=" md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Eventify</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            {filteredItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => window.innerWidth < 768 && toggleSidebar()}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Eventify. All rights reserved.
          </p>
          {user && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Role: {user.role}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;