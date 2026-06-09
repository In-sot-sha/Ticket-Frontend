import React from 'react';
import { 
  useRoutes,
  Navigate
} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import AppIndex from './AppIndex';
import AuthLayout from '../layouts/AuthLayout';

// Public pages
import HomePage from '../pages/HomePage';
import EventsPage from '../pages/EventsPage';
import EventDetailPage from '../pages/EventDetailPage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import TermsOfService from '../pages/TermsOfService';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import OrganizerPage from '../pages/OrganizerPage';
import HelpPage from '../pages/HelpPage';
import RecoverTicketPage from '../pages/RecoverTicketPage';
import BookingPage from '../pages/BookingPage';
import BookingSuccessPage from '../pages/BookingSuccessPage';
import OpayMockCheckout from '../pages/OpayMockCheckout';

// Protected pages
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import DashboardLayout from '../components/layout/DashboardLayout';
import EventsDashboard from '../pages/EventsDashboard';
import OrganizerEventPage from '../pages/OrganizerEventPage';
import CreateEvent from '../pages/CreateEvent';
import PaymentPage from '../pages/PaymentPage';
import TicketConfirmationPage from '../pages/TicketConfirmationPage';
import TicketsDashboard from '../pages/TicketsDashboard';
import VendorsDashboard from '../pages/VendorsDashboard';
import AnalyticsDashboard from '../pages/AnalyticsDashboard';
import SettingsDashboard from '../pages/SettingsDashboard';
import FinanceDashboard from '../pages/FinanceDashboard';
import BecomeOrganizer from '../pages/BecomeOrganizer';
import ApplyAsVendor from '../pages/ApplyAsVendor';
import VendorApplications from '../pages/VendorApplications';
import MyVendorApplications from '../pages/MyVendorApplications';
import GuestDashboard from '../pages/GuestDashboard';
import WishlistPage from '../pages/WishlistPage';
import UserDashboard from '../components/layout/UserDashboard';

// Route guard component for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // If still loading the auth state, show a loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};




// Route guard component for public routes (redirects if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // If still loading the auth state, show a loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Uncomment if you want to redirect authenticated users away from login/register pages
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Define the routes using useRoutes pattern
const AppRoutes: React.FC = () => {
  const routes = [
    // Public routes with full layout (header and footer)
    {
      path: "/",
      element: <AppIndex />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: "events",
          element: <EventsPage />,
        },
        {
          path: "events/:id",
          element: <EventDetailPage />,
        },
        {
          path: "events/create",
          element: (
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          ),
        },
        {
          path: "events/create/:id",
          element: (
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          ),
        },
        {
          path: "terms",
          element: <TermsOfService />,
        },
        {
          path: "privacy",
          element: <PrivacyPolicy />,
        },
        {
          path: "organizers",
          element: <OrganizerPage />,
        },
        {
          path: "recover-ticket",
          element: <RecoverTicketPage />,
        },
        {
          path: "book/:eventId",
          element: <BookingPage />,
        },
        {
          path: "booking/success",
          element: <BookingSuccessPage />,
        },
        {
          path: "opay-mock-checkout",
          element: <OpayMockCheckout />,
        },
        {
          path: "help",
          element: <HelpPage />,
        },
        {
          path: "wishlist",
          element: <WishlistPage />,
        },
        {
          path: "user",
          children: [
            {
              index: true,
              element: <Navigate to="/user/tickets" replace />,
            },
            {
              path: "tickets",
              element: (
                <ProtectedRoute>
                  <GuestDashboard />
                </ProtectedRoute>
              ),
            },
          ],
        },
      ],
    },
    // Public auth routes without header/footer
    {
      path: "/",
      element: <AuthLayout />,
      children: [
        {
          path: "login",
          element: (
            <PublicRoute>
              <Login />
            </PublicRoute>
          ),
        },
        {
          path: "register",
          element: (
            <PublicRoute>
              <Register />
            </PublicRoute>
          ),
        },
      ],
    },
    // Protected routes with dashboard layout - Role-based routing
    {
      path: "/organizer",
      element: (
        // <ProtectedRoute>
          <DashboardLayout />
        // </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Dashboard context="organizer" />,
        },
        {
          path: "events",
          element: <EventsDashboard />,
        },
        {
          path: "events/create",
          element: <CreateEvent />,
        },
        {
          path: "events/create/:id",
          element: <CreateEvent />,
        },
        {
          path: "events/:id",
          element: <OrganizerEventPage />,
        },
        {
          path: "vendors-applications",
          element: <VendorApplications />,
        },
        {
          path: "analytics",
          element: <AnalyticsDashboard />,
        },
        {
          path: "finance",
          element: <FinanceDashboard />,
        },
        {
          path: "organizer-settings",
          element: <SettingsDashboard />,
        },
      ],

    },
    // Other protected routes with full layout
    {
      path: "/",
      element: <AppIndex />,
      children: [
        {
          path: "profile",
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          ),
        },
        {
          path: "become-organizer",
          element: (
            <ProtectedRoute>
              <BecomeOrganizer />
            </ProtectedRoute>
          ),
        },
        {
          path: "events/:eventId/apply-vendor",
          element: (
            <ProtectedRoute>
              <ApplyAsVendor />
            </ProtectedRoute>
          ),
        },
        {
          path: "payment",
          element: (
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "ticket-confirmation",
          element: <TicketConfirmationPage />,
        },
      ],
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;