import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from './StaffSidebar';
import { Button } from '../ui/Button';
import { Menu } from 'lucide-react';
import Header from './Header';
import MobileTabBar from './MobileTabBar';

const StaffLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="shrink-0">
        <Header />
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="md:hidden absolute top-24 left-4 z-40">
          <Button variant="outline" size="icon" onClick={() => setSidebarOpen((o) => !o)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <StaffSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen((o) => !o)} />

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="max-w-7xl mx-auto p-2 md:p-3.5">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
};

export default StaffLayout;
