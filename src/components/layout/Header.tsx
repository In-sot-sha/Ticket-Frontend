import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ModeToggle } from './ModeToggle';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { 
  Menu, 
  X, 
  User, 
  Calendar,
  MapPin,
  Ticket,
  ChevronDown,
  LogOut,
  UserCircle,
  Settings,
  Users,
  Building,
  Store,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHoveringUser, setIsHoveringUser] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { currentRole, setCurrentRole, availableRoles } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Combine hover state and click state for user menu
  const showUserMenu = isUserMenuOpen || isHoveringUser;
  
  useEffect(() => {
    if (showUserMenu) {
      const handleClickOutside = (e: MouseEvent) => {
        if (!(e.target as Element).closest('.user-menu-container')) {
          setIsUserMenuOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };



 
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Ticket className="h-8 w-8 text-primary" />
          <Link to="/" className="text-xl font-bold">
            Eventify
          </Link>
        </div>

        {/* Desktop Navigation - Dynamic based on current location */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {location.pathname.startsWith('/organizer') ? (
            <>
              <Link 
                to="/events" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/events' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Browse Events
              </Link>
              <Link 
                to="/organizer/events" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/organizer/events' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                My Events
              </Link>
              <Link 
                to="/organizer/events/create" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/organizer/events/create' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Create Event
              </Link>
              <Link 
                to="/organizer/analytics" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/organizer/analytics' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Analytics
              </Link>
            </>
          ) : location.pathname.startsWith('/user') ? (
            <>
              <Link 
                to="/events" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/events' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Browse Events
              </Link>
              <Link 
                to="/user/tickets" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/user/tickets' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                My Tickets
              </Link>
              <Link 
                to="/user/vendors" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/user/vendors' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Vendor Applications
              </Link>
              <Link 
                to="/become-organizer" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/become-organizer' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Become Organizer
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/events" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/events' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Events
              </Link>
              <Link 
                to="/organizers" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/organizers' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                For Organizers
              </Link>
            </>
          )}
        </nav>



        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          <ModeToggle />
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              {/* Create Event Button - only shown for organizers */}
              {(user?.role === 'ORGANIZER' || location.pathname.startsWith('/organizer')) && (
                <Link to="/organizer/events/create">
                  <Button className="hidden md:flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              )}
              
              {/* User dropdown - appears on hover */}
              <div 
                className="relative user-menu-container"
                onMouseEnter={() => setIsHoveringUser(true)}
                onMouseLeave={() => setIsHoveringUser(false)}
              >
                <button
                  className="flex items-center space-x-1 p-2 rounded-full hover:bg-accent"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={showUserMenu}
                >
                  <UserCircle className="h-6 w-6 text-primary" />
                  <span className="hidden md:inline">{user?.firstName}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link 
                        to="/profile" 
                        className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Profile Settings
                      </Link>
                      
                      {/* Context switching options based on location */}
                      {location.pathname.startsWith('/organizer') ? (
                        <Link 
                          to="/user" 
                          className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Switch to User View
                        </Link>
                      ) : (
                        <Link 
                          to="/organizer" 
                          className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Building className="h-4 w-4 mr-2" />
                          Switch to Organizer View
                        </Link>
                      )}
                      
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm flex items-center text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background p-4">
          <div className="flex flex-col space-y-4">


            <div className="flex flex-col space-y-3">
              {location.pathname.startsWith('/organizer') ? (
                <>
                  <Link 
                    to="/events" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Browse Events
                  </Link>
                  <Link 
                    to="/organizer/events" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Events
                  </Link>
                  <Link 
                    to="/organizer/events/create" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Event
                  </Link>
                  <Link 
                    to="/organizer/analytics" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                </>
              ) : location.pathname.startsWith('/user') ? (
                <>
                  <Link 
                    to="/events" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Browse Events
                  </Link>
                  <Link 
                    to="/user/tickets" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Tickets
                  </Link>
                  <Link 
                    to="/user/vendors" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Vendor Applications
                  </Link>
                  <Link 
                    to="/become-organizer" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Become Organizer
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/events" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Events
                  </Link>
                  <Link 
                    to="/organizers" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    For Organizers
                  </Link>
                </>
              )}
              
              {isAuthenticated ? (
                <>
                  {/* Create Event Button for mobile */}
                  {(user?.role === 'ORGANIZER' || location.pathname.startsWith('/organizer')) && (
                    <Link 
                      to="/organizer/events/create" 
                      className="py-2 px-3 rounded-md hover:bg-accent transition-colors flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Link>
                  )}
                  
                  {location.pathname !== '/organizer' && location.pathname !== '/organizer/events' && location.pathname !== '/organizer/analytics' && location.pathname !== '/organizer/settings' && !location.pathname.includes('/organizer/vendor-applications') && !location.pathname.includes('/organizer/finance') ? (
                    <Link 
                      to="/organizer" 
                      className="py-2 px-3 rounded-md hover:bg-accent transition-colors flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Organizer Dashboard
                    </Link>
                  ) : null}
                  {location.pathname !== '/user' && location.pathname !== '/user/tickets' && location.pathname !== '/user/vendors' && !location.pathname.includes('/user/my-vendor-applications') ? (
                    <Link 
                      to="/user" 
                      className="py-2 px-3 rounded-md hover:bg-accent transition-colors flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      User Dashboard
                    </Link>
                  ) : null}
                  
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }} 
                    className="w-full text-left py-2 px-3 rounded-md hover:bg-accent transition-colors flex items-center text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;