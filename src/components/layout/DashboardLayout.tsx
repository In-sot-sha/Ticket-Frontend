import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from '../ui/Button';
import { Menu } from 'lucide-react';
import Header from './Header';
import MobileTabBar from './MobileTabBar';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isCreateEvent = /\/organizer\/events\/create/.test(location.pathname);
  const isScanner    = location.pathname === '/organizer/scan';

  const toggleSidebar = () => setSidebarOpen((o) => !o);

  // Header visibility:
  // • Desktop (md+): always show, including on create-event page
  // • Mobile:        hide on create-event and scanner (they are full-screen)
  const showHeader = isCreateEvent
    ? true   // always show on desktop; CSS hides it on mobile via "hidden md:block"
    : !isScanner;

  return (
    // Full-viewport flex column.
    // pb-16 on mobile = clearance for the MobileTabBar (64 px).
    // No overflow-hidden on the outer shell so the page itself doesn't clip.
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* ── Header ── */}
      {showHeader && (
        <div className={isCreateEvent ? 'hidden md:block shrink-0' : 'shrink-0'}>
          <Header />
        </div>
      )}

      {/* ── Body row: sidebar + main ── */}
      <div className="flex flex-1 min-h-0">

        {/* Mobile hamburger — only when sidebar is relevant */}
        {!isCreateEvent && !isScanner && (
          <div className="md:hidden absolute top-4 left-4 z-40">
            <Button variant="outline" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Sidebar
            • Mobile: fixed overlay drawer (handled inside Sidebar)
            • Desktop: sticky, fills its own column height — does NOT scroll
              with the main content.  The parent min-h-0 + flex let this work. */}
        {!isScanner && (
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        )}

        {/* Main content — this is the ONLY thing that scrolls */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <div
            className={
              isCreateEvent || isScanner
                ? 'w-full'
                : 'max-w-7xl mx-auto p-2 md:p-3.5'
            }
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile tab bar */}
       <MobileTabBar />
    </div>
  );
};

export default DashboardLayout;
