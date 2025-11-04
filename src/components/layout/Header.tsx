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
          <Ticket className="h-8 w-8 " />
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
              <Link 
                to="/help" 
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/help' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Help
              </Link>
            </>
          )}
        </nav>



        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Mode Toggle - Always visible */}
          <ModeToggle />
          
          {/* Desktop: Create Event Button & User Menu */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              {/* Create Event Button - only shown for organizers */}
              {(user?.role === 'ORGANIZER' || location.pathname.startsWith('/organizer')) && (
                <Link to="/organizer/events/create">
                  <Button className="flex items-center">
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
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={showUserMenu}
                >
                  <UserCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{user?.firstName}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 z-50 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                    </div>
                    
                    <div className="py-2">
                      <Link 
                        to="/profile" 
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-500" />
                        Profile Settings
                      </Link>
                      
                      {/* Context switching options based on location */}
                      {location.pathname.startsWith('/organizer') ? (
                        <Link 
                          to="/user" 
                          className="w-full text-left px-4 py-2.5 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-3 text-gray-500" />
                          Switch to User View
                        </Link>
                      ) : (
                        <Link 
                          to="/organizer" 
                          className="w-full text-left px-4 py-2.5 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Building className="h-4 w-4 mr-3 text-gray-500" />
                          Switch to Organizer View
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                      
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Desktop: Login & Sign Up Buttons */
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-background">
          <div className="container py-4">
            {/* User Profile Section (if authenticated) */}
            {isAuthenticated && (
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="space-y-1">
              {location.pathname.startsWith('/organizer') ? (
                <>
                  <Link 
                    to="/events" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-5 w-5 text-gray-500" />
                    Browse Events
                  </Link>
                  <Link 
                    to="/organizer/events" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Ticket className="h-5 w-5 text-gray-500" />
                    My Events
                  </Link>
                  <Link 
                    to="/organizer/events/create" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Plus className="h-5 w-5 text-gray-500" />
                    Create Event
                  </Link>
                  <Link 
                    to="/organizer/analytics" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Users className="h-5 w-5 text-gray-500" />
                    Analytics
                  </Link>
                </>
              ) : location.pathname.startsWith('/user') ? (
                <>
                  <Link 
                    to="/events" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-5 w-5 text-gray-500" />
                    Browse Events
                  </Link>
                  <Link 
                    to="/user/tickets" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Ticket className="h-5 w-5 text-gray-500" />
                    My Tickets
                  </Link>
                  <Link 
                    to="/user/vendors" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Store className="h-5 w-5 text-gray-500" />
                    Vendor Applications
                  </Link>
                  <Link 
                    to="/become-organizer" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Building className="h-5 w-5 text-gray-500" />
                    Become Organizer
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MapPin className="h-5 w-5 text-gray-500" />
                    Home
                  </Link>
                  <Link 
                    to="/events" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-5 w-5 text-gray-500" />
                    Events
                  </Link>
                  <Link 
                    to="/organizers" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Building className="h-5 w-5 text-gray-500" />
                    For Organizers
                  </Link>
                  <Link 
                    to="/help" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Ticket className="h-5 w-5 text-gray-500" />
                    Help
                  </Link>
                </>
              )}
            </nav>
              
            {/* Authenticated User Actions */}
            {isAuthenticated ? (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="h-5 w-5 text-gray-500" />
                  Profile Settings
                </Link>
                
                {/* Context Switching */}
                {location.pathname.startsWith('/organizer') ? (
                  <Link 
                    to="/user" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5 text-gray-500" />
                    Switch to User View
                  </Link>
                ) : (
                  <Link 
                    to="/organizer" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Building className="h-5 w-5 text-gray-500" />
                    Switch to Organizer View
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }} 
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            ) : (
              /* Login & Sign Up for non-authenticated users */
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <Link 
                  to="/login" 
                  className="block w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full justify-center" size="lg">
                    Login
                  </Button>
                </Link>
                <Link 
                  to="/register" 
                  className="block w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button className="w-full justify-center" size="lg">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;