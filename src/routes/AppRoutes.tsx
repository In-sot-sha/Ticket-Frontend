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

// Protected pages
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import DashboardLayout from '../components/layout/DashboardLayout';
import EventsDashboard from '../pages/EventsDashboard';
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
import UserDashboardWithTabs from '../pages/UserDashboardWithTabs';
import OrganizerSidebar from '../components/layout/OrganizerSidebar';
import UserDashboard from '../components/layout/UserDashboard';

// Route guard component for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};




// Route guard component for public routes (redirects if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // if (isAuthenticated) {
  //   return <Navigate to="/dashboard" replace />;
  // }
  
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
      ],

    },
    // User dashboard with tabs (separate layout since it has its own header)
    {
      path: "/user",
      element: (
        <ProtectedRoute>
          <UserDashboardWithTabs />
        </ProtectedRoute>
      ),
      children: [
       
        {
          path: "tickets",
          element: <TicketsDashboard />,
        },
        {
          path: "vendors",
          element: <VendorsDashboard />,
        },
        {
          path: "my-vendor-applications",
          element: <MyVendorApplications />,
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
          element: (
            <ProtectedRoute>
              <TicketConfirmationPage />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;