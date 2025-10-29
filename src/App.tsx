
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import AppRoutes from './routes/AppRoutes';
import './index.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <RoleProvider>
            <AppRoutes />
          </RoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;