import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import { queryClient } from './lib/queryClient';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBadge from './components/OfflineBadge';
import ForcedPasswordGate from './components/ForcedPasswordGate';
import './index.css';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <ErrorBoundary>
            <ThemeProvider>
              <AuthProvider>
                <RoleProvider>
                  <OfflineBadge />
                  <ForcedPasswordGate>
                    <AppRoutes />
                  </ForcedPasswordGate>
                </RoleProvider>
              </AuthProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </Router>
      </HelmetProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;