import React from 'react';
import { 
  useRoutes,
  Navigate,
  useParams,
} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import OrganizerCreateRoute from '../components/OrganizerCreateRoute';

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
// import ApplyAsVendor from '../pages/ApplyAsVendor';
import VendorApplications from '../pages/VendorApplications';
import GuestDashboard from '../pages/GuestDashboard';
import WishlistPage from '../pages/WishlistPage';
import TicketScanner from '../pages/TicketScanner';
import ManualAttendeePage from '../pages/ManualAttendeePage';
import AdminLayout from '../components/layout/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import OrganizationsPage from '../pages/admin/OrganizationsPage';
import AdminTicketsPage from '../pages/admin/AdminTicketsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminTransactionsPage from '../pages/admin/AdminTransactionsPage';
import AdminSupportPage from '../pages/admin/AdminSupportPage';
import AdminStaffPage from '../pages/admin/AdminStaffPage';
import AdminOpsProjectsPage from '../pages/admin/AdminOpsProjectsPage';
import AdminEventsPage from '../pages/admin/AdminEventsPage';
import StaffHomePage from '../pages/StaffHomePage';
import { StaffOrgsPage, StaffProjectsPage } from '../pages/StaffSections';
import ForceChangePasswordPage from '../pages/ForceChangePasswordPage';
import SupportPage from '../pages/SupportPage';
import StaffLayout from '../components/layout/StaffLayout';
import DevEmailsPage from '../pages/DevEmailsPage';

/** Old /events/create/:id bookmarks → organizer edit URL */
const LegacyCreateEventRedirect: React.FC = () => {
  const { id } = useParams();
  return <Navigate to={`/organizer/events/create/${id}`} replace />;
};

const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // HTML #app-boot covers until auth resolves
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isStaff && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Admin-only route guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // HTML #app-boot covers until auth resolves
  if (loading) return null;

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
    // Email template preview (Vite dev, or ADMIN in production)
    {
      path: '/dev/emails',
      element: <DevEmailsPage />,
    },
    {
      path: '/change-password',
      element: (
        <ProtectedRoute>
          <ForceChangePasswordPage />
        </ProtectedRoute>
      ),
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
        // Legacy create URLs → organizer dashboard (keeps /events/:slug detail-only)
        {
          path: "events/create",
          element: <Navigate to="/organizer/events/create" replace />,
        },
        {
          path: "events/create/:id",
          element: <LegacyCreateEventRedirect />,
        },
        {
          path: "events/:slug",
          element: <EventDetailPage />,
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
          path: "events/create",
          element: (
            <OrganizerCreateRoute>
              <CreateEvent />
            </OrganizerCreateRoute>
          ),
        },
        {
          path: "events/create/:id",
          element: (
            <OrganizerCreateRoute>
              <CreateEvent />
            </OrganizerCreateRoute>
          ),
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
          path: "events/:id/add-attendee",
          element: <ManualAttendeePage />,
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
          path: "organizations",
          element: <OrganizationsPage />,
        },
        {
          path: "tickets",
          element: <AdminTicketsPage />,
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
        {
          path: "promotions",
          element: <Navigate to="/admin/events" replace />,
        },
        {
          path: "staff",
          element: <AdminStaffPage />,
        },
        {
          path: "ops",
          element: <AdminOpsProjectsPage />,
        },
        {
          path: "events",
          element: <AdminEventsPage />,
        },
      ],
    },
    {
      path: "/staff",
      element: (
        <StaffRoute>
          <StaffLayout />
        </StaffRoute>
      ),
      children: [
        {
          index: true,
          element: <StaffHomePage />,
        },
        {
          path: "orgs",
          element: <StaffOrgsPage />,
        },
        {
          path: "projects",
          element: <StaffProjectsPage />,
        },
        {
          path: "events/:id/walk-in",
          element: <ManualAttendeePage />,
        },
        {
          path: "scan",
          element: <GateScannerPage />,
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
          element: <Profile />,
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
          element: <SupportPage />,
        },
        // {
        //   path: "events/:eventId/apply-vendor",
        //   element: (
        //     <ProtectedRoute>
        //       <ApplyAsVendor />
        //     </ProtectedRoute>
        //   ),
        // },
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