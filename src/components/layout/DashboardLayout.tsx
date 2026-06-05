import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from '../ui/Button';
import { Menu } from 'lucide-react';
import Header from './Header';
import MobileTabBar from './MobileTabBar';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className='max-h-screen overflow-hidden pb-16 md:pb-0'>
      <Header/>
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="md:hidden absolute top-4 left-4 z-40">
        <Button 
          variant="outline" 
          size="icon"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <main className="flex-1 overflow-y-auto p-2 md:p-3">
          <div className="max-w-7x mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    <MobileTabBar />
    </div>
  );
};

export default DashboardLayout;