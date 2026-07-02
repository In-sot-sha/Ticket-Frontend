import React from 'react';
import { 
  useRoutes,
  Navigate
} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';

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
import ContactPage from '../pages/ContactPage';
import RecoverTicketPage from '../pages/RecoverTicketPage';
import BookingPage from '../pages/BookingPage';
import BookingSuccessPage from '../pages/BookingSuccessPage';
import OpayMockCheckout from '../pages/OpayMockCheckout';
import NotFoundPage from '../pages/NotFoundPage';

// Protected pages
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import DashboardLayout from '../components/layout/DashboardLayout';
import EventsDashboard from '../pages/EventsDashboard';
import CreateEvent from '../pages/CreateEvent';
import PaymentPage from '../pages/PaymentPage';
import TicketConfirmationPage from '../pages/TicketConfirmationPage';
import AnalyticsDashboard from '../pages/AnalyticsDashboard';
import SettingsDashboard from '../pages/SettingsDashboard';
import FinanceDashboard from '../pages/FinanceDashboard';
import BecomeOrganizer from '../pages/BecomeOrganizer';
import GateScannerPage from '../pages/GateScannerPage';
import OrganizerEventPage from '../pages/OrganizerEventPage';
import ApplyAsVendor from '../pages/ApplyAsVendor';
import VendorApplications from '../pages/VendorApplications';
import GuestDashboard from '../pages/GuestDashboard';
import WishlistPage from '../pages/WishlistPage';
import TicketScanner from '../pages/TicketScanner';
import AdminLayout from '../components/layout/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import HostApplicationsPage from '../pages/admin/HostApplicationsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminTransactionsPage from '../pages/admin/AdminTransactionsPage';
import AdminSupportPage from '../pages/admin/AdminSupportPage';
import SupportPage from '../pages/SupportPage';

// Admin-only route guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

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

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Define the routes using useRoutes pattern
const AppRoutes: React.FC = () => {
  const routes = [
    // ── Gate scanner — fully public, no header/footer, no auth ──
    {
      path: '/scan-gate',
      element: <GateScannerPage />,
    },

    // Public routes with full layout (header and footer)
    {
      path: "/",
      element: <AppIndex />,
      children: [        {
          index: true,
          element: <HomePage />,
        },
        {
          path: "events",
          element: <EventsPage />,
        },
        {
          path: "events/:slug",
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
          path: "for-organizers",
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
          path: "contact",
          element: <ContactPage />,
        },
        {
          path: "wishlist",
          element: <WishlistPage />,
        },
        {
          path: "my-tickets",
          element: (
            // <ProtectedRoute>
              <GuestDashboard />
            // </ProtectedRoute>
          ),
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
        <ProtectedRoute>
          <DashboardLayout />
         </ProtectedRoute>
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
          path: "events/:id",
          element: <OrganizerEventPage />,
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
        {
          path: "scan",
          element: <TicketScanner />,
        },
      ],

    },
    // System admin routes
    {
      path: "/admin",
      element: (
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      ),
      children: [
        {
          index: true,
          element: <AdminDashboard />,
        },
        {
          path: "host-applications",
          element: <HostApplicationsPage />,
        },
        {
          path: "users",
          element: <AdminUsersPage />,
        },
        {
          path: "transactions",
          element: <AdminTransactionsPage />,
        },
        {
          path: "support",
          element: <AdminSupportPage />,
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
          path: "support",
          element: (
            <ProtectedRoute>
              <SupportPage />
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
    // Catch-all 404 route
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;