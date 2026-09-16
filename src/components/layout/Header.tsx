import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { ModeToggle } from './ModeToggle';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { 
  Menu, 
  // Search, 
  Ticket, 
  UserCircle,
  Settings,
  LogOut,
  Building,
  User,
  HelpCircle,
  Plus,
  Heart,
  LayoutDashboard,
  Calendar,
  BarChart3,
  Shield,
  HardHat,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { currentRole, setCurrentRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isUserMenuOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        if (!(e.target as Element).closest('.user-menu-container')) {
          setIsUserMenuOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const isOrganizerContext = location.pathname.startsWith('/organizer');
  const isAdminContext = location.pathname.startsWith('/admin');
  const isStaffContext = location.pathname.startsWith('/staff');
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = !!user?.isStaff;

  const handleSwitchToGuest = () => {
    setCurrentRole('USER');
    navigate('/');
  };

  const handleSwitchRole = () => {
    if (isAdminContext || isOrganizerContext || isStaffContext) {
      handleSwitchToGuest();
      return;
    }
    if (user?.role === 'ORGANIZER' || user?.isOrganizer) {
      if (user.ownedOrganizations?.some(org => org.isVerified)) {
        setCurrentRole('ORGANIZER');
        navigate('/organizer');
      } else {
        navigate('/become-organizer');
      }
    } else {
      navigate('/become-organizer');
    }
  };

  const handleSwitchToAdmin = () => {
    setCurrentRole('ADMIN');
    navigate('/admin');
  };

  const handleSwitchToStaff = () => {
    setCurrentRole('STAFF');
    navigate('/staff');
  };

  const roleSwitchLabel = () => {
    if (isAdminContext || isOrganizerContext || isStaffContext) return 'Switch to Guest';
    if (isAdmin) return 'Switch to Admin Dashboard';
    return 'Switch to Hosting';
  };

  // Browse events search pill — same destination as Find events nav link
  // const shouldShowSearch = () => {
  //   if (location.pathname === '/') return true;
  //   if (location.pathname.startsWith('/events')) return true;
  //   if (location.pathname.startsWith('/my-tickets')) return true;
  //   return false;
  // };

  const showGuestNav = !isAdminContext && !isOrganizerContext && !isStaffContext;

  const desktopNavLinks = [
    { label: 'Find events', to: '/events', match: (path: string) => path === '/events' || path.startsWith('/events/') },
    { label: 'For organizers', to: '/for-organizers', match: (path: string) => path.startsWith('/for-organizers') },
    { label: 'Help', to: '/help', match: (path: string) => path.startsWith('/help') },
    { label: 'Contact', to: '/contact', match: (path: string) => path.startsWith('/contact') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md transition-all duration-300 pt-safe">
      <div className="container mx-auto px-4 md:px-8 h-20 relative flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex items-center min-w-0 shrink-0">
          <Link to="/" className="flex items-center gap-1.5 group">
            <Ticket className="h-8 w-8 text-rose-500 transform transition-transform group-hover:rotate-12 duration-200" />
            <span className="text-rose-500 font-extrabold text-xl tracking-tight hidden sm:block">
              partystorm
            </span>
          </Link>
        </div>

        {/* Centered desktop quick links */}
        {showGuestNav && (
          <nav
            className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-0.5"
            aria-label="Primary"
          >
            {desktopNavLinks.map((link) => {
              const isActive = link.match(location.pathname);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors',
                    isActive
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Center Search Pill — commented out; Find events covers this */}
        {/* {shouldShowSearch() && (
          <div className="hidden xl:block animate-in fade-in zoom-in-95 duration-200 shrink-0">
            <div 
              onClick={() => navigate('/events')}
              className="flex w-[280px] justify-between items-center border border-gray-200 dark:border-gray-800 rounded-full py-2 pr-2 shadow-sm hover:shadow-md transition-all cursor-pointer bg-white dark:bg-gray-900 duration-200"
            >
              <div className="text-xs text-neutral-500 dark:text-neutral-400 pl-4 pr-2 flex w-full items-center justify-between gap-3">
               Browse events
                <div className="bg-rose-500 p-2  rounded-full text-white hover:bg-rose-600 transition-colors">
                  <Search className="h-3 w-3 stroke-[3]" />
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Right side controls */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Role switch — one button, same style throughout */}
          {isAuthenticated && (
            <button
              onClick={
                isAdminContext || isOrganizerContext || isStaffContext
                  ? handleSwitchToGuest
                  : isAdmin
                    ? handleSwitchToAdmin
                    : handleSwitchRole
              }
              className="hidden xl:block text-xs font-semibold px-4 py-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
            >
              {roleSwitchLabel()}
            </button>
          )}

          {/* Create event shortcut for organizers */}
          {/* isAuthenticated && (user?.role === 'ORGANIZER' || location.pathname.startsWith('/organizer')) && (
            <Link to="/organizer/events/create" className="hidden sm:block">
              <button className="flex items-center gap-1 text-xs font-semibold px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Host Event
              </button>
            </Link>
          ) */}

          {/* Theme Mode Toggle */}
          <ModeToggle />
          
          {/* User profile dropdown button container */}
          <div className="relative user-menu-container">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 border border-gray-200 dark:border-gray-800 rounded-full p-2.5 hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
              aria-expanded={isUserMenuOpen}
            >
              <Menu className="h-4 w-4 text-gray-500" />
              {isAuthenticated && user?.firstName ? (
                <div className="h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                  {user.firstName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <UserCircle className="h-6 w-6 text-gray-400 stroke-[1.5]" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3.5 w-60 bg-white dark:bg-gray-950 rounded-2xl shadow-xl py-2 z-50 border border-gray-100 dark:border-gray-850 animate-in fade-in slide-in-from-top-3 duration-150">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-850">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {isAdminContext
                          ? 'System Admin'
                          : isStaffContext
                            ? 'Staff Workspace'
                            : isOrganizerContext
                              ? 'Host Dashboard'
                              : 'Welcome back'}
                      </p>
                      <p className="text-sm font-extrabold text-neutral-800 dark:text-neutral-100 mt-1">
                        {user?.firstName} {user?.lastName}
                      </p>
                    </div>
                    
                    <div className="py-1">
                      {isAdminContext ? (
                        <>
                          <Link to="/admin" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <LayoutDashboard className="h-4 w-4 mr-3 text-gray-400" />Overview
                          </Link>
                          <Link to="/admin/ops" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Building className="h-4 w-4 mr-3 text-gray-400" />Ops projects
                          </Link>
                          <Link to="/admin/staff" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <HardHat className="h-4 w-4 mr-3 text-gray-400" />Staff
                          </Link>
                          <Link to="/admin/events" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Calendar className="h-4 w-4 mr-3 text-gray-400" />Events
                          </Link>
                          <Link to="/admin/organizations" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Building className="h-4 w-4 mr-3 text-gray-400" />Organizations
                          </Link>
                          <Link to="/admin/users" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <User className="h-4 w-4 mr-3 text-gray-400" />Users
                          </Link>
                          <Link to="/admin/support" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <HelpCircle className="h-4 w-4 mr-3 text-gray-400" />Support
                          </Link>
                        </>
                      ) : isStaffContext ? (
                        <>
                          <Link to="/staff" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <LayoutDashboard className="h-4 w-4 mr-3 text-gray-400" />Staff home
                          </Link>
                          <Link to="/staff/scan" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Ticket className="h-4 w-4 mr-3 text-gray-400" />Gate scanner
                          </Link>
                        </>
                      ) : isOrganizerContext ? (
                        <>
                          <Link to="/organizer" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <LayoutDashboard className="h-4 w-4 mr-3 text-gray-400" />Dashboard
                          </Link>
                          <Link to="/organizer/events" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Calendar className="h-4 w-4 mr-3 text-gray-400" />My Events
                          </Link>
                          <Link to="/organizer/events/create" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Plus className="h-4 w-4 mr-3 text-gray-400" />Create Event
                          </Link>
                          <Link to="/organizer/analytics" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <BarChart3 className="h-4 w-4 mr-3 text-gray-400" />Analytics
                          </Link>
                          <Link to="/organizer/organizer-settings" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Settings className="h-4 w-4 mr-3 text-gray-400" />Account Settings
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link to="/profile" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Settings className="h-4 w-4 mr-3 text-gray-400" />Account settings
                          </Link>
                          <Link to="/my-tickets" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Ticket className="h-4 w-4 mr-3 text-gray-400" />My tickets
                          </Link>
                          <Link to="/wishlist" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <Heart className="h-4 w-4 mr-3 text-gray-400" />Wishlist
                          </Link>
                          <Link to="/help" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <HelpCircle className="h-4 w-4 mr-3 text-gray-400" />Help Center
                          </Link>
                          <Link to="/support" className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <HelpCircle className="h-4 w-4 mr-3 text-rose-500" />Help & Support
                          </Link>
                        </>
                      )}

                      {/* Switch mode */}
                      {isAdmin && !isAdminContext && (
                        <button
                          onClick={() => { handleSwitchToAdmin(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-t border-gray-100 dark:border-gray-850 mt-1"
                        >
                          <Shield className="h-4 w-4 mr-3 text-rose-500" />Switch to Admin Mode
                        </button>
                      )}
                      {isStaff && !isStaffContext && (
                        <button
                          onClick={() => { handleSwitchToStaff(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-t border-gray-100 dark:border-gray-850 mt-1"
                        >
                          <HardHat className="h-4 w-4 mr-3 text-rose-500" />Switch to Staff Mode
                        </button>
                      )}
                      {!isAdminContext && !isStaffContext && !isOrganizerContext && !isAdmin && (
                        <button
                          onClick={() => { handleSwitchRole(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-t border-gray-100 dark:border-gray-850 mt-1"
                        >
                          <Building className="h-4 w-4 mr-3 text-rose-500" />Switch to Host Mode
                        </button>
                      )}
                      {(isAdminContext || isStaffContext || isOrganizerContext) && (
                        <button
                          onClick={() => { handleSwitchToGuest(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-t border-gray-100 dark:border-gray-850 mt-1"
                        >
                          <User className="h-4 w-4 mr-3 text-rose-500" />Switch to Guest Mode
                        </button>
                      )}
                   
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-850 my-1" />
                    
                    <div className="py-1">
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 flex items-center transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Log out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="py-1.5">
                      <Link 
                        to="/register" 
                        className="w-full text-left px-4 py-3 text-xs font-bold text-neutral-900 dark:text-white flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                      <Link 
                        to="/login" 
                        className="w-full text-left px-4 py-3 text-xs font-medium text-neutral-600 dark:text-neutral-300 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Log in
                      </Link>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-gray-850 my-1"></div>
                    
                    <div className="py-1">
                      <Link 
                        to="/become-organizer" 
                        className="w-full text-left px-4 py-3 text-xs font-medium text-neutral-600 dark:text-neutral-300 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Host your event
                      </Link>
                      <Link 
                        to="/help" 
                        className="w-full text-left px-4 py-3 text-xs font-medium text-neutral-600 dark:text-neutral-300 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <HelpCircle className="h-4 w-4 mr-3 text-gray-400" />
                        Help Center
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;